import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Dataset } from './dataset.entity';
import { DatasourceTable } from '@/module/datasource/entities/datasource-table.entity';

@Entity('dataset_tables')
export class DatasetTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dataset_id', type: 'int' })
  datasetId: number;

  @Column({ name: 'table_id', type: 'int' })
  tableId: number;

  @Column({ name: 'dataset_name', type: 'varchar', length: 100 })
  datasetName: string;

  @Column({ name: 'table_name', type: 'varchar', length: 255 })
  tableName: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Dataset, (dataset) => dataset.datasetTables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;

  @ManyToOne(() => DatasourceTable, (table) => table.datasetTables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'table_id' })
  table: DatasourceTable;
}
