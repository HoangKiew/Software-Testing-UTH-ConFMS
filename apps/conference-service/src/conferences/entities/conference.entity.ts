// src/conferences/entities/conference.entity.ts
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ConferenceStatus {
  DRAFT = 'draft',
  OPEN_FOR_SUBMISSION = 'open_for_submission',
  SUBMISSION_CLOSED = 'submission_closed',
  UNDER_REVIEW = 'under_review',
  REVIEW_COMPLETED = 'review_completed',
  DECISION_MADE = 'decision_made',
  CAMERA_READY = 'camera_ready',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
}

@Entity({ name: 'conferences' })
export class Conference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  acronym: string;

  @Column({ type: 'text', nullable: true })
  description: string;  // Sửa truncated

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'jsonb', default: [] })
  topics: string[];

  @Column({
    type: 'jsonb',
    default: {
      submission: null,
      review: null,
      cameraReady: null,
    },
  })
  deadlines: {
    submission?: Date | null;
    review?: Date | null;
    cameraReady?: Date | null;
  };

  @Column({
    type: 'enum',
    enum: ConferenceStatus,
    default: ConferenceStatus.DRAFT,
  })
  status: ConferenceStatus;

  @Column({ name: 'chair_id', type: 'integer' })  // Đổi sang number (int) khớp identity User.id
  chairId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}