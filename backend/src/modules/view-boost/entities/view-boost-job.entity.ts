import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ViewBoostStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

@Entity('view_boost_jobs')
export class ViewBoostJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  url: string;

  @Column({ name: 'target_views', type: 'int' })
  targetViews: number;

  @Column({ name: 'current_views', type: 'int', default: 0 })
  currentViews: number;

  @Column({
    type: 'enum',
    enum: ViewBoostStatus,
    default: ViewBoostStatus.PENDING,
  })
  status: ViewBoostStatus;

  @Column({ name: 'proxy_list', type: 'text', nullable: true })
  proxyList: string;

  @Column({ name: 'user_agents', type: 'text', nullable: true })
  userAgents: string;

  @Column({ name: 'delay_min', type: 'int', default: 5 })
  delayMin: number;

  @Column({ name: 'delay_max', type: 'int', default: 30 })
  delayMax: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
