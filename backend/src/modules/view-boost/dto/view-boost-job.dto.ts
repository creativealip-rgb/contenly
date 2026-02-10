export class CreateViewBoostJobDto {
  url: string;
  targetViews: number;
  proxyList?: string;
  delayMin?: number;
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
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}
