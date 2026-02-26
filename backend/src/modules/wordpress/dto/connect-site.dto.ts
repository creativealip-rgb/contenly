import { IsString, IsNotEmpty, IsUrl, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectSiteDto {
    @ApiProperty({ example: 'My WordPress Blog' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'https://myblog.com' })
    @IsUrl()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'xxxx xxxx xxxx xxxx' })
    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    appPassword: string;
}
