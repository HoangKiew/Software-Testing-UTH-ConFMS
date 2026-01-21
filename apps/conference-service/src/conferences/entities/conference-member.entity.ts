import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conference } from './conference.entity';

export enum ConferenceMemberRole {
  CHAIR = 'CHAIR',
  PC_MEMBER = 'PC_MEMBER',
  REVIEWER = 'REVIEWER',
}

@Entity({ name: 'conference_members' })
export class ConferenceMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  conferenceId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'enum', enum: ConferenceMemberRole })
  role: ConferenceMemberRole;

  @ManyToOne(() => Conference, (conference) => conference.members, {
    onDelete: 'CASCADE',
  })
  conference: Conference;
}
