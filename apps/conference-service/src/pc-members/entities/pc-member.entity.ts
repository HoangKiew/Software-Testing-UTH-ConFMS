// apps/conference-service/src/pc-members/entities/pc-member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

export enum PcMemberStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum PcMemberRole {
  PC_MEMBER = 'PC_MEMBER',
  TRACK_CHAIR = 'TRACK_CHAIR',
  SENIOR_PC = 'SENIOR_PC',
}

@Entity({ name: 'pc_members' })
export class PcMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({
    type: 'enum',
    enum: PcMemberRole,
    default: PcMemberRole.PC_MEMBER,
  })
  role: PcMemberRole;

  @Column({ type: 'jsonb', default: [] })
  topics: string[]; // Lĩnh vực chuyên môn để gợi ý phân công

  @Column({ type: 'jsonb', default: [] })
  coiUserIds: number[]; // Xung đột lợi ích theo userId

  @Column({ type: 'jsonb', default: [] })
  coiInstitutions: string[]; // Xung đột lợi ích theo tổ chức/domain

  @Column({
    type: 'enum',
    enum: PcMemberStatus,
    default: PcMemberStatus.PENDING,
  })
  status: PcMemberStatus;

  @Column({ type: 'timestamp', nullable: true })
  invitedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  declinedAt: Date;

  // Quan hệ với Conference – dùng JoinColumn để TypeORM tự fill conference_id từ relation
  @ManyToOne(() => Conference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;
}