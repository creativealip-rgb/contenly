import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  sourceUrl: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class AnalyzeDto {
  @IsString()
  projectId: string;
}

export class ClipSegmentDto {
  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(1)
  endTime: number;

  @IsOptional()
  @IsString()
  hookTitle?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateSegmentDto {
  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  endTime: number;

  @IsOptional()
  @IsString()
  hookTitle?: string;
}

export class SubtitleStyleDto {
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @IsOptional()
  @IsString()
  fontColor?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsString()
  position?: 'top' | 'center' | 'bottom';

  @IsOptional()
  @IsString()
  animation?: 'none' | 'word-highlight' | 'karaoke' | 'fade-in';
}

export class TitleStyleDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @IsOptional()
  @IsString()
  fontColor?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsString()
  position?: 'top' | 'center' | 'bottom';
}

export class ExportClipDto {
  @IsString()
  projectId: string;

  @IsNumber()
  segmentIndex: number;

  @ValidateNested()
  @Type(() => SubtitleStyleDto)
  @IsOptional()
  subtitleStyle?: SubtitleStyleDto;

  @ValidateNested()
  @Type(() => TitleStyleDto)
  @IsOptional()
  titleStyle?: TitleStyleDto;
}
