import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'rebuttals' })
export class Rebuttal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  submissionId: string; 

  @Column({ type: 'int' })
  authorId: number;

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}














