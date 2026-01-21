import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConferencesController } from './conferences/conferences.controller';
import { ConferencesService } from './conferences/conferences.service';
import { TemplatesService } from './template/templates.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { PublicController } from './public/public.controller';
import { ReportingController } from './reporting/reporting.controller';
import { ReportingService } from './reporting/reporting.service';
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { ValidationController } from './validation/validation.controller';
import { Conference } from './conferences/entities/conference.entity';
import { Track } from './conferences/entities/track.entity';
import { ConferenceMember } from './conferences/entities/conference-member.entity';
import { TrackMember } from './conferences/entities/track-member.entity';
import { CfpSetting } from './cfp/entities/cfp-setting.entity';
import { EmailTemplate } from './template/entities/email-template.entity';
import { FormTemplate } from './template/entities/form-template.entity';
import { CfpTemplate } from './template/entities/cfp-template.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { JwtStrategy } from './auth/jwt.strategy';
import { SubmissionClientService } from './integrations/submission-client.service';
import { IdentityClientService } from './integrations/identity-client.service';
import { ReviewClientService } from './integrations/review-client.service';
import { EmailService } from './common/services/email.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/conference-service/.env.local',
        'apps/conference-service/.env',
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
        const database =
          config.get<string>('DB_DATABASE') || 'db_conference';
        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities: [
            Conference,
            Track,
            ConferenceMember,
            TrackMember,
            CfpSetting,
            EmailTemplate,
            FormTemplate,
            CfpTemplate,
            AuditLog,
          ],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([
      Conference,
      Track,
      ConferenceMember,
      TrackMember,
      CfpSetting,
      EmailTemplate,
      FormTemplate,
      CfpTemplate,
      AuditLog,
    ]),
    PassportModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_ACCESS_EXPIRES_IN')) || 900,
        },
      }),
    }),
  ],
  controllers: [
    HealthController,
    ConferencesController,
    NotificationsController,
    PublicController,
    ReportingController,
    AuditController,
    ValidationController,
  ],
  providers: [
    ConferencesService,
    TemplatesService,
    NotificationsService,
    ReportingService,
    AuditService,
    JwtStrategy,
    SubmissionClientService,
    IdentityClientService,
    ReviewClientService,
    EmailService,
  ],
})
export class ConferenceServiceModule {}
