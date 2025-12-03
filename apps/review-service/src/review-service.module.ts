import { Module } from '@nestjs/common';
import { ReviewServiceController } from './review-service.controller';
import { ReviewServiceService } from './review-service.service';

@Module({
  imports: [],
  controllers: [ReviewServiceController],
  providers: [ReviewServiceService],
})
export class ReviewServiceModule {}
