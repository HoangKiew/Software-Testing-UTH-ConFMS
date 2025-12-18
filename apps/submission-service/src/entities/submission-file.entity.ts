// Mapping với bảng submission_files (quan trọng nhất để quản lý v1, v2, v3,...) trong Database
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Submission } from './submission.entity';

@Entity('submission_file')
export class SubmissionFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  submission_id: number;

  @Column()
  file_path: string; // Lưu link URL từ Supabase

  @Column()
  version: number; // Lưu 1, 2, 3...

  @CreateDateColumn()
  uploaded_at: Date;

  @ManyToOne(() => Submission, (submission) => submission.files)
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;
}