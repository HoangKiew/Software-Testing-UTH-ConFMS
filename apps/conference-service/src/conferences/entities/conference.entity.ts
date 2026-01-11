// apps/conference-service/src/conferences/entities/conference.entity.ts

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ConferenceMember } from './conference-member.entity';
import { Track } from './track.entity';

/**
 * Trạng thái của hội nghị
 */
export enum ConferenceStatus {
  DRAFT = 'draft',          // Soạn thảo
  OPEN = 'open',            // Mở nộp bài
  REVIEW = 'review',        // Đang review
  DECIDED = 'decided',      // Đã quyết định
  FINAL = 'final',          // Hoàn tất, chuẩn bị tổ chức
  ARCHIVED = 'archived',    // Lưu trữ
}

@Entity({ name: 'conferences' })
@Index('idx_conference_chair_id', ['chairId'])               // Index cho query theo chair
@Index('idx_conference_status', ['status'])                  // Index cho filter theo status
@Index('idx_conference_start_date', ['startDate'])           // Index cho query thời gian
export class Conference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: 'Tên đầy đủ của hội nghị' })
  name: string;

  @Column({ comment: 'Tên viết tắt (acronym)' })
  acronym: string;

  @Column({ type: 'text', nullable: true, comment: 'Mô tả chi tiết hội nghị' })
  description: string;

  @Column({ type: 'timestamptz', comment: 'Ngày bắt đầu hội nghị' })
  startDate: Date;

  @Column({ type: 'timestamptz', comment: 'Ngày kết thúc hội nghị' })
  endDate: Date;

  @Column({ type: 'jsonb', default: [], comment: 'Danh sách chủ đề (topics)' })
  topics: string[];

  @Column({
    type: 'jsonb',
    default: {
      submission: null,
      review: null,
      cameraReady: null,
    },
    comment: 'Các mốc thời gian quan trọng',
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
    comment: 'Trạng thái hiện tại của hội nghị',
  })
  status: ConferenceStatus;

  @Column({ name: 'chair_id', type: 'integer', comment: 'ID của chair (từ identity-service)' })
  chairId: number;

  @Column({ default: true, comment: 'Hội nghị có đang hoạt động không' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', default: [], comment: 'Lịch trình hội nghị (sessions)' })
  schedule: Array<{
    time: string;
    sessionName: string;
    paperIds: string[];
  }>;

  // === Các field mới ===

  @Column({ name: 'ai_features_enabled', default: false, comment: 'Bật/tắt toàn bộ tính năng AI' })
  aiFeaturesEnabled: boolean;

  @Column({
    type: 'jsonb',
    name: 'ai_config',
    default: {
      emailDraft: true,
      keywordSuggestion: true,
      neutralSummary: true,
    },
    comment: 'Cấu hình chi tiết từng tính năng AI',
  })
  aiConfig: {
    emailDraft?: boolean;
    keywordSuggestion?: boolean;
    neutralSummary?: boolean;
  };

  @Column({ default: false, comment: 'Cho phép công khai proceedings' })
  openAccess: boolean;

  @OneToMany(() => ConferenceMember, (member) => member.conference, { cascade: true })
  members: ConferenceMember[];

  @OneToMany(() => Track, (track) => track.conference, { cascade: true })
  tracks: Track[];
}