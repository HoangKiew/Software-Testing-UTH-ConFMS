import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

@Entity({ name: 'audit_logs' })
@Index(['conferenceId'])
@Index(['userId'])
@Index(['resourceType', 'resourceId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  action: string; 

  @Column({ type: 'varchar', length: 50 })
  resourceType: string; 

  @Column({ type: 'int', nullable: true })
  resourceId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Conference, {
    onDelete: 'SET NULL',
  })
  conference: Conference | null;
}















