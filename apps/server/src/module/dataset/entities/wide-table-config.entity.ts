import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Entity,
} from 'typeorm';

@Entity()
export class WideTableConfig {
  /** 主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 数据集 ID */
  @Column({ name: 'dataset_id', type: 'int' })
  dataSetId: number;

  /** 目标宽表名 */
  @Column({ name: 'target_table_name', type: 'varchar', length: 255 })
  targetTableName: string;

  /** 同步策略 */
  @Column({ name: 'sync_strategy', type: 'enum', enum: ['manual', 't+1'] })
  syncStrategy: 'manual' | 't+1';

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
