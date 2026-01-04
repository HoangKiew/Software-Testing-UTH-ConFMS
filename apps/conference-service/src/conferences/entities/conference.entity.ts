// apps/conference-service/src/conferences/entities/conference.entity.ts
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ConferenceMember } from './conference-member.entity';
import { Track } from './track.entity';

export enum ConferenceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  REVIEW = 'review',
  DECIDED = 'decided',
  FINAL = 'final',
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
  description: string;

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
  };

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

  // === Các field mới (chỉ giữ 1 lần duy nhất) ===

  // Bật/tắt AI tổng thể cho hội nghị
  @Column({ name: 'ai_features_enabled', default: false })
  aiFeaturesEnabled: boolean;

  // Cấu hình chi tiết từng tính năng AI
  @Column({
    type: 'jsonb',
    name: 'ai_config',
    default: {
      emailDraft: true,
      keywordSuggestion: true,  // Dùng tên này để khớp với ai.service.ts
      neutralSummary: true,
    },
  })
  aiConfig: {
    emailDraft?: boolean;
    keywordSuggestion?: boolean;
    neutralSummary?: boolean;
  };

  // Cho phép public proceedings
  @Column({ default: false })
  openAccess: boolean;

  @OneToMany(() => ConferenceMember, (member) => member.conference)
  members: ConferenceMember[];

  @OneToMany(() => Track, (track) => track.conference)
  tracks: Track[];

}