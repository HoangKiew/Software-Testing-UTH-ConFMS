/**
 * Unit Tests – ReviewsService
 * Class: ReviewsService
 * File: apps/review-service/src/reviews/reviews.service.ts
 * Methodology: Normal (N) | Boundary (B) | Abnormal (A)
 * Benchmark: 30 TC/KLOC | LOC analysed: 385 | TC written: 26
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewPreference, PreferenceType } from './entities/review-preference.entity';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { Review, ConfidenceLevel, RecommendationType } from './entities/review.entity';
import { PcDiscussion } from './entities/pc-discussion.entity';
import { Decision, FinalDecision } from './entities/decision.entity';
import { Rebuttal } from './entities/rebuttal.entity';
import { ConferenceClientService } from '../integrations/conference-client.service';
import { SubmissionClientService } from '../integrations/submission-client.service';
import { IdentityClientService } from '../integrations/identity-client.service';

// ─── Mock Factories ────────────────────────────────────────────────────────────
const mockRepo = () => ({
  find: jest.fn(), findOne: jest.fn(),
  save: jest.fn(), create: jest.fn(), count: jest.fn(),
});

// ─── Data Helpers ───────────────────────────────────────────────────────────────
const makeAssignment = (o: Partial<Assignment> = {}): Assignment =>
  ({ id: 1, reviewerId: 10, submissionId: 'sub-uuid-1', conferenceId: 1,
     assignedBy: 10, status: AssignmentStatus.PENDING, dueDate: null,
     createdAt: new Date(), updatedAt: new Date(), review: null, ...o }) as Assignment;

const makeReview = (o: Partial<Review> = {}): Review =>
  ({ id: 1, assignmentId: 1, score: 7, confidence: ConfidenceLevel.HIGH,
     recommendation: RecommendationType.ACCEPT,
     commentForAuthor: 'Good work', commentForPC: null,
     createdAt: new Date(), ...o }) as Review;

// ─── Test Suite ─────────────────────────────────────────────────────────────────
describe('ReviewsService', () => {
  let service: ReviewsService;
  let prefRepo:       ReturnType<typeof mockRepo>;
  let assignmentRepo: ReturnType<typeof mockRepo>;
  let reviewRepo:     ReturnType<typeof mockRepo>;
  let decisionRepo:   ReturnType<typeof mockRepo>;
  let confClient:     { getMyTrackAssignments: jest.Mock };
  let submClient:     { getSubmissionsByTrack: jest.Mock; getSubmissionById: jest.Mock; updateSubmissionStatus: jest.Mock };
  let identityClient: { getUsersByIds: jest.Mock };

  beforeEach(async () => {
    confClient     = { getMyTrackAssignments: jest.fn() };
    submClient     = {
      getSubmissionsByTrack: jest.fn(),
      getSubmissionById: jest.fn(),
      updateSubmissionStatus: jest.fn(),
    };
    identityClient = { getUsersByIds: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(ReviewPreference), useFactory: mockRepo },
        { provide: getRepositoryToken(Assignment),        useFactory: mockRepo },
        { provide: getRepositoryToken(Review),            useFactory: mockRepo },
        { provide: getRepositoryToken(PcDiscussion),      useFactory: mockRepo },
        { provide: getRepositoryToken(Decision),          useFactory: mockRepo },
        { provide: getRepositoryToken(Rebuttal),          useFactory: mockRepo },
        { provide: ConferenceClientService,  useValue: confClient },
        { provide: SubmissionClientService,  useValue: submClient },
        { provide: IdentityClientService,    useValue: identityClient },
      ],
    }).compile();

    service         = module.get<ReviewsService>(ReviewsService);
    prefRepo        = module.get(getRepositoryToken(ReviewPreference));
    assignmentRepo  = module.get(getRepositoryToken(Assignment));
    reviewRepo      = module.get(getRepositoryToken(Review));
    decisionRepo    = module.get(getRepositoryToken(Decision));
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-1  submitBid  (LOC ~22) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('submitBid', () => {
    const dto = { submissionId: 'sub-uuid-1', conferenceId: 1, preference: PreferenceType.INTERESTED };

    it('[Normal] tạo bid mới thành công khi chưa có bid', async () => {
      prefRepo.findOne.mockResolvedValue(null); // chưa có bid
      prefRepo.create.mockReturnValue({ reviewerId: 10, ...dto });
      prefRepo.save.mockResolvedValue({ id: 1, reviewerId: 10, ...dto });
      const r = await service.submitBid(10, dto);
      expect(prefRepo.save).toHaveBeenCalled();
      expect(r.preference).toBe(PreferenceType.INTERESTED);
    });

    it('[Normal] cập nhật bid khi đã tồn tại (upsert)', async () => {
      const existing = { id: 1, reviewerId: 10, ...dto, preference: PreferenceType.MAYBE };
      prefRepo.findOne.mockResolvedValue(existing);
      prefRepo.save.mockResolvedValue({ ...existing, preference: PreferenceType.CONFLICT });
      const r = await service.submitBid(10, { ...dto, preference: PreferenceType.CONFLICT });
      expect(prefRepo.save).toHaveBeenCalledWith(expect.objectContaining({ preference: PreferenceType.CONFLICT }));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-2  checkConflictOfInterest  (LOC ~18) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('checkConflictOfInterest', () => {
    it('[Normal] trả về true khi reviewer đã báo CONFLICT', async () => {
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.CONFLICT });
      expect(await service.checkConflictOfInterest(10, 'sub-uuid-1')).toBe(true);
    });

    it('[Boundary] trả về false khi preference là INTERESTED (không phải CONFLICT)', async () => {
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.INTERESTED });
      expect(await service.checkConflictOfInterest(10, 'sub-uuid-1')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-3  selfAssignSubmission  (LOC ~45) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('selfAssignSubmission', () => {
    it('[Normal] tạo assignment mới thành công khi không có COI', async () => {
      prefRepo.findOne.mockResolvedValue(null); // không có COI
      assignmentRepo.findOne.mockResolvedValue(null); // chưa có assignment
      const newA = makeAssignment({ status: AssignmentStatus.ACCEPTED });
      assignmentRepo.create.mockReturnValue(newA);
      assignmentRepo.save.mockResolvedValue(newA);
      const r = await service.selfAssignSubmission(10, 'sub-uuid-1', 1);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('[Abnormal] ném BadRequestException khi reviewer có COI', async () => {
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.CONFLICT });
      await expect(service.selfAssignSubmission(10, 'sub-uuid-1', 1))
        .rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] trả về assignment hiện tại nếu đã ACCEPTED trước đó', async () => {
      prefRepo.findOne.mockResolvedValue(null);
      const existing = makeAssignment({ status: AssignmentStatus.ACCEPTED });
      assignmentRepo.findOne.mockResolvedValue(existing);
      const r = await service.selfAssignSubmission(10, 'sub-uuid-1', 1);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-4  getMyAssignments  (LOC ~12) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getMyAssignments', () => {
    it('[Normal] trả về danh sách assignments của reviewer', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment(), makeAssignment({ id: 2 })]);
      const r = await service.getMyAssignments(10);
      expect(r).toHaveLength(2);
    });

    it('[Boundary] trả về mảng rỗng khi reviewer chưa có assignment nào', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const r = await service.getMyAssignments(99);
      expect(r).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-5  updateAssignmentStatus  (LOC ~25) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateAssignmentStatus', () => {
    it('[Normal] ACCEPT assignment thành công', async () => {
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.PENDING });
      assignmentRepo.findOne.mockResolvedValue(a);
      assignmentRepo.save.mockResolvedValue({ ...a, status: AssignmentStatus.ACCEPTED });
      const r = await service.updateAssignmentStatus(1, 10, AssignmentStatus.ACCEPTED);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('[Abnormal] ném NotFoundException khi assignment không tồn tại', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      await expect(service.updateAssignmentStatus(999, 10, AssignmentStatus.ACCEPTED))
        .rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném ForbiddenException khi reviewer không phải chủ assignment', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 5 }));
      await expect(service.updateAssignmentStatus(1, 99, AssignmentStatus.ACCEPTED))
        .rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném BadRequestException khi assignment đã được xử lý (không còn PENDING)', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 10, status: AssignmentStatus.ACCEPTED }));
      await expect(service.updateAssignmentStatus(1, 10, AssignmentStatus.REJECTED))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-6  submitReview  (LOC ~85) → 5 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('submitReview', () => {
    const dto = { assignmentId: 1, score: 7, confidence: ConfidenceLevel.HIGH,
      recommendation: RecommendationType.ACCEPT, commentForAuthor: 'Good', commentForPC: undefined };

    it('[Normal] nộp review mới thành công cho assignment ACCEPTED', async () => {
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.ACCEPTED });
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(null); // chưa có review
      reviewRepo.create.mockReturnValue(makeReview());
      reviewRepo.save.mockResolvedValue(makeReview());
      assignmentRepo.save.mockResolvedValue({ ...a, status: AssignmentStatus.COMPLETED });
      const r = await service.submitReview(10, dto);
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('[Normal] cập nhật review khi assignment đã COMPLETED và còn trong hạn', async () => {
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 ngày
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.COMPLETED, dueDate });
      const existing = makeReview();
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(existing);
      reviewRepo.save.mockResolvedValue({ ...existing, score: 8 });
      assignmentRepo.save.mockResolvedValue(a);
      const r = await service.submitReview(10, { ...dto, score: 8 });
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném NotFoundException khi assignment không tồn tại', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      await expect(service.submitReview(10, dto)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném ForbiddenException khi không phải reviewer của assignment này', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 5 }));
      await expect(service.submitReview(99, dto)).rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném BadRequestException khi COMPLETED và đã hết hạn dueDate', async () => {
      const pastDue = new Date(Date.now() - 1000); // đã hết hạn
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.COMPLETED, dueDate: pastDue });
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(makeReview());
      await expect(service.submitReview(10, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-7  getReviewsBySubmission  (LOC ~60) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getReviewsBySubmission', () => {
    it('[Normal] trả về danh sách reviews khi có assignments', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      identityClient.getUsersByIds.mockResolvedValue(new Map());
      const r = await service.getReviewsBySubmission('sub-uuid-1');
      expect(r).toHaveLength(1);
    });

    it('[Boundary] trả về mảng rỗng khi submission chưa có assignment nào', async () => {
      assignmentRepo.find.mockResolvedValue([]); // không có assignment
      const r = await service.getReviewsBySubmission('sub-uuid-new');
      expect(r).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-8  getDecisionSummaryBySubmission  (LOC ~62) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getDecisionSummaryBySubmission', () => {
    it('[Normal] trả về thống kê đúng khi có nhiều reviews', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([
        makeReview({ score: 6, recommendation: RecommendationType.REJECT }),
        makeReview({ id: 2, score: 8, recommendation: RecommendationType.ACCEPT }),
      ]);
      decisionRepo.findOne.mockResolvedValue(null);
      const r = await service.getDecisionSummaryBySubmission('sub-uuid-1');
      expect(r.stats.reviewCount).toBe(2);
      expect(r.stats.averageScore).toBe(7);
      expect(r.stats.minScore).toBe(6);
      expect(r.stats.maxScore).toBe(8);
    });

    it('[Boundary] trả về null stats khi không có review nào', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([]); // không có review
      decisionRepo.findOne.mockResolvedValue(null);
      const r = await service.getDecisionSummaryBySubmission('sub-uuid-1');
      expect(r.stats.reviewCount).toBe(0);
      expect(r.stats.averageScore).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-9  upsertDecisionForSubmission  (LOC ~28) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('upsertDecisionForSubmission', () => {
    it('[Normal] tạo decision mới khi chưa tồn tại', async () => {
      decisionRepo.findOne.mockResolvedValue(null);
      const newDec = { id: 1, submissionId: 'sub-uuid-1', decision: FinalDecision.ACCEPT, decidedBy: 99 };
      decisionRepo.create.mockReturnValue(newDec);
      decisionRepo.save.mockResolvedValue(newDec);
      const r = await service.upsertDecisionForSubmission('sub-uuid-1', 99, FinalDecision.ACCEPT);
      expect(r.decision).toBe(FinalDecision.ACCEPT);
    });

    it('[Normal] cập nhật decision khi đã tồn tại (upsert)', async () => {
      const existing = { id: 1, submissionId: 'sub-uuid-1', decision: FinalDecision.BORDERLINE, decidedBy: 99, note: null };
      decisionRepo.findOne.mockResolvedValue(existing);
      decisionRepo.save.mockResolvedValue({ ...existing, decision: FinalDecision.ACCEPT });
      const r = await service.upsertDecisionForSubmission('sub-uuid-1', 99, FinalDecision.ACCEPT);
      expect(r.decision).toBe(FinalDecision.ACCEPT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-10  getReviewerActivityStats  (LOC ~28) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getReviewerActivityStats', () => {
    it('[Normal] trả về thống kê đúng khi reviewer có assignments và reviews', async () => {
      const assignments = [
        makeAssignment({ status: AssignmentStatus.ACCEPTED }),
        makeAssignment({ id: 2, status: AssignmentStatus.COMPLETED }),
      ];
      assignmentRepo.find.mockResolvedValue(assignments);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      const r = await service.getReviewerActivityStats(10);
      expect(r.assignmentCount).toBe(2);
      expect(r.reviewCount).toBe(1);
      expect(r.hasActiveAssignments).toBe(true);
    });

    it('[Boundary] trả về tất cả bằng 0 khi reviewer không có assignment nào', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const r = await service.getReviewerActivityStats(99);
      expect(r.assignmentCount).toBe(0);
      expect(r.reviewCount).toBe(0);
      expect(r.hasActiveAssignments).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-11  checkReviewerAssignment  (LOC ~14) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('checkReviewerAssignment', () => {
    it('[Normal] trả về true khi reviewer có assignment cho submission', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment());
      expect(await service.checkReviewerAssignment(10, 'sub-uuid-1')).toBe(true);
    });

    it('[Abnormal] trả về false khi không có assignment', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      expect(await service.checkReviewerAssignment(10, 'sub-uuid-no-match')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-12  getBidsBySubmission  (LOC ~15) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getBidsBySubmission', () => {
    it('[Normal] trả về danh sách bids khi có dữ liệu', async () => {
      prefRepo.find.mockResolvedValue([
        { id: 1, reviewerId: 10, submissionId: 'sub-uuid-1', preference: PreferenceType.INTERESTED },
      ]);
      const r = await service.getBidsBySubmission('sub-uuid-1');
      expect(r).toHaveLength(1);
    });

    it('[Boundary] trả về mảng rỗng khi submission không có bid nào', async () => {
      prefRepo.find.mockResolvedValue([]);
      expect(await service.getBidsBySubmission('sub-uuid-new')).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-13  getDiscussionsBySubmission  (LOC ~15) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getDiscussionsBySubmission', () => {
    it('[Normal] trả về danh sách discussions khi có dữ liệu', async () => {
      const mockDiscRepo = service['pcDiscussionRepository' as any] || { find: jest.fn() };
      // Get via DI token
      const discRepo = (service as any).pcDiscussionRepository;
      discRepo.find.mockResolvedValue([{ id: 1, submissionId: 'sub-uuid-1', content: 'Good paper' }]);
      const r = await service.getDiscussionsBySubmission('sub-uuid-1');
      expect(r).toHaveLength(1);
    });

    it('[Boundary] trả về mảng rỗng khi chưa có discussion nào', async () => {
      const discRepo = (service as any).pcDiscussionRepository;
      discRepo.find.mockResolvedValue([]);
      expect(await service.getDiscussionsBySubmission('sub-uuid-new')).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-14  getAnonymizedReviewsBySubmission  (LOC ~12) → 1 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getAnonymizedReviewsBySubmission', () => {
    it('[Normal] trả về reviews ẩn danh (chỉ có score, comment, recommendation)', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      identityClient.getUsersByIds.mockResolvedValue(new Map());
      const r = await service.getAnonymizedReviewsBySubmission('sub-uuid-1');
      expect(r[0]).not.toHaveProperty('reviewerId');
      expect(r[0]).toHaveProperty('score');
      expect(r[0]).toHaveProperty('recommendation');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-15  getSubmissionProgress  (LOC ~35) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSubmissionProgress', () => {
    it('[Normal] trả về đúng tiến độ khi có assignments và reviews', async () => {
      assignmentRepo.find.mockResolvedValue([
        makeAssignment({ status: AssignmentStatus.COMPLETED }),
        makeAssignment({ id: 2, status: AssignmentStatus.PENDING }),
      ]);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      identityClient.getUsersByIds.mockResolvedValue(new Map());
      const r = await service.getSubmissionProgress('sub-uuid-1');
      expect(r.totalAssignments).toBe(2);
      expect(r.completedAssignments).toBe(1);
      expect(r.pendingAssignments).toBe(1);
      expect(r.reviewsSubmitted).toBe(1);
    });

    it('[Boundary] trả về tất cả 0 khi không có assignment', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      reviewRepo.find.mockResolvedValue([]);
      identityClient.getUsersByIds.mockResolvedValue(new Map());
      const r = await service.getSubmissionProgress('sub-uuid-empty');
      expect(r.totalAssignments).toBe(0);
      expect(r.lastReviewAt).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-16  getConferenceProgress  (LOC ~35) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getConferenceProgress', () => {
    it('[Normal] trả về đúng thống kê tiến độ hội nghị', async () => {
      assignmentRepo.find.mockResolvedValue([
        makeAssignment({ status: AssignmentStatus.COMPLETED }),
        makeAssignment({ id: 2, status: AssignmentStatus.PENDING }),
      ]);
      reviewRepo.count.mockResolvedValue(1);
      const r = await service.getConferenceProgress(1);
      expect(r.conferenceId).toBe(1);
      expect(r.totalAssignments).toBe(2);
      expect(r.reviewsSubmitted).toBe(1);
    });

    it('[Boundary] trả về tất cả 0 khi hội nghị không có assignment', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const r = await service.getConferenceProgress(99);
      expect(r.totalAssignments).toBe(0);
      expect(r.reviewsSubmitted).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-17  getSubmissionsForReviewer  (LOC ~50) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSubmissionsForReviewer', () => {
    it('[Normal] trả về submissions khi reviewer có accepted track', async () => {
      confClient.getMyTrackAssignments.mockResolvedValue([
        { trackId: 1, status: 'ACCEPTED' },
      ]);
      submClient.getSubmissionsByTrack.mockResolvedValue([
        { id: 'sub-1', status: 'SUBMITTED' },
        { id: 'sub-2', status: 'REVIEWING' },
      ]);
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r.length).toBeGreaterThan(0);
    });

    it('[Boundary] trả về [] khi reviewer không có accepted track nào', async () => {
      confClient.getMyTrackAssignments.mockResolvedValue([
        { trackId: 1, status: 'PENDING' },
      ]);
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r).toEqual([]);
    });

    it('[Abnormal] trả về [] khi conference client lỗi', async () => {
      confClient.getMyTrackAssignments.mockRejectedValue(new Error('service down'));
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r).toEqual([]);
    });
  });
});
