import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferenceServiceController } from './conference-service.controller';
import { ConferenceServiceService } from './conference-service.service';
import { ConferencesModule } from './conferences/conferences.module';
import { Conference } from './conferences/entities/conference.entity';
import { Track } from './conferences/entities/track.entity';
import { ConferenceMember } from './conferences/entities/conference-member.entity';

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

        console.log(
          `[Conference-Service] DB -> host=${host} port=${port} user=${username} db=${database}`,
        );

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [Conference, Track, ConferenceMember],
          synchronize: true,
        };
      },
    }),
    ConferencesModule,
  ],
  controllers: [ConferenceServiceController],
  providers: [ConferenceServiceService],
})
export class ConferenceServiceModule {}
