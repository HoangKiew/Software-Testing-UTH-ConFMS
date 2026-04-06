/**
 * Unit Tests – SubmissionServiceService
 * Class: SubmissionServiceService
 * File: apps/submission-service/src/submission-service.service.ts
 * Methodology: Boundary Value Analysis (BVA)
 *
 * BVA Coverage Plan:
 * ┌────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │ Function                   │ Biên được kiểm thử                                      │
 * ├────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │ getSubmissionsByUser       │ userId hợp lệ (min=1), danh sách rỗng (0 phần tử)       │
 * │ getSubmissionById          │ Role boundary: CHAIR vs AUTHOR vs owner                 │
 * │ getSubmissionsByConference │ Biên 0 / 1 / nhiều bài nộp                              │
 * │ updateStatus               │ Status enum boundary: tất cả trạng thái                 │
 * │ withdrawSubmission         │ Status: SUBMITTED(ok) vs ACCEPTED(biên không hợp lệ)    │
 * │ updateSubmission           │ Status biên: SUBMITTED(ok), ACCEPTED/WITHDRAWN(invalid) │
 * │ getSubmissionReviews       │ Role boundary: CHAIR, AUTHOR-owner, AUTHOR-not-owner     │
 * │ getPublicFileInfoById      │ File version: 1 (min), nhiều (max-1/max)                │
 * │ handleSubmission           │ coAuthors = "" vs 1 email vs nhiều emails               │
 * │ findAllWithPagination      │ page boundary: -1/0/1/totalPages/totalPages+1           │
 * │                            │ limit boundary: 1/10/100                                │
 * │ uploadCameraReady          │ version boundary: lần đầu (101), lần thứ n (100+n)      │
 * └────────────────────────────┴─────────────────────────────────────────────────────────┘
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

    jest.clearAllMocks();
    auditRepo.save.mockResolvedValue({});
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-1  getSubmissionsByUser
  // Input: userId (số nguyên dương)
  // Biên:
  //   Min  = userId = 1  → còn nghĩa, có thể có bài
  //   Nominal = userId = 10 → bình thường
  //   Boundary (0 bài) = userId hợp lệ nhưng không bài nào
  //   Invalid = DB lỗi
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getSubmissionsByUser', () => {
    it('[BVA-Min] userId = 1 (biên dưới nhỏ nhất hợp lệ) → trả về danh sách rỗng', async () => {
      // userId=1 là giá trị hợp lệ nhỏ nhất; DB trả rỗng
      subRepo.find.mockResolvedValue([]);
      const r = await service.getSubmissionsByUser(1);
      expect(r.status).toBe('success');
      expect(r.data).toEqual([]);
    });

    it('[BVA-Nominal] userId bình thường có 2 bài nộp', async () => {
      subRepo.find.mockResolvedValue([makeSub(), makeSub({ id: 2 })]);
      const r = await service.getSubmissionsByUser(10);
      expect(r.status).toBe('success');
      expect(r.data).toHaveLength(2);
    });

    it('[BVA-Boundary/0] userId hợp lệ nhưng có đúng 1 bài nộp (biên 1 phần tử)', async () => {
      subRepo.find.mockResolvedValue([makeSub()]);
      const r = await service.getSubmissionsByUser(10);
      expect(r.data).toHaveLength(1);
    });

    it('[BVA-Invalid] DB lỗi → ném InternalServerErrorException', async () => {
      subRepo.find.mockRejectedValue(new Error('Connection refused'));
      await expect(service.getSubmissionsByUser(10))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-2  getSubmissionById
  // Input: id (submissionId), userId, roles[]
  // Biên:
  //   Role boundary: ['CHAIR'] → full access (biên trên)
  //   Role boundary: ['AUTHOR'] + isOwner → phép xem (biên dưới valid)
  //   Role boundary: ['AUTHOR'] + !isOwner → không được (biên invalid)
  //   id không tồn tại → NotFoundException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getSubmissionById', () => {
    it('[BVA-Role-Chair] CHAIR là biên trên quyền truy cập → xem được bất kỳ bài nào', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      const r = await service.getSubmissionById(1, 999, ['CHAIR']);
      expect(r.status).toBe('success');
    });

    it('[BVA-Role-OwnerAuthor] AUTHOR + owner (userId = created_by) → biên dưới hợp lệ', async () => {
      // Đây là trường hợp biên dưới: quyền thấp nhất được phép xem
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      const r = await service.getSubmissionById(1, 5, ['AUTHOR']);
      expect(r.status).toBe('success');
    });

    it('[BVA-Role-NonOwner] AUTHOR + userId ngay ngoài biên (userId ≠ created_by) → ForbiddenException', async () => {
      // userId = created_by - 1 → ngoài biên, không phải owner
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.getSubmissionById(1, 4, ['AUTHOR']))
        .rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Id-NotExist] id không tồn tại → NotFoundException', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.getSubmissionById(999, 1, ['AUTHOR']))
        .rejects.toThrow(NotFoundException);
    });

    it('[BVA-Id-Min] id = 1 (giá trị nhỏ nhất hợp lệ) → CHAIR xem được', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ id: 1 }));
      const r = await service.getSubmissionById(1, 99, ['CHAIR']);
      expect(r.status).toBe('success');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-3  getSubmissionsByConference
  // Input: conferenceId (string)
  // Biên số lượng bài:
  //   0 bài (biên dưới) → trả [] và total=0
  //   1 bài (biên Min+1) → trả 1 phần tử
  //   nhiều bài (Nominal) → trả đủ
  //   DB lỗi (Invalid)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getSubmissionsByConference', () => {
    it('[BVA-Count-0] 0 bài nộp (biên dưới Min) → total = 0, data = []', async () => {
      subRepo.find.mockResolvedValue([]);
      const r = await service.getSubmissionsByConference('conf-empty');
      expect(r.total).toBe(0);
      expect(r.data).toEqual([]);
    });

    it('[BVA-Count-1] đúng 1 bài nộp (biên Min+1) → total = 1', async () => {
      subRepo.find.mockResolvedValue([makeSub()]);
      const r = await service.getSubmissionsByConference('conf-1');
      expect(r.total).toBe(1);
      expect(r.data).toHaveLength(1);
    });

    it('[BVA-Count-Nominal] nhiều bài nộp (Nominal) → trả đúng số lượng', async () => {
      subRepo.find.mockResolvedValue([makeSub(), makeSub({ id: 2 }), makeSub({ id: 3 })]);
      const r = await service.getSubmissionsByConference('conf-multi');
      expect(r.total).toBe(3);
    });

    it('[BVA-Invalid] DB lỗi → ném InternalServerErrorException', async () => {
      subRepo.find.mockRejectedValue(new Error('DB timeout'));
      await expect(service.getSubmissionsByConference('conf-1'))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-4  updateStatus
  // Input: status (enum SubmissionStatus), isChair (boolean)
  // Biên Status:
  //   SUBMITTED → UNDER_REVIEW (transition hợp lệ - biên thấp)
  //   SUBMITTED → ACCEPTED    (CHAIR only)
  //   SUBMITTED → REJECTED    (CHAIR only)
  //   id không tồn tại (Invalid)
  //   không phải owner và không phải Chair (Invalid permission)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: updateStatus', () => {
    beforeEach(() => {
      mockReviewClient.notifyStatusChange.mockResolvedValue(undefined);
    });

    it('[BVA-Status-ToUnderReview] SUBMITTED → UNDER_REVIEW: owner cập nhật (biên thấp nhất)', async () => {
      const sub = makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.UNDER_REVIEW });
      const r = await service.updateStatus(1, SubmissionStatus.UNDER_REVIEW, '', 10, false);
      expect(r.status).toBe('success');
    });

    it('[BVA-Status-ToAccepted] SUBMITTED → ACCEPTED: CHAIR cập nhật (biên quyền cao nhất)', async () => {
      const sub = makeSub({ created_by: 5 });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.ACCEPTED });
      const r = await service.updateStatus(1, SubmissionStatus.ACCEPTED, 'Good paper', 99, true);
      expect(r.status).toBe('success');
    });

    it('[BVA-Status-ToRejected] SUBMITTED → REJECTED: CHAIR cập nhật', async () => {
      const sub = makeSub({ created_by: 5 });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.REJECTED });
      const r = await service.updateStatus(1, SubmissionStatus.REJECTED, 'Needs work', 99, true);
      expect(r.status).toBe('success');
    });

    it('[BVA-Permission-Boundary] isChair=false và không phải owner → ForbiddenException (biên ngoài)', async () => {
      // userId=99, created_by=5: userId không phải owner VÀ isChair=false → ngoài vùng valid
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.updateStatus(1, SubmissionStatus.ACCEPTED, '', 99, false))
        .rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Id-NotExist] submission id không tồn tại → NotFoundException', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus(999, SubmissionStatus.ACCEPTED, '', 1, true))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-5  withdrawSubmission
  // Input: id, userId
  // Biên trạng thái:
  //   SUBMITTED (biên dưới hợp lệ - có thể rút)
  //   UNDER_REVIEW (cũng rút được nếu logic cho phép)
  //   ACCEPTED (biên trên không hợp lệ - không được rút)
  //   WITHDRAWN (đã rút rồi - biên invalid)
  // Biên quyền:
  //   userId = created_by (biên dưới hợp lệ)
  //   userId ≠ created_by (ngoài biên - ForbiddenException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: withdrawSubmission', () => {
    beforeEach(() => {
      mockReviewClient.notifyStatusChange.mockResolvedValue(undefined);
    });

    it('[BVA-Status-Submitted] status=SUBMITTED (biên dưới hợp lệ) → rút thành công', async () => {
      const sub = makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.WITHDRAWN });
      const r = await service.withdrawSubmission(1, 10);
      expect(r.status).toBe('success');
    });

    it('[BVA-Status-Accepted] status=ACCEPTED (biên trên không hợp lệ) → BadRequestException', async () => {
      // ACCEPTED là biên trên không cho phép rút
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      await expect(service.withdrawSubmission(1, 10)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Owner-Exact] userId = created_by (biên khớp chính xác) → rút được', async () => {
      // Biên: userId PHẢI bằng đúng created_by
      const sub = makeSub({ created_by: 42, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, status: SubmissionStatus.WITHDRAWN });
      const r = await service.withdrawSubmission(1, 42);
      expect(r.status).toBe('success');
    });

    it('[BVA-Owner-OneBeyond] userId = created_by + 1 (ngay ngoài biên) → ForbiddenException', async () => {
      // Đây là biên chính xác của BVA: userId lệch 1 đơn vị
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 42 }));
      await expect(service.withdrawSubmission(1, 43)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Id-NotExist] submission không tồn tại → NotFoundException', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.withdrawSubmission(999, 10)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-6  updateSubmission
  // Biên trạng thái:
  //   SUBMITTED (biên dưới valid)
  //   UNDER_REVIEW (valid, nếu deadline còn)
  //   ACCEPTED (biên trên invalid - không sửa được)
  //   WITHDRAWN (invalid - không sửa được)
  // Biên quyền:
  //   userId = created_by (valid)
  //   userId ≠ created_by (invalid)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: updateSubmission', () => {
    beforeEach(() => {
      mockConferenceClient.checkDeadline.mockResolvedValue(undefined);
    });

    it('[BVA-Status-Submitted] SUBMITTED (biên dưới valid) → có thể cập nhật', async () => {
      const sub = makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, title: 'Updated Title' });
      const r = await service.updateSubmission(1, 10, { title: 'Updated Title' });
      expect(r.status).toBe('success');
    });

    it('[BVA-Status-Accepted] ACCEPTED (biên trên invalid) → BadRequestException', async () => {
      // Biên ngay trên vùng valid: ACCEPTED không cho sửa
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      await expect(service.updateSubmission(1, 10, { title: 'X' }))
        .rejects.toThrow(BadRequestException);
    });

    it('[BVA-Status-Withdrawn] WITHDRAWN (biên khác invalid) → BadRequestException', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.WITHDRAWN }));
      await expect(service.updateSubmission(1, 10, { title: 'X' }))
        .rejects.toThrow(BadRequestException);
    });

    it('[BVA-Owner-Exact] userId = created_by → hợp lệ', async () => {
      const sub = makeSub({ created_by: 7, status: SubmissionStatus.SUBMITTED });
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockResolvedValue({ ...sub, abstract: 'new abstract' });
      const r = await service.updateSubmission(1, 7, { abstract: 'new abstract' });
      expect(r.status).toBe('success');
    });

    it('[BVA-Owner-OneBeyond] userId = created_by + 1 (ngoài biên) → ForbiddenException', async () => {
      // BVA: offset 1 là biên ngoài
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 7 }));
      await expect(service.updateSubmission(1, 8, { title: 'Y' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-7  getSubmissionReviews
  // Biên role:
  //   CHAIR → xem full (biên cao nhất)
  //   ADMIN → xem full (tương đương CHAIR)
  //   AUTHOR + owner → xem ẩn danh (biên dưới valid)
  //   AUTHOR + !owner → ForbiddenException (biên ngoài)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getSubmissionReviews', () => {
    it('[BVA-Role-Chair] CHAIR → isFullInfo=true (biên quyền cao)', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      mockReviewClient.getReviewsForSubmission.mockResolvedValue([{ id: 1, score: 8, reviewerId: 10 }]);
      const r = await service.getSubmissionReviews(1, 99, ['CHAIR']);
      expect(r.status).toBe('success');
      // CHAIR phải gọi với isChair=true
      expect(mockReviewClient.getReviewsForSubmission).toHaveBeenCalledWith(1, true);
    });

    it('[BVA-Role-Owner-Author] AUTHOR là owner → được xem (biên dưới valid, isChair=false)', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10 }));
      mockReviewClient.getReviewsForSubmission.mockResolvedValue([{ id: 1, score: 7 }]);
      const r = await service.getSubmissionReviews(1, 10, ['AUTHOR']);
      expect(r.status).toBe('success');
      expect(mockReviewClient.getReviewsForSubmission).toHaveBeenCalledWith(1, false);
    });

    it('[BVA-Role-NonOwner] AUTHOR không phải owner → ForbiddenException (biên ngoài)', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 5 }));
      await expect(service.getSubmissionReviews(1, 99, ['AUTHOR']))
        .rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Id-NotExist] submission không tồn tại → NotFoundException', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.getSubmissionReviews(999, 1, ['CHAIR']))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-8  getPublicFileInfoBySubmissionId
  // Biên version file:
  //   version = 1 (Min - lần upload đầu tiên)
  //   version = 2 (Min+1)
  //   version = nhiều (Nominal)
  //   file không tồn tại → NotFoundException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getPublicFileInfoBySubmissionId', () => {
    it('[BVA-Version-1] version = 1 (biên Min - lần đầu upload) → trả thông tin file', async () => {
      fileRepo.findOne.mockResolvedValue({ id: 1, file_path: 'https://cdn/v1.pdf', version: 1 });
      const r = await service.getPublicFileInfoBySubmissionId(1);
      expect(r.status).toBe('success');
      expect(r.data.version).toBe(1);
    });

    it('[BVA-Version-2] version = 2 (biên Min+1) → trả đúng version', async () => {
      fileRepo.findOne.mockResolvedValue({ id: 2, file_path: 'https://cdn/v2.pdf', version: 2 });
      const r = await service.getPublicFileInfoBySubmissionId(1);
      expect(r.data.version).toBe(2);
    });

    it('[BVA-Version-100] version = 100 (biên camera-ready) → trả đúng version', async () => {
      fileRepo.findOne.mockResolvedValue({ id: 10, file_path: 'https://cdn/camera.pdf', version: 101 });
      const r = await service.getPublicFileInfoBySubmissionId(1);
      expect(r.data.version).toBe(101);
    });

    it('[BVA-NoFile] không có file nào → NotFoundException', async () => {
      fileRepo.findOne.mockResolvedValue(null);
      await expect(service.getPublicFileInfoBySubmissionId(99))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-9  handleSubmission
  // Biên coAuthors (chuỗi email):
  //   "" (0 email - biên Min) → không tạo co-author
  //   "a@b.com" (1 email - biên Min+1) → tạo 1 co-author
  //   nhiều email (Nominal)
  // Biên upload:
  //   upload thành công (valid)
  //   upload lỗi (Supabase error → BadRequestException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: handleSubmission', () => {
    beforeEach(() => {
      mockConferenceClient.checkDeadline.mockResolvedValue(undefined);
      mockConferenceClient.getConference.mockResolvedValue({ id: 1, topics: ['AI'] });
      jest.spyOn<any, any>(service, 'getNextVersion').mockResolvedValue(1);
      subRepo.create.mockReturnValue(makeSub());
      subRepo.save.mockResolvedValue(makeSub());
      authorRepo.create.mockReturnValue({});
      authorRepo.save.mockResolvedValue({});
      fileRepo.save.mockResolvedValue({ id: 10 });
      mockReviewClient.notifyNewSubmission.mockResolvedValue(undefined);
    });

    it('[BVA-CoAuthors-Empty] coAuthors = "" (biên Min - 0 đồng tác giả) → thành công, không tạo co-author', async () => {
      authorRepo.find = jest.fn().mockResolvedValue([]);
      const file: any = { originalname: 'paper.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };
      const dto = { title: 'Paper', conferenceId: 1, topic: 'AI', abstract: 'A', coAuthors: '' };
      const r = await service.handleSubmission(file, dto as any, 1, 'main@test.com', 'Author');
      expect(r.status).toBe('success');
      // authorRepo.save chỉ được gọi 1 lần (primary author), không có co-author
      expect(authorRepo.save).toHaveBeenCalledTimes(1);
    });

    it('[BVA-CoAuthors-One] coAuthors = 1 email hợp lệ (biên Min+1) → tạo 1 co-author', async () => {
      authorRepo.find = jest.fn().mockResolvedValue([{}]);
      const file: any = { originalname: 'paper.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };
      const dto = { title: 'Paper', conferenceId: 1, topic: 'AI', abstract: 'A', coAuthors: 'co@test.com' };
      const r = await service.handleSubmission(file, dto as any, 1, 'main@test.com', 'Author');
      expect(r.status).toBe('success');
      // authorRepo.save được gọi 2 lần: 1 primary + 1 co-author
      expect(authorRepo.save).toHaveBeenCalledTimes(2);
    });

    it('[BVA-CoAuthors-Multiple] coAuthors = 3 emails (Nominal) → tạo 3 co-authors', async () => {
      authorRepo.find = jest.fn().mockResolvedValue([{}, {}, {}]);
      const file: any = { originalname: 'paper.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };
      const dto = { title: 'Paper', conferenceId: 1, topic: 'AI', abstract: 'A',
                    coAuthors: 'c1@test.com, c2@test.com, c3@test.com' };
      const r = await service.handleSubmission(file, dto as any, 1, 'main@test.com', 'Author');
      expect(r.status).toBe('success');
      expect(authorRepo.save).toHaveBeenCalledTimes(4); // 1 + 3
    });

    it('[BVA-Upload-Error] Supabase upload lỗi → BadRequestException', async () => {
      (service as any).supabase.storage.from = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: 'Bucket not found' } }),
      });
      const file: any = { originalname: 'paper.pdf', buffer: Buffer.from(''), mimetype: 'application/pdf' };
      const dto = { title: 'T', conferenceId: 1, topic: 'AI', abstract: '', coAuthors: '' };
      await expect(service.handleSubmission(file, dto as any, 1, 'e@e.com', 'N'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-10  findAllWithPagination
  // Biên page:
  //   page = -1 (ngoài biên dưới - invalid) → validPage = 1
  //   page = 0  (biên dưới invalid) → validPage = 1
  //   page = 1  (biên Min hợp lệ) → skip = 0
  //   page = totalPages (biên Max hợp lệ) → có data
  //   page = totalPages+1 (ngoài biên trên) → validPage = totalPages
  // Biên limit:
  //   limit = 1  (Min) → 1 phần tử/trang
  //   limit = 10 (Nominal)
  //   limit = 100 (Max)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: findAllWithPagination', () => {
    let mockQB: any;

    beforeEach(() => {
      mockQB = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10), // 10 tổng, limit=10 → 1 trang
        getMany: jest.fn().mockResolvedValue([makeSub()]),
      };
      subRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQB);
    });

    it('[BVA-Page-Min] page = 1 (biên dưới hợp lệ) → skip = 0', async () => {
      const r = await service.findAllWithPagination({ page: 1, limit: 10 });
      expect(mockQB.skip).toHaveBeenCalledWith(0);
      expect(r.pagination.page).toBe(1);
    });

    it('[BVA-Page-Below-Min] page = 0 (biên dưới không hợp lệ) → validPage = 1', async () => {
      const r = await service.findAllWithPagination({ page: 0, limit: 10 });
      expect(r.pagination.page).toBe(1);
      expect(mockQB.skip).toHaveBeenCalledWith(0);
    });

    it('[BVA-Page-Negative] page = -5 (ngoài biên âm) → validPage = 1', async () => {
      const r = await service.findAllWithPagination({ page: -5, limit: 10 });
      expect(r.pagination.page).toBe(1);
    });

    it('[BVA-Page-Max] page = totalPages (biên trên hợp lệ) → không vượt quá', async () => {
      // total=10, limit=10 → totalPages=1, page=1 là Max
      mockQB.getCount.mockResolvedValue(10);
      const r = await service.findAllWithPagination({ page: 1, limit: 10 });
      expect(r.pagination.page).toBeLessThanOrEqual(r.pagination.totalPages || 1);
    });

    it('[BVA-Page-BeyondMax] page = totalPages+1 (ngoài biên trên) → validPage = totalPages', async () => {
      // total=10, limit=10 → totalPages=1; page=2 vượt → validPage=1
      mockQB.getCount.mockResolvedValue(10);
      const r = await service.findAllWithPagination({ page: 2, limit: 10 });
      expect(r.pagination.page).toBe(1); // clamped to totalPages
    });

    it('[BVA-Limit-1] limit = 1 (biên dưới Min) → take(1)', async () => {
      mockQB.getCount.mockResolvedValue(5); // 5 records, 5 trang với limit=1
      await service.findAllWithPagination({ page: 1, limit: 1 });
      expect(mockQB.take).toHaveBeenCalledWith(1);
    });

    it('[BVA-Limit-Nominal] limit = 10 (Nominal) → take(10)', async () => {
      await service.findAllWithPagination({ page: 1, limit: 10 });
      expect(mockQB.take).toHaveBeenCalledWith(10);
    });

    it('[BVA-Filter-Status] filter status được áp dụng', async () => {
      await service.findAllWithPagination({ page: 1, limit: 10, status: 'SUBMITTED' });
      expect(mockQB.andWhere).toHaveBeenCalled();
    });

    it('[BVA-Filter-Search] filter search với ILIKE được áp dụng', async () => {
      await service.findAllWithPagination({ page: 1, limit: 10, search: 'AI' });
      expect(mockQB.andWhere).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-11  uploadCameraReady
  // Biên quyền:
  //   userId = created_by (valid)
  //   userId ≠ created_by (ngoài biên → ForbiddenException)
  // Biên status:
  //   ACCEPTED (biên valid duy nhất)
  //   SUBMITTED / UNDER_REVIEW (ngoài biên → BadRequestException)
  // Biên version camera-ready:
  //   0 camera-ready files trước → version = 101 (lần đầu, biên Min)
  //   1 camera-ready file trước → version = 102 (biên Min+1)
  //   n camera-ready files → version = 100+n+1
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: uploadCameraReady', () => {
    const file: any = { originalname: 'cr.pdf', buffer: Buffer.from('content'), mimetype: 'application/pdf' };

    it('[BVA-Version-First] 0 camera-ready files trước (biên Min) → version = 101', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      // Không có file camera-ready (version >= 100)
      fileRepo.find.mockResolvedValue([{ version: 1 }, { version: 2 }]); // chỉ có regular files
      subRepo.update.mockResolvedValue({});
      fileRepo.save.mockResolvedValue({ id: 50 });
      const r = await service.uploadCameraReady(1, file, 10);
      expect(r.status).toBe('success');
      expect(r.data.version).toBe(101); // 100 + 0 camera-ready + 1
    });

    it('[BVA-Version-Second] 1 camera-ready file trước (biên Min+1) → version = 102', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      // Có 1 file camera-ready (version=101)
      fileRepo.find.mockResolvedValue([{ version: 1 }, { version: 101 }]);
      subRepo.update.mockResolvedValue({});
      fileRepo.save.mockResolvedValue({ id: 51 });
      const r = await service.uploadCameraReady(1, file, 10);
      expect(r.status).toBe('success');
      expect(r.data.version).toBe(102); // 100 + 1 + 1
    });

    it('[BVA-Status-NotAccepted] SUBMITTED (ngoài biên status) → BadRequestException', async () => {
      // Biên: chỉ ACCEPTED mới hợp lệ; SUBMITTED là ngay ngoài biên đó
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.SUBMITTED }));
      await expect(service.uploadCameraReady(1, file, 10)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Owner-OneBeyond] userId = created_by + 1 (ngay ngoài biên) → ForbiddenException', async () => {
      subRepo.findOne.mockResolvedValue(makeSub({ created_by: 10, status: SubmissionStatus.ACCEPTED }));
      // userId=11 là ngay ngoài biên của created_by=10
      await expect(service.uploadCameraReady(1, file, 11)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Id-NotExist] submission không tồn tại → NotFoundException', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.uploadCameraReady(99, file, 10)).rejects.toThrow(NotFoundException);
    });
  });
});
