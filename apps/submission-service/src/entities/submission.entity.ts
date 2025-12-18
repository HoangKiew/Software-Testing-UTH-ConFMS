// Mapping với bảng submission trong Database
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SubmissionFile } from './submission-file.entity';

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

  @Column({ default: 'SUBMITTED' })
  status: string;

  @Column()
  created_by: number; // Đây là ID của User nộp bài

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => SubmissionFile, (file) => file.submission)
  files: SubmissionFile[];
}