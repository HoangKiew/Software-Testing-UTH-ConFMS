/**
 * Unit Tests – SubmissionServiceService
 * Class: SubmissionServiceService
 * File: apps/submission-service/src/submission-service.service.ts
 * Methodology: Normal (N) | Boundary (B) | Abnormal (A)
 * Benchmark: 30 TC/KLOC | LOC analysed: 303 | TC written: 27
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionServiceService } from './submission-service.service';
import { Submission } from './modules/submission/entities/submission.entity';
import { SubmissionFile } from './modules/submission/entities/submission-file.entity';
import { SubmissionAuthor } from './modules/submission/entities/author.entity';
import { AuditTrail } from './modules/submission/entities/audit-trail.entity';
import { ConferenceClient } from './modules/integration/conference.client';
import { ReviewClient } from './modules/integration/review.client';
import { SubmissionStatus } from './shared/constants/submission-status.enum';

// ─── Mock Factories ────────────────────────────────────────────────────────────
const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockConferenceClient = { checkDeadline: jest.fn(), getConference: jest.fn() };
const mockReviewClient = {
  notifyNewSubmission: jest.fn(),
  notifyStatusChange: jest.fn(),
  getReviewsForSubmission: jest.fn(),
};

// ─── Data Helpers ───────────────────────────────────────────────────────────────
const makeSub = (o: Partial<Submission> = {}): Submission =>
  ({ id: 1, title: 'Test Paper', conference_id: 'conf-1', created_by: 10,
     status: SubmissionStatus.SUBMITTED, files: [], authors: [], ...o }) as Submission;

// ─── Test Suite ─────────────────────────────────────────────────────────────────
describe('SubmissionServiceService', () => {
  let service: SubmissionServiceService;
  let subRepo: ReturnType<typeof mockRepo>;
  let fileRepo: ReturnType<typeof mockRepo>;
  let authorRepo: ReturnType<typeof mockRepo>;
  let auditRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionServiceService,
        { provide: getRepositoryToken(Submission),      useFactory: mockRepo },
        { provide: getRepositoryToken(SubmissionFile),  useFactory: mockRepo },
        { provide: getRepositoryToken(SubmissionAuthor),useFactory: mockRepo },
        { provide: getRepositoryToken(AuditTrail),      useFactory: mockRepo },
        { provide: ConferenceClient, useValue: mockConferenceClient },
        { provide: ReviewClient,     useValue: mockReviewClient },
      ],
    }).compile();

    service    = module.get<SubmissionServiceService>(SubmissionServiceService);
    subRepo    = module.get(getRepositoryToken(Submission));
    fileRepo   = module.get(getRepositoryToken(SubmissionFile));
    authorRepo = module.get(getRepositoryToken(SubmissionAuthor));
    auditRepo  = module.get(getRepositoryToken(AuditTrail));

    // Bypass Supabase init
    jest.spyOn<any, any>(service, 'onModuleInit').mockReturnValue(undefined);
    (service as any).supabase = {
      storage: { from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/file.pdf' } }),
      })},
    };

    // Reset shared mocks
    jest.clearAllMocks();
    auditRepo.save.mockResolvedValue({});
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-1  getSubmissionsByUser  (LOC ~20) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSubmissionsByUser', () => {
    it('[Normal] trả về danh sách bài nộp của user', async () => {
      subRepo.find.mockResolvedValue([makeSub(), makeSub({ id: 2 })]);
      const r = await service.getSubmissionsByUser(10);
      expect(r.status).toBe('success');
      expect(r.data).toHaveLength(2);
    });

    it('[Boundary] trả về mảng rỗng khi user không có bài nộp nào', async () => {
      subRepo.find.mockResolvedValue([]);
      const r = await service.getSubmissionsByUser(99);
      expect(r.status).toBe('success');
      expect(r.data).toEqual([]);
    });

    it('[Abnormal] ném InternalServerErrorException khi DB lỗi', async () => {
      subRepo.find.mockRejectedValue(new Error('DB error'));
      await expect(service.getSubmissionsByUser(10))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-2  getSubmissionById  (LOC ~30) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSubmissionById', () => {
    it('[Normal] owner xem được bài của mình', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      const r = await service.getSubmissionById(1, 5, ['AUTHOR']);
      expect(r.status).toBe('success');
    });

    it('[Normal] CHAIR xem được mọi bài nộp', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      const r = await service.getSubmissionById(1, 99, ['CHAIR']);
      expect(r.status).toBe('success');
    });

    it('[Abnormal] ném NotFoundException khi submission không tồn tại', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.getSubmissionById(999, 1, ['AUTHOR']))
        .rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném ForbiddenException khi không phải owner và không là CHAIR', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.getSubmissionById(1, 99, ['AUTHOR']))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-3  getSubmissionsByConference  (LOC ~18) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSubmissionsByConference', () => {
    it('[Normal] trả về danh sách bài nộp theo conferenceId', async () => {
      subRepo.find.mockResolvedValue([makeSub(), makeSub({ id: 2 })]);
      const r = await service.getSubmissionsByConference('conf-1');
      expect(r.status).toBe('success');
      expect(r.total).toBe(2);
    });

    it('[Boundary] trả về total=0 khi conference chưa có bài nào', async () => {
      subRepo.find.mockResolvedValue([]);
      const r = await service.getSubmissionsByConference('empty-conf');
      expect(r.data).toEqual([]);
      expect(r.total).toBe(0);
    });

    it('[Abnormal] ném InternalServerErrorException khi DB lỗi', async () => {
      subRepo.find.mockRejectedValue(new Error('DB error'));
      await expect(service.getSubmissionsByConference('conf-1'))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-4  updateStatus  (LOC ~48) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateStatus', () => {
    beforeEach(() => {
      mockReviewClient.notifyStatusChange.mockResolvedValue(undefined);
    });

    it('[Normal] CHAIR cập nhật trạng thái thành công', async () => {
      const sub = makeSub({ created_by: 5 });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.ACCEPTED });
      const r = await service.updateStatus(1, SubmissionStatus.ACCEPTED, '', 99, true);
      expect(r.status).toBe('success');
    });

    it('[Normal] owner cập nhật trạng thái thành công', async () => {
      const sub = makeSub({ created_by: 10 });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.UNDER_REVIEW });
      const r = await service.updateStatus(1, SubmissionStatus.UNDER_REVIEW, '', 10, false);
      expect(r.status).toBe('success');
    });

    it('[Abnormal] ném ForbiddenException khi không có quyền', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.updateStatus(1, SubmissionStatus.ACCEPTED, '', 99, false))
        .rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném NotFoundException khi submission không tồn tại', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus(999, SubmissionStatus.ACCEPTED, '', 1, true))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-5  withdrawSubmission  (LOC ~42) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('withdrawSubmission', () => {
    beforeEach(() => {
      mockReviewClient.notifyStatusChange.mockResolvedValue(undefined);
    });

    it('[Normal] owner rút bài thành công', async () => {
      const sub = makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.WITHDRAWN });
      const r = await service.withdrawSubmission(1, 10);
      expect(r.status).toBe('success');
      expect(subRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SubmissionStatus.WITHDRAWN }),
      );
    });

    it('[Abnormal] ném ForbiddenException khi không phải owner', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.withdrawSubmission(1, 99)).rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném BadRequestException khi bài đã ACCEPTED', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      await expect(service.withdrawSubmission(1, 10)).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném NotFoundException khi submission không tồn tại', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.withdrawSubmission(999, 10)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-6  updateSubmission  (LOC ~82) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateSubmission', () => {
    beforeEach(() => {
      mockConferenceClient.checkDeadline.mockResolvedValue(undefined);
    });

    it('[Normal] owner cập nhật title và abstract thành công', async () => {
      const sub = makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, title: 'New Title' });
      const r = await service.updateSubmission(1, 10, { title: 'New Title', abstract: 'New abstract' });
      expect(r.status).toBe('success');
      expect(subRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném ForbiddenException khi không phải owner', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.updateSubmission(1, 99, { title: 'X' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném BadRequestException khi bài đã ACCEPTED', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      await expect(service.updateSubmission(1, 10, { title: 'X' }))
        .rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném BadRequestException khi bài đã WITHDRAWN', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.WITHDRAWN }));
      await expect(service.updateSubmission(1, 10, { title: 'X' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-7  getSubmissionReviews  (LOC ~38) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSubmissionReviews', () => {
    it('[Normal] CHAIR lấy reviews với full thông tin', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      mockReviewClient.getReviewsForSubmission.mockResolvedValue([{ id: 1, score: 8 }]);
      const r = await service.getSubmissionReviews(1, 99, ['CHAIR']);
      expect(r.status).toBe('success');
      expect(mockReviewClient.getReviewsForSubmission).toHaveBeenCalledWith(1, true);
    });

    it('[Abnormal] ném ForbiddenException khi không phải owner và không là CHAIR', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.getSubmissionReviews(1, 99, ['AUTHOR']))
        .rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném NotFoundException khi submission không tồn tại', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.getSubmissionReviews(999, 1, ['CHAIR']))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-8  getPublicFileInfoBySubmissionId  (LOC ~25) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getPublicFileInfoBySubmissionId', () => {
    it('[Normal] trả về thông tin file mới nhất', async () => {
      fileRepo.findOne.mockResolvedValue({ id: 7, file_path: 'https://cdn/file.pdf', version: 2 });
      const r = await service.getPublicFileInfoBySubmissionId(1);
      expect(r.status).toBe('success');
      expect(r.data.version).toBe(2);
    });

    it('[Abnormal] ném NotFoundException khi không có file nào', async () => {
      fileRepo.findOne.mockResolvedValue(null);
      await expect(service.getPublicFileInfoBySubmissionId(99))
        .rejects.toThrow(NotFoundException);
    });
  }); // end getPublicFileInfoBySubmissionId
  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-9  handleSubmission  (LOC ~100) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('handleSubmission', () => {
    it('[Normal] tạo submission mới và upload file thành công', async () => {
      mockConferenceClient.checkDeadline.mockResolvedValue(undefined); // deadline ok
      // mock getConference for validateTopic
      mockConferenceClient.getConference.mockResolvedValue({ id: 1, topics: ['AI'] });
      // mock getNextVersion => 1
      jest.spyOn<any, any>(service, 'getNextVersion').mockResolvedValue(1);
      
      subRepo.create.mockReturnValue(makeSub());
      subRepo.save.mockResolvedValue(makeSub());
      authorRepo.create.mockReturnValue({});
      authorRepo.save.mockResolvedValue({});
      fileRepo.save.mockResolvedValue({ id: 10 });
      
      const file: any = { originalname: 'paper.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };
      const dto = { title: 'T1', conferenceId: 1, topic: 'AI', abstract: 'A', coAuthors: 'co@example.com' };
      
      const r = await service.handleSubmission(file, dto as any, 1, 'main@example.com', 'Author');
      expect(r.status).toBe('success');
      expect(subRepo.save).toHaveBeenCalled();
      expect(fileRepo.save).toHaveBeenCalled();
      expect(mockReviewClient.notifyNewSubmission).toHaveBeenCalled();
    });

    it('[Abnormal] ném BadRequestException khi Supabase upload lỗi', async () => {
      mockConferenceClient.checkDeadline.mockResolvedValue(undefined);
      mockConferenceClient.getConference.mockResolvedValue({ id: 1, topics: ['AI'] });
      jest.spyOn<any, any>(service, 'getNextVersion').mockResolvedValue(1);
      
      subRepo.create.mockReturnValue(makeSub());
      subRepo.save.mockResolvedValue(makeSub());
      
      // Override supabase upload mock for this test
      (service as any).supabase.storage.from = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: 'Upload Failed' } }),
      });
      
      const file: any = { originalname: 'paper.pdf', buffer: Buffer.from(''), mimetype: 'pdf' };
      await expect(service.handleSubmission(file, {} as any, 1, 'e@e.com', 'N'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-10  findAllWithPagination  (LOC ~60) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAllWithPagination', () => {
    let mockQueryBuilder: any;

    beforeEach(() => {
      mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        getMany: jest.fn().mockResolvedValue([makeSub()]),
      };
      subRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
    });

    it('[Normal] trả về danh sách phân trang có filter', async () => {
      const query = { page: 1, limit: 10, status: 'SUBMITTED', conferenceId: 1, search: 'test', sortBy: 'title', order: 'ASC' };
      const r = await service.findAllWithPagination(query);
      expect(r.pagination.total).toBe(5);
      expect(r.data.length).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('submission.title', 'ASC');
    });

    it('[Boundary] trả về trang 1 nếu page < 1', async () => {
      const query = { page: -5, limit: 10 };
      const r = await service.findAllWithPagination(query);
      // Valid page should be 1, so skip should be 0
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(r.pagination.page).toBe(1);
    });
  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-11  uploadCameraReady  (LOC ~90) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('uploadCameraReady', () => {
    const file: any = { originalname: 'camera.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };

    it('[Normal] tác giả upload file camera-ready thành công cho bài đã ACCEPTED', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      fileRepo.find.mockResolvedValue([{ version: 1 }]); // chưa có bản camera-ready nào
      subRepo.update.mockResolvedValue({});
      fileRepo.save.mockResolvedValue({ id: 99 });
      
      const r = await service.uploadCameraReady(1, file, 10);
      expect(r.status).toBe('success');
      expect(r.data.version).toBe(101); // 100 + 0 + 1
      expect(subRepo.update).toHaveBeenCalled();
      expect(fileRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném NotFoundException nếu submission không tồn tại', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.uploadCameraReady(99, file, 10)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném ForbiddenException nếu không phải tác giả (created_by)', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5, status: SubmissionStatus.ACCEPTED }));
      await expect(service.uploadCameraReady(1, file, 10)).rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném BadRequestException nếu bài chưa được ACCEPTED', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED }));
      await expect(service.uploadCameraReady(1, file, 10)).rejects.toThrow(BadRequestException);
    });
  });
});
});



