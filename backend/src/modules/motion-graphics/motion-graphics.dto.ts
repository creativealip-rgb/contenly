import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class RenderTemplateDto {
  @IsString()
  templateId: string;

  @IsObject()
  props: Record<string, any>;

  @IsOptional()
  @IsIn(['mp4', 'webm', 'png'])
  format?: 'mp4' | 'webm' | 'png';

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(300)
  durationFrames?: number;

  @IsOptional()
  @IsInt()
  @Min(720)
  @Max(3840)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(720)
  @Max(3840)
  height?: number;
}

export class ListTemplatesDto {
  @IsOptional()
  @IsIn(['title', 'lower-third', 'text', 'counter', 'subscribe', 'transition', 'logo', 'callout', 'caption', 'all'])
  category?: string;
}

export class AiGenerateAnimationDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  durationSeconds?: number;

  @IsOptional()
  @IsIn(['1920x1080', '1080x1920', '1080x1080'])
  resolution?: string;

  @IsOptional()
  @IsString()
  style?: string;
}

export class RenderCaptionDto {
  @IsArray()
  words: Array<{ word: string; start: number; end: number }>;

  @IsOptional()
  @IsIn(['classic', 'neon', 'bounce', 'highlight', 'karaoke'])
  style?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsString()
  highlightColor?: string;

  @IsOptional()
  @IsInt()
  fontSize?: number;
}
