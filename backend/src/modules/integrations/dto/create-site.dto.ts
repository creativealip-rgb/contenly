import { IsString, IsUrl, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSiteDto {
  @ApiProperty({
    example: 'My WordPress Blog',
    description: 'Display name for the site',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'https://myblog.com',
    description: 'WordPress site URL',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: 'admin', description: 'WordPress admin username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'xxxx xxxx xxxx xxxx',
    description: 'WordPress application password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  appPassword: string;
}
