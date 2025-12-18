import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
// KHÔNG CẦN import Role nữa! Xóa dòng này nếu có:
// import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  // Dùng string 'Role' để tránh circular import hoàn toàn
  @ManyToMany('Role', (role: any) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: any[];  // Hoặc để Role[] nếu bạn import Role ở nơi khác (nhưng không import ở đây)

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}