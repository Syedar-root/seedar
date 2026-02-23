import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QueryStatus } from '../query-status.enum';

@Entity('query')
export class Query {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  datasetId: number;

  @Column({ type: 'json' })
  dsl: any;

  @Column({ type: 'enum', enum: QueryStatus, default: QueryStatus.DRAFT })
  status: QueryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
