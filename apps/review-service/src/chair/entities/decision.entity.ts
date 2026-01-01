import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ChairDecisionValue = 'accepted' | 'rejected';

@Entity('chair_decisions')
export class ChairDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  submissionId: string;

  @Column()
  chairId: number;

  @Column({ type: 'varchar', length: 20 })
  decision: ChairDecisionValue;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
