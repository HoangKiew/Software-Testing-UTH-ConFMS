import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum RoleName {
  ADMIN = 'ADMIN',
  CHAIR = 'CHAIR',
  AUTHOR = 'AUTHOR',
  REVIEWER = 'REVIEWER',
  PC_MEMBER = 'PC_MEMBER',
}

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RoleName,
    unique: true,
  })
  name: RoleName;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
