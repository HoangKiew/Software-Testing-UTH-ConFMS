import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { EmailService } from '../common/services/email.service';
import { SubmissionClientService } from '../integrations/submission-client.service';
import { ReviewClientService } from '../integrations/review-client.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly submissionClient: SubmissionClientService,
    private readonly reviewClient: ReviewClientService,
  ) {}
  // Đánh dấu email của user đã được xác minh
  async markEmailVerified(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }
    user.isVerified = true;
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { 
        email,
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['roles'],
    });
  }
// Tìm user theo email bao gồm cả những user đã bị xóa mềm
  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email }, // No deletedAt filter - includes soft deleted
      relations: ['roles'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { 
        id,
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['roles'],
    });
  }
// Tìm all
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }
// Tạo user với vai trò tùy chỉnh
  async createUser(params: {
    email: string;
    password: string;
    fullName: string;
    roles?: Role[];
  }): Promise<User> {
    const rolesToAssign = params.roles || [];
    if (rolesToAssign.length > 0) {
      const verifiedRoles: Role[] = [];
      for (const role of rolesToAssign) {
        if (!role.id) {
          throw new Error(`Role ${role.name} Không có ID. Vui lòng đảm bảo các vai trò được tải từ cơ sở dữ liệu.`);
        }
        const dbRole = await this.roleRepository.findOne({ where: { id: role.id } });
        if (!dbRole) {
          throw new Error(`Role ${role.name} with ID ${role.id} Không có trong cơ sở dữ liệu`);
        }
        verifiedRoles.push(dbRole);
      }
      const user = this.usersRepository.create({
        email: params.email,
        password: params.password,
        fullName: params.fullName,
        isVerified: false,
        roles: verifiedRoles,
      });
      
      const savedUser = await this.usersRepository.save(user);
      const userWithRoles = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles'],
      });
      
      if (!userWithRoles) {
        throw new Error('Failed to reload user with roles');
      }
      return userWithRoles;
    } else {
      const user = this.usersRepository.create({
        email: params.email,
        password: params.password,
        fullName: params.fullName,
        isVerified: false,
      });
      
      const savedUser = await this.usersRepository.save(user);
      const userWithRoles = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles'],
      });
      
      if (!userWithRoles) {
        throw new Error('Failed to reload user');
      }
      
      return userWithRoles;
    }
  }
// Tìm vai trò theo tên
  async findRoleByName(name: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ 
      where: { name: name as RoleName } 
    });
    return role;
  }
// Tạo user với vai trò cụ thể
  async createUserWithRole(params: {
    email: string;
    password: string; // Password gốc (chưa hash)
    fullName: string;
    roleName: string;
  }): Promise<User> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const role = await this.findRoleByName(params.roleName);
    if (!role) {
      throw new BadRequestException(`Role ${params.roleName} not found`);
    }

    // Hash password trước khi lưu
    const hashedPassword = await bcrypt.hash(params.password, 10);

    const user = this.usersRepository.create({
      email: params.email,
      password: hashedPassword,
      fullName: params.fullName,
      isVerified: false,
      roles: [role],
    });

    const savedUser = await this.usersRepository.save(user);
    
    // Gửi email thông báo tài khoản đã được tạo (không gửi code verification)
    // Gửi password gốc để người dùng biết thông tin đăng nhập
    try {
      await this.emailService.sendAccountCreatedNotification(
        savedUser.email,
        savedUser.fullName,
        params.password, // Password gốc để gửi trong email
      );
    } catch (error) {
      throw new BadRequestException('Không thể gửi email thông báo tài khoản');
    }

    return savedUser;
  }
// Cập nhật vai trò cho user
  async updateUserRoles(userId: number, roleName: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.findRoleByName(roleName);
    if (!role) {
      throw new BadRequestException(`Role ${roleName} not found`);
    }
    user.roles = [role];
    return this.usersRepository.save(user);
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
// Đổi mật khẩu
  async changePassword(
    userId: number,
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
      throw new UnauthorizedException('Mật khẩu cũ không chính xác');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }
// Quên mật khẩu - gửi email đặt lại mật khẩu
  async forgotPassword(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    const resetToken = this.passwordResetTokenRepository.create({
      token: code,
      userId: user.id,
      expiresAt,
      used: false,
    });
    await this.passwordResetTokenRepository.save(resetToken);

    try {
      await this.emailService.sendPasswordResetCode(user.email, code);
    } catch (error) {
      throw new BadRequestException('Không thể gửi email đặt lại mật khẩu');
    }
  }
// Lấy mã đặt lại mật khẩu theo email
  async getResetCodeByEmail(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const token = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        used: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!token) {
      throw new NotFoundException('Chưa có mã reset mật khẩu. Vui lòng gửi yêu cầu quên mật khẩu trước.');
    }

    if (token.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Mã reset mật khẩu đã hết hạn. Vui lòng gửi yêu cầu mới.');
    }

    return {
      email: user.email,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }
// Xác minh mã đặt lại mật khẩu
  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        token: code,
        used: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!token) {
      return false;
    }

    if (token.expiresAt.getTime() < Date.now()) {
      return false;
    }

    return true;
  }
// Reset mật khẩu
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const token = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        token: code,
        used: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!token) {
      throw new UnauthorizedException('Mã reset mật khẩu không hợp lệ');
    }

    if (token.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Mã reset mật khẩu đã hết hạn');
    }

    token.used = true;
    await this.passwordResetTokenRepository.save(token);

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }

  // Xóa mềm user với các soft delete check 
  async deleteUser(userId: number, authToken?: string, force: boolean = false): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    if (user.deletedAt !== null) {
      throw new BadRequestException('Người dùng này đã bị xóa trước đó');
    }
    if (!force) {
      if (!authToken) {
        throw new BadRequestException({
          code: 'MISSING_AUTH_TOKEN',
          message: 'Không thể kiểm tra guard clauses vì thiếu auth token. Vui lòng cung cấp token để xác minh người dùng không có submissions/reviews trước khi xóa.',
          detail: {
            userId,
            reason: 'Auth token required for cross-service guard clause checks',
          },
        });
      }
      const submissionCount = await this.submissionClient.countSubmissionsByAuthorId(
        userId,
        authToken,
      );

      if (submissionCount > 0) {
        throw new BadRequestException({
          code: 'USER_HAS_SUBMISSIONS',
          message: 'Người dùng này đã nộp bài, không được xóa',
          detail: {
            userId,
            submissionCount,
          },
        });
      }
      const reviewerStats = await this.reviewClient.getReviewerActivityStats(
        userId,
        authToken,
      );

      if (reviewerStats.assignmentCount > 0 || reviewerStats.reviewCount > 0) {
        throw new BadRequestException({
          code: 'USER_IS_REVIEWER',
          message: 'Người dùng này đang tham gia hội đồng chấm, không được xóa',
          detail: {
            userId,
            assignmentCount: reviewerStats.assignmentCount,
            reviewCount: reviewerStats.reviewCount,
          },
        });
      }
    }
    // Perform Soft Delete
    user.deletedAt = new Date();
    user.isActive = false;
    await this.usersRepository.save(user);
  }
}

