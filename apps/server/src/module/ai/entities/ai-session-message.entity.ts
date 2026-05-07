import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_session_message')
@Index('IDX_ai_session_message_session_id_id', ['sessionId', 'id'])
@Index('IDX_ai_session_message_session_id_turn_id', ['sessionId', 'turnId'])
@Index('IDX_ai_session_message_session_id_sid', ['sessionId', 'sid'])
export class AiSessionMessage {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'session_id', type: 'varchar', length: 36 })
  sessionId: string;

  @Column({ name: 'turn_id', type: 'varchar', length: 64 })
  turnId: string;

  @Column({ type: 'varchar', length: 64 })
  sid: string;

  @Column({ name: 'message_type', type: 'varchar', length: 32 })
  messageType: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  role?: string;

  @Column({ name: 'content_text', type: 'longtext', nullable: true })
  contentText?: string;

  @Column({ name: 'content_json', type: 'json', nullable: true })
  contentJson?: Record<string, unknown>;

  @Column({ name: 'meta_json', type: 'json', nullable: true })
  metaJson?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
