import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubmissionServiceController } from './submission-service.controller';
import { SubmissionServiceService } from './submission-service.service';

// Import các Entity để NestJS biết cấu trúc bảng
import { Submission } from './entities/submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';

@Module({
  imports: [
    // 1. Load biến môi trường từ Docker/file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Cấu hình KẾT NỐI chính (ROOT) đến Postgres
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: 5432,
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin123',
      database: 'db_submission', // Khớp với file 01-init.sql của nhóm cậu
      entities: [Submission, SubmissionFile],
      synchronize: true, // Tự động tạo bảng dựa trên Entity
      logging: true,     // Hiện câu lệnh SQL ra terminal để cậu kiểm tra
    }),

    // 3. Đăng ký Repository để SubmissionService có thể dùng
    TypeOrmModule.forFeature([
      Submission, 
      SubmissionFile, 
    ]), 
  ],
  controllers: [SubmissionServiceController],
  providers: [SubmissionServiceService],
  exports: [SubmissionServiceService], 
})
export class SubmissionServiceModule {}