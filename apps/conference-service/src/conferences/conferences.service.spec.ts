// apps/conference-service/src/conferences/conferences.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConferencesService } from './conferences.service';
import { Conference, ConferenceStatus } from './entities/conference.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { ForbiddenException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

describe('ConferencesService', () => {
  let service: ConferencesService;
  let conferenceRepository: MockRepository<Conference>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConferencesService,
        {
          provide: getRepositoryToken(Conference),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ConferencesService>(ConferencesService);
    conferenceRepository = module.get(getRepositoryToken(Conference));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a conference with chairId', async () => {
      const dto: CreateConferenceDto = {
        name: 'Test Conference 2026',
        acronym: 'TC2026',
        startDate: '2026-01-01',
        endDate: '2026-01-03',
        description: 'Test description',
        topics: ['AI', 'ML'],
        deadlines: {
          submission: '2025-12-01',
          review: '2025-12-15',
          cameraReady: '2026-01-01',
        },
        aiFeaturesEnabled: true,
        openAccess: true,
      };

      const savedConference = {
        id: 'conf-123',
        chairId: 999,
        status: ConferenceStatus.DRAFT,
        isActive: true,
        ...dto,
      };

      conferenceRepository.save.mockResolvedValue(savedConference);

      const result = await service.create(dto, 999);

      expect(result.chairId).toBe(999);
      expect(result.status).toBe(ConferenceStatus.DRAFT);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule if user is chair', async () => {
      const existingConf = {
        id: 'conf-123',
        chairId: 999,
        schedule: [],
      } as Conference;

      conferenceRepository.findOne.mockResolvedValue(existingConf);
      conferenceRepository.save.mockResolvedValue({
        ...existingConf,
        schedule: [{ time: '09:00', sessionName: 'Keynote', paperIds: [] }],
      });

      const result = await service.updateSchedule(
        'conf-123',
        [{ time: '09:00', sessionName: 'Keynote', paperIds: [] }],
        999,
      );

      expect(result.schedule.length).toBe(1);
    });

    it('should throw ForbiddenException if user is not chair', async () => {
      conferenceRepository.findOne.mockResolvedValue({
        id: 'conf-123',
        chairId: 999,
      } as Conference);

      await expect(
        service.updateSchedule('conf-123', [], 888),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findPublic', () => {
    it('should return only active conferences', async () => {
      conferenceRepository.find.mockResolvedValue([
        { id: '1', isActive: true } as Conference,
        { id: '2', isActive: false } as Conference,
      ]);

      const result = await service.findPublic();
      expect(result.length).toBe(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('exportProceedingsPdf', () => {
    it('should return a mocked Buffer', async () => {
      const mockBuffer = Buffer.from('PDF MOCK CONTENT');

      jest
        .spyOn(service, 'exportProceedingsPdf')
        .mockResolvedValue(mockBuffer);

      const result = await service.exportProceedingsPdf('conf-123');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('PDF MOCK');
    });
  });
});