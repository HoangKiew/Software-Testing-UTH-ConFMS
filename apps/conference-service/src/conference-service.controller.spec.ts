import { Test, TestingModule } from '@nestjs/testing';
import { ConferenceServiceController } from './conference-service.controller';
import { ConferenceServiceService } from './conference-service.service';

describe('ConferenceServiceController', () => {
  let conferenceServiceController: ConferenceServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ConferenceServiceController],
      providers: [ConferenceServiceService],
    }).compile();

    conferenceServiceController = app.get<ConferenceServiceController>(ConferenceServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(conferenceServiceController.getHello()).toBe('Hello World!');
    });
  });
});
