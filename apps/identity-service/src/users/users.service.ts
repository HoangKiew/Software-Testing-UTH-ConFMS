import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly dataSource: DataSource,
  ) {}
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
      where: { email },
      relations: ['roles'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

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

  async findRoleByName(name: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ 
      where: { name: name as RoleName } 
    });
    if (role) {
      console.log(`[findRoleByName] Found role: ${role.name} (ID: ${role.id}) for search: ${name}`);
    } else {
      console.log(`[findRoleByName] Role not found for: ${name}`);
    }
    return role;
  }

  async createUserWithRole(params: {
    email: string;
    password: string;
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

    const user = this.usersRepository.create({
      email: params.email,
      password: params.password,
      fullName: params.fullName,
      isVerified: false,
      roles: [role],
    });

    return this.usersRepository.save(user);
  }

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
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Không tiết lộ thông tin tồn tại của email cho client
      return;
    }

    // Tạo mã 6 chữ số
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); //

    const resetToken = this.passwordResetTokenRepository.create({
      token: code,
      userId: user.id,
      expiresAt,
      used: false,
    });
    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Tích hợp SMTP / notification-service để gửi email
    // Tạm thời log ra server để dev test
    // eslint-disable-next-line no-console
    console.log(
      `[ForgotPassword] Sent reset code ${code} to email ${user.email} (expires at ${expiresAt.toISOString()})`,
    );
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
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

  async deleteUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.remove(user);
  }
}

