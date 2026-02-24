import { IsString, IsOptional, IsInt, IsUrl } from 'class-validator';

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

export class UpdateScriptSceneDto {
  @IsOptional()
  @IsString()
  visualContext?: string;

  @IsOptional()
  @IsString()
  voiceoverText?: string;
}
