// src/decisions/entities/decision.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// ENUM đặt trực tiếp trong file
export enum DecisionType {
  ACCEPT = 'accept',
  REJECT = 'reject',
  REVISE = 'revise',
  WITHDRAW = 'withdraw',
}

@Entity({ name: 'decisions' })
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'submission_id' })
  submissionId: string;

  @Column({ type: 'enum', enum: DecisionType })
  decision: DecisionType;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ name: 'decided_by', type: 'integer' })
  decidedBy: number;

  @Column({ type: 'timestamp' })
  decidedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
