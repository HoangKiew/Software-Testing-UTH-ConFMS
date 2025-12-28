import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { RoleName } from '../users/entities/role.entity';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    private readonly emailService: EmailService,
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }
// APi 1:  Đăng ký tài admin
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const adminRole = await this.usersService.findRoleByName(RoleName.ADMIN);
    if (!adminRole || !adminRole.id) {
      throw new BadRequestException(
        'Không tìm thấy quyền ADMIN.',
      );
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      roles: [adminRole],
    });
    await this.createAndSendEmailVerificationToken(user);
    return {
      user: this.stripPassword(user),
      message: 'Vui lòng kiểm tra email để xác minh tài khoản',
    };
  }
// Api 2: Xác tài khoản qua email với mã 6 số
  private async createAndSendEmailVerificationToken(user: User) {
    // Tạo mã 6 chữ số
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const entity = this.emailVerificationTokenRepository.create({
      token: code,
      userId: user.id,
      expiresAt,
      used: false,
    });
    await this.emailVerificationTokenRepository.save(entity);
    
    try {
      await this.emailService.sendVerificationEmail(user.email, code, user.fullName);
    } catch (error) {
      console.error(`[AuthService] Failed to send verification email to ${user.email}:`, error);
    }
  }
// Api 3: Đăng nhập
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Gmail đăng nhập không hợp lệ');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Tài khoản chưa được xác minh email. Vui lòng kiểm tra email.',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Mật khẩu đăng nhập không hợp lệ');
    }

    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }
// Api 4: Tạo lại token
  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken, userId: payload.sub },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    if (stored.expiryDate.getTime() < Date.now()) {
      await this.refreshTokenRepository.delete({ id: stored.id });
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    await this.refreshTokenRepository.delete({ id: stored.id });
    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }
// Api 5: Đăng xuất
  async logout(dto: RefreshTokenDto) {
    await this.refreshTokenRepository.delete({ token: dto.refreshToken });
    return { message: 'Đã đăng xuất' };
  }
// Api 6: Xác thực tk bằng token từ gmail
  async verifyEmail(code: string) {
    const record = await this.emailVerificationTokenRepository.findOne({
      where: { token: code, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new UnauthorizedException('Mã xác minh không hợp lệ');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Mã xác minh đã hết hạn');
    }

    const user = await this.usersService.markEmailVerified(record.userId);

    record.used = true;
    await this.emailVerificationTokenRepository.save(record);

    return { message: 'Xác minh email thành công' };
  }

  async getVerificationTokenByEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    if (user.isVerified) {
      return {
        email: user.email,
        message: 'Email đã được xác minh',
        isVerified: true,
      };
    }
    await this.emailVerificationTokenRepository.delete({
      userId: user.id,
    });
    
    await this.createAndSendEmailVerificationToken(user);
    
    const token = await this.emailVerificationTokenRepository.findOne({
      where: { userId: user.id, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!token) {
      throw new NotFoundException('Không thể tạo verification code');
    }

    return {
      email: user.email,
      code: token.token, 
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      isVerified: false,
    };
  }
// Api update password
  private stripPassword(user: User) {
    const { password, ...rest } = user;
    return rest;
  }

  private async issueTokens(user: User) {
    const roleNames = user.roles?.map((role) => role.name) || [];
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: roleNames,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.refreshSecret,
        expiresIn: this.parseExpiryToSeconds(this.refreshExpiresIn),
      },
    );

    const expiryDate = new Date(
      Date.now() + this.parseExpiryToMs(this.refreshExpiresIn),
    );

    const entity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiryDate,
    });
    await this.refreshTokenRepository.save(entity);

    return {
      accessToken,
      refreshToken,
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '1800',
      refreshExpiresIn: this.refreshExpiresIn,
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.refreshSecret,
      });
    } catch (err) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private parseExpiryToMs(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 60 * 60 * 1000; 
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs =
      { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 0;
    return value * unitMs;
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 60 * 60;
    const value = Number(match[1]);
    const unit = match[2];
    const unitSec = { s: 1, m: 60, h: 3_600, d: 86_400 }[unit] ?? 0;
    return value * unitSec;
  }
}
