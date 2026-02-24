import { IsString, IsOptional, IsUrl, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeedDto {
    @ApiProperty({ example: 'TechCrunch', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'https://techcrunch.com/feed/', required: false })
    @IsUrl()
    @IsOptional()
    url?: string;

    @ApiProperty({ example: 15, required: false })
    @IsInt()
    @IsOptional()
    @Min(5)
    pollingIntervalMinutes?: number;

    @ApiProperty({ example: 'active', required: false })
    @IsEnum(['active', 'paused', 'error'])
    @IsOptional()
    status?: string;
}
