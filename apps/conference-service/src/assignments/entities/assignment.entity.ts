// src/assignments/entities/assignment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AssignmentStatus {
  SUGGESTED = 'suggested',
  ASSIGNED = 'assigned',
  BIDDING = 'bidding',
  COMPLETED = 'completed',
  DECLINED = 'declined',
}

@Entity({ name: 'assignments' })
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string; // THÊM: Lưu topic thay submissionId

  @Column()
  conferenceId: string;

  @Column()
  reviewerId: number;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.SUGGESTED })
  status: AssignmentStatus;

  @Column({ type: 'float', default: 0 })
  similarityScore: number;

  @Column({ type: 'text', nullable: true })
  suggestionReason: string;

  @Column({ default: false })
  hasCoi: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  assignedAt: Date;
}