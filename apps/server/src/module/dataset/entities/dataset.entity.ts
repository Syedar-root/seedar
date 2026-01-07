import { Datasource } from '@/module/datasource/entities/datasource.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DatasetTable } from './dataset-table.entity';
import { DatasetStatus, DatasetType } from '../dataset.types';

@Entity('dataset')
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string;

  @OneToOne(() => Datasource)
  @JoinColumn()
  datasource: Datasource;

  @OneToMany(() => DatasetTable, (datasetTable) => datasetTable.dataset, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  datasetTables: DatasetTable[];

  @Column({
    type: 'enum',
    enum: DatasetStatus,
    default: DatasetStatus.ACTIVE,
  })
  status: DatasetStatus;

  @Column({
    type: 'enum',
    enum: DatasetType,
    default: DatasetType.SEMANTIC,
  })
  type: DatasetType;
}
