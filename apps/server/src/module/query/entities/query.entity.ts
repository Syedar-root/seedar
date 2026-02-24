import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QueryStatus } from '../query-status.enum';
import { Dataset } from '@/module/dataset/entities/dataset.entity';

@Entity('query')
export class Query {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  datasetId: number;

  @ManyToOne(() => Dataset)
  @JoinColumn({ name: 'datasetId' })
  dataset: Dataset;

  @Column({ type: 'json' })
  dsl: any;

  @Column({ type: 'enum', enum: QueryStatus, default: QueryStatus.DRAFT })
  status: QueryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
