import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CAMERA_READY = 'camera_ready',
}

@Entity({ name: 'submissions' })
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conference_id' })
  conferenceId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  abstract: string;

  @Column()
  keywords: string;

  @Column({ type: 'jsonb', default: [] })  // Array userIds (numbers) từ identity
  authors: number[];

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
  })
  status: SubmissionStatus;

  @Column({ type: 'jsonb', default: {} })  // { initial: url, final: url } - sau integrate S3
  files: { initial?: string; final?: string };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}