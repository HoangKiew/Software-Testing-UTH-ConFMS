import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Decision } from '../entities/decision.entity';
import { Review } from '../entities/review.entity';
import { Assignment } from '../entities/assignment.entity';
import { DiscussionMessage } from '../entities/discussion-message.entity';
import { ChairController } from './chair.controller';
import { ChairService } from './chair.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision, Review, Assignment, DiscussionMessage]),
    HttpModule,
  ],
  controllers: [ChairController],
  providers: [ChairService],
})
export class ChairModule {}