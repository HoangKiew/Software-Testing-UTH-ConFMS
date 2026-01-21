import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ReviewsController } from './reviews/reviews.controller';
import { ReviewsService } from './reviews/reviews.service';
import { ReviewPreference } from './reviews/entities/review-preference.entity';
import { Assignment } from './reviews/entities/assignment.entity';
import { Review } from './reviews/entities/review.entity';
import { PcDiscussion } from './reviews/entities/pc-discussion.entity';
import { Decision } from './reviews/entities/decision.entity';
import { Rebuttal } from './reviews/entities/rebuttal.entity';
import { JwtStrategy } from './auth/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { ConferenceClientService } from './integrations/conference-client.service';
import { SubmissionClientService } from './integrations/submission-client.service';
import { IdentityClientService } from './integrations/identity-client.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/review-service/.env.local',
        'apps/review-service/.env',
        '.env',
      ],
    }),
    HttpModule,
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST') || 'localhost';
        const port = Number(config.get<string>('DB_PORT')) || 5432;
        const username = config.get<string>('DB_USERNAME') || 'admin';
        const password = config.get<string>('DB_PASSWORD') || 'admin123';
        const database = config.get<string>('DB_DATABASE') || 'db_review';

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities: [
            ReviewPreference,
            Assignment,
            Review,
            PcDiscussion,
            Decision,
            Rebuttal,
          ],
          synchronize: true, // Enable auto-sync for development
        };
      },
    }),
    TypeOrmModule.forFeature([
      ReviewPreference,
      Assignment,
      Review,
      PcDiscussion,
      Decision,
      Rebuttal,
    ]),
  ],
  controllers: [HealthController, ReviewsController],
  providers: [
    ReviewsService,
    JwtStrategy,
    ConferenceClientService,
    SubmissionClientService,
    IdentityClientService,
  ],
})
export class ReviewServiceModule {}
