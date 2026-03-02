import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUrl,
  IsHexColor,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceContent?: string;

  @IsOptional()
  @IsString()
  globalStyle?: string;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  globalStyle?: string;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateSlideDto {
  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  visualPrompt?: string;

  @IsOptional()
  @IsString()
  layoutPosition?: string;

  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(72)
  fontSize?: number;

  @IsOptional()
  @IsHexColor()
  fontColor?: string;
}

export class GenerateStoryboardDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  targetSlides?: number;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class InstagramGenerateImageDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  referenceImageUrl?: string;
}

export class ExportCarouselDto {
  @IsOptional()
  @IsString()
  format?: 'png' | 'jpg' | 'pdf';

  @IsOptional()
  @IsInt()
  quality?: number;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class CreateSlideDto {
  @IsInt()
  slideNumber: number;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  visualPrompt?: string;
}

export class ReorderSlidesDto {
  @IsString()
  slideId: string;

  @IsInt()
  newSlideNumber: number;
}
