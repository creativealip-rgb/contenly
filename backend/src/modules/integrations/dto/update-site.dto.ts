import { IsString, IsOptional, IsUrl, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSiteDto {
  @ApiPropertyOptional({
    example: 'My WordPress Blog',
    description: 'Display name for the site',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://myblog.com',
    description: 'WordPress site URL',
  })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'WordPress admin username',
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({
    example: 'xxxx xxxx xxxx xxxx',
    description: 'WordPress application password',
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  appPassword?: string;
}
