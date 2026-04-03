import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { AiStatus, AiType } from '../enums/ai-status.enum';

@Entity('ai')
export class Ai {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AiType,
    default: AiType.CHAT,
  })
  type: AiType;

  @Column({
    type: 'enum',
    enum: AiStatus,
    default: AiStatus.ACTIVE,
  })
  status: AiStatus;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, any>;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
