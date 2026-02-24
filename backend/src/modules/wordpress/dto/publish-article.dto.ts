import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class PublishArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(['draft', 'publish', 'private', 'future'])
  status: 'draft' | 'publish' | 'private' | 'future';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  date?: string; // For scheduled posts (future status)

  @IsOptional()
  @IsString()
  featuredImageUrl?: string;
}
