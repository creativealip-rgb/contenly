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
