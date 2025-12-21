// apps/conference-service/src/conference-service.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

// Import từ root src (đúng vị trí)
import { ConferenceServiceController } from './conference-service.controller';
import { ConferenceServiceService } from './conference-service.service';

// Import module con đúng path
import { ConferencesModule } from './conferences/conferences.module';
import { SubmissionsModule } from './submissions/submissions.module';

// Import strategy đúng path
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/conference-service/.env.local', 'apps/conference-service/.env', '.env'],
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
        synchronize: true, // dev only
        logging: true,
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is required! Copy from identity-service');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
    ScheduleModule.forRoot(),
    ConferencesModule,
    SubmissionsModule,
  ],
  controllers: [ConferenceServiceController],
  providers: [ConferenceServiceService, JwtStrategy],
})
export class ConferenceServiceModule {}