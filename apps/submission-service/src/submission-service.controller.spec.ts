import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionServiceController } from './submission-service.controller';
import { SubmissionServiceService } from './submission-service.service';

describe('SubmissionServiceController', () => {
  let submissionServiceController: SubmissionServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionServiceController],
      providers: [SubmissionServiceService],
    }).compile();

    submissionServiceController = app.get<SubmissionServiceController>(SubmissionServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(submissionServiceController.getHello()).toBe('Hello World!');
    });
  });
});
