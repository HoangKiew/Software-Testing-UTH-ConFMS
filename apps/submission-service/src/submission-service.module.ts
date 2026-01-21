import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HttpModule } from '@nestjs/axios';
import { Submission } from './entities/submission.entity';
import { SubmissionVersion } from './entities/submission-version.entity';
import { SubmissionsController } from './submissions/submissions.controller';
import { SubmissionsService } from './submissions/submissions.service';
import { SupabaseService } from './supabase/supabase.config';
import { ConferenceClientService } from './integrations/conference-client.service';
import { ReviewClientService } from './integrations/review-client.service';
import { IdentityClientService } from './integrations/identity-client.service';
import { EmailService } from './common/services/email.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/submission-service/.env', '.env'],
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        signOptions: {
          expiresIn:
            Number(config.get<string>('JWT_ACCESS_EXPIRES_IN')) || 900,
        },
      }),
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST') || 'localhost';
        const port = Number(config.get<string>('DB_PORT')) || 5432;
        const username = config.get<string>('DB_USERNAME') || 'admin';
        const password = config.get<string>('DB_PASSWORD') || 'admin123';
        const database = config.get<string>('DB_DATABASE') || 'db_submission';
        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [Submission, SubmissionVersion],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([Submission, SubmissionVersion]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  ],
  controllers: [HealthController, SubmissionsController],
  providers: [
    SubmissionsService,
    SupabaseService,
    ConferenceClientService,
    ReviewClientService,
    IdentityClientService,
    EmailService,
    JwtStrategy,
  ],
})
export class SubmissionServiceModule {}
