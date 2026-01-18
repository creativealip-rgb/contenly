import { IsUrl, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScrapeUrlDto {
    @ApiProperty({ example: 'https://example.com/article' })
    @IsUrl()
    url: string;

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    extractImages?: boolean = true;

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    extractMetadata?: boolean = true;
}
