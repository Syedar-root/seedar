import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Datasource } from './datasource.entity';
import { DatasourceColumn } from './datasource-column.entity';

@Entity('datasource_tables')
export class DatasourceTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'data_source_id', type: 'int' })
  dataSourceId: number;

  @Column({ name: 'table_name', type: 'varchar', length: 255 })
  tableName: string;

  @Column({
    name: 'table_comment',
    type: 'text',
    nullable: true,
  })
  tableComment?: string;

  @Column({
    name: 'row_count',
    type: 'int',
    nullable: true,
  })
  rowCount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @ManyToOne(() => Datasource, (datasource) => datasource.tables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'data_source_id' })
  datasource: Datasource;

  @OneToMany(() => DatasourceColumn, (column) => column.table)
  columns: DatasourceColumn[];
}
