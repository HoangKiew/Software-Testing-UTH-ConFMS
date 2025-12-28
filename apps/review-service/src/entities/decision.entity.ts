import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum FinalDecision {
  ACCEPT = 'accept',
  REJECT = 'reject',
  PENDING = 'pending', // Chưa quyết định
}

@Entity('decisions')
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  submissionId: string; // ID bài báo từ submission-service

  @Column()
  conferenceId: string;

  @Column()
  decidedBy: string; // chairId

  @Column({
    type: 'enum',
    enum: FinalDecision,
    default: FinalDecision.PENDING,
  })
  decision: FinalDecision;

  @Column({ type: 'text', nullable: true })
  chairComment: string | null; // Nhận xét cuối cùng của Chair (có thể gửi cho tác giả)

  @CreateDateColumn()
  decidedAt: Date;
}