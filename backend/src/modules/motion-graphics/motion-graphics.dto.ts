import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

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
  @IsIn(['title', 'lower-third', 'text', 'counter', 'subscribe', 'all'])
  category?: string;
}
