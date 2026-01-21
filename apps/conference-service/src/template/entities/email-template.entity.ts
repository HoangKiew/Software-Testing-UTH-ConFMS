import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

export enum EmailTemplateType {
  DECISION_ACCEPTED = 'DECISION_ACCEPTED',
  DECISION_REJECTED = 'DECISION_REJECTED',
  REMINDER_REVIEW = 'REMINDER_REVIEW',
  INVITATION_PC = 'INVITATION_PC',
  NOTIFICATION_DEADLINE = 'NOTIFICATION_DEADLINE',
}

@Entity({ name: 'email_templates' })
@Unique(['conferenceId', 'type'])
@Index(['conferenceId'])
@Index(['type'])
export class EmailTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  conferenceId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: EmailTemplateType;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, string> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Conference, (conference) => conference.emailTemplates, {
    onDelete: 'CASCADE',
  })
  conference: Conference;
}




