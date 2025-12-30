// apps/conference-service/src/conferences/entities/conference.entity.ts
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Track } from './track.entity';
import { ConferenceMember } from './conference-member.entity';

export enum ConferenceStatus {
  DRAFT = 'draft',
  OPEN_FOR_SUBMISSION = 'open_for_submission',
  SUBMISSION_CLOSED = 'submission_closed',
  UNDER_REVIEW = 'under_review',
  REVIEW_COMPLETED = 'review_completed',
  DECISION_MADE = 'decision_made',
  CAMERA_READY = 'camera_ready',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
}

@Entity({ name: 'conferences' })
export class Conference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  acronym: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'jsonb', default: [] })
  topics: string[];

  @Column({
    type: 'jsonb',
    default: {
      submission: null,
      review: null,
      cameraReady: null,
    },
  })
  deadlines: {
    submission?: Date | null;
    review?: Date | null;
    cameraReady?: Date | null;
  } | null;

  @Column({
    type: 'enum',
    enum: ConferenceStatus,
    default: ConferenceStatus.DRAFT,
  })
  status: ConferenceStatus;

  @Column({ name: 'chair_id', type: 'integer' })
  chairId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', default: [] })
  schedule: Array<{
    time: string;
    sessionName: string;
    paperIds: string[];
  }>;

  @Column({ name: 'ai_features_enabled', default: false })
  aiFeaturesEnabled: boolean;

  @Column({
    type: 'jsonb',
    name: 'ai_config',
    default: {
      emailDraft: true,
      keywordSuggestion: true,
      neutralSummary: true,
    },
  })
  aiConfig: {
    emailDraft?: boolean;
    keywordSuggestion?: boolean;
    neutralSummary?: boolean;
  };

  @Column({ default: false })
  openAccess: boolean;
  
  @OneToMany(() => Track, (track) => track.conference, {
    cascade: ['insert', 'update'],
  })
  tracks: Track[];

  @OneToMany(() => ConferenceMember, (conferenceMember) => conferenceMember.conference, {
    cascade: ['insert', 'update'],
  })
  members: ConferenceMember[];
}

