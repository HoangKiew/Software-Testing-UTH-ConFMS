import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assignmentId: number;

  @Column()
  reviewerId: number;

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  publicComment: string;

  @Column({ type: 'text', nullable: true })
  privateComment: string;

  @Column({ type: 'boolean', default: false })
  isFinal: boolean;

  // Chair decision for this review (propagated when chair decides on the submission)
  @Column({ type: 'varchar', length: 20, nullable: true })
  chairDecision?: 'accepted' | 'rejected' | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
