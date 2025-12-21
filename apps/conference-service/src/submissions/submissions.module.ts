// apps/conference-service/src/submissions/submissions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './entities/submission.entity';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { ConferencesModule } from '../conferences/conferences.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission]),
    forwardRef(() => ConferencesModule),  // ← Bắt buộc để tránh circular dependency
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}