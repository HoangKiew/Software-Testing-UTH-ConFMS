import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { ReviewHistory } from './review-history.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Liên kết với assignment
  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  assignment: Assignment;

  @Column()
  assignmentId: number;

  @Column()
  reviewerId: string;

  // Điểm số (có thể mở rộng sau theo hội nghị)
  @Column({ type: 'int', default: 0 })
  originality: number; // 0-10

  @Column({ type: 'int', default: 0 })
  technicalQuality: number; // 0-10

  @Column({ type: 'int', default: 0 })
  clarity: number; // 0-10

  @Column({ type: 'int', default: 0 })
  relevance: number; // 0-10

  @Column({ type: 'int', default: 0 })
  overall: number; // 0-20

  // Nhận xét công khai cho tác giả (ẩn danh)
  @Column({ type: 'text', nullable: true })
  publicComment: string;

  // Nhận xét nội bộ cho Chair
  @Column({ type: 'text', nullable: true })
  privateComment: string;

  @Column({ default: false })
  isFinal: boolean; // Đánh dấu đã submit chính thức

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Lịch sử chỉnh sửa
  @OneToMany(() => ReviewHistory, (history) => history.review, { cascade: true })
  histories: ReviewHistory[];
}