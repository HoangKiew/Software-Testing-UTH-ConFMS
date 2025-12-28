import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Enum trạng thái nhiệm vụ review
export enum AssignmentStatus {
  PENDING = 'pending',   // Mới phân công, CHƯA xử lý (mặc định)
  ACCEPTED = 'accepted', // Reviewer đã chấp nhận review
  REJECTED = 'rejected', // Reviewer từ chối review
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number; // ID tự tăng (1, 2, 3...)

  @Column()
  submissionId: string; // ID bài báo

  @Column()
  reviewerId: string; // ID reviewer (lấy từ identity-service)

  @Column()
  conferenceId: string; // ID hội nghị

  @Column()
  assignedBy: string; // ID người phân công (chair)

  @Column({ type: 'timestamp' })
  deadline: Date; // Hạn phản hồi

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING, // ✅ MẶC ĐỊNH LÀ PENDING
  })
  status: AssignmentStatus;

  @CreateDateColumn()
  createdAt: Date; // Thời điểm phân công
}
