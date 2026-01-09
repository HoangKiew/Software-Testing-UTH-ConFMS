// apps/review-service/src/review-service.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { ReviewServiceController } from './review-service.controller';
import { ReviewServiceService } from './review-service.service';

// Thêm import proxy controller mới
import { InvitationsProxyController } from './invitations/invitations.proxy.controller';

import { AuthModule } from './auth/auth.module';
import { ReviewerModule } from './reviewer/reviewer.module';
import { ChairModule } from './chair/chair.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/review-service/.env', '.env'],
    }),

    PassportModule,

    AuthModule,

    HttpModule, // Để gọi submission-service + conference-service (proxy invitation)

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: +(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        synchronize: true, // Dev only
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
    }),

    ReviewerModule,
    ChairModule,
  ],

  controllers: [
    ReviewServiceController,
    InvitationsProxyController, // ← THÊM DÒNG NÀY ĐỂ CÓ ACCEPT/DECLINE Ở REVIEW-SERVICE
  ],

  providers: [ReviewServiceService],
})
export class ReviewServiceModule { }