import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'pc_discussions' })
export class PcDiscussion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  submissionId: string; 

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
















