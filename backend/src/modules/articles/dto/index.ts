import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  sourceUrl: string;

  @ApiProperty()
  @IsString()
  originalContent: string;

  @ApiProperty()
  @IsString()
  generatedContent: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  tokensUsed?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wpPostId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wpPostUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wpSiteId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  feedItemId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  featuredImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wpSiteId?: string;
}
