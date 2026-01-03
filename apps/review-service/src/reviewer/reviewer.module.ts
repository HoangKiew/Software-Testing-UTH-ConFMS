import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Assignment } from './entities/assignment.entity';
import { Review } from './entities/review.entity';
import { ReviewEditHistory } from './entities/review-edit-history.entity';
import { DiscussionMessage } from './entities/discussion.entity';
import { ReviewerService } from './reviewer.service';
import { ReviewerController } from './reviewer.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([Assignment, Review, ReviewEditHistory, DiscussionMessage]),
  ],
  providers: [ReviewerService],
  controllers: [ReviewerController],
})
export class ReviewerModule {}
