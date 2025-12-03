import { Test, TestingModule } from '@nestjs/testing';
import { ReviewServiceController } from './review-service.controller';
import { ReviewServiceService } from './review-service.service';

describe('ReviewServiceController', () => {
  let reviewServiceController: ReviewServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReviewServiceController],
      providers: [ReviewServiceService],
    }).compile();

    reviewServiceController = app.get<ReviewServiceController>(ReviewServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(reviewServiceController.getHello()).toBe('Hello World!');
    });
  });
});
