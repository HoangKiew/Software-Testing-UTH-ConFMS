import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubmissionVersion } from './submission-version.entity';

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  REVIEWING = 'REVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  CAMERA_READY = 'CAMERA_READY',
}

@Entity({ name: 'submissions' })
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  abstract: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keywords: string | null;

  @Column({ type: 'text' })
  fileUrl: string; 

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
  })
  status: SubmissionStatus;

  @Column({ type: 'int' })
  authorId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'author_name' })
  authorName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'author_affiliation' })
  authorAffiliation: string | null;

  @Column({ type: 'int' })
  trackId: number;

  @Column({ type: 'int' })
  conferenceId: number;

  @Column({ type: 'jsonb', nullable: true })
  coAuthors: Array<{ name: string; email: string; affiliation?: string }> | null;

  @Column({ type: 'text', nullable: true })
  cameraReadyFileUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => SubmissionVersion, (version) => version.submission, {
    cascade: true,
  })
  versions: SubmissionVersion[];
}



