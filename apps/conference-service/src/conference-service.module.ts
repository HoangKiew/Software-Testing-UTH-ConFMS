// src/conference-service.module.ts (hoặc apps/conference-service/src/conference-service.module.ts)
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { DecisionsModule } from './decisions/decisions.module';
// Các module đã có
import { EmailsModule } from './emails/emails.module';
import { ReportsModule } from './reports/reports.module';
import { ConferencesModule } from './conferences/conferences.module';
import { AiModule } from './ai/ai.module';

// Module mới chúng ta vừa làm
import { PcMembersModule } from './pc-members/pc-members.module';
import { AssignmentsModule } from './assignments/assignments.module';

// Cron & JWT Strategy
import { ConferencesCron } from './conferences/conferences.cron';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    // Config toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/conference-service/.env.local',
        'apps/conference-service/.env',
        '.env',
      ],
    }),

    // TypeORM async config
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
        synchronize: true, // Dev only – production dùng migration
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

    // === Các feature module ===
    ConferencesModule,
    AiModule,
    EmailsModule,
    ReportsModule,

    // === Module mới ===
    PcMembersModule,
    AssignmentsModule, // Đã thêm
    DecisionsModule,
    // Submissions handled by dedicated Submission Service (port 3003)
  ],

  providers: [
    JwtStrategy,
    ConferencesCron,
  ],
})
export class ConferenceServiceModule { }