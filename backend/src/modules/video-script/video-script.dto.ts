import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateScriptProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceContent?: string;
}

export class GenerateScriptDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  targetDurationSeconds?: number;
}

export class UpdateScriptProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sourceContent?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  subHeadline?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  hook?: string;

  @IsOptional()
  @IsString()
  thumbnailPrompt?: string;

  @IsOptional()
  @IsString()
  musicSuggestion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsInt()
  targetDurationSeconds?: number;
}

export class UpdateScriptSceneDto {
  @IsOptional()
  @IsString()
  visualContext?: string;

  @IsOptional()
  @IsString()
  voiceoverText?: string;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  footageSearches?: Array<{
    platform?: string;
    keyword?: string;
    url?: string;
  }>;
}

export class RegenerateScriptFieldDto {
  @IsIn(['headline', 'subHeadline', 'caption', 'thumbnailPrompt'])
  field: 'headline' | 'subHeadline' | 'caption' | 'thumbnailPrompt';
}

export class FetchSceneFootageDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsInt()
  perSource?: number;

  @IsOptional()
  @IsIn(['landscape', 'portrait', 'square'])
  orientation?: 'landscape' | 'portrait' | 'square';
}

export class SelectSceneFootageDto {
  @IsArray()
  items: Array<{
    source: string;
    id: string;
    thumbnailUrl: string;
    previewUrl?: string;
    downloadUrl?: string;
    title?: string;
    width?: number;
    height?: number;
    duration?: number;
    attribution?: {
      author?: string;
      authorUrl?: string;
      sourceUrl?: string;
    };
  }>;
}

export class AddSceneDto {
  @IsOptional()
  @IsInt()
  afterSceneNumber?: number;
}

export class ReorderScenesDto {
  @IsArray()
  @IsString({ each: true })
  orderedSceneIds: string[];
}

export class TtsPreviewDto {
  @IsOptional()
  @IsIn(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}
