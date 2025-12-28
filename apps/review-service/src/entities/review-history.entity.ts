import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('review_histories')
export class ReviewHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Review, (review) => review.histories)
  review: Review;

  @Column()
  reviewId: string;

  @Column({ type: 'int' })
  originality: number;

  @Column({ type: 'int' })
  technicalQuality: number;

  @Column({ type: 'int' })
  clarity: number;

  @Column({ type: 'int' })
  relevance: number;

  @Column({ type: 'int' })
  overall: number;

  @Column({ type: 'text', nullable: true })
  publicComment: string;

  @Column({ type: 'text', nullable: true })
  privateComment: string;

  @Column()
  editedBy: string; // reviewerId

  @CreateDateColumn()
  editedAt: Date;
}