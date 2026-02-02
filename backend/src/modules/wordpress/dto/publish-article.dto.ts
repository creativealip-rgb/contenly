import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class PublishArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(['draft', 'publish', 'private', 'future', 'DRAFT', 'PUBLISHED', 'SCHEDULED'], {
    message: 'Status must be draft, publish, private, future, DRAFT, PUBLISHED, or SCHEDULED',
  })
  status: 'draft' | 'publish' | 'private' | 'future' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

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
