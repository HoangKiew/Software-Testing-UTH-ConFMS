import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  // external submission identifier (string like 'sub-001')
  @Column({ type: 'varchar', length: 100 })
  submissionId: string;

  // reviewer user id from identity service
  @Column()
  reviewerId: number;

  // conference identifier
  @Column({ type: 'varchar', length: 100, nullable: true })
  conferenceId: string;

  // who assigned (could be chair id)
  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  // original single deadline (kept for backwards compatibility)
  deadline: Date;

  // deadline for reviewer to accept/decline the assignment
  @Column({ type: 'timestamptz', nullable: true })
  acceptDeadline: Date;

  // deadline for reviewer to submit the review once accepted
  @Column({ type: 'timestamptz', nullable: true })
  reviewDeadline: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: AssignmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt: Date;
}
