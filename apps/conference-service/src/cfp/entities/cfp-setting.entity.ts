import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

@Entity({ name: 'cfp_settings' })
export class CfpSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  submissionDeadline: Date;

  @Column({ type: 'timestamptz' })
  reviewDeadline: Date;

  @Column({ type: 'timestamptz' })
  notificationDate: Date;

  @Column({ type: 'timestamptz' })
  cameraReadyDeadline: Date;

  @Column({ type: 'int', unique: true })
  conferenceId: number;

  @OneToOne(() => Conference, (conference) => conference.cfpSetting, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;
}
