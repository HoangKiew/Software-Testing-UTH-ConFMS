import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { StringValue } from 'ms';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Không cho phép undefined
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          // Ví dụ: '15m', '1h', '7d'
          expiresIn: config.getOrThrow<StringValue>(
            'JWT_ACCESS_EXPIRES_IN',
          ),
        },
      }),
    }),
  ],
  providers: [JwtStrategy, AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
