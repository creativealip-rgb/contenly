import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DrizzleService } from '../../db/drizzle.service';
import { videoClipProjects } from '../../db/schema';
import { schema } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { OpenAiService } from '../ai/services/openai.service';
import { BillingService } from '../billing/billing.service';
import { FootageService, FootageSearchResult } from '../video-script/footage.service';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface ClipSegment {
  startTime: number;
  endTime: number;
  hookTitle: string;
  reason: string;
  viralScore: number;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

export interface VideoClipPresetConfig {
  subtitleStyle?: SubtitleStyleInput;
  titleStyle?: TitleStyleInput;
  aspectRatio?: AspectRatio;
  cropOffsetX?: number;
  // Default b-roll behavior options to apply when adding new items via this preset
  defaultBrollMode?: BrollOverlayMode;
  defaultBrollTransition?: BrollTransition;
  defaultDuckSourceAudio?: boolean;
  defaultDuckLevel?: number;
}

export type BrollOverlayMode = 'pip' | 'full' | 'side';
export type BrollTransition = 'cut' | 'fade' | 'slide';

export interface BrollItem {
  id: string;
  sourceUrl: string; // direct media URL (image or video)
  type: 'image' | 'video';
  thumbnailUrl?: string;
  // segmentIndex this overlay belongs to
  segmentIndex: number;
  // times relative to the clip output (seconds, 0 = clip start)
  start: number;
  end: number;
  mode?: BrollOverlayMode;
  transition?: BrollTransition;
  // PIP positioning (0..1 normalized)
  pipX?: number;
  pipY?: number;
  pipScale?: number; // 0.2..1.0
  // Audio ducking - reduce source audio while overlay is active
  duckSourceAudio?: boolean;
  duckLevel?: number; // 0..1, 0 = full mute, 1 = no duck
  // Title attribution (for stock library)
  attribution?: string;
}

export interface SubtitleStyleInput {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadow?: boolean;
  position?: 'top' | 'center' | 'bottom';
  animation?: 'none' | 'word-highlight' | 'karaoke' | 'fade-in';
  highlightColor?: string;
}

export interface TitleStyleInput {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  position?: 'top' | 'center' | 'bottom';
}

@Injectable()
export class VideoClipService {
  private readonly logger = new Logger(VideoClipService.name);
  private readonly outputDir = path.join(os.tmpdir(), 'contenly-clips');

  constructor(
    private drizzle: DrizzleService,
    private openAiService: OpenAiService,
    private billingService: BillingService,
    private footageService: FootageService,
    @InjectQueue('video-clip') private clipQueue: Queue,
  ) {
    fs.mkdir(this.outputDir, { recursive: true }).catch(() => {});
  }

  async createProject(userId: string, sourceUrl: string, title?: string) {
    const db = this.drizzle.getDb();
    const [project] = await db.insert(videoClipProjects).values({
      userId,
      sourceUrl,
      title: title || 'Untitled Clip Project',
      status: 'created',
    }).returning();
    return project;
  }

  /**
   * Create a project directly from an uploaded file. The file is moved into
   * the outputDir using the project id as a prefix, thumbnail and waveform
   * are extracted synchronously, then the analyze flow can be triggered
   * (which will skip the download step because videoPath is already set).
   */
  async createProjectFromFile(
    userId: string,
    file: { originalname: string; mimetype: string; buffer?: Buffer; path?: string; size: number },
    title?: string,
  ) {
    if (!file) throw new BadRequestException('File tidak ada');
    if (file.size > 1024 * 1024 * 1024) {
      throw new BadRequestException('File terlalu besar (max 1GB)');
    }
    if (!/^video\//.test(file.mimetype)) {
      throw new BadRequestException('File harus berupa video');
    }

    const db = this.drizzle.getDb();
    const [project] = await db.insert(videoClipProjects).values({
      userId,
      sourceUrl: `upload://${file.originalname}`,
      title: title || file.originalname.replace(/\.[^.]+$/, '') || 'Uploaded Clip',
      status: 'created',
    }).returning();

    // Move file into outputDir
    const targetPath = path.join(this.outputDir, `${project.id}.mp4`);
    if (file.buffer) {
      await fs.writeFile(targetPath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, targetPath);
      await fs.unlink(file.path).catch(() => {});
    } else {
      throw new BadRequestException('Upload payload kosong');
    }

    // Probe duration; if too long, abort and clean up
    let duration = 0;
    try {
      duration = await this.getVideoDuration(targetPath);
    } catch {
      duration = 0;
    }
    if (duration > 3600) {
      await fs.unlink(targetPath).catch(() => {});
      await db.delete(videoClipProjects).where(eq(videoClipProjects.id, project.id));
      throw new BadRequestException('Durasi video melebihi 60 menit');
    }

    // Extract thumbnail + waveform (best-effort, non-fatal)
    const thumbnailPath = await this.extractThumbnail(targetPath, project.id).catch(() => '');
    const waveform = await this.extractWaveform(targetPath).catch(() => []);

    const [updated] = await db
      .update(videoClipProjects)
      .set({
        videoPath: targetPath,
        thumbnailPath: thumbnailPath || null,
        duration: Math.round(duration) || null,
        waveform: waveform.length > 0 ? waveform : null,
        status: 'transcribing', // ready for analyze flow to pick up
      })
      .where(eq(videoClipProjects.id, project.id))
      .returning();

    return updated;
  }

  async getProjects(userId: string) {
    const db = this.drizzle.getDb();
    return db.select().from(videoClipProjects)
      .where(eq(videoClipProjects.userId, userId))
      .orderBy(desc(videoClipProjects.createdAt));
  }

  async getProject(userId: string, projectId: string) {
    const db = this.drizzle.getDb();
    const [project] = await db.select().from(videoClipProjects)
      .where(and(eq(videoClipProjects.id, projectId), eq(videoClipProjects.userId, userId)));
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async deleteProject(userId: string, projectId: string) {
    const db = this.drizzle.getDb();
    const [project] = await db.delete(videoClipProjects)
      .where(and(eq(videoClipProjects.id, projectId), eq(videoClipProjects.userId, userId)))
      .returning();
    if (!project) throw new NotFoundException('Project not found');
    // Cleanup files
    if (project.videoPath) fs.unlink(project.videoPath).catch(() => {});
    return { success: true };
  }

  async analyzeVideo(userId: string, projectId: string) {
    await this.billingService.checkBalance(userId, 50);
    const project = await this.getProject(userId, projectId);
    if (project.status === 'analyzing') throw new BadRequestException('Already analyzing');

    const db = this.drizzle.getDb();
    await db.update(videoClipProjects).set({ status: 'downloading' }).where(eq(videoClipProjects.id, projectId));

    await this.clipQueue.add('analyze', { projectId, userId }, { attempts: 2, backoff: 5000 });
    return { message: 'Analysis started', projectId };
  }

  async downloadVideo(sourceUrl: string, projectId: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `${projectId}.mp4`);
    
    // yt-dlp download — max 60 min, best quality up to 1080p
    const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';
    await execFileAsync(ytdlp, [
      '-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
      '--merge-output-format', 'mp4',
      '--max-filesize', '2G',
      '--match-filter', 'duration<=3600',
      '-o', outputPath,
      '--no-playlist',
      sourceUrl,
    ], { timeout: 600000 }); // 10 min timeout for download

    return outputPath;
  }

  async extractThumbnail(videoPath: string, projectId: string): Promise<string> {
    const thumbPath = path.join(this.outputDir, `${projectId}-thumb.jpg`);
    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', '5',
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '3',
        '-vf', 'scale=640:-1',
        thumbPath,
      ], { timeout: 30000 });
      return thumbPath;
    } catch (err) {
      this.logger.warn(`Failed to extract thumbnail: ${err}`);
      return '';
    }
  }

  /**
   * Extract audio waveform peaks as a normalized array of numbers in [0..1].
   * Uses ffmpeg `astats` per N samples via showwavespic isn't trivial in JSON,
   * so we resort to PCM s16le decode then peak-bucket in Node.
   * Returns an array of `bucketCount` peak values.
   */
  async extractWaveform(videoPath: string, bucketCount = 600): Promise<number[]> {
    // Decode mono 8kHz s16le PCM to stdout, then peak bucket
    return new Promise<number[]>((resolve, reject) => {
      const ffmpeg = require('child_process').spawn('ffmpeg', [
        '-i', videoPath,
        '-f', 's16le',
        '-acodec', 'pcm_s16le',
        '-ac', '1',
        '-ar', '8000',
        '-loglevel', 'error',
        '-',
      ]);

      const chunks: Buffer[] = [];
      ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
      ffmpeg.stderr.on('data', () => {});
      ffmpeg.on('error', reject);
      ffmpeg.on('close', (code: number) => {
        if (code !== 0) {
          // Fall back to empty array — non-fatal
          return resolve([]);
        }
        try {
          const buffer = Buffer.concat(chunks);
          const sampleCount = buffer.length / 2; // s16le = 2 bytes per sample
          if (sampleCount <= 0) return resolve([]);
          const samplesPerBucket = Math.max(1, Math.floor(sampleCount / bucketCount));
          const peaks: number[] = new Array(bucketCount).fill(0);
          for (let i = 0; i < bucketCount; i++) {
            const start = i * samplesPerBucket;
            let peak = 0;
            for (let s = 0; s < samplesPerBucket; s++) {
              const idx = (start + s) * 2;
              if (idx + 1 >= buffer.length) break;
              const sample = buffer.readInt16LE(idx);
              const abs = Math.abs(sample);
              if (abs > peak) peak = abs;
            }
            peaks[i] = peak / 32767;
          }
          resolve(peaks);
        } catch (err) {
          this.logger.warn(`Waveform decode error: ${err}`);
          resolve([]);
        }
      });

      // Safety timeout — abort after 60s
      setTimeout(() => {
        try { ffmpeg.kill('SIGKILL'); } catch { /* */ }
      }, 60000);
    });
  }

  async fetchVideoMetadata(sourceUrl: string): Promise<{
    title?: string;
    duration?: number;
    uploader?: string;
    thumbnail?: string;
    description?: string;
  } | null> {
    const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';
    try {
      const { stdout } = await execFileAsync(ytdlp, [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--skip-download',
        sourceUrl,
      ], { timeout: 30000 });
      const info = JSON.parse(stdout);
      return {
        title: info.title,
        duration: info.duration,
        uploader: info.uploader || info.channel,
        thumbnail: info.thumbnail,
        description: typeof info.description === 'string' ? info.description.slice(0, 500) : undefined,
      };
    } catch (err) {
      this.logger.warn(`Failed to fetch metadata for ${sourceUrl}: ${err}`);
      return null;
    }
  }

  async getVideoStreamPath(userId: string, projectId: string): Promise<string> {
    const project = await this.getProject(userId, projectId);
    if (!project.videoPath) {
      throw new BadRequestException('Video belum di-download');
    }
    // Make sure file exists
    try {
      await fs.access(project.videoPath);
    } catch {
      throw new NotFoundException('Video file not found on server');
    }
    return project.videoPath;
  }

  async getThumbnailPath(userId: string, projectId: string): Promise<string | null> {
    const project = await this.getProject(userId, projectId);
    if (!project.thumbnailPath) return null;
    try {
      await fs.access(project.thumbnailPath);
      return project.thumbnailPath;
    } catch {
      return null;
    }
  }

  async addCustomSegment(
    userId: string,
    projectId: string,
    segment: { startTime: number; endTime: number; hookTitle?: string },
  ) {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    const duration = project.duration || 0;
    const start = Math.max(0, Math.min(segment.startTime, duration > 0 ? duration - 1 : segment.startTime));
    const end = Math.max(start + 1, Math.min(segment.endTime, duration > 0 ? duration : segment.endTime));
    const newSegment: ClipSegment = {
      startTime: start,
      endTime: end,
      hookTitle: segment.hookTitle?.trim() || `Custom Clip ${segments.length + 1}`,
      reason: 'Manual cut by user',
      viralScore: 0,
    };
    segments.push(newSegment);
    const db = this.drizzle.getDb();
    await db
      .update(videoClipProjects)
      .set({ segments, updatedAt: new Date() })
      .where(eq(videoClipProjects.id, projectId));
    return { segments };
  }

  async deleteSegment(userId: string, projectId: string, segmentIndex: number) {
    const project = await this.getProject(userId, projectId);
    const segments = ([...((project.segments as ClipSegment[]) || [])]);
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segment index');
    }
    if (segments.length <= 1) {
      throw new BadRequestException('Minimal harus ada 1 segment');
    }
    segments.splice(segmentIndex, 1);
    const db = this.drizzle.getDb();
    await db
      .update(videoClipProjects)
      .set({ segments, updatedAt: new Date() })
      .where(eq(videoClipProjects.id, projectId));
    return { segments };
  }

  async duplicateSegment(userId: string, projectId: string, segmentIndex: number) {
    const project = await this.getProject(userId, projectId);
    const segments = ([...((project.segments as ClipSegment[]) || [])]);
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segment index');
    }
    const dup: ClipSegment = { ...segments[segmentIndex], hookTitle: `${segments[segmentIndex].hookTitle} (copy)` };
    segments.splice(segmentIndex + 1, 0, dup);
    const db = this.drizzle.getDb();
    await db
      .update(videoClipProjects)
      .set({ segments, updatedAt: new Date() })
      .where(eq(videoClipProjects.id, projectId));
    return { segments };
  }

  async splitSegment(userId: string, projectId: string, segmentIndex: number, splitAt: number) {
    const project = await this.getProject(userId, projectId);
    const segments = ([...((project.segments as ClipSegment[]) || [])]);
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segment index');
    }
    const seg = segments[segmentIndex];
    if (splitAt <= seg.startTime + 0.5 || splitAt >= seg.endTime - 0.5) {
      throw new BadRequestException('Split point must be inside the segment with at least 0.5s margin');
    }
    const left: ClipSegment = { ...seg, endTime: splitAt, hookTitle: `${seg.hookTitle} (1)` };
    const right: ClipSegment = { ...seg, startTime: splitAt, hookTitle: `${seg.hookTitle} (2)` };
    segments.splice(segmentIndex, 1, left, right);
    const db = this.drizzle.getDb();
    await db
      .update(videoClipProjects)
      .set({ segments, updatedAt: new Date() })
      .where(eq(videoClipProjects.id, projectId));
    return { segments };
  }

  async generateAlternateHooks(
    userId: string,
    projectId: string,
    segmentIndex: number,
    count = 3,
  ): Promise<string[]> {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segment index');
    }
    const seg = segments[segmentIndex];
    const words = ((project.words as TranscriptWord[]) || []).filter(
      (w) => w.start >= seg.startTime && w.end <= seg.endTime,
    );
    const transcriptSnippet = words.map((w) => w.word).join(' ').slice(0, 1500);

    const hasBalance = await this.billingService.checkBalance(userId, 1);
    if (!hasBalance) {
      throw new BadRequestException('Saldo kredit tidak mencukupi');
    }

    const prompt = `You are a viral short-form video copywriter.

Return VALID JSON only:
{ "hooks": ["hook 1", "hook 2", "hook 3"] }

Rules:
- Provide ${Math.max(2, Math.min(8, count))} alternative hook titles for the clip below.
- Each hook must be max 8 words, attention-grabbing, in the same language as the transcript.
- Use different angles: question, bold claim, statistic, mystery, controversy.
- No emoji. No surrounding quotes.

Current hook: ${seg.hookTitle}
Reason it can go viral: ${seg.reason}
Transcript snippet: ${transcriptSnippet}`;

    const result = (await this.openAiService.generateContent(transcriptSnippet || project.title, {
      mode: 'custom',
      systemPrompt: prompt,
    })) as { hooks?: unknown };

    const raw = Array.isArray(result.hooks) ? result.hooks : [];
    const hooks = raw
      .map((h) => (typeof h === 'string' ? h.trim().replace(/^"|"$/g, '') : ''))
      .filter((h) => h.length > 0)
      .slice(0, count);

    await this.billingService.deductTokens(userId, 1, `Alternate hooks for clip ${segmentIndex}`);
    return hooks;
  }

  async transcribeVideo(videoPath: string): Promise<{ text: string; words: TranscriptWord[] }> {
    const audioPath = videoPath.replace('.mp4', '.wav');
    const srtPath = videoPath.replace('.mp4', '-transcript.srt');
    const modelPath = process.env.WHISPER_MODEL_PATH || path.join(__dirname, '..', '..', '..', 'models', 'ggml-base.bin');

    // Extract 16kHz mono audio
    await execFileAsync('ffmpeg', [
      '-i', videoPath, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
      '-y', audioPath,
    ], { timeout: 300000 });

    // Transcribe using ffmpeg whisper filter (local, no API needed)
    const escapedModel = modelPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    await execFileAsync('ffmpeg', [
      '-i', audioPath,
      '-af', `whisper=model='${escapedModel}':format=srt:destination='${escapedSrt}'`,
      '-f', 'null', '-',
    ], { timeout: 600000 });

    // Parse SRT to get text and word-level timestamps
    const srtContent = await fs.readFile(srtPath, 'utf-8');
    const { text, words } = this.parseSRT(srtContent);

    await fs.unlink(audioPath).catch(() => {});
    await fs.unlink(srtPath).catch(() => {});

    return { text, words };
  }

  private parseSRT(srt: string): { text: string; words: TranscriptWord[] } {
    const blocks = srt.trim().split(/\n\n+/);
    const words: TranscriptWord[] = [];
    const textParts: string[] = [];

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
      if (!timeMatch) continue;

      const start = +timeMatch[1] * 3600 + +timeMatch[2] * 60 + +timeMatch[3] + +timeMatch[4] / 1000;
      const end = +timeMatch[5] * 3600 + +timeMatch[6] * 60 + +timeMatch[7] + +timeMatch[8] / 1000;
      const text = lines.slice(2).join(' ').trim();
      if (!text) continue;

      textParts.push(text);
      // Distribute words evenly across the time range
      const lineWords = text.split(/\s+/);
      const duration = end - start;
      const wordDuration = duration / lineWords.length;
      for (let i = 0; i < lineWords.length; i++) {
        words.push({
          word: lineWords[i],
          start: start + i * wordDuration,
          end: start + (i + 1) * wordDuration,
        });
      }
    }

    return { text: textParts.join(' '), words };
  }

  async findViralSegments(transcript: string, duration: number): Promise<ClipSegment[]> {
    const prompt = `You are a viral content expert. Analyze this video transcript and find 5-10 segments that have the highest viral potential for short-form video (TikTok/Reels/Shorts, 15-60 seconds each).

For each segment, identify:
- The exact start and end timestamps (in seconds)
- A catchy hook title (max 8 words, attention-grabbing)
- Why it would go viral (emotional, funny, controversial, informative, surprising)
- Viral score (1-10)

Video duration: ${duration} seconds.
Transcript: ${transcript}

Return JSON array:
[{"startTime": 0, "endTime": 45, "hookTitle": "You Won't Believe This", "reason": "Surprising revelation with emotional impact", "viralScore": 9}]

Rules:
- Each clip should be 15-60 seconds
- Prioritize moments with strong hooks in the first 3 seconds
- Look for emotional peaks, plot twists, controversial statements, humor
- Ensure clips are self-contained (make sense without context)
- Sort by viralScore descending`;

    const response = await this.openAiService.getClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{"segments":[]}';
    const parsed = JSON.parse(content);
    return (parsed.segments || parsed).slice(0, 10);
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', videoPath,
    ]);
    return parseFloat(stdout.trim());
  }

  async exportClip(
    userId: string,
    projectId: string,
    segmentIndex: number,
    subtitleStyle?: SubtitleStyleInput,
    titleStyle?: TitleStyleInput,
    options?: { aspectRatio?: AspectRatio; cropOffsetX?: number; includeBroll?: boolean },
  ) {
    await this.billingService.checkBalance(userId, 30);
    const project = await this.getProject(userId, projectId);
    if (!project.videoPath) throw new BadRequestException('Video not downloaded yet');
    if (!project.segments) throw new BadRequestException('No segments analyzed yet');

    const segments = project.segments as ClipSegment[];
    if (segmentIndex >= segments.length) throw new BadRequestException('Invalid segment index');

    const jobId = `export-${projectId}-${segmentIndex}-${Date.now()}`;
    await this.clipQueue.add('export', {
      jobId,
      userId,
      projectId,
      segmentIndex,
      subtitleStyle: subtitleStyle || {},
      titleStyle: titleStyle || {},
      aspectRatio: options?.aspectRatio || '9:16',
      cropOffsetX: typeof options?.cropOffsetX === 'number' ? options.cropOffsetX : 0,
      includeBroll: options?.includeBroll !== false, // default true
    }, { attempts: 2, backoff: 5000 });

    return { message: 'Export started', jobId };
  }

  async clipAndExport(
    videoPath: string,
    segment: ClipSegment,
    words: TranscriptWord[],
    subtitleStyle: SubtitleStyleInput,
    titleStyle: TitleStyleInput,
    outputId: string,
    options: { aspectRatio?: AspectRatio; cropOffsetX?: number; brollItems?: BrollItem[]; brollAssets?: Record<string, string> } = {},
  ): Promise<string> {
    const outputPath = path.join(this.outputDir, `${outputId}-short.mp4`);
    const assPath = path.join(this.outputDir, `${outputId}.ass`);
    const { startTime, endTime, hookTitle } = segment;

    // Filter words inside segment
    const segmentWords = words.filter((w) => w.start >= startTime && w.end <= endTime);

    // Aspect ratio + crop math
    const aspectRatio: AspectRatio = options.aspectRatio || '9:16';
    const cropOffsetX = Math.max(-1, Math.min(1, options.cropOffsetX ?? 0));
    const aspectMap: Record<AspectRatio, { w: number; h: number; cropExpr: string }> = {
      '9:16': {
        w: 1080,
        h: 1920,
        // crop width = ih*9/16; horizontal x position uses center offset
        cropExpr: `crop=ih*9/16:ih:(iw-ih*9/16)/2+(${cropOffsetX})*((iw-ih*9/16)/2):0`,
      },
      '1:1': {
        w: 1080,
        h: 1080,
        cropExpr: `crop=ih:ih:(iw-ih)/2+(${cropOffsetX})*((iw-ih)/2):0`,
      },
      '16:9': {
        w: 1920,
        h: 1080,
        cropExpr: `crop=iw:iw*9/16:0:(ih-iw*9/16)/2`,
      },
      '4:5': {
        w: 1080,
        h: 1350,
        cropExpr: `crop=ih*4/5:ih:(iw-ih*4/5)/2+(${cropOffsetX})*((iw-ih*4/5)/2):0`,
      },
    };
    const { w: outW, h: outH, cropExpr } = aspectMap[aspectRatio];

    // Generate ASS subtitle (supports word-highlight, karaoke, fade-in via libass)
    const fontFamily = subtitleStyle?.fontFamily || 'Arial';
    const fontSize = subtitleStyle?.fontSize || 24;
    const fontColor = subtitleStyle?.fontColor || '#ffffff';
    const outlineColor = subtitleStyle?.outlineColor || '#000000';
    const outlineWidth = typeof subtitleStyle?.outlineWidth === 'number' ? subtitleStyle.outlineWidth : 2;
    const shadow = subtitleStyle?.shadow ? true : false;
    const subPosition = subtitleStyle?.position || 'bottom';
    const animation = subtitleStyle?.animation || 'none';
    const highlightColor = subtitleStyle?.highlightColor || '#ffd400';

    const titleText = titleStyle?.text || hookTitle;
    const titleFontFamily = titleStyle?.fontFamily || 'Impact';
    const titleFontSize = titleStyle?.fontSize || 36;
    const titleColor = titleStyle?.fontColor || '#ffffff';
    const titleBg = titleStyle?.bgColor || '#000000';
    const titlePos = titleStyle?.position || 'top';

    const assContent = this.generateASS({
      width: outW,
      height: outH,
      segmentWords,
      segmentStart: startTime,
      segmentEnd: endTime,
      subtitle: {
        fontFamily,
        fontSize,
        fontColor,
        outlineColor,
        outlineWidth,
        shadow,
        position: subPosition,
        animation,
        highlightColor,
      },
      title: titleText
        ? {
            text: titleText,
            fontFamily: titleFontFamily,
            fontSize: titleFontSize,
            fontColor: titleColor,
            bgColor: titleBg,
            position: titlePos,
            duration: Math.min(4, endTime - startTime),
          }
        : null,
    });
    await fs.writeFile(assPath, assContent, 'utf8');

    // Escape ASS path for libass on Windows
    const escapedAssPath = assPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

    const brollItems = (options.brollItems || []).filter((b) => options.brollAssets?.[b.id]);

    if (brollItems.length === 0) {
      // Simple path: no b-roll, single input + linear filter
      const filterComplex = [`${cropExpr},scale=${outW}:${outH}`, `ass=${escapedAssPath}`].join(',');
      await execFileAsync('ffmpeg', [
        '-ss', String(startTime),
        '-to', String(endTime),
        '-i', videoPath,
        '-vf', filterComplex,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', outputPath,
      ], { timeout: 600000 });
      await fs.unlink(assPath).catch(() => {});
      return outputPath;
    }

    // Complex path with b-roll: build filter_complex graph
    // Inputs: 0 = source (with -ss/-to), 1..N = b-roll assets (NO -ss/-to since they are full assets)
    // For images (-loop 1) we need different input args than video.
    const inputArgs: string[] = ['-ss', String(startTime), '-to', String(endTime), '-i', videoPath];
    const segDuration = endTime - startTime;
    const brollMeta: Array<{ index: number; item: BrollItem }> = [];

    for (let i = 0; i < brollItems.length; i++) {
      const it = brollItems[i];
      const local = options.brollAssets![it.id];
      const inputIndex = i + 1;
      if (it.type === 'image') {
        inputArgs.push('-loop', '1', '-t', String(segDuration), '-i', local);
      } else {
        // video: trim to overlay length to keep things simple; ffmpeg will handle re-encoding
        const overlayDur = Math.max(0.5, it.end - it.start);
        inputArgs.push('-t', String(overlayDur), '-i', local);
      }
      brollMeta.push({ index: inputIndex, item: it });
    }

    // Build filter_complex
    const filterParts: string[] = [];
    // Base layer
    filterParts.push(`[0:v]${cropExpr},scale=${outW}:${outH},format=yuva420p,setsar=1[base]`);

    let lastVideoLabel = 'base';
    for (let i = 0; i < brollMeta.length; i++) {
      const { index, item } = brollMeta[i];
      const overlayLabel = `o${i}`;
      const outLabel = `v${i + 1}`;
      const fadeDur = item.transition === 'fade' ? 0.3 : 0;

      if (item.mode === 'full') {
        const targetW = outW;
        const targetH = outH;
        filterParts.push(
          `[${index}:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1${
            fadeDur > 0
              ? `,fade=t=in:st=0:d=${fadeDur}:alpha=1,fade=t=out:st=${(item.end - item.start) - fadeDur}:d=${fadeDur}:alpha=1`
              : ''
          },format=yuva420p[${overlayLabel}]`,
        );
        filterParts.push(
          `[${lastVideoLabel}][${overlayLabel}]overlay=enable='between(t,${item.start},${item.end})':x=0:y=0[${outLabel}]`,
        );
      } else if (item.mode === 'side') {
        // Side-by-side picture: place b-roll on right half (or below for landscape)
        const targetW = Math.round(outW / 2);
        const targetH = Math.round(outH / 2);
        const xPos = Math.round((item.pipX ?? 0.5) * outW);
        const yPos = Math.round((item.pipY ?? 0.18) * outH);
        filterParts.push(
          `[${index}:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1${
            fadeDur > 0
              ? `,fade=t=in:st=0:d=${fadeDur}:alpha=1,fade=t=out:st=${(item.end - item.start) - fadeDur}:d=${fadeDur}:alpha=1`
              : ''
          },format=yuva420p[${overlayLabel}]`,
        );
        filterParts.push(
          `[${lastVideoLabel}][${overlayLabel}]overlay=enable='between(t,${item.start},${item.end})':x=${xPos - Math.round(targetW / 2)}:y=${yPos - Math.round(targetH / 2)}[${outLabel}]`,
        );
      } else {
        // PIP mode (default)
        const scale = Math.max(0.15, Math.min(0.9, item.pipScale ?? 0.4));
        const targetW = Math.round(outW * scale);
        const targetH = Math.round(outH * scale);
        const xPos = Math.round((item.pipX ?? 0.5) * outW - targetW / 2);
        const yPos = Math.round((item.pipY ?? 0.18) * outH - targetH / 2);
        filterParts.push(
          `[${index}:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black@0,setsar=1${
            fadeDur > 0
              ? `,fade=t=in:st=0:d=${fadeDur}:alpha=1,fade=t=out:st=${(item.end - item.start) - fadeDur}:d=${fadeDur}:alpha=1`
              : ''
          },format=yuva420p[${overlayLabel}]`,
        );
        filterParts.push(
          `[${lastVideoLabel}][${overlayLabel}]overlay=enable='between(t,${item.start},${item.end})':x=${xPos}:y=${yPos}[${outLabel}]`,
        );
      }
      lastVideoLabel = outLabel;
    }

    // Burn subtitle on top of final composited video
    filterParts.push(`[${lastVideoLabel}]ass=${escapedAssPath}[vout]`);

    // Audio: mix source + ducking when b-roll active
    // We use volume filter with enable expr for each b-roll segment that has duck enabled
    // Source audio is [0:a]; for each ducking range, apply volume reduction
    const duckRanges: Array<{ start: number; end: number; level: number }> = brollItems
      .filter((b) => b.duckSourceAudio)
      .map((b) => ({ start: b.start, end: b.end, level: b.duckLevel ?? 0.3 }));

    let audioOut = '0:a';
    if (duckRanges.length > 0) {
      // Build volume expression: 1 normally, level inside any duck range
      // Use `volume=eval=frame:volume='if(...)'`
      // Simpler approach: use astreamselect/aevalsrc would be complex; use a chain of volume filters.
      let lastALabel = '0:a';
      for (let i = 0; i < duckRanges.length; i++) {
        const r = duckRanges[i];
        const aOut = `aduck${i}`;
        filterParts.push(
          `[${lastALabel}]volume=enable='between(t,${r.start},${r.end})':volume=${r.level}[${aOut}]`,
        );
        lastALabel = aOut;
      }
      audioOut = lastALabel;
    }

    const filterComplex = filterParts.join(';');

    const ffArgs: string[] = [
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', `[${audioOut}]`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      '-y', outputPath,
    ];

    await execFileAsync('ffmpeg', ffArgs, { timeout: 900000 });

    await fs.unlink(assPath).catch(() => {});
    return outputPath;
  }

  private generateSRT(words: TranscriptWord[], offsetStart: number): string {
    if (!words.length) return '';
    
    // Group words into subtitle lines (max 8 words or 3 seconds per line)
    const lines: { start: number; end: number; text: string }[] = [];
    let currentLine: TranscriptWord[] = [];

    for (const word of words) {
      currentLine.push(word);
      const lineStart = currentLine[0].start - offsetStart;
      const lineDuration = word.end - currentLine[0].start;

      if (currentLine.length >= 8 || lineDuration >= 3) {
        lines.push({
          start: lineStart,
          end: word.end - offsetStart,
          text: currentLine.map(w => w.word).join(' '),
        });
        currentLine = [];
      }
    }
    if (currentLine.length) {
      lines.push({
        start: currentLine[0].start - offsetStart,
        end: currentLine[currentLine.length - 1].end - offsetStart,
        text: currentLine.map(w => w.word).join(' '),
      });
    }

    return lines.map((line, i) => {
      const start = this.formatSRTTime(line.start);
      const end = this.formatSRTTime(line.end);
      return `${i + 1}\n${start} --> ${end}\n${line.text}\n`;
    }).join('\n');
  }

  private formatSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  private hexToASS(hex: string): string {
    // Convert hex color to ASS format (BGR)
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      return clean.slice(4, 6) + clean.slice(2, 4) + clean.slice(0, 2);
    }
    return 'FFFFFF';
  }

  private formatASSTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = Math.floor(safe % 60);
    const cs = Math.floor((safe % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  private escapeAssText(text: string): string {
    // Curly braces are tag delimiters in ASS; escape them
    return text.replace(/[{}]/g, '');
  }

  private generateASS(opts: {
    width: number;
    height: number;
    segmentWords: TranscriptWord[];
    segmentStart: number;
    segmentEnd: number;
    subtitle: Required<Pick<SubtitleStyleInput, 'fontFamily' | 'fontSize' | 'fontColor' | 'outlineColor' | 'outlineWidth' | 'shadow' | 'position' | 'animation' | 'highlightColor'>>;
    title: {
      text: string;
      fontFamily: string;
      fontSize: number;
      fontColor: string;
      bgColor: string;
      position: 'top' | 'center' | 'bottom';
      duration: number;
    } | null;
  }): string {
    const { width, height, segmentWords, segmentStart, segmentEnd, subtitle, title } = opts;

    const assPrimary = `&H00${this.hexToASS(subtitle.fontColor)}`;
    const assOutline = `&H00${this.hexToASS(subtitle.outlineColor)}`;
    const assHighlight = `&H00${this.hexToASS(subtitle.highlightColor)}`;
    // Alignment: 1=BL, 2=BC, 3=BR, 4=ML, 5=MC, 6=MR, 7=TL, 8=TC, 9=TR
    const subAlign = subtitle.position === 'top' ? 8 : subtitle.position === 'center' ? 5 : 2;
    const marginV = subtitle.position === 'bottom' ? Math.round(height * 0.08) : Math.round(height * 0.06);

    // Style block
    const styles: string[] = [];
    styles.push(
      `Style: Sub,${subtitle.fontFamily},${subtitle.fontSize * (height / 1080) | 0},${assPrimary},${assPrimary},${assOutline},&H66000000,-1,0,0,0,100,100,0,0,1,${subtitle.outlineWidth},${subtitle.shadow ? 1 : 0},${subAlign},40,40,${marginV},1`,
    );

    if (title) {
      const assTitlePrimary = `&H00${this.hexToASS(title.fontColor)}`;
      const assTitleBg = `&H80${this.hexToASS(title.bgColor)}`;
      const titleAlign = title.position === 'top' ? 8 : title.position === 'center' ? 5 : 2;
      const titleMarginV = title.position === 'bottom' ? Math.round(height * 0.1) : Math.round(height * 0.08);
      // BorderStyle=3 → opaque box background using BackColour
      styles.push(
        `Style: Title,${title.fontFamily},${title.fontSize * (height / 1080) | 0},${assTitlePrimary},${assTitlePrimary},${assTitlePrimary},${assTitleBg},-1,0,0,0,100,100,0,0,3,4,0,${titleAlign},40,40,${titleMarginV},1`,
      );
    }

    // Group words into subtitle lines (max 6 words OR 2.5s)
    const lines: { start: number; end: number; words: TranscriptWord[] }[] = [];
    let currentLine: TranscriptWord[] = [];
    for (const word of segmentWords) {
      currentLine.push(word);
      const start = currentLine[0].start;
      const end = currentLine[currentLine.length - 1].end;
      if (currentLine.length >= 6 || end - start >= 2.5) {
        lines.push({ start, end, words: currentLine });
        currentLine = [];
      }
    }
    if (currentLine.length) {
      lines.push({
        start: currentLine[0].start,
        end: currentLine[currentLine.length - 1].end,
        words: currentLine,
      });
    }

    // Build dialogue events
    const events: string[] = [];
    for (const line of lines) {
      const lineStart = Math.max(0, line.start - segmentStart);
      const lineEnd = Math.max(lineStart + 0.4, line.end - segmentStart);
      const startTs = this.formatASSTime(lineStart);
      const endTs = this.formatASSTime(lineEnd);

      let text = '';
      if (subtitle.animation === 'word-highlight' || subtitle.animation === 'karaoke') {
        // Per-word: each word turns highlighted color when it's spoken
        // Use \k<centisec> for karaoke timing in ASS
        const parts: string[] = [];
        for (const w of line.words) {
          const wordStart = Math.max(0, w.start - segmentStart);
          const wordEnd = Math.max(wordStart + 0.05, w.end - segmentStart);
          const durCs = Math.max(1, Math.round((wordEnd - wordStart) * 100));
          const safeWord = this.escapeAssText(w.word);
          if (subtitle.animation === 'karaoke') {
            // \K = karaoke fill effect
            parts.push(`{\\K${durCs}}${safeWord} `);
          } else {
            // word-highlight: use \kf for sweep + per-word color via \r override
            // Simpler approach: each word independently colored as highlight when current
            parts.push(`{\\kf${durCs}\\1c${assHighlight}}${safeWord}{\\1c${assPrimary}} `);
          }
        }
        text = parts.join('').trimEnd();
      } else if (subtitle.animation === 'fade-in') {
        const lineText = this.escapeAssText(line.words.map((w) => w.word).join(' '));
        text = `{\\fad(150,80)}${lineText}`;
      } else {
        text = this.escapeAssText(line.words.map((w) => w.word).join(' '));
      }

      events.push(`Dialogue: 0,${startTs},${endTs},Sub,,0,0,0,,${text}`);
    }

    if (title) {
      const tStart = this.formatASSTime(0);
      const tEnd = this.formatASSTime(Math.max(0.5, title.duration));
      const safeTitle = this.escapeAssText(title.text);
      events.push(`Dialogue: 0,${tStart},${tEnd},Title,,0,0,0,,{\\fad(150,200)}${safeTitle}`);
    }

    return [
      '[Script Info]',
      'ScriptType: v4.00+',
      `PlayResX: ${width}`,
      `PlayResY: ${height}`,
      'WrapStyle: 2',
      'ScaledBorderAndShadow: yes',
      '',
      '[V4+ Styles]',
      'Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding',
      ...styles,
      '',
      '[Events]',
      'Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text',
      ...events,
      '',
    ].join('\n');
  }

  async updateSegment(userId: string, projectId: string, segmentIndex: number, data: any) {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    if (segmentIndex >= segments.length) throw new BadRequestException('Invalid segment index');

    segments[segmentIndex] = { ...segments[segmentIndex], ...data };
    const db = this.drizzle.getDb();
    await db.update(videoClipProjects).set({ segments }).where(eq(videoClipProjects.id, projectId));
    return segments[segmentIndex];
  }

  // ============ B-roll plan management ============

  /**
   * Download b-roll assets to local cache so ffmpeg can use them as inputs.
   * Returns map of broll.id → local file path.
   */
  async downloadBrollAssets(items: BrollItem[]): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    for (const item of items) {
      try {
        const ext = item.type === 'video' ? '.mp4' : path.extname(item.sourceUrl).slice(0, 5) || '.jpg';
        const local = path.join(this.outputDir, `broll-${item.id}${ext}`);
        try {
          await fs.access(local);
          map[item.id] = local;
          continue;
        } catch {
          /* not cached yet */
        }
        const axios = require('axios');
        const res = await axios.get(item.sourceUrl, { responseType: 'arraybuffer', timeout: 60000 });
        await fs.writeFile(local, Buffer.from(res.data));
        map[item.id] = local;
      } catch (err) {
        this.logger.warn(`Failed to download b-roll ${item.id}: ${(err as Error).message}`);
      }
    }
    return map;
  }


  async searchBrollFootage(
    userId: string,
    projectId: string,
    options: { query: string; perSource?: number; orientation?: 'landscape' | 'portrait' | 'square' },
  ): Promise<FootageSearchResult> {
    await this.getProject(userId, projectId);
    const query = options.query?.trim();
    if (!query) throw new BadRequestException('Query kosong');
    return this.footageService.fetchFootage(query, {
      perSource: options.perSource ?? 8,
      orientation: options.orientation,
    });
  }

  async getBrollPlan(userId: string, projectId: string): Promise<BrollItem[]> {
    const project = await this.getProject(userId, projectId);
    return ((project.brollPlan as BrollItem[]) || []);
  }

  async addBrollItem(
    userId: string,
    projectId: string,
    item: Omit<BrollItem, 'id'>,
  ): Promise<BrollItem[]> {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    if (item.segmentIndex < 0 || item.segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segmentIndex');
    }
    const seg = segments[item.segmentIndex];
    const segDuration = seg.endTime - seg.startTime;

    const newItem: BrollItem = {
      ...item,
      id: `broll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      start: Math.max(0, Math.min(item.start, segDuration - 0.5)),
      end: Math.max(item.start + 0.5, Math.min(item.end, segDuration)),
      mode: item.mode || 'pip',
      transition: item.transition || 'fade',
      pipX: item.pipX ?? 0.5,
      pipY: item.pipY ?? 0.18,
      pipScale: item.pipScale ?? 0.4,
      duckSourceAudio: item.duckSourceAudio ?? false,
      duckLevel: item.duckLevel ?? 0.3,
    };

    const plan = ((project.brollPlan as BrollItem[]) || []).slice();
    plan.push(newItem);

    const db = this.drizzle.getDb();
    await db.update(videoClipProjects).set({ brollPlan: plan, updatedAt: new Date() }).where(eq(videoClipProjects.id, projectId));
    return plan;
  }

  async updateBrollItem(
    userId: string,
    projectId: string,
    itemId: string,
    patch: Partial<BrollItem>,
  ): Promise<BrollItem[]> {
    const project = await this.getProject(userId, projectId);
    const plan = ((project.brollPlan as BrollItem[]) || []).slice();
    const idx = plan.findIndex((b) => b.id === itemId);
    if (idx < 0) throw new BadRequestException('B-roll item tidak ditemukan');
    plan[idx] = { ...plan[idx], ...patch, id: plan[idx].id };
    // sanitize ranges
    if (typeof plan[idx].start === 'number' && typeof plan[idx].end === 'number') {
      plan[idx].end = Math.max(plan[idx].start + 0.5, plan[idx].end);
    }
    const db = this.drizzle.getDb();
    await db.update(videoClipProjects).set({ brollPlan: plan, updatedAt: new Date() }).where(eq(videoClipProjects.id, projectId));
    return plan;
  }

  async deleteBrollItem(userId: string, projectId: string, itemId: string): Promise<BrollItem[]> {
    const project = await this.getProject(userId, projectId);
    const plan = ((project.brollPlan as BrollItem[]) || []).filter((b) => b.id !== itemId);
    const db = this.drizzle.getDb();
    await db.update(videoClipProjects).set({ brollPlan: plan, updatedAt: new Date() }).where(eq(videoClipProjects.id, projectId));
    return plan;
  }

  /**
   * AI suggests b-roll keywords for a segment based on transcript words.
   * Returns array of keywords ready to feed to footage search.
   */
  async suggestBrollKeywords(
    userId: string,
    projectId: string,
    segmentIndex: number,
    count = 6,
  ): Promise<string[]> {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segment index');
    }
    const seg = segments[segmentIndex];
    const allWords = (project.words as TranscriptWord[]) || [];
    const inSeg = allWords.filter((w) => w.start >= seg.startTime && w.end <= seg.endTime);
    const text = inSeg.map((w) => w.word).join(' ').slice(0, 1500);

    const hasBalance = await this.billingService.checkBalance(userId, 1);
    if (!hasBalance) throw new BadRequestException('Saldo kredit tidak mencukupi');

    const prompt = `You are a stock footage curator. Suggest ${Math.max(3, Math.min(12, count))} concrete English keywords or 2-3 word phrases that match the visual context of this short-form video clip.

Return VALID JSON only:
{ "keywords": ["k1", "k2", ...] }

Rules:
- Searchable on Pexels / Unsplash (concrete nouns + adjectives, no full sentences).
- Mix wide shots and close-ups when relevant.
- Avoid duplicates.

Clip hook: ${seg.hookTitle}
Reason: ${seg.reason}
Transcript snippet: ${text}`;

    const result = (await this.openAiService.generateContent(text || project.title, {
      mode: 'custom',
      systemPrompt: prompt,
    })) as { keywords?: unknown };

    const raw = Array.isArray(result.keywords) ? result.keywords : [];
    const keywords = raw
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k) => k.length > 0)
      .slice(0, count);

    await this.billingService.deductTokens(userId, 1, `B-roll keywords for clip ${segmentIndex}`);
    return keywords;
  }

  /**
   * AI Auto-Cutaway:
   * 1) Ask AI to identify imageable phrases inside the segment (with timing relative to clip).
   * 2) For each phrase, run footage search (best result wins).
   * 3) Insert into brollPlan with the phrase timing + small padding.
   *
   * Returns count of overlays added.
   */
  async autoCutaway(
    userId: string,
    projectId: string,
    segmentIndex: number,
    options: { maxOverlays?: number; preferVideo?: boolean; orientation?: 'landscape' | 'portrait' | 'square' } = {},
  ): Promise<{ added: BrollItem[]; skipped: number }> {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new BadRequestException('Invalid segment index');
    }
    const seg = segments[segmentIndex];
    const allWords = (project.words as TranscriptWord[]) || [];
    const inSeg = allWords.filter((w) => w.start >= seg.startTime && w.end <= seg.endTime);
    if (inSeg.length < 4) {
      throw new BadRequestException('Transcript untuk segment ini terlalu sedikit untuk auto-cutaway');
    }

    const hasBalance = await this.billingService.checkBalance(userId, 2);
    if (!hasBalance) throw new BadRequestException('Saldo kredit tidak mencukupi');

    const maxOverlays = Math.max(2, Math.min(10, options.maxOverlays ?? 5));

    // Build word-indexed transcript with relative timing (relative to clip start)
    const indexed = inSeg.map((w, i) => ({
      i,
      word: w.word,
      start: +(w.start - seg.startTime).toFixed(2),
      end: +(w.end - seg.startTime).toFixed(2),
    }));
    const transcriptText = indexed.map((w) => `[${w.i}|${w.start}-${w.end}] ${w.word}`).join(' ');
    const segDuration = +(seg.endTime - seg.startTime).toFixed(2);

    const prompt = `You are a short-form video b-roll director. Given a transcript with timings, find ${maxOverlays} MOMENTS where a stock footage cutaway would visually enrich the narration.

Return VALID JSON only:
{
  "cutaways": [
    {
      "startTime": 1.2,
      "endTime": 4.5,
      "keyword": "concrete English search term, 1-3 words",
      "reason": "short why",
      "mode": "pip" | "full"
    }
  ]
}

Rules:
- Times are relative to clip start (0 = clip start, max = ${segDuration}s).
- Each cutaway should be 2-5 seconds long.
- Pick concrete visual referents (objects, places, people doing things, actions). Avoid abstract concepts.
- Use "full" mode for hero moments / scene establishing; use "pip" for supporting details and most cases.
- Don't overlap cutaways with each other (leave at least 0.5s gap between them).
- Keywords must be Pexels-searchable English nouns/short phrases.
- Distribute cutaways across the clip.

Transcript with [wordIndex|start-end]:
${transcriptText}

Clip hook: ${seg.hookTitle}
Clip duration: ${segDuration}s`;

    interface AICutawayItem {
      startTime: number;
      endTime: number;
      keyword: string;
      reason?: string;
      mode?: 'pip' | 'full';
    }
    const result = (await this.openAiService.generateContent(transcriptText, {
      mode: 'custom',
      systemPrompt: prompt,
    })) as { cutaways?: unknown };

    const rawCutaways: AICutawayItem[] = Array.isArray(result.cutaways)
      ? (result.cutaways as unknown[])
          .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
          .map((c): AICutawayItem => ({
            startTime: typeof c.startTime === 'number' ? c.startTime : 0,
            endTime: typeof c.endTime === 'number' ? c.endTime : 0,
            keyword: typeof c.keyword === 'string' ? c.keyword.trim() : '',
            reason: typeof c.reason === 'string' ? c.reason : undefined,
            mode: c.mode === 'full' ? 'full' : 'pip',
          }))
          .filter((c) => c.keyword && c.endTime > c.startTime + 0.5)
      : [];

    if (rawCutaways.length === 0) {
      await this.billingService.deductTokens(userId, 1, `Auto-cutaway analysis (no matches) clip ${segmentIndex}`);
      return { added: [], skipped: 0 };
    }

    // Deduct base token for AI analysis
    await this.billingService.deductTokens(userId, 2, `Auto-cutaway AI for clip ${segmentIndex}`);

    // For each cutaway, fetch footage and add to plan
    const plan = ((project.brollPlan as BrollItem[]) || []).slice();
    const added: BrollItem[] = [];
    let skipped = 0;
    for (const cut of rawCutaways.slice(0, maxOverlays)) {
      try {
        const fr = await this.footageService.fetchFootage(cut.keyword, {
          perSource: 4,
          orientation: options.orientation,
        });
        // Pick best: prefer video if requested, else first available
        const candidates = options.preferVideo
          ? [...fr.pexelsVideos, ...fr.pexelsPhotos, ...fr.googleImages]
          : [...fr.pexelsPhotos, ...fr.pexelsVideos, ...fr.googleImages];
        const pick = candidates[0];
        if (!pick) {
          skipped += 1;
          continue;
        }
        const start = Math.max(0, Math.min(cut.startTime, segDuration - 1));
        const end = Math.max(start + 0.5, Math.min(cut.endTime, segDuration));
        const id = `broll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const item: BrollItem = {
          id,
          sourceUrl: pick.previewUrl || pick.downloadUrl || pick.thumbnailUrl,
          type: pick.source === 'pexels-video' ? 'video' : 'image',
          thumbnailUrl: pick.thumbnailUrl,
          segmentIndex,
          start,
          end,
          mode: cut.mode || 'pip',
          transition: 'fade',
          pipX: 0.5,
          pipY: 0.18,
          pipScale: 0.4,
          duckSourceAudio: false,
          duckLevel: 0.3,
          attribution: pick.attribution?.author ? `${pick.attribution.author} (Pexels)` : undefined,
        };
        plan.push(item);
        added.push(item);
      } catch (err) {
        this.logger.warn(`Auto-cutaway: failed to fetch footage for "${cut.keyword}": ${(err as Error).message}`);
        skipped += 1;
      }
    }

    if (added.length > 0) {
      const db = this.drizzle.getDb();
      await db.update(videoClipProjects).set({ brollPlan: plan, updatedAt: new Date() }).where(eq(videoClipProjects.id, projectId));
    }

    return { added, skipped };
  }

  // ============ Preset CRUD ============

  async listPresets(userId: string) {
    const db = this.drizzle.getDb();
    return db
      .select()
      .from(schema.videoClipPreset)
      .where(eq(schema.videoClipPreset.userId, userId))
      .orderBy(desc(schema.videoClipPreset.isFavorite), desc(schema.videoClipPreset.updatedAt));
  }

  async createPreset(userId: string, name: string, config: VideoClipPresetConfig, description?: string) {
    if (!name?.trim()) throw new BadRequestException('Nama preset wajib diisi');
    const db = this.drizzle.getDb();
    const [row] = await db
      .insert(schema.videoClipPreset)
      .values({
        userId,
        name: name.trim().slice(0, 100),
        description: description?.slice(0, 500) || null,
        config,
      })
      .returning();
    return row;
  }

  async updatePreset(
    userId: string,
    presetId: string,
    patch: { name?: string; description?: string; config?: VideoClipPresetConfig; isFavorite?: boolean },
  ) {
    const db = this.drizzle.getDb();
    const [existing] = await db
      .select()
      .from(schema.videoClipPreset)
      .where(and(eq(schema.videoClipPreset.id, presetId), eq(schema.videoClipPreset.userId, userId)));
    if (!existing) throw new NotFoundException('Preset tidak ditemukan');
    const [row] = await db
      .update(schema.videoClipPreset)
      .set({
        name: patch.name?.trim() ? patch.name.trim().slice(0, 100) : existing.name,
        description: patch.description !== undefined ? (patch.description?.slice(0, 500) || null) : existing.description,
        config: patch.config !== undefined ? patch.config : existing.config,
        isFavorite: patch.isFavorite !== undefined ? patch.isFavorite : existing.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(schema.videoClipPreset.id, presetId))
      .returning();
    return row;
  }

  async deletePreset(userId: string, presetId: string) {
    const db = this.drizzle.getDb();
    const [existing] = await db
      .select()
      .from(schema.videoClipPreset)
      .where(and(eq(schema.videoClipPreset.id, presetId), eq(schema.videoClipPreset.userId, userId)));
    if (!existing) throw new NotFoundException('Preset tidak ditemukan');
    await db.delete(schema.videoClipPreset).where(eq(schema.videoClipPreset.id, presetId));
    return { success: true };
  }
}
