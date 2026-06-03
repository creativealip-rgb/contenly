import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';

export type FootageItem = {
  source: 'pexels-photo' | 'pexels-video' | 'google-image';
  id: string;
  thumbnailUrl: string;
  previewUrl: string; // Larger preview / full-res link
  downloadUrl?: string; // Direct file URL when available
  title?: string;
  width?: number;
  height?: number;
  duration?: number; // For videos in seconds
  attribution?: {
    author?: string;
    authorUrl?: string;
    sourceUrl?: string; // Page URL on the source site
  };
};

export type FootageSearchResult = {
  query: string;
  pexelsPhotos: FootageItem[];
  pexelsVideos: FootageItem[];
  googleImages: FootageItem[];
  errors: { source: string; message: string }[];
};

@Injectable()
export class FootageService {
  private readonly logger = new Logger(FootageService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchFootage(
    query: string,
    options: { perSource?: number; orientation?: 'landscape' | 'portrait' | 'square' } = {},
  ): Promise<FootageSearchResult> {
    const perSource = Math.max(1, Math.min(15, options.perSource ?? 8));
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return {
        query: trimmedQuery,
        pexelsPhotos: [],
        pexelsVideos: [],
        googleImages: [],
        errors: [{ source: 'input', message: 'Query is empty' }],
      };
    }

    const errors: FootageSearchResult['errors'] = [];

    const [photosRes, videosRes, googleRes] = await Promise.allSettled([
      this.searchPexelsPhotos(trimmedQuery, perSource, options.orientation),
      this.searchPexelsVideos(trimmedQuery, perSource, options.orientation),
      this.scrapeGoogleImages(trimmedQuery, perSource),
    ]);

    const pexelsPhotos =
      photosRes.status === 'fulfilled'
        ? photosRes.value
        : (errors.push({ source: 'pexels-photo', message: this.errMsg(photosRes.reason) }), []);

    const pexelsVideos =
      videosRes.status === 'fulfilled'
        ? videosRes.value
        : (errors.push({ source: 'pexels-video', message: this.errMsg(videosRes.reason) }), []);

    const googleImages =
      googleRes.status === 'fulfilled'
        ? googleRes.value
        : (errors.push({ source: 'google-image', message: this.errMsg(googleRes.reason) }), []);

    return {
      query: trimmedQuery,
      pexelsPhotos,
      pexelsVideos,
      googleImages,
      errors,
    };
  }

  // ---------- Pexels ----------

  private getPexelsApiKey(): string | null {
    const key = (this.configService.get<string>('PEXELS_API_KEY') || '').trim();
    return key || null;
  }

  private async searchPexelsPhotos(
    query: string,
    perPage: number,
    orientation?: 'landscape' | 'portrait' | 'square',
  ): Promise<FootageItem[]> {
    const apiKey = this.getPexelsApiKey();
    if (!apiKey) {
      this.logger.debug('PEXELS_API_KEY not set — skipping Pexels photos search');
      return [];
    }

    const url = 'https://api.pexels.com/v1/search';
    const { data } = await axios.get(url, {
      headers: { Authorization: apiKey },
      params: {
        query,
        per_page: perPage,
        orientation: orientation || undefined,
      },
      timeout: 12000,
    });

    const photos: any[] = Array.isArray(data?.photos) ? data.photos : [];

    return photos.map((p) => ({
      source: 'pexels-photo' as const,
      id: String(p.id),
      thumbnailUrl: p.src?.medium || p.src?.small || p.src?.tiny || '',
      previewUrl: p.src?.large2x || p.src?.large || p.src?.original || '',
      downloadUrl: p.src?.original || p.src?.large || '',
      title: p.alt || '',
      width: p.width,
      height: p.height,
      attribution: {
        author: p.photographer,
        authorUrl: p.photographer_url,
        sourceUrl: p.url,
      },
    }));
  }

  private async searchPexelsVideos(
    query: string,
    perPage: number,
    orientation?: 'landscape' | 'portrait' | 'square',
  ): Promise<FootageItem[]> {
    const apiKey = this.getPexelsApiKey();
    if (!apiKey) {
      this.logger.debug('PEXELS_API_KEY not set — skipping Pexels videos search');
      return [];
    }

    const url = 'https://api.pexels.com/videos/search';
    const { data } = await axios.get(url, {
      headers: { Authorization: apiKey },
      params: {
        query,
        per_page: perPage,
        orientation: orientation || undefined,
      },
      timeout: 12000,
    });

    const videos: any[] = Array.isArray(data?.videos) ? data.videos : [];

    return videos.map((v) => {
      const files: any[] = Array.isArray(v.video_files) ? v.video_files : [];
      // Prefer mid-quality MP4 link for preview; fallback to first file
      const mp4 = files.find((f) => f.file_type === 'video/mp4' && f.quality === 'sd') ||
        files.find((f) => f.file_type === 'video/mp4') ||
        files[0];

      const pictures: any[] = Array.isArray(v.video_pictures) ? v.video_pictures : [];
      const thumb = pictures[0]?.picture || v.image || '';

      return {
        source: 'pexels-video' as const,
        id: String(v.id),
        thumbnailUrl: thumb,
        previewUrl: v.image || thumb,
        downloadUrl: mp4?.link || '',
        title: v.user?.name ? `Video by ${v.user.name}` : '',
        width: v.width,
        height: v.height,
        duration: v.duration,
        attribution: {
          author: v.user?.name,
          authorUrl: v.user?.url,
          sourceUrl: v.url,
        },
      };
    });
  }

  // ---------- Google Image scrape ----------

  /**
   * Scrape Google Images thumbnail listing. This is best-effort and may break
   * when Google changes its markup. We use the static (non-JS) results page.
   */
  private async scrapeGoogleImages(query: string, limit: number): Promise<FootageItem[]> {
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&safe=active`;

    const { data: html } = await axios.get<string>(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 12000,
      // Google sometimes returns 302 to consent page
      maxRedirects: 5,
      validateStatus: (s) => s < 400,
    });

    const items: FootageItem[] = [];
    const $ = cheerio.load(html);

    // Strategy 1: <img> tags with data-src or src that are actual content thumbnails.
    // Google encodes thumbnails as base64 data URIs in <img src>; we try to extract them.
    const seen = new Set<string>();
    $('img').each((_, el) => {
      if (items.length >= limit) return false;
      const $el = $(el);
      const src = $el.attr('data-src') || $el.attr('src') || '';
      const alt = ($el.attr('alt') || '').trim();
      if (!src) return;
      if (src.startsWith('/images/branding')) return; // Google logo etc.
      if (seen.has(src)) return;
      seen.add(src);

      // Skip tiny gif spacers
      if (src.startsWith('data:image/gif;base64,R0lGODlh')) return;

      items.push({
        source: 'google-image',
        id: `g-${items.length}-${src.slice(-12).replace(/[^a-z0-9]/gi, '')}`,
        thumbnailUrl: src,
        previewUrl: src,
        title: alt,
        attribution: {
          sourceUrl: url,
        },
      });
    });

    // Strategy 2: extract original image URLs from inline JSON if present.
    // Google embeds an array of `["url", w, h]` triples in a script. We use a
    // light regex to surface up to a handful for the previewUrl.
    const fullUrls: string[] = [];
    const regex = /"(https?:\/\/[^"\s]+\.(?:jpg|jpeg|png|webp))",\d+,\d+/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      if (fullUrls.length >= limit * 2) break;
      const u = match[1];
      if (!u.includes('gstatic.com') && !u.includes('googleusercontent.com')) {
        fullUrls.push(u);
      }
    }

    // Pair full URLs with first N items (skip the very first item which is often Google branding)
    let urlIdx = 0;
    for (let i = 0; i < items.length && urlIdx < fullUrls.length; i++) {
      if (items[i].previewUrl && items[i].previewUrl.startsWith('data:')) continue;
      items[i].previewUrl = fullUrls[urlIdx];
      items[i].downloadUrl = fullUrls[urlIdx];
      urlIdx++;
    }

    return items.slice(0, limit);
  }

  private errMsg(reason: unknown): string {
    if (axios.isAxiosError(reason)) {
      return `${reason.response?.status || ''} ${reason.message}`.trim();
    }
    if (reason instanceof Error) return reason.message;
    return String(reason);
  }
}
