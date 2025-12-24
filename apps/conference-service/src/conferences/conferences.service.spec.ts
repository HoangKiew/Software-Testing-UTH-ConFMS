// apps/conference-service/src/conferences/conferences.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConferencesService } from './conferences.service';
import { Conference, ConferenceStatus } from './entities/conference.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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
        aiFeaturesEnabled: true,
        openAccess: true,
        ...dto,
      };

      conferenceRepository.save.mockResolvedValue(savedConference);

      const result = await service.create(dto, 999);

      expect(conferenceRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...dto,
        chairId: 999,
        status: ConferenceStatus.DRAFT,
        isActive: true,
      }));
      expect(result.name).toBe('Test Conference 2026');
      expect(result.chairId).toBe(999);
      expect(result.aiFeaturesEnabled).toBe(true);
      expect(result.openAccess).toBe(true);
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

      const newSchedule = [{ time: '09:00', sessionName: 'Keynote', paperIds: [] }];
      const result = await service.updateSchedule('conf-123', newSchedule, 999);

      expect(result.schedule).toEqual(newSchedule);
    });

    it('should throw ForbiddenException if user is not chair', async () => {
      const existingConf = { id: 'conf-123', chairId: 999 } as Conference;
      conferenceRepository.findOne.mockResolvedValue(existingConf);

      await expect(
        service.updateSchedule('conf-123', [], 888), // userId khác chair
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findPublic', () => {
    it('should return only active conferences', async () => {
      const activeConf = { id: '1', isActive: true, status: ConferenceStatus.OPEN_FOR_SUBMISSION } as Conference;
      const inactiveConf = { id: '2', isActive: false } as Conference;

      conferenceRepository.find.mockResolvedValue([activeConf, inactiveConf]);

      const result = await service.findPublic();

      expect(result).toEqual([activeConf]);
      expect(result).not.toContain(inactiveConf);
    });
  });

  describe('findPublicOne', () => {
    it('should return conference if active', async () => {
      const conf = { id: '1', isActive: true } as Conference;
      conferenceRepository.findOne.mockResolvedValue(conf);

      const result = await service.findPublicOne('1');
      expect(result).toBe(conf);
    });

    it('should throw ForbiddenException if not active', async () => {
      const conf = { id: '1', isActive: false } as Conference;
      conferenceRepository.findOne.mockResolvedValue(conf);

      await expect(service.findPublicOne('1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('exportProceedingsPdf', () => {
    it('should return a Buffer from PDF generation', async () => {
      // Mock findOne để trả về hội nghị có submissions
      conferenceRepository.findOne.mockResolvedValue({
        id: 'conf-123',
        name: 'Test Conf',
      });

      const buffer = await service.exportProceedingsPdf('conf-123');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000); // PDF phải có nội dung
    });
  });
});