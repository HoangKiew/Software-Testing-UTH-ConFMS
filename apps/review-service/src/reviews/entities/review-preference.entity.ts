import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PreferenceType {
  INTERESTED = 'INTERESTED',
  MAYBE = 'MAYBE',
  CONFLICT = 'CONFLICT',
  NOT_INTERESTED = 'NOT_INTERESTED',
}

@Entity({ name: 'review_preferences' })
@Unique(['reviewerId', 'submissionId'])
export class ReviewPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  reviewerId: number;

  @Column({ type: 'uuid' })
  submissionId: string; 

  @Column({ type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({
    type: 'enum',
    enum: PreferenceType,
    default: PreferenceType.MAYBE,
  })
  preference: PreferenceType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
















