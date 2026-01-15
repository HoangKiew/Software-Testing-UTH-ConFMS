// apps/conference-service/src/invitations/entities/invitation.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity({ name: 'conference_invitations' })
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conference_id' })
  conferenceId: string;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ type: 'jsonb', array: false, default: () => "'[]'" })
  topics: string[];

  @Column({ type: 'jsonb', array: false, default: () => "'[]'" })
  coiUserIds: number[];

  @Column({ type: 'jsonb', array: false, default: () => "'[]'" })
  coiInstitutions: string[];

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  // Fixed: use correct type 'timestamptz' (or omit type completely)
  @CreateDateColumn({ name: 'invited_at', type: 'timestamptz' })
  invitedAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'declined_at', type: 'timestamptz', nullable: true })
  declinedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewerEmail?: string;

  @ManyToOne(() => Conference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;
}