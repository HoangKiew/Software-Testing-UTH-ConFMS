import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('discussion_messages')
export class DiscussionMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  submissionId: string;

  @Column()
  senderId: string; // reviewerId hoặc chairId

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}