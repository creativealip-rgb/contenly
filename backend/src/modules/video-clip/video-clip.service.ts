import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DrizzleService } from '../../db/drizzle.service';
import { videoClipProjects } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { OpenAiService } from '../ai/services/openai.service';
import { BillingService } from '../billing/billing.service';
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

@Injectable()
export class VideoClipService {
  private readonly logger = new Logger(VideoClipService.name);
  private readonly outputDir = path.join(os.tmpdir(), 'contenly-clips');

  constructor(
    private drizzle: DrizzleService,
    private openAiService: OpenAiService,
    private billingService: BillingService,
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
    subtitleStyle?: any,
    titleStyle?: any,
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
    }, { attempts: 2, backoff: 5000 });

    return { message: 'Export started', jobId };
  }

  async clipAndExport(
    videoPath: string,
    segment: ClipSegment,
    words: TranscriptWord[],
    subtitleStyle: any,
    titleStyle: any,
    outputId: string,
  ): Promise<string> {
    const outputPath = path.join(this.outputDir, `${outputId}-short.mp4`);
    const srtPath = path.join(this.outputDir, `${outputId}.srt`);
    const { startTime, endTime, hookTitle } = segment;

    // Generate SRT from word timestamps for this segment
    const segmentWords = words.filter(w => w.start >= startTime && w.end <= endTime);
    const srtContent = this.generateSRT(segmentWords, startTime);
    await fs.writeFile(srtPath, srtContent);

    // Build ffmpeg filter for 9:16 crop + subtitle + title overlay
    const fontFamily = subtitleStyle?.fontFamily || 'Arial';
    const fontSize = subtitleStyle?.fontSize || 24;
    const fontColor = subtitleStyle?.fontColor || 'white';
    const subPosition = subtitleStyle?.position || 'bottom';
    const titleText = titleStyle?.text || hookTitle;
    const titleFontSize = titleStyle?.fontSize || 32;
    const titleColor = titleStyle?.fontColor || 'white';
    const titleBg = titleStyle?.bgColor || '0x00000080';
    const titlePos = titleStyle?.position || 'top';

    const subY = subPosition === 'top' ? '100' : subPosition === 'center' ? '(h-text_h)/2' : 'h-text_h-120';
    const titleY = titlePos === 'top' ? '80' : titlePos === 'center' ? '(h-text_h)/2' : 'h-text_h-80';

    // Complex filter: crop to 9:16, scale to 1080x1920, burn subtitles, add title
    // For ffmpeg subtitles filter on Windows: escape backslashes and colons for libass
    const escapedSrtPath = srtPath.replace(/\\/g, '\\\\\\\\').replace(/:/g, '\\\\:');
    const filterComplex = [
      // Crop to 9:16 from center, then scale
      `crop=ih*9/16:ih,scale=1080:1920`,
      // Burn subtitles
      `subtitles=${escapedSrtPath}:force_style='FontName=${fontFamily},FontSize=${fontSize},PrimaryColour=&H00${this.hexToASS(fontColor)},Alignment=2,MarginV=${subPosition === 'bottom' ? 60 : 20}'`,
      // Title overlay
      `drawtext=text='${titleText.replace(/'/g, "\\'")}':fontsize=${titleFontSize}:fontcolor=${titleColor}:box=1:boxcolor=${titleBg}:boxborderw=10:x=(w-text_w)/2:y=${titleY}:enable='between(t,0,4)'`,
    ].join(',');

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

    await fs.unlink(srtPath).catch(() => {});
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

  async updateSegment(userId: string, projectId: string, segmentIndex: number, data: any) {
    const project = await this.getProject(userId, projectId);
    const segments = (project.segments as ClipSegment[]) || [];
    if (segmentIndex >= segments.length) throw new BadRequestException('Invalid segment index');

    segments[segmentIndex] = { ...segments[segmentIndex], ...data };
    const db = this.drizzle.getDb();
    await db.update(videoClipProjects).set({ segments }).where(eq(videoClipProjects.id, projectId));
    return segments[segmentIndex];
  }
}
