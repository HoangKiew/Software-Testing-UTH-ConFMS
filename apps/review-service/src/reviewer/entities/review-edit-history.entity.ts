import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('review_edit_history')
export class ReviewEditHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  reviewId: string;

  @Column()
  reviewerId: number;

  @Column({ type: 'jsonb' })
  oldData: any;

  @CreateDateColumn({ type: 'timestamptz' })
  editedAt: Date;
}
