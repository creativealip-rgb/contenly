import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @IsString()
    id: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    fullName?: string;
}

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    avatarUrl?: string;
}

export class CreateApiKeyDto {
    @ApiProperty({ example: 'My API Key' })
    @IsString()
    name: string;
}
