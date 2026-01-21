import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Track } from './track.entity';

@Entity({ name: 'track_members' })
export class TrackMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  trackId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Track, (track) => track.members, {
    onDelete: 'CASCADE',
  })
  track: Track;
}







