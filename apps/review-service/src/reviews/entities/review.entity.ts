import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';

export enum ConfidenceLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RecommendationType {
  ACCEPT = 'ACCEPT',
  WEAK_ACCEPT = 'WEAK_ACCEPT',
  REJECT = 'REJECT',
  WEAK_REJECT = 'WEAK_REJECT',
}

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  assignmentId: number;

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({ type: 'int' })
  score: number; 

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.MEDIUM,
  })
  confidence: ConfidenceLevel;

  @Column({ type: 'text', nullable: true })
  commentForAuthor: string | null;

  @Column({ type: 'text', nullable: true })
  commentForPC: string | null; 

  @Column({
    type: 'enum',
    enum: RecommendationType,
  })
  recommendation: RecommendationType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Assignment, (assignment) => assignment.review)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;
}
















