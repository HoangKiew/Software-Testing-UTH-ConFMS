import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/role.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { EmailVerificationToken } from './auth/entities/email-verification-token.entity';
import { PasswordResetToken } from './users/entities/password-reset-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/identity-service/.env.local', 
        'apps/identity-service/.env',
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST') || 'localhost';
        const port = Number(config.get<string>('DB_PORT')) || 5432;
        const username = config.get<string>('DB_USERNAME') || 'admin';
        const password = config.get<string>('DB_PASSWORD') || 'admin123';
        const database = config.get<string>('DB_DATABASE') || 'db_identity';
        console.log(
          `[Identity-Service] DB -> host=${host} port=${port} user=${username} db=${database}`,
        );

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [User, Role, RefreshToken, PasswordResetToken, EmailVerificationToken],
          synchronize: true, 
        };
      },
    }),
    SeedModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class IdentityServiceModule {}
