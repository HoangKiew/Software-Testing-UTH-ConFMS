// src/decisions/entities/decision.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Submission } from '../../submissions/entities/submission.entity';

// ĐẶT ENUM TRỰC TIẾP TRONG FILE ĐỂ TRÁNH LỖI IMPORT VÒNG HOẶC SELF-IMPORT
export enum DecisionType {
  ACCEPT = 'accept',
  REJECT = 'reject',
  REVISE = 'revise',      // Nếu hệ thống có revise
  WITHDRAW = 'withdraw',  // Nếu cần
}

@Entity({ name: 'decisions' })
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'submission_id' })
  submissionId: string;

  // SỬ DỤNG ENUM ĐÃ KHAI BÁO Ở TRÊN
  @Column({ type: 'enum', enum: DecisionType })
  decision: DecisionType;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ name: 'decided_by', type: 'integer' })
  decidedBy: number;

  @Column({ type: 'timestamp' })
  decidedAt: Date;

  @ManyToOne(() => Submission, (submission) => submission.id, { onDelete: 'CASCADE' })
  submission: Submission;

  @CreateDateColumn()
  createdAt: Date;
}