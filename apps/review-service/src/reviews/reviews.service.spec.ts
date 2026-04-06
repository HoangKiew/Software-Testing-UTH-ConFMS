/**
 * Unit Tests – ReviewsService
 * Class: ReviewsService
 * File: apps/review-service/src/reviews/reviews.service.ts
 * Methodology: Boundary Value Analysis (BVA)
 *
 * BVA Coverage Plan:
 * ┌────────────────────────────────┬─────────────────────────────────────────────────────────────┐
 * │ Function                       │ Biên được kiểm thử                                          │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ submitBid                      │ preference enum boundary:                                   │
 * │                                │   INTERESTED, MAYBE, CONFLICT, NOT_INTERESTED               │
 * │                                │   bid mới (chưa có), bid đã có (upsert boundary)            │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ checkConflictOfInterest        │ preference = CONFLICT (biên true)                           │
 * │                                │ preference ≠ CONFLICT: INTERESTED, MAYBE (biên false)      │
 * │                                │ không có preference (biên no-record)                        │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ selfAssignSubmission           │ COI = false (biên valid), COI = true (biên invalid)         │
 * │                                │ assignment đã ACCEPTED (idempotent boundary)                │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ getMyAssignments               │ 0 assignments (biên Min), 1 (Min+1), nhiều (Nominal)        │
 * │                                │ page boundary: page=1 (skip=0), page=2 (skip=limit)        │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ updateAssignmentStatus         │ status boundary:                                            │
 * │                                │   PENDING → ACCEPTED (biên valid)                          │
 * │                                │   PENDING → REJECTED (biên valid)                          │
 * │                                │   ACCEPTED → * (biên đã qua → BadRequestException)        │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ submitReview                   │ assignment status boundary:                                 │
 * │                                │   ACCEPTED (biên hợp lệ để nộp mới)                        │
 * │                                │   COMPLETED + dueDate=now+1ms (biên Min còn hạn cập nhật)  │
 * │                                │   COMPLETED + dueDate=now-1ms (biên hết hạn cập nhật)      │
 * │                                │   Reviewer boundary: đúng reviewer vs sai reviewer          │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ getDecisionSummaryBySubmission │ review count boundary:                                      │
 * │                                │   0 reviews → averageScore=null, min=null                  │
 * │                                │   1 review → average=score, min=max=same score             │
 * │                                │   2+ reviews → calculate min/max/avg                       │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ upsertDecisionForSubmission    │ decision chưa có (create biên), đã có (update biên)        │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ getReviewerActivityStats       │ 0 assignments (biên Min), có assignments (Nominal)           │
 * ├────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 * │ getSubmissionsForReviewer      │ acceptedTracks=0 (biên Min → [])                            │
 * │                                │ acceptedTracks=1+ (biên valid)                              │
 * │                                │ conference client lỗi (exception boundary → [])             │
 * └────────────────────────────────┴─────────────────────────────────────────────────────────────┘
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
  // BVA-1  submitBid
  // Input: preference (enum: INTERESTED | MAYBE | CONFLICT | NOT_INTERESTED)
  // Biên enum: kiểm thử các giá trị biên của enum
  //   INTERESTED (biên 1 - giá trị đầu tiên)
  //   CONFLICT (biên quan trọng - giá trị gây ảnh hưởng COI check)
  //   NOT_INTERESTED (giá trị khác)
  // Biên tồn tại bid:
  //   chưa có bid → CREATE mới (biên 0 → 1)
  //   đã có bid → UPDATE (biên n → n với preference khác)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: submitBid', () => {
    const baseBid = { submissionId: 'sub-uuid-1', conferenceId: 1 };

    it('[BVA-Pref-Interested] preference = INTERESTED (biên enum - giá trị đầu tiên) → tạo bid mới', async () => {
      prefRepo.findOne.mockResolvedValue(null); // chưa có bid
      const bid = { reviewerId: 10, ...baseBid, preference: PreferenceType.INTERESTED };
      prefRepo.create.mockReturnValue(bid);
      prefRepo.save.mockResolvedValue({ id: 1, ...bid });
      const r = await service.submitBid(10, { ...baseBid, preference: PreferenceType.INTERESTED });
      expect(r.preference).toBe(PreferenceType.INTERESTED);
      expect(prefRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Pref-Conflict] preference = CONFLICT (biên quan trọng - gây COI) → tạo bid CONFLICT', async () => {
      prefRepo.findOne.mockResolvedValue(null);
      const bid = { reviewerId: 10, ...baseBid, preference: PreferenceType.CONFLICT };
      prefRepo.create.mockReturnValue(bid);
      prefRepo.save.mockResolvedValue({ id: 2, ...bid });
      const r = await service.submitBid(10, { ...baseBid, preference: PreferenceType.CONFLICT });
      expect(r.preference).toBe(PreferenceType.CONFLICT);
    });

    it('[BVA-Bid-AlreadyExist] bid đã tồn tại → UPDATE preference (biên upsert)', async () => {
      // Biên: từ MAYBE → CONFLICT (thay đổi preference khi đã có bid)
      const existing = { id: 1, reviewerId: 10, ...baseBid, preference: PreferenceType.MAYBE };
      prefRepo.findOne.mockResolvedValue(existing);
      prefRepo.save.mockResolvedValue({ ...existing, preference: PreferenceType.CONFLICT });
      const r = await service.submitBid(10, { ...baseBid, preference: PreferenceType.CONFLICT });
      expect(prefRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ preference: PreferenceType.CONFLICT }),
      );
    });

    it('[BVA-Bid-New] chưa có bid (biên 0 → 1) → tạo bid mới không upsert', async () => {
      prefRepo.findOne.mockResolvedValue(null);
      prefRepo.create.mockReturnValue({ reviewerId: 10, ...baseBid, preference: PreferenceType.MAYBE });
      prefRepo.save.mockResolvedValue({ id: 3, preference: PreferenceType.MAYBE });
      await service.submitBid(10, { ...baseBid, preference: PreferenceType.MAYBE });
      expect(prefRepo.create).toHaveBeenCalled(); // phải gọi create, không phải update existing
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-2  checkConflictOfInterest
  // Input: preference value
  // Biên boolean output:
  //   preference = CONFLICT → true (biên duy nhất trả true)
  //   preference = INTERESTED → false (biên ngay ngoài CONFLICT)
  //   preference = MAYBE → false (biên khác)
  //   không có record preference → false (biên zero)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: checkConflictOfInterest', () => {
    it('[BVA-Pref-Conflict-True] preference = CONFLICT (biên valid = true) → trả true', async () => {
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.CONFLICT });
      expect(await service.checkConflictOfInterest(10, 'sub-uuid-1')).toBe(true);
    });

    it('[BVA-Pref-Interested-False] preference = INTERESTED (ngay ngoài CONFLICT) → trả false', async () => {
      // Biên: INTERESTED là giá trị ngay cạnh Conflict nhưng KHÔNG phải CONFLICT
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.INTERESTED });
      expect(await service.checkConflictOfInterest(10, 'sub-uuid-1')).toBe(false);
    });

    it('[BVA-Pref-Maybe-False] preference = MAYBE → trả false', async () => {
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.MAYBE });
      expect(await service.checkConflictOfInterest(10, 'sub-uuid-1')).toBe(false);
    });

    it('[BVA-NoPref] không có preference record (biên zero) → trả false', async () => {
      prefRepo.findOne.mockResolvedValue(null); // không có record
      expect(await service.checkConflictOfInterest(10, 'sub-uuid-no-pref')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-3  selfAssignSubmission
  // Biên COI:
  //   hasConflict = false (biên valid - được phép tự phân công)
  //   hasConflict = true (biên invalid - BadRequestException)
  // Biên assignment tồn tại:
  //   assignment chưa có → tạo mới (biên 0 → 1)
  //   assignment đã ACCEPTED → trả luôn (idempotent biên)
  //   assignment đã PENDING → update lên ACCEPTED
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: selfAssignSubmission', () => {
    it('[BVA-COI-False] COI = false (biên valid) → tạo assignment mới ACCEPTED', async () => {
      prefRepo.findOne.mockResolvedValue(null); // không có COI
      assignmentRepo.findOne.mockResolvedValue(null); // chưa có assignment
      const newA = makeAssignment({ status: AssignmentStatus.ACCEPTED });
      assignmentRepo.create.mockReturnValue(newA);
      assignmentRepo.save.mockResolvedValue(newA);
      const r = await service.selfAssignSubmission(10, 'sub-uuid-1', 1);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('[BVA-COI-True] COI = CONFLICT (biên invalid) → BadRequestException', async () => {
      // Biên: CONFLICT là biên invalid cho tự phân công
      prefRepo.findOne.mockResolvedValue({ preference: PreferenceType.CONFLICT });
      await expect(service.selfAssignSubmission(10, 'sub-uuid-1', 1))
        .rejects.toThrow(BadRequestException);
    });

    it('[BVA-Assignment-AlreadyAccepted] assignment đã ACCEPTED (idempotent biên) → trả luôn không save lại', async () => {
      prefRepo.findOne.mockResolvedValue(null);
      const existing = makeAssignment({ status: AssignmentStatus.ACCEPTED });
      assignmentRepo.findOne.mockResolvedValue(existing);
      const r = await service.selfAssignSubmission(10, 'sub-uuid-1', 1);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
      expect(assignmentRepo.save).not.toHaveBeenCalled(); // idempotent - không gọi save
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-4  getMyAssignments
  // Input: reviewerId, page, limit
  // Biên count:
  //   0 assignments (biên Min)
  //   1 assignment (biên Min+1)
  //   nhiều (Nominal)
  // Biên page:
  //   page = 1 (biên Min) → skip = 0
  //   page = 2 (biên Min+1) → skip = limit
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getMyAssignments', () => {
    it('[BVA-Count-0] 0 assignments (biên Min) → trả []', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const r = await service.getMyAssignments(99);
      expect(r).toEqual([]);
    });

    it('[BVA-Count-1] đúng 1 assignment (biên Min+1) → trả [1 phần tử]', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      const r = await service.getMyAssignments(10);
      expect(r).toHaveLength(1);
    });

    it('[BVA-Count-Nominal] nhiều assignments (Nominal) → trả đúng số lượng', async () => {
      assignmentRepo.find.mockResolvedValue([
        makeAssignment(), makeAssignment({ id: 2 }), makeAssignment({ id: 3 }),
      ]);
      const r = await service.getMyAssignments(10);
      expect(r).toHaveLength(3);
    });

    it('[BVA-Page-1] page = 1 (biên Min) → skip = 0 (không bỏ qua record nào)', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      await service.getMyAssignments(10, 1, 10); // page=1, skip=0
      expect(assignmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('[BVA-Page-2] page = 2 (biên Min+1) → skip = limit', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      await service.getMyAssignments(10, 2, 10); // page=2, skip=10
      expect(assignmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-5  updateAssignmentStatus
  // Input: status (ACCEPTED | REJECTED), current assignment status
  // Biên status chuyển đổi:
  //   PENDING → ACCEPTED (biên hợp lệ)
  //   PENDING → REJECTED (biên hợp lệ)
  //   ACCEPTED → * (biên đã qua - không thể thay đổi → BadRequestException)
  //   REJECTED → * (biên đã qua → BadRequestException)
  // Biên quyền:
  //   reviewerId đúng (biên valid)
  //   reviewerId sai 1 đơn vị (biên ngoài → ForbiddenException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: updateAssignmentStatus', () => {
    it('[BVA-Status-Pending-to-Accepted] PENDING → ACCEPTED (biên valid từ dưới lên)', async () => {
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.PENDING });
      assignmentRepo.findOne.mockResolvedValue(a);
      assignmentRepo.save.mockResolvedValue({ ...a, status: AssignmentStatus.ACCEPTED });
      const r = await service.updateAssignmentStatus(1, 10, AssignmentStatus.ACCEPTED);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('[BVA-Status-Pending-to-Rejected] PENDING → REJECTED (biên valid - reject ngay đầu)', async () => {
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.PENDING });
      assignmentRepo.findOne.mockResolvedValue(a);
      assignmentRepo.save.mockResolvedValue({ ...a, status: AssignmentStatus.REJECTED });
      const r = await service.updateAssignmentStatus(1, 10, AssignmentStatus.REJECTED);
      expect(r.status).toBe(AssignmentStatus.REJECTED);
    });

    it('[BVA-Status-Already-Accepted] ACCEPTED → * (biên đã finalized) → BadRequestException', async () => {
      // Biên: status ≠ PENDING → không thể thay đổi
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 10, status: AssignmentStatus.ACCEPTED }));
      await expect(service.updateAssignmentStatus(1, 10, AssignmentStatus.REJECTED))
        .rejects.toThrow(BadRequestException);
    });

    it('[BVA-Status-Already-Completed] COMPLETED → * (biên đã hoàn thành) → BadRequestException', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 10, status: AssignmentStatus.COMPLETED }));
      await expect(service.updateAssignmentStatus(1, 10, AssignmentStatus.ACCEPTED))
        .rejects.toThrow(BadRequestException);
    });

    it('[BVA-Reviewer-Exact] reviewerId = đúng (biên khớp chính xác) → thành công', async () => {
      const a = makeAssignment({ reviewerId: 42, status: AssignmentStatus.PENDING });
      assignmentRepo.findOne.mockResolvedValue(a);
      assignmentRepo.save.mockResolvedValue({ ...a, status: AssignmentStatus.ACCEPTED });
      // reviewerId=42 khớp chính xác với assignment.reviewerId=42
      const r = await service.updateAssignmentStatus(1, 42, AssignmentStatus.ACCEPTED);
      expect(r.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('[BVA-Reviewer-OneBeyond] reviewerId = expected+1 (ngay ngoài biên) → ForbiddenException', async () => {
      // BVA chính xác: 43 ≠ 42 → ngay ngoài biên match
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 42 }));
      await expect(service.updateAssignmentStatus(1, 43, AssignmentStatus.ACCEPTED))
        .rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Assignment-NotExist] assignment không tồn tại → NotFoundException', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      await expect(service.updateAssignmentStatus(999, 10, AssignmentStatus.ACCEPTED))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-6  submitReview
  // Input: assignment status + dueDate
  // Biên assignment status:
  //   ACCEPTED (biên valid để nộp mới)
  //   COMPLETED + dueDate = now+1ms (biên Min còn hạn cập nhật)
  //   COMPLETED + dueDate = now-1ms (biên Max invalid - vừa hết hạn)
  //   COMPLETED + dueDate = null (không ràng buộc deadline - cập nhật được)
  // Biên quyền reviewer:
  //   reviewerId đúng (biên valid)
  //   reviewerId + 1 (biên ngoài → ForbiddenException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: submitReview', () => {
    const dto = { assignmentId: 1, score: 7, confidence: ConfidenceLevel.HIGH,
      recommendation: RecommendationType.ACCEPT, commentForAuthor: 'Good' };

    it('[BVA-Status-Accepted-New] assignment ACCEPTED không có review → nộp mới thành công', async () => {
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.ACCEPTED });
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(null); // chưa có review
      reviewRepo.create.mockReturnValue(makeReview());
      reviewRepo.save.mockResolvedValue(makeReview());
      assignmentRepo.save.mockResolvedValue({ ...a, status: AssignmentStatus.COMPLETED });
      await service.submitReview(10, dto);
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('[BVA-DueDate-JustValid] COMPLETED + dueDate=now+1ms (biên Min còn hạn) → cập nhật được', async () => {
      // Biên chính xác BVA: còn hạn 1ms = biên Min on-time valid
      const dueDate = new Date(Date.now() + 1); // +1ms - ngay trên biên valid
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.COMPLETED, dueDate });
      const existing = makeReview();
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(existing);
      reviewRepo.save.mockResolvedValue({ ...existing, score: 8 });
      assignmentRepo.save.mockResolvedValue(a);
      await service.submitReview(10, { ...dto, score: 8 });
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('[BVA-DueDate-JustExpired] COMPLETED + dueDate=now-1ms (biên Max invalid - vừa hết hạn) → BadRequestException', async () => {
      // Biên BVA chính xác: hết hạn chỉ 1ms trước = ngay ngoài biên hợp lệ
      const pastDue = new Date(Date.now() - 1); // -1ms - biên vừa hết hạn
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.COMPLETED, dueDate: pastDue });
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(makeReview());
      await expect(service.submitReview(10, dto)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-DueDate-Null] COMPLETED + dueDate=null (không có deadline) → cập nhật được', async () => {
      // Biên: dueDate=null nghĩa là không có deadline → cập nhật luôn được
      const a = makeAssignment({ reviewerId: 10, status: AssignmentStatus.COMPLETED, dueDate: null });
      const existing = makeReview();
      assignmentRepo.findOne.mockResolvedValue(a);
      reviewRepo.findOne.mockResolvedValue(existing);
      reviewRepo.save.mockResolvedValue({ ...existing, score: 9 });
      assignmentRepo.save.mockResolvedValue(a);
      const r = await service.submitReview(10, { ...dto, score: 9 });
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Reviewer-WrongId] reviewerId ≠ assignment.reviewerId (ngoài biên) → ForbiddenException', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment({ reviewerId: 5 }));
      await expect(service.submitReview(99, dto)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Assignment-NotExist] assignment không tồn tại → NotFoundException', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      await expect(service.submitReview(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-7  getDecisionSummaryBySubmission
  // Input: số lượng reviews (biên quan trọng cho tính toán stats)
  // Biên count:
  //   0 reviews (biên Min) → averageScore=null, min=null, max=null
  //   1 review (biên Min+1) → average=min=max=score của review đó
  //   2 reviews (biên Min+2) → tính được min ≠ max nếu score khác nhau
  //   nhiều reviews (Nominal) → tính đúng avg/min/max
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getDecisionSummaryBySubmission', () => {
    it('[BVA-Reviews-0] 0 reviews (biên Min) → stats.averageScore=null, min=null, max=null', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([]); // 0 reviews = biên Min
      decisionRepo.findOne.mockResolvedValue(null);
      const r = await service.getDecisionSummaryBySubmission('sub-uuid-1');
      expect(r.stats.reviewCount).toBe(0);
      expect(r.stats.averageScore).toBeNull();
      expect(r.stats.minScore).toBeNull();
      expect(r.stats.maxScore).toBeNull();
    });

    it('[BVA-Reviews-1] 1 review (biên Min+1) → average=min=max=score', async () => {
      // Biên: khi chỉ có 1 review → min = max = average = cùng 1 giá trị
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([makeReview({ score: 8 })]);
      decisionRepo.findOne.mockResolvedValue(null);
      const r = await service.getDecisionSummaryBySubmission('sub-uuid-1');
      expect(r.stats.reviewCount).toBe(1);
      expect(r.stats.averageScore).toBe(8);
      expect(r.stats.minScore).toBe(8); // min = max khi chỉ 1 review
      expect(r.stats.maxScore).toBe(8);
    });

    it('[BVA-Reviews-2] 2 reviews với score khác nhau (biên Min+2) → min ≠ max', async () => {
      // Biên: từ 2 review trở đi min và max có thể khác nhau
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([
        makeReview({ score: 4 }),   // min
        makeReview({ id: 2, score: 8 }), // max
      ]);
      decisionRepo.findOne.mockResolvedValue(null);
      const r = await service.getDecisionSummaryBySubmission('sub-uuid-1');
      expect(r.stats.reviewCount).toBe(2);
      expect(r.stats.averageScore).toBe(6); // (4+8)/2
      expect(r.stats.minScore).toBe(4);
      expect(r.stats.maxScore).toBe(8);
    });

    it('[BVA-Reviews-Nominal] 3 reviews (Nominal) → tính đúng avg/min/max', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([
        makeReview({ score: 5 }),
        makeReview({ id: 2, score: 7 }),
        makeReview({ id: 3, score: 9 }),
      ]);
      decisionRepo.findOne.mockResolvedValue(null);
      const r = await service.getDecisionSummaryBySubmission('sub-uuid-1');
      expect(r.stats.reviewCount).toBe(3);
      expect(r.stats.averageScore).toBeCloseTo(7, 1); // (5+7+9)/3
      expect(r.stats.minScore).toBe(5);
      expect(r.stats.maxScore).toBe(9);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-8  upsertDecisionForSubmission
  // Biên tồn tại decision:
  //   decision chưa có (biên 0 → 1, tạo mới)
  //   decision đã có (biên n → n với giá trị mới, upsert)
  // Biên FinalDecision enum:
  //   ACCEPT (biên đầu tiên hợp lệ)
  //   REJECT (biên cuối quan trọng)
  //   BORDERLINE → ACCEPT (chuyển từ biên giữa lên biên trên)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: upsertDecisionForSubmission', () => {
    it('[BVA-Decision-CreateNew] decision chưa tồn tại (biên 0 → tạo mới) → CREATE', async () => {
      decisionRepo.findOne.mockResolvedValue(null); // biên 0: chưa có
      const newDec = { id: 1, submissionId: 'sub-uuid-1', decision: FinalDecision.ACCEPT, decidedBy: 99 };
      decisionRepo.create.mockReturnValue(newDec);
      decisionRepo.save.mockResolvedValue(newDec);
      const r = await service.upsertDecisionForSubmission('sub-uuid-1', 99, FinalDecision.ACCEPT);
      expect(r.decision).toBe(FinalDecision.ACCEPT);
      expect(decisionRepo.create).toHaveBeenCalled();
    });

    it('[BVA-Decision-UpdateExisting] decision đã tồn tại (biên upsert) → UPDATE giá trị mới', async () => {
      // Biên: đã có BORDERLINE → chuyển lên ACCEPT
      const existing = { id: 1, submissionId: 'sub-uuid-1', decision: FinalDecision.BORDERLINE, decidedBy: 99, note: null };
      decisionRepo.findOne.mockResolvedValue(existing);
      decisionRepo.save.mockResolvedValue({ ...existing, decision: FinalDecision.ACCEPT });
      const r = await service.upsertDecisionForSubmission('sub-uuid-1', 99, FinalDecision.ACCEPT);
      expect(r.decision).toBe(FinalDecision.ACCEPT);
      expect(decisionRepo.create).not.toHaveBeenCalled(); // không tạo mới, chỉ update
    });

    it('[BVA-Decision-Reject] tạo decision REJECT (biên cuối của enum) → CREATE REJECT', async () => {
      decisionRepo.findOne.mockResolvedValue(null);
      const newDec = { id: 2, submissionId: 'sub-uuid-2', decision: FinalDecision.REJECT, decidedBy: 99 };
      decisionRepo.create.mockReturnValue(newDec);
      decisionRepo.save.mockResolvedValue(newDec);
      const r = await service.upsertDecisionForSubmission('sub-uuid-2', 99, FinalDecision.REJECT);
      expect(r.decision).toBe(FinalDecision.REJECT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-9  getReviewerActivityStats
  // Input: reviewerId
  // Biên count assignments:
  //   0 assignments (biên Min) → assignmentCount=0, hasActive=false
  //   1 PENDING assignment (biên Min+1) → hasActive=true
  //   1 COMPLETED (biên Min+1 nhưng inactive) → hasActive=false
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getReviewerActivityStats', () => {
    it('[BVA-Assignments-0] 0 assignments (biên Min) → all zeros, hasActive=false', async () => {
      assignmentRepo.find.mockResolvedValue([]); // biên Min = 0
      const r = await service.getReviewerActivityStats(99);
      expect(r.assignmentCount).toBe(0);
      expect(r.reviewCount).toBe(0);
      expect(r.hasActiveAssignments).toBe(false);
    });

    it('[BVA-Assignments-1-Pending] 1 PENDING assignment (biên Min+1) → hasActive=true', async () => {
      // Biên: PENDING = active assignment → hasActive=true
      assignmentRepo.find.mockResolvedValue([makeAssignment({ status: AssignmentStatus.PENDING })]);
      reviewRepo.find.mockResolvedValue([]);
      const r = await service.getReviewerActivityStats(10);
      expect(r.assignmentCount).toBe(1);
      expect(r.hasActiveAssignments).toBe(true);
    });

    it('[BVA-Assignments-1-Completed] 1 COMPLETED assignment (không còn active) → hasActive=false', async () => {
      // Biên: COMPLETED không phải PENDING/ACCEPTED → hasActive=false
      assignmentRepo.find.mockResolvedValue([makeAssignment({ status: AssignmentStatus.COMPLETED })]);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      const r = await service.getReviewerActivityStats(10);
      expect(r.assignmentCount).toBe(1);
      expect(r.hasActiveAssignments).toBe(false);
    });

    it('[BVA-Assignments-Nominal] 2 assignments (ACCEPTED + COMPLETED) → thống kê đúng', async () => {
      const assignments = [
        makeAssignment({ status: AssignmentStatus.ACCEPTED }),
        makeAssignment({ id: 2, status: AssignmentStatus.COMPLETED }),
      ];
      assignmentRepo.find.mockResolvedValue(assignments);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      const r = await service.getReviewerActivityStats(10);
      expect(r.assignmentCount).toBe(2);
      expect(r.reviewCount).toBe(1);
      expect(r.hasActiveAssignments).toBe(true); // ACCEPTED = active
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-10  getSubmissionsForReviewer
  // Biên acceptedTracks:
  //   0 ACCEPTED tracks (biên Min) → trả []
  //   1 ACCEPTED track (biên Min+1) → lấy submissions từ track đó
  //   tất cả tracks PENDING (biên 0 accepted) → trả []
  // Biên exception:
  //   conference client lỗi → trả [] (graceful degradation biên)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getSubmissionsForReviewer', () => {
    it('[BVA-AcceptedTracks-0] không có ACCEPTED track nào (biên Min) → trả []', async () => {
      confClient.getMyTrackAssignments.mockResolvedValue([]); // 0 tracks
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r).toEqual([]);
    });

    it('[BVA-AcceptedTracks-AllPending] tất cả tracks là PENDING (biên 0 accepted) → trả []', async () => {
      // Biên: có tracks nhưng không có track ACCEPTED nào
      confClient.getMyTrackAssignments.mockResolvedValue([
        { trackId: 1, status: 'PENDING' },
        { trackId: 2, status: 'PENDING' },
      ]);
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r).toEqual([]);
    });

    it('[BVA-AcceptedTracks-1] đúng 1 ACCEPTED track (biên Min+1) → lấy submissions từ track đó', async () => {
      confClient.getMyTrackAssignments.mockResolvedValue([
        { trackId: 1, status: 'ACCEPTED' },
      ]);
      submClient.getSubmissionsByTrack.mockResolvedValue([
        { id: 'sub-1', status: 'SUBMITTED' },
        { id: 'sub-2', status: 'UNDER_REVIEW' },
      ]);
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r.length).toBeGreaterThan(0);
    });

    it('[BVA-Exception-Graceful] conference client lỗi (exception biên) → trả [] không throw', async () => {
      // Biên: service lỗi phải được xử lý gracefully (không propagate exception)
      confClient.getMyTrackAssignments.mockRejectedValue(new Error('Service unavailable'));
      const r = await service.getSubmissionsForReviewer(10, 'token-abc');
      expect(r).toEqual([]); // graceful degradation
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-11  getReviewsBySubmission / checkReviewerAssignment
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getReviewsBySubmission', () => {
    it('[BVA-Assignments-0] submission không có assignment nào (biên Min) → trả []', async () => {
      assignmentRepo.find.mockResolvedValue([]); // 0 assignments = biên
      const r = await service.getReviewsBySubmission('sub-uuid-new');
      expect(r).toEqual([]);
    });

    it('[BVA-Reviews-Exist] có assignments và reviews → trả danh sách', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment()]);
      reviewRepo.find.mockResolvedValue([makeReview()]);
      identityClient.getUsersByIds.mockResolvedValue(new Map());
      const r = await service.getReviewsBySubmission('sub-uuid-1');
      expect(r).toHaveLength(1);
    });
  });

  describe('BVA: checkReviewerAssignment', () => {
    it('[BVA-Assignment-Exist] có assignment → trả true', async () => {
      assignmentRepo.findOne.mockResolvedValue(makeAssignment());
      expect(await service.checkReviewerAssignment(10, 'sub-uuid-1')).toBe(true);
    });

    it('[BVA-Assignment-NotExist] không có assignment (biên ngoài) → trả false', async () => {
      // Biên: null = không có record = ngoài biên hợp lệ
      assignmentRepo.findOne.mockResolvedValue(null);
      expect(await service.checkReviewerAssignment(10, 'sub-uuid-no-match')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-12  getBidsBySubmission / getDiscussionsBySubmission
  // Biên count: 0 (Min), 1 (Min+1)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getBidsBySubmission', () => {
    it('[BVA-Count-0] 0 bids (biên Min) → trả []', async () => {
      prefRepo.find.mockResolvedValue([]);
      expect(await service.getBidsBySubmission('sub-uuid-new')).toEqual([]);
    });

    it('[BVA-Count-1] 1 bid (biên Min+1) → trả [1 phần tử]', async () => {
      prefRepo.find.mockResolvedValue([
        { id: 1, reviewerId: 10, submissionId: 'sub-uuid-1', preference: PreferenceType.INTERESTED },
      ]);
      const r = await service.getBidsBySubmission('sub-uuid-1');
      expect(r).toHaveLength(1);
    });
  });

  describe('BVA: getDiscussionsBySubmission', () => {
    it('[BVA-Count-0] 0 discussions (biên Min) → trả []', async () => {
      const discRepo = (service as any).pcDiscussionRepository;
      discRepo.find.mockResolvedValue([]);
      expect(await service.getDiscussionsBySubmission('sub-uuid-new')).toEqual([]);
    });

    it('[BVA-Count-1] 1 discussion (biên Min+1) → trả [1 phần tử]', async () => {
      const discRepo = (service as any).pcDiscussionRepository;
      discRepo.find.mockResolvedValue([{ id: 1, submissionId: 'sub-uuid-1', content: 'Interesting' }]);
      const r = await service.getDiscussionsBySubmission('sub-uuid-1');
      expect(r).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-13  getSubmissionProgress / getConferenceProgress
  // Biên assignment counts (0 vs có)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getSubmissionProgress', () => {
    it('[BVA-NoAssignments] 0 assignments (biên Min) → totalAssignments=0, lastReviewAt=null', async () => {
      assignmentRepo.find.mockResolvedValue([]); // biên Min
      reviewRepo.find.mockResolvedValue([]);
      identityClient.getUsersByIds.mockResolvedValue(new Map());
      const r = await service.getSubmissionProgress('sub-uuid-empty');
      expect(r.totalAssignments).toBe(0);
      expect(r.lastReviewAt).toBeNull();
    });

    it('[BVA-OneCompleted-OneP] 1 COMPLETED + 1 PENDING (biên thống kê hỗn hợp)', async () => {
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
    });
  });

  describe('BVA: getConferenceProgress', () => {
    it('[BVA-NoAssignments] 0 assignments (biên Min) → tất cả = 0', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const r = await service.getConferenceProgress(99);
      expect(r.totalAssignments).toBe(0);
      expect(r.reviewsSubmitted).toBe(0);
    });

    it('[BVA-HasAssignments] có assignments (Nominal) → thống kê đúng', async () => {
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
  });
});
