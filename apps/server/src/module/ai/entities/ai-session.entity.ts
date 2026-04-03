import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { AiSessionType } from '../enums/ai-session-type.enum';
import { AiSessionStatus } from '../enums/ai-session-status.enum';

@Entity('ai_session')
export class AiSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({
    type: 'enum',
    enum: AiSessionType,
    default: AiSessionType.CHAT,
  })
  type: AiSessionType;

  @Column({
    type: 'enum',
    enum: AiSessionStatus,
    default: AiSessionStatus.ACTIVE,
  })
  status: AiSessionStatus;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens: number;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
