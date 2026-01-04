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
import { utcTimeTransformer } from '../transformers/utc-time.transformer';

@Entity('datasource_meta_version')
export class DataSourceMetaVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Datasource)
  @JoinColumn({ name: 'datasource_id' })
  dataSource: Datasource;

  @Column({ type: 'int' })
  version: number;

  @Column({
    type: 'datetime',
    transformer: utcTimeTransformer,
  })
  refreshedAt: Date;

  @Column({ nullable: true })
  remark?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
