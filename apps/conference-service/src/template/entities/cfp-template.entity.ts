import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

@Entity({ name: 'cfp_templates' })
@Index(['conferenceId'])
export class CfpTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  conferenceId: number;

  @Column({ type: 'text' })
  htmlContent: string;

  @Column({ type: 'jsonb', nullable: true })
  customStyles: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Conference, (conference) => conference.cfpTemplate, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;
}




