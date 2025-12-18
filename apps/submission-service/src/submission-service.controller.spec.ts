import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionServiceController } from './submission-service.controller';
import { SubmissionServiceService } from './submission-service.service';

describe('SubmissionServiceController', () => {
  let controller: SubmissionServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionServiceController],
      // Mocking service để không cần kết nối DB thật khi test
      providers: [
        {
          provide: SubmissionServiceService,
          useValue: {}, 
        },
      ],
    }).compile();

    controller = module.get<SubmissionServiceController>(SubmissionServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});