import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubmissionServiceController } from './submission-service.controller';
import { SubmissionServiceService } from './submission-service.service';
import { Submission } from './modules/submission/entities/submission.entity';
import { SubmissionFile } from './modules/submission/entities/submission-file.entity';
import { SubmissionAuthor } from './modules/submission/entities/author.entity'; // Dùng author.entity vì file chưa đổi tên
import { AuditTrail } from './modules/submission/entities/audit-trail.entity';
import { AuthModule } from './auth/auth.module';
import { IntegrationModule } from './modules/integration/integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: 5432,
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'db_submission',
      entities: [Submission, SubmissionFile, SubmissionAuthor, AuditTrail],
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([
      Submission,
      SubmissionFile,
      SubmissionAuthor,
      AuditTrail
    ]),
    AuthModule,
    IntegrationModule
  ],
  controllers: [SubmissionServiceController],
  providers: [SubmissionServiceService],
  exports: [SubmissionServiceService],
})
export class SubmissionServiceModule { }