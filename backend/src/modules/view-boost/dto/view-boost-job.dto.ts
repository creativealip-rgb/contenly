import { IsUrl, IsInt, Min, Max, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateViewBoostJobDto {
  @IsUrl()
  url: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  targetViews: number;

  @IsOptional()
  @IsString()
  proxyList?: string;

  @IsOptional()
  @IsEnum(['standard', 'premium'])
  serviceType?: 'standard' | 'premium';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  delayMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  delayMax?: number;
}

export class UpdateViewBoostJobDto {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentViews?: number;
  errorMessage?: string;
}

export class ViewBoostJobResponse {
  id: string;
  url: string;
  targetViews: number;
  currentViews: number;
  status: string;
  serviceType: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}
