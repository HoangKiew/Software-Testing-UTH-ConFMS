import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Submission } from './submission.entity';

@Entity({ name: 'submission_versions' })
export class SubmissionVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  submissionId: string;

  @Column({ type: 'int' })
  versionNumber: number; 

  @Column({ type: 'varchar', length: 500 })
  title: string; 

  @Column({ type: 'text' })
  abstract: string; 

  @Column({ type: 'text' })
  fileUrl: string; 

  @Column({ type: 'varchar', length: 500, nullable: true })
  keywords: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date; // Ngày backup

  @ManyToOne(() => Submission, (submission) => submission.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submissionId' })
  submission: Submission;
}















