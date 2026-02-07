import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Datasource } from './datasource.entity';

/**
 * 外键关系实体
 * 用于存储数据源中表与表之间的外键关联关系
 */
@Entity('datasource_foreign_keys')
export class DatasourceForeignKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'data_source_id', type: 'int' })
  dataSourceId: number;

  @Column({ name: 'fk_name', type: 'varchar', length: 255 })
  fkName: string;

  @Column({ name: 'source_table_name', type: 'varchar', length: 255 })
  sourceTableName: string;

  @Column({ name: 'source_column_name', type: 'varchar', length: 255 })
  sourceColumnName: string;

  @Column({ name: 'target_table_name', type: 'varchar', length: 255 })
  targetTableName: string;

  @Column({ name: 'target_column_name', type: 'varchar', length: 255 })
  targetColumnName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @ManyToOne(() => Datasource, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'data_source_id' })
  datasource: Datasource;
}
