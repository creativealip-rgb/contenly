import { IsString, IsNotEmpty, IsUrl, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedDto {
    @ApiProperty({ example: 'TechCrunch' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'https://techcrunch.com/feed/' })
    @IsUrl()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ example: 15, required: false })
    @IsInt()
    @IsOptional()
    @Min(5)
    pollingIntervalMinutes?: number;
}
