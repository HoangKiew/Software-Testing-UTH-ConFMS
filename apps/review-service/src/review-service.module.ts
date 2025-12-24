// apps/review-service/src/review-service.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ReviewServiceController } from './review-service.controller';
import { ReviewServiceService } from './review-service.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/review-service/.env', '.env'],
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is required in environment variables');
        }

        return {
          secret,
          signOptions: {
            // Ép kiểu để TypeScript chấp nhận string là StringValue hợp lệ
            expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
          },
        };
      },
    }),
  ],
  controllers: [ReviewServiceController],
  providers: [
    ReviewServiceService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class ReviewServiceModule {}