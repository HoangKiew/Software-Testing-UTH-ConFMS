import {
  BadRequestException,
  Injectable,
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
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      role: dto.role,
    });

    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken, userId: payload.sub },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (stored.expiryDate.getTime() < Date.now()) {
      await this.refreshTokenRepository.delete({ id: stored.id });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Rotate refresh token: remove old, issue new
    await this.refreshTokenRepository.delete({ id: stored.id });
    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async logout(dto: RefreshTokenDto) {
    await this.refreshTokenRepository.delete({ token: dto.refreshToken });
    return { message: 'Logged out' };
  }

  private stripPassword(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  private async issueTokens(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.refreshSecret,
        // jose types prefer numeric seconds
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
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '900',
      refreshExpiresIn: this.refreshExpiresIn,
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.refreshSecret,
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private parseExpiryToMs(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
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

