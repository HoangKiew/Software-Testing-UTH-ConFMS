import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createUser(params: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: params.email,
      password: params.password,
      fullName: params.fullName,
      role: params.role || UserRole.AUTHOR,
      isActive: true,
    });
    return this.usersRepository.save(user);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }

  async forgotPassword(email: string): Promise<void> {
    // Khung xử lý - tùy chỉnh sau (gửi email / tạo token)
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }
}

