import { Datasource } from 'src/module/datasource/entities/datasource.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('dataset')
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string;

  @OneToOne(() => Datasource)
  @JoinColumn()
  datasource: Datasource;
}
