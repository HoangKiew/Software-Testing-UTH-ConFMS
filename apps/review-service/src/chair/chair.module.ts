import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from '../reviewer/entities/assignment.entity';
import { Review } from '../reviewer/entities/review.entity';
import { DiscussionMessage } from '../reviewer/entities/discussion.entity';
import { ChairDecision } from './entities/decision.entity';
import { ChairService } from './chair.service';
import { ChairController } from './chair.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, Review, DiscussionMessage, ChairDecision])],
  providers: [ChairService],
  controllers: [ChairController],
})
export class ChairModule {}
