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

export enum FormTemplateType {
  SUBMISSION_FORM = 'SUBMISSION_FORM',
  REVIEW_FORM = 'REVIEW_FORM',
  CFP_FORM = 'CFP_FORM',
}

export interface FormField {
  name: string;
  label: string;
  type: string; // text, textarea, select, checkbox, file, etc.
  required: boolean;
  options?: string[];
  validation?: Record<string, any>;
}

@Entity({ name: 'form_templates' })
@Unique(['conferenceId', 'type'])
@Index(['conferenceId'])
@Index(['type'])
export class FormTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  conferenceId: number;

  @Column({ type: 'varchar', length: 50 })
  type: FormTemplateType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'jsonb' })
  fields: FormField[];

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Conference, (conference) => conference.formTemplates, {
    onDelete: 'CASCADE',
  })
  conference: Conference;
}




