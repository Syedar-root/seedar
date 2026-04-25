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
import type { QueryDSL } from '../dsl-transformer/dsl-transformer.v2';

@Entity('query')
export class Query {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column()
  datasetId: number;

  @ManyToOne(() => Dataset)
  @JoinColumn({ name: 'datasetId' })
  dataset: Dataset;

  @Column({ type: 'json', nullable: true })
  dsl: QueryDSL | null;

  @Column({ type: 'enum', enum: QueryStatus, default: QueryStatus.DRAFT })
  status: QueryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
