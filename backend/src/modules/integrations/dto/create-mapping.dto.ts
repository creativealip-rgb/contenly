import { IsString, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMappingDto {
  @ApiProperty({ example: 'Technology', description: 'Source category name' })
  @IsString()
  @IsNotEmpty()
  sourceCategory: string;

  @ApiProperty({ example: '12', description: 'WordPress category ID' })
  @IsString()
  @IsNotEmpty()
  targetCategoryId: string;

  @ApiProperty({ example: 'Tech News', description: 'WordPress category name' })
  @IsString()
  @IsNotEmpty()
  targetCategoryName: string;
}
