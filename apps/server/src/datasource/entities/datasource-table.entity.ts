import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Datasource } from './datasource.entity';

@Entity('datasource_table')
export class DataSourceTable {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Datasource)
  @JoinColumn({ name: 'datasource_id' })
  dataSource: Datasource;

  @Column()
  tableName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
