// src/audit/audit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number | null;

  @Column()
  action: string; // ví dụ: 'CREATE_CONFERENCE', 'UPDATE_DEADLINE', 'MAKE_DECISION'

  @Column({ nullable: true })
  entity: string; // 'Conference', 'Submission', etc.

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: any; // { old: {...}, new: {...} }

  @CreateDateColumn()
  createdAt: Date;
}