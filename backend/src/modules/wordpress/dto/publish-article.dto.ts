import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsDateString, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishArticleDto {
  @ApiProperty({ example: 'My Awesome Post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '<p>Hello world</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'publish' }) // Removed enum check to avoid strict mismatch if WP adds statuses
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: [1, 2], required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categories?: number[];

  @ApiProperty({ example: '2026-02-24T12:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 'https://source.com/article', required: false })
  @IsUrl()
  @IsOptional()
  sourceUrl?: string;

  @ApiProperty({ example: 'Raw content...', required: false })
  @IsString()
  @IsOptional()
  originalContent?: string;

  @ApiProperty({ example: 'uuid-v4', required: false })
  @IsString() // Using string because uuidValidate is used manually in service, but DTO can check it too
  @IsOptional()
  feedItemId?: string;

  @ApiProperty({ example: 'uuid-v4', required: false })
  @IsString()
  @IsOptional()
  articleId?: string;

  @ApiProperty({ example: 'https://image.com/featured.jpg', required: false })
  @IsString() // Allowing data: urls too so IsUrl might fail
  @IsOptional()
  featuredImageUrl?: string;
}
