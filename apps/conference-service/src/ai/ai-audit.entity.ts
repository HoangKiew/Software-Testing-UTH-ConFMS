// src/ai/ai-audit.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'ai_audit_logs' })
export class AiAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  model: string; // <-- BẮT BUỘC CÓ DÒNG NÀY VỚI @Column()

  @Column({ length: 100 })
  feature: string;

  @Column({ name: 'conference_id', nullable: true })
  conferenceId?: string;

  @Column({ name: 'submission_id', nullable: true })
  submissionId?: string;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId?: number;

  @Column({ length: 64 })
  inputHash: string;

  @Column({ type: 'text', nullable: true })
  outputPreview: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}