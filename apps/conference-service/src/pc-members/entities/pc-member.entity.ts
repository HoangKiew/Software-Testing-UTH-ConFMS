// apps/conference-service/src/pc-members/entities/pc-member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

export enum PcMemberStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

// ✅ CHỈ GIỮ LẠI PC_MEMBER THÔI
// Nếu sau này cần Track Chair hay Senior PC thì thêm lại sau, lúc đó sẽ nâng cấp hệ thống
export enum PcMemberRole {
  PC_MEMBER = 'PC_MEMBER',
}

@Entity({ name: 'pc_members' })
export class PcMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  // Role giờ chỉ có 1 giá trị duy nhất, nhưng vẫn giữ enum để dễ mở rộng sau này
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

  // Quan hệ với Conference
  @ManyToOne(() => Conference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;
}