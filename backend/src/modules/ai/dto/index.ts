import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateContentDto {
    @ApiProperty({ description: 'Original content to rewrite' })
    @IsString()
    originalContent: string;

    @ApiPropertyOptional()
    options?: {
        tone?: string;
        length?: 'short' | 'medium' | 'long';
        keywords?: string[];
        targetLanguage?: string;
    };
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

export class GenerateImageDto {
    @ApiProperty({ description: 'Description of the image to generate' })
    @IsString()
    prompt: string;
}
