// src/assignments/entities/assignment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Submission } from '../../submissions/entities/submission.entity';
import { PcMember } from '../../pc-members/entities/pc-member.entity';

export enum AssignmentStatus {
  SUGGESTED = 'suggested',       // Gợi ý từ AI/system
  ASSIGNED = 'assigned',         // Chair xác nhận phân công
  BIDDING = 'bidding',           // Reviewer bidding (nếu có phase)
  COMPLETED = 'completed',       // Reviewer đã submit review (từ review-service sync)
  DECLINED = 'declined',         // Reviewer từ chối
}

@Entity({ name: 'assignments' })
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conference_id' })
  conferenceId: string;

  @Column({ name: 'submission_id' })
  submissionId: string;

  @Column({ name: 'reviewer_id' }) // pc_member.id
  reviewerId: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.SUGGESTED,
  })
  status: AssignmentStatus;

  @Column({ type: 'float', default: 0 })
  similarityScore: number; // Lưu score từ AI suggestion

  @Column({ type: 'text', nullable: true })
  suggestionReason: string; // Lý do từ AI

  @Column({ default: false })
  hasCoi: boolean; // Flag COI detected

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  assignedAt: Date;

  // Quan hệ
  @ManyToOne(() => Submission, (submission) => submission.id, { onDelete: 'CASCADE' })
  submission: Submission;

  @ManyToOne(() => PcMember, (pcMember) => pcMember.id, { onDelete: 'CASCADE' })
  reviewer: PcMember;
}