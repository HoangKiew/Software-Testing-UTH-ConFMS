import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Review } from './review.entity';

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'assignments' })
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  reviewerId: number;

  @Column({ type: 'uuid' })
  submissionId: string; 

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({ type: 'int' })
  assignedBy: number; 

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Review, (review) => review.assignment)
  review: Review | null;
}












