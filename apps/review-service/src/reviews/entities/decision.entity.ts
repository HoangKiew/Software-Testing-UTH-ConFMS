import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum FinalDecision {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  BORDERLINE = 'BORDERLINE',
}

@Entity({ name: 'decisions' })
@Unique(['submissionId'])
export class Decision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  submissionId: string; 

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({
    type: 'enum',
    enum: FinalDecision,
  })
  decision: FinalDecision;

  @Column({ type: 'int' })
  decidedBy: number; 

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  decidedAt: Date;
}















