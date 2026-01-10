import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('review_edit_history')
export class ReviewEditHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  reviewId: string;

  @Column()
  reviewerId: number;

  // Store previous values in explicit columns for easier querying and display
  @Column({ type: 'int', nullable: true })
  oldScore: number | null;

  @Column({ type: 'text', nullable: true })
  oldPublicComment: string | null;

  @Column({ type: 'text', nullable: true })
  oldPrivateComment: string | null;

  @Column({ type: 'boolean', nullable: true })
  oldIsFinal: boolean | null;

  @Column({ type: 'int', nullable: true })
  oldAssignmentId: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  editedAt: Date;
}
