import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { DataSourceTable } from './datasource-table.entity';
import { NormalizedDataType } from '../datasource.types';

@Entity('datasource_column')
export class DataSourceColumn {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => DataSourceTable)
  @JoinColumn({ name: 'datasource_table_id' })
  table: DataSourceTable;

  @Column({ type: 'varchar', length: 100 })
  columnName: string;

  @Column()
  rawDataType: string;

  @Column({
    type: 'enum',
    enum: NormalizedDataType,
  })
  normalizedType: NormalizedDataType;

  @Column({ default: true })
  nullable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
