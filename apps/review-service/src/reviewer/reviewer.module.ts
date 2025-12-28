import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Assignment } from '../entities/assignment.entity';
import { Review } from '../entities/review.entity';
import { ReviewHistory } from '../entities/review-history.entity';
import { DiscussionMessage } from '../entities/discussion-message.entity';
import { ReviewerController } from './reviewer.controller'; // Chỉ 1 cái này
import { ReviewerService } from './reviewer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      Review,
      ReviewHistory,
      DiscussionMessage,
    ]),
    HttpModule,
  ],
  controllers: [ReviewerController], // Chỉ 1 controller
  providers: [ReviewerService],
})
export class ReviewerModule {}