// Mapping với bảng tác giả phụ
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Submission } from './submission.entity';

@Entity('submission_author')
export class SubmissionAuthor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  submission_id: number;

  @Column()
  author_name: string;

  @Column()
  email: string;

  @Column({ default: false })
  is_corresponding: boolean; // Có phải tác giả liên hệ không

  @ManyToOne(() => Submission)
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;
}