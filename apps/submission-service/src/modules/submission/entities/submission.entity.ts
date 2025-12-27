import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SubmissionFile } from './submission-file.entity';
import { SubmissionAuthor } from './author.entity';
import { SubmissionStatus } from '../../../shared/constants/submission-status.enum';

@Entity('submission')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conference_id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  abstract: string;

  @Column({ type: 'varchar', default: SubmissionStatus.SUBMITTED })
  status: SubmissionStatus;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  withdrawn_at: Date;


  @OneToMany(() => SubmissionFile, (file) => file.submission)
  files: SubmissionFile[];

  @OneToMany(() => SubmissionAuthor, (author) => author.submission, { cascade: true })
  authors: SubmissionAuthor[];
}