import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class GenerateOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional({ enum: ['short', 'medium', 'long'] })
  @IsOptional()
  @IsEnum(['short', 'medium', 'long'])
  length?: 'short' | 'medium' | 'long';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetLanguage?: string;
}

export class GenerateContentDto {
  @ApiProperty({ description: 'Original content to rewrite' })
  @IsString()
  originalContent: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ enum: ['rewrite', 'idea'], default: 'rewrite' })
  @IsOptional()
  @IsEnum(['rewrite', 'idea'])
  mode?: 'rewrite' | 'idea';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedItemId?: string;

  @ApiPropertyOptional({ type: GenerateOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenerateOptionsDto)
  options?: GenerateOptionsDto;
}

export class GenerateSeoDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  keywords?: string[];
}

export class AiGenerateImageDto {
  @ApiProperty({ description: 'Description of the image to generate' })
  @IsString()
  prompt: string;
}
