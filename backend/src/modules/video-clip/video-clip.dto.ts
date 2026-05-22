import { IsString, IsOptional, IsNumber, IsArray, IsObject, ValidateNested, Min, IsIn, IsBoolean, IsInt } from 'class-validator';
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
  @IsOptional()
  @IsNumber()
  @Min(0)
  startTime?: number;

  @IsOptional()
  @IsNumber()
  endTime?: number;

  @IsOptional()
  @IsString()
  hookTitle?: string;
}

export class AddSegmentDto {
  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  endTime: number;

  @IsOptional()
  @IsString()
  hookTitle?: string;
}

export class SplitSegmentDto {
  @IsNumber()
  splitAt: number;
}

export class GenerateAlternateHooksDto {
  @IsOptional()
  @IsInt()
  count?: number;
}

export class FetchUrlMetadataDto {
  @IsString()
  sourceUrl: string;
}

export class BrollSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  perSource?: number;

  @IsOptional()
  @IsIn(['landscape', 'portrait', 'square'])
  orientation?: 'landscape' | 'portrait' | 'square';
}

export class AddBrollItemDto {
  @IsString()
  sourceUrl: string;

  @IsIn(['image', 'video'])
  type: 'image' | 'video';

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsInt()
  segmentIndex: number;

  @IsNumber()
  start: number;

  @IsNumber()
  end: number;

  @IsOptional()
  @IsIn(['pip', 'full', 'side'])
  mode?: 'pip' | 'full' | 'side';

  @IsOptional()
  @IsIn(['cut', 'fade', 'slide'])
  transition?: 'cut' | 'fade' | 'slide';

  @IsOptional()
  @IsNumber()
  pipX?: number;

  @IsOptional()
  @IsNumber()
  pipY?: number;

  @IsOptional()
  @IsNumber()
  pipScale?: number;

  @IsOptional()
  @IsBoolean()
  duckSourceAudio?: boolean;

  @IsOptional()
  @IsNumber()
  duckLevel?: number;

  @IsOptional()
  @IsString()
  attribution?: string;
}

export class UpdateBrollItemDto {
  @IsOptional()
  @IsNumber()
  start?: number;

  @IsOptional()
  @IsNumber()
  end?: number;

  @IsOptional()
  @IsIn(['pip', 'full', 'side'])
  mode?: 'pip' | 'full' | 'side';

  @IsOptional()
  @IsIn(['cut', 'fade', 'slide'])
  transition?: 'cut' | 'fade' | 'slide';

  @IsOptional()
  @IsNumber()
  pipX?: number;

  @IsOptional()
  @IsNumber()
  pipY?: number;

  @IsOptional()
  @IsNumber()
  pipScale?: number;

  @IsOptional()
  @IsBoolean()
  duckSourceAudio?: boolean;

  @IsOptional()
  @IsNumber()
  duckLevel?: number;
}

export class SuggestBrollKeywordsDto {
  @IsInt()
  segmentIndex: number;

  @IsOptional()
  @IsInt()
  count?: number;
}

export class AutoCutawayDto {
  @IsInt()
  segmentIndex: number;

  @IsOptional()
  @IsInt()
  maxOverlays?: number;

  @IsOptional()
  @IsBoolean()
  preferVideo?: boolean;

  @IsOptional()
  @IsIn(['landscape', 'portrait', 'square'])
  orientation?: 'landscape' | 'portrait' | 'square';
}

export class CreatePresetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  config: Record<string, unknown>;
}

export class UpdatePresetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
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
  outlineColor?: string;

  @IsOptional()
  @IsNumber()
  outlineWidth?: number;

  @IsOptional()
  @IsBoolean()
  shadow?: boolean;

  @IsOptional()
  @IsIn(['top', 'center', 'bottom'])
  position?: 'top' | 'center' | 'bottom';

  @IsOptional()
  @IsIn(['none', 'word-highlight', 'karaoke', 'fade-in'])
  animation?: 'none' | 'word-highlight' | 'karaoke' | 'fade-in';

  @IsOptional()
  @IsString()
  highlightColor?: string;
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
  @IsIn(['top', 'center', 'bottom'])
  position?: 'top' | 'center' | 'bottom';
}

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

export class ExportClipDto {
  @IsString()
  projectId: string;

  @IsNumber()
  segmentIndex: number;

  @IsOptional()
  @IsIn(['9:16', '1:1', '16:9', '4:5'])
  aspectRatio?: AspectRatio;

  @IsOptional()
  @IsNumber()
  cropOffsetX?: number;

  @IsOptional()
  @IsBoolean()
  includeBroll?: boolean;

  @ValidateNested()
  @Type(() => SubtitleStyleDto)
  @IsOptional()
  subtitleStyle?: SubtitleStyleDto;

  @ValidateNested()
  @Type(() => TitleStyleDto)
  @IsOptional()
  titleStyle?: TitleStyleDto;
}

export class BatchExportDto {
  @IsString()
  projectId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  segmentIndexes: number[];

  @IsOptional()
  @IsIn(['9:16', '1:1', '16:9', '4:5'])
  aspectRatio?: AspectRatio;

  @IsOptional()
  @IsNumber()
  cropOffsetX?: number;

  @IsOptional()
  @IsBoolean()
  includeBroll?: boolean;

  @ValidateNested()
  @Type(() => SubtitleStyleDto)
  @IsOptional()
  subtitleStyle?: SubtitleStyleDto;

  @ValidateNested()
  @Type(() => TitleStyleDto)
  @IsOptional()
  titleStyle?: TitleStyleDto;
}
