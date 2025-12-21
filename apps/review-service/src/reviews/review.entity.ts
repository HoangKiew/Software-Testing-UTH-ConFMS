import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  submission_id: number;

  @Column()
  reviewer_id: number;

  @Column()
  conference_id: number;

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  decision: 'accept' | 'reject' | 'revise';

  @Column({ default: false })
  submitted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
