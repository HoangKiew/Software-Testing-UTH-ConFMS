// apps/conference-service/src/conference-service.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules
import { DecisionsModule } from './decisions/decisions.module';
import { ReportsModule } from './reports/reports.module';
// ← SỬA DÒNG NÀY: Đổi từ pc-members → invitations
import { InvitationsModule } from './invitations/invitations.module';  // ← ĐÚNG RỒI!
import { AssignmentsModule } from './assignments/assignments.module';

import { EmailsModule } from './emails/emails.module';
import { ConferencesModule } from './conferences/conferences.module';
import { AiModule } from './ai/ai.module';
import { InternalModule } from './internal/internal.module';

import { ConferencesCron } from './conferences/conferences.cron';
import { JwtStrategy } from './auth/jwt.strategy';

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
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') || 'localhost',
        port: config.get<number>('DB_PORT') || 5432,
        username: config.get<string>('DB_USERNAME') || 'admin',
        password: config.get<string>('DB_PASSWORD') || 'admin123',
        database: config.get<string>('DB_DATABASE') || 'db_conference',
        autoLoadEntities: true,
        synchronize: true, // Dev only
        logging: process.env.NODE_ENV === 'development',
      }),
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is required! Please copy from identity-service.');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),

    ScheduleModule.forRoot(),

    // === Feature Modules ===
    ConferencesModule,
    AiModule,
    EmailsModule,
    ReportsModule,
    InvitationsModule,     // ← ĐÃ ĐÚNG TÊN MỚI
    AssignmentsModule,
    DecisionsModule,
    InternalModule,
  ],

  providers: [
    JwtStrategy,
    ConferencesCron,
  ],
})
export class ConferenceServiceModule { }