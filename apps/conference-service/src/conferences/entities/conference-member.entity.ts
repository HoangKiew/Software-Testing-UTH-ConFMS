import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conference } from './conference.entity';

export enum ConferenceMemberRole {
  CHAIR = 'CHAIR',
  PC_MEMBER = 'PC_MEMBER',
}

@Entity({ name: 'conference_members' })
export class ConferenceMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conference, (conference) => conference.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ConferenceMemberRole,
  })
  role: ConferenceMemberRole;
}

