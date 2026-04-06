/**
 * Unit Tests – ConferencesService
 * Class: ConferencesService
 * File: apps/conference-service/src/conferences/conferences.service.ts
 * Methodology: Boundary Value Analysis (BVA)
 *
 * BVA Coverage Plan:
 * ┌──────────────────────────────────┬────────────────────────────────────────────────────────────┐
 * │ Function                         │ Biên được kiểm thử                                         │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ createConference                 │ startDate vs endDate:                                      │
 * │                                  │   startDate < endDate (valid, Nominal)                     │
 * │                                  │   startDate = endDate (biên invalid - same day)            │
 * │                                  │   startDate > endDate (ngoài biên)                         │
 * │                                  │   Ngày bắt đầu 1 ngày trước ngày kết thúc (Min+1)         │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ setCfpSettings                   │ submissionDeadline vs reviewDeadline:                      │
 * │                                  │   bằng nhau (biên equal = valid)                           │
 * │                                  │   submission < review (Nominal valid)                      │
 * │                                  │   submission > review (biên invalid)                       │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ acceptTrackAssignment            │ Status boundary:                                           │
 * │                                  │   PENDING → ACCEPTED (biên valid)                         │
 * │                                  │   ACCEPTED → ACCEPTED (biên invalid/redundant)             │
 * │                                  │   REJECTED → ACCEPTED (biên invalid/already-decided)      │
 * │                                  │   member không tồn tại (ngoài biên)                        │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ rejectTrackAssignment            │ Status boundary tương tự acceptTrack                       │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ getMyTrackAssignments            │ Track active/deleted boundary:                              │
 * │                                  │   track.isActive=true + deletedAt=null (biên valid)       │
 * │                                  │   track.isActive=false (biên invalid)                      │
 * │                                  │   conference.isActive=false (biên invalid)                 │
 * │                                  │   0 assignments (biên Min)                                 │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ checkReviewerTrackAssignment     │ track.deletedAt=null + isActive=true (valid biên)          │
 * │                                  │ track.deletedAt có giá trị (biên invalid)                  │
 * ├──────────────────────────────────┼────────────────────────────────────────────────────────────┤
 * │ ensureCanManageConference        │ Role boundary: ADMIN/CHAIR (bypass), AUTHOR (phải check)  │
 * │ deleteTrack                      │ submissions=0 (biên Min valid), submissions>0 (invalid)   │
 * │ addTrackMember                   │ member chưa có (valid), member đã có (biên duplicate)     │
 * └──────────────────────────────────┴────────────────────────────────────────────────────────────┘
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConferencesService } from './conferences.service';
import { Conference } from './entities/conference.entity';
import { Track } from './entities/track.entity';
import { ConferenceMember, ConferenceMemberRole } from './entities/conference-member.entity';
import { TrackMember } from './entities/track-member.entity';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';
import { EmailService } from '../common/services/email.service';
import { IdentityClientService } from '../integrations/identity-client.service';
import { SubmissionClientService } from '../integrations/submission-client.service';
import { ReviewClientService } from '../integrations/review-client.service';

// ─── Mock Factory ──────────────────────────────────────────────────────────────
const mockRepo = () => ({
  find: jest.fn(), findOne: jest.fn(),
  save: jest.fn(), create: jest.fn(), remove: jest.fn(),
});

// ─── Data Helpers ───────────────────────────────────────────────────────────────
const makeConf = (o: Partial<Conference> = {}): Conference =>
  ({ id: 1, name: 'ICAI 2026', startDate: new Date('2026-05-01'), endDate: new Date('2026-05-03'),
     venue: 'Hanoi', organizerId: 99, isActive: true, deletedAt: null,
     tracks: [], members: [], ...o }) as Conference;

const makeTrack = (o: Partial<Track> = {}): Track =>
  ({ id: 1, name: 'AI Track', conferenceId: 1, isActive: true, deletedAt: null, ...o }) as Track;

const ADMIN  = { id: 1,  roles: ['ADMIN'] };
const CHAIR  = { id: 99, roles: ['CHAIR'] };
const AUTHOR = { id: 5,  roles: ['AUTHOR'] };

// ─── Test Suite ─────────────────────────────────────────────────────────────────
describe('ConferencesService', () => {
  let service: ConferencesService;
  let confRepo:   ReturnType<typeof mockRepo>;
  let trackRepo:  ReturnType<typeof mockRepo>;
  let memberRepo: ReturnType<typeof mockRepo>;
  let trackMemberRepo: ReturnType<typeof mockRepo>;
  let cfpRepo:    ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConferencesService,
        { provide: getRepositoryToken(Conference),       useFactory: mockRepo },
        { provide: getRepositoryToken(Track),            useFactory: mockRepo },
        { provide: getRepositoryToken(ConferenceMember), useFactory: mockRepo },
        { provide: getRepositoryToken(TrackMember),      useFactory: mockRepo },
        { provide: getRepositoryToken(CfpSetting),       useFactory: mockRepo },
        { provide: EmailService,           useValue: { sendTrackAssignmentEmail: jest.fn() } },
        { provide: IdentityClientService,  useValue: { getUserById: jest.fn() } },
        { provide: SubmissionClientService,useValue: { getSubmissionIdsByTrack: jest.fn() } },
        { provide: ReviewClientService,    useValue: { hasUserReviewedSubmissions: jest.fn() } },
      ],
    }).compile();

    service          = module.get<ConferencesService>(ConferencesService);
    confRepo         = module.get(getRepositoryToken(Conference));
    trackRepo        = module.get(getRepositoryToken(Track));
    memberRepo       = module.get(getRepositoryToken(ConferenceMember));
    trackMemberRepo  = module.get(getRepositoryToken(TrackMember));
    cfpRepo          = module.get(getRepositoryToken(CfpSetting));
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-1  createConference
  // Input: startDate, endDate (Date strings)
  // Biên quan trọng nhất: startDate vs endDate
  //   startDate + 1 ngày = endDate (Min separation - biên Min hợp lệ)
  //   startDate = endDate (biên bằng nhau - ngay tại biên invalid)
  //   startDate + 1 ngày > endDate (ngoài biên - invalid)
  //   startDate hoàn toàn trước endDate (Nominal)
  //   Date string không hợp lệ (ngoài biên kiểu dữ liệu)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: createConference', () => {
    const base = { name: 'ICAI 2026', venue: 'HCM' };

    it('[BVA-Date-OneDayApart] startDate + 1 ngày = endDate (biên Min hợp lệ nhỏ nhất) → thành công', async () => {
      // Biên Min: khoảng cách tối thiểu hợp lệ = 1 ngày
      const saved = makeConf({ name: base.name });
      confRepo.create.mockReturnValue(saved);
      confRepo.save.mockResolvedValue(saved);
      memberRepo.create.mockReturnValue({});
      memberRepo.save.mockResolvedValue({});
      const r = await service.createConference({
        ...base, startDate: '2026-06-01', endDate: '2026-06-02',  // cách 1 ngày đúng
      } as any, 99);
      expect(r.name).toBe('ICAI 2026');
    });

    it('[BVA-Date-Equal] startDate = endDate (biên equal - ngay tại biên invalid) → BadRequestException', async () => {
      // Điểm biên chính xác BVA: startDate >= endDate → invalid
      await expect(
        service.createConference({ ...base, startDate: '2026-06-03', endDate: '2026-06-03' } as any, 99),
      ).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Date-StartAfterEnd] startDate > endDate (ngoài biên - startDate 1 ngày sau endDate) → BadRequestException', async () => {
      // Ngoài biên: startDate vượt qua endDate 1 ngày
      await expect(
        service.createConference({ ...base, startDate: '2026-06-04', endDate: '2026-06-03' } as any, 99),
      ).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Date-Nominal] startDate nhiều ngày trước endDate (Nominal) → thành công', async () => {
      const saved = makeConf();
      confRepo.create.mockReturnValue(saved);
      confRepo.save.mockResolvedValue(saved);
      memberRepo.create.mockReturnValue({});
      memberRepo.save.mockResolvedValue({});
      const r = await service.createConference({
        ...base, startDate: '2026-06-01', endDate: '2026-06-10',
      } as any, 99);
      expect(confRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Date-Invalid-String] startDate là chuỗi không hợp lệ → BadRequestException', async () => {
      // Ngoài biên kiểu dữ liệu: string không parse được thành Date
      await expect(
        service.createConference({ ...base, startDate: 'not-a-date', endDate: '2026-06-03' } as any, 99),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-2  findOne / findAll
  // Biên:
  //   id tồn tại (biên valid) → trả về conference
  //   id không tồn tại (biên invalid) → NotFoundException
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: findOne', () => {
    it('[BVA-Id-Exist] id hợp lệ tồn tại → trả về conference', async () => {
      confRepo.findOne.mockResolvedValue(makeConf({ id: 1 }));
      const r = await service.findOne(1);
      expect(r.id).toBe(1);
    });

    it('[BVA-Id-Min] id = 1 (biên Min nhỏ nhất hợp lệ) → trả về conference', async () => {
      confRepo.findOne.mockResolvedValue(makeConf({ id: 1 }));
      const r = await service.findOne(1);
      expect(r.id).toBe(1);
    });

    it('[BVA-Id-NotExist] id không tồn tại (biên ngoài) → NotFoundException', async () => {
      confRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-3  setCfpSettings
  // Biên thứ tự các deadline:
  //   submissionDeadline = reviewDeadline (biên equal = valid nhờ <=)
  //   submissionDeadline < reviewDeadline (1 ngày trước - biên Min hợp lệ)
  //   submissionDeadline > reviewDeadline (biên invalid - 1 ngày sau)
  //   reviewDeadline = notificationDate (biên equal = valid)
  //   chuỗi ngày không hợp lệ (ngoài biên kiểu dữ liệu)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: setCfpSettings', () => {
    const base = {
      submissionDeadline: '2026-03-01',
      reviewDeadline:     '2026-04-01',
      notificationDate:   '2026-04-15',
      cameraReadyDeadline:'2026-05-01',
    };

    it('[BVA-Deadline-Equal] submissionDeadline = reviewDeadline (biên equal valid) → thành công', async () => {
      // <=  là điều kiện → bằng nhau là biên hợp lệ (biên Max của submission)
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue(null); // ADMIN bypass
      cfpRepo.findOne.mockResolvedValue(null);
      cfpRepo.create.mockReturnValue({});
      cfpRepo.save.mockResolvedValue({});
      const equalDto = { ...base, reviewDeadline: '2026-03-01' }; // bằng submissionDeadline
      await expect(service.setCfpSettings(1, equalDto as any, ADMIN)).resolves.toBeDefined();
    });

    it('[BVA-Deadline-OneDayBefore] submission 1 ngày trước review (biên Min hợp lệ riêng biệt) → thành công', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      cfpRepo.findOne.mockResolvedValue(null);
      cfpRepo.create.mockReturnValue({});
      cfpRepo.save.mockResolvedValue({});
      const dto = { ...base, submissionDeadline: '2026-03-31', reviewDeadline: '2026-04-01' }; // 1 ngày
      await expect(service.setCfpSettings(1, dto as any, ADMIN)).resolves.toBeDefined();
    });

    it('[BVA-Deadline-Invalid] reviewDeadline < submissionDeadline (ngoài biên ngay 1 ngày) → BadRequestException', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      // review 1 ngày trước submission là ngay vượt biên
      await expect(
        service.setCfpSettings(1, { ...base, reviewDeadline: '2026-02-28' } as any, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Deadline-CameraReady-Less-Notification] cameraReady < notification → BadRequestException', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      // notification > cameraReady là invalid
      await expect(
        service.setCfpSettings(1, {
          ...base,
          notificationDate: '2026-05-15',    // sau cameraReadyDeadline
          cameraReadyDeadline: '2026-05-01', // 2 tuần trước notification
        } as any, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-4  acceptTrackAssignment
  // Input: status (PENDING / ACCEPTED / REJECTED)
  // Biên status:
  //   PENDING → ACCEPTED (biên hợp lệ: trạng thái ban đầu → trạng thái chuyển)
  //   ACCEPTED → ACCEPTED (biên đã qua → BadRequestException)
  //   REJECTED → ACCEPTED (biên đã finalized → BadRequestException)
  // Biên member:
  //   member tồn tại (biên valid)
  //   member không tồn tại (biên ngoài → NotFoundException)
  // Biên track:
  //   track.isActive=true + deletedAt=null (biên valid)
  //   track.isActive=false (biên track đã xóa → NotFoundException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: acceptTrackAssignment', () => {
    it('[BVA-Status-Pending-to-Accepted] PENDING → ACCEPTED (biên valid - trạng thái đúng cần chuyển)', async () => {
      const member = { trackId: 1, userId: 5, status: 'PENDING',
                       track: { deletedAt: null, isActive: true } };
      trackMemberRepo.findOne.mockResolvedValue(member);
      trackMemberRepo.save.mockResolvedValue({ ...member, status: 'ACCEPTED' });
      const r = await service.acceptTrackAssignment(1, 5);
      expect(trackMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACCEPTED' }),
      );
    });

    it('[BVA-Status-Already-Accepted] ACCEPTED → ACCEPTED (biên đã qua) → BadRequestException', async () => {
      // Biên: đã ở trạng thái ACCEPTED → không thể accept lại
      trackMemberRepo.findOne.mockResolvedValue({
        trackId: 1, userId: 5, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: true },
      });
      await expect(service.acceptTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Status-Rejected-to-Accepted] REJECTED → ACCEPTED (biên đã finalized) → BadRequestException', async () => {
      // Biên: một khi REJECTED không thể quay lại ACCEPTED
      trackMemberRepo.findOne.mockResolvedValue({
        trackId: 1, userId: 5, status: 'REJECTED',
        track: { deletedAt: null, isActive: true },
      });
      await expect(service.acceptTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Member-NotExist] member không tồn tại (biên ngoài) → NotFoundException', async () => {
      trackMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptTrackAssignment(999, 5)).rejects.toThrow(NotFoundException);
    });

    it('[BVA-Track-Deleted] track.isActive=false (biên track đã xóa) → NotFoundException', async () => {
      // Biên: track không còn active → không thể accept assignment
      trackMemberRepo.findOne.mockResolvedValue({
        trackId: 1, userId: 5, status: 'PENDING',
        track: { deletedAt: new Date(), isActive: false }, // đã xóa
      });
      await expect(service.acceptTrackAssignment(1, 5)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-5  rejectTrackAssignment
  // Tương tự acceptTrack, chỉ đảo ngược logic biên
  // Biên:
  //   PENDING → REJECTED (biên valid)
  //   REJECTED → REJECTED (biên đã finalized → BadRequestException)
  //   ACCEPTED → REJECTED (biên đã ACCEPTED → BadRequestException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: rejectTrackAssignment', () => {
    it('[BVA-Status-Pending-to-Rejected] PENDING → REJECTED (biên valid)', async () => {
      const member = { trackId: 1, userId: 5, status: 'PENDING',
                       track: { deletedAt: null, isActive: true } };
      trackMemberRepo.findOne.mockResolvedValue(member);
      trackMemberRepo.save.mockResolvedValue({ ...member, status: 'REJECTED' });
      await service.rejectTrackAssignment(1, 5);
      expect(trackMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'REJECTED' }),
      );
    });

    it('[BVA-Status-Already-Rejected] REJECTED → REJECTED (biên đã finalized) → BadRequestException', async () => {
      trackMemberRepo.findOne.mockResolvedValue({
        trackId: 1, userId: 5, status: 'REJECTED',
        track: { deletedAt: null, isActive: true },
      });
      await expect(service.rejectTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Status-Accepted-to-Rejected] ACCEPTED → REJECTED (không thể hoàn tác) → BadRequestException', async () => {
      // Biên: đã ACCEPTED không thể reject
      trackMemberRepo.findOne.mockResolvedValue({
        trackId: 1, userId: 5, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: true },
      });
      await expect(service.rejectTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Member-NotExist] member không tồn tại → NotFoundException', async () => {
      trackMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.rejectTrackAssignment(999, 5)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-6  ensureCanManageConference
  // Biên role:
  //   ADMIN (biên cao nhất - bypass mọi check)
  //   CHAIR (tương đương ADMIN - bypass)
  //   AUTHOR + có membership (biên thấp valid)
  //   AUTHOR + không có membership (biên ngoài → ForbiddenException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: ensureCanManageConference', () => {
    it('[BVA-Role-Admin] ADMIN (biên cao nhất - bypass) → không check membership', async () => {
      await expect(service.ensureCanManageConference(1, ADMIN)).resolves.toBeUndefined();
      expect(memberRepo.findOne).not.toHaveBeenCalled(); // bypass = không gọi DB
    });

    it('[BVA-Role-Chair] CHAIR (biên bypass tương đương ADMIN) → không check membership', async () => {
      await expect(service.ensureCanManageConference(1, CHAIR)).resolves.toBeUndefined();
      expect(memberRepo.findOne).not.toHaveBeenCalled();
    });

    it('[BVA-Role-Author-NoMembership] AUTHOR không có membership (biên ngoài) → ForbiddenException', async () => {
      // Biên: AUTHOR phải check membership; null = không có = ngoài biên
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.ensureCanManageConference(1, AUTHOR)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-7  getMyTrackAssignments
  // Biên filter active:
  //   track.isActive=true + track.deletedAt=null (biên valid - được lấy)
  //   track.isActive=false (biên invalid - bị lọc ra)
  //   conference.isActive=false (biên invalid - bị lọc ra)
  //   track.deletedAt ≠ null (biên invalid - bị lọc ra)
  // Biên count:
  //   0 assignments (biên Min)
  //   1 assignment active (biên Min+1)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: getMyTrackAssignments', () => {
    it('[BVA-Track-ActiveValid] track active + deletedAt=null (biên valid) → trả về assignment', async () => {
      trackMemberRepo.find.mockResolvedValue([{
        id: 1, userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: true,
                 conference: { deletedAt: null, isActive: true } },
      }]);
      const r = await service.getMyTrackAssignments(10);
      expect(r).toHaveLength(1);
    });

    it('[BVA-Track-Inactive] track.isActive=false (biên invalid - track không còn active) → bị lọc ra', async () => {
      // Điểm biên: isActive false là ngay ngoài biên hợp lệ
      trackMemberRepo.find.mockResolvedValue([{
        id: 1, userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: false,  // isActive=false là biên invalid
                 conference: { deletedAt: null, isActive: true } },
      }]);
      const r = await service.getMyTrackAssignments(10);
      expect(r).toEqual([]); // bị filter ra
    });

    it('[BVA-Track-Deleted] track.deletedAt ≠ null (biên deleted) → bị lọc ra', async () => {
      trackMemberRepo.find.mockResolvedValue([{
        id: 1, userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: new Date(), isActive: false, // deletedAt có giá trị
                 conference: { deletedAt: null, isActive: true } },
      }]);
      const r = await service.getMyTrackAssignments(10);
      expect(r).toEqual([]);
    });

    it('[BVA-Conference-Inactive] conference.isActive=false (biên conf không active) → bị lọc ra', async () => {
      trackMemberRepo.find.mockResolvedValue([{
        id: 1, userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: true,
                 conference: { deletedAt: null, isActive: false } }, // conf inactive
      }]);
      const r = await service.getMyTrackAssignments(10);
      expect(r).toEqual([]);
    });

    it('[BVA-Count-0] userId không có assignment nào (biên Min = 0) → trả []', async () => {
      trackMemberRepo.find.mockResolvedValue([]);
      const r = await service.getMyTrackAssignments(99);
      expect(r).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-8  checkReviewerTrackAssignment
  // Biên track state:
  //   ACCEPTED + track active + deletedAt=null (biên valid → hasAccepted=true)
  //   ACCEPTED + track.deletedAt ≠ null (biên invalid → hasAccepted=false)
  //   ACCEPTED + track.isActive=false (biên invalid → hasAccepted=false)
  //   member không tồn tại (biên ngoài → hasAccepted=false)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: checkReviewerTrackAssignment', () => {
    it('[BVA-Track-Active-Valid] ACCEPTED + track active (biên valid) → hasAccepted=true', async () => {
      trackMemberRepo.findOne.mockResolvedValue({
        userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: true }, // điều kiện biên: cả 2 phải thỏa
      });
      const r = await service.checkReviewerTrackAssignment(10, 1);
      expect(r.hasAccepted).toBe(true);
    });

    it('[BVA-Track-Deleted] ACCEPTED + track.deletedAt ≠ null (biên ngoài) → hasAccepted=false', async () => {
      // Biên: khi deletedAt có giá trị → ngay ngoài biên valid
      trackMemberRepo.findOne.mockResolvedValue({
        userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: new Date(), isActive: false }, // biên xóa
      });
      const r = await service.checkReviewerTrackAssignment(10, 1);
      expect(r.hasAccepted).toBe(false);
    });

    it('[BVA-Member-NotExist] member không tồn tại → hasAccepted=false', async () => {
      trackMemberRepo.findOne.mockResolvedValue(null);
      const r = await service.checkReviewerTrackAssignment(10, 999);
      expect(r.hasAccepted).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-9  deleteTrack
  // Biên submissions:
  //   0 submissions (biên Min = 0) → được phép xóa
  //   1 submission (biên Min+1) → không được xóa (BadRequestException)
  //   track không tồn tại (biên ngoài → NotFoundException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: deleteTrack', () => {
    it('[BVA-Submissions-0] 0 submissions (biên Min valid) → xóa track thành công', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(makeTrack());
      trackRepo.save.mockResolvedValue(makeTrack({ isActive: false, deletedAt: new Date() }));
      const submClient = (service as any).submissionClient;
      submClient.getSubmissionIdsByTrack.mockResolvedValue([]); // 0 submissions = biên Min
      await expect(service.deleteTrack(1, 1, CHAIR, 'token')).resolves.toBeUndefined();
      expect(trackRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Submissions-1] 1 submission (biên Min+1 invalid) → BadRequestException', async () => {
      // Biên: 1 submission là ngay vượt qua biên 0 hợp lệ
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(makeTrack());
      const submClient = (service as any).submissionClient;
      submClient.getSubmissionIdsByTrack.mockResolvedValue(['sub-1']); // 1 submission
      await expect(service.deleteTrack(1, 1, CHAIR, 'token')).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Submissions-Many] nhiều submissions (Nominal invalid) → BadRequestException', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(makeTrack());
      const submClient = (service as any).submissionClient;
      submClient.getSubmissionIdsByTrack.mockResolvedValue(['sub-1', 'sub-2', 'sub-3']);
      await expect(service.deleteTrack(1, 1, CHAIR, 'token')).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Track-NotExist] track không tồn tại (biên ngoài) → NotFoundException', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteTrack(1, 999, CHAIR)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-10  addTrackMember
  // Biên membership:
  //   member chưa tồn tại (biên valid - được thêm)
  //   member đã tồn tại (biên duplicate invalid - BadRequestException)
  //   track không tồn tại (biên ngoài → NotFoundException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: addTrackMember', () => {
    it('[BVA-Member-NotExist] member chưa là thành viên (biên valid Min) → thêm thành công', async () => {
      trackRepo.findOne.mockResolvedValue(makeTrack({ conference: makeConf() as any }));
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackMemberRepo.findOne.mockResolvedValue(null); // chưa là member = biên valid
      const newMember = { id: 1, trackId: 1, userId: 20 };
      trackMemberRepo.create.mockReturnValue(newMember);
      trackMemberRepo.save.mockResolvedValue(newMember);
      const r = await service.addTrackMember(1, { userId: 20 } as any, CHAIR);
      expect(trackMemberRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Member-Duplicate] member đã tồn tại (biên duplicate - ngay vượt qua) → BadRequestException', async () => {
      // Biên: member đã có = ngoài biên valid của thêm mới
      trackRepo.findOne.mockResolvedValue(makeTrack({ conference: makeConf() as any }));
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackMemberRepo.findOne.mockResolvedValue({ id: 1, userId: 20 }); // đã là member
      await expect(service.addTrackMember(1, { userId: 20 } as any, CHAIR)).rejects.toThrow(BadRequestException);
    });

    it('[BVA-Track-NotExist] track không tồn tại (biên ngoài) → NotFoundException', async () => {
      trackRepo.findOne.mockResolvedValue(null);
      await expect(service.addTrackMember(999, { userId: 20 } as any, CHAIR)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BVA-11  updateConference / deleteConference
  // Biên quyền:
  //   ADMIN → được phép (bypass)
  //   AUTHOR → không có quyền → ForbiddenException
  // Biên conference tồn tại:
  //   id tồn tại (biên valid)
  //   id không tồn tại (biên ngoài → NotFoundException)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BVA: updateConference', () => {
    it('[BVA-Role-Admin] ADMIN cập nhật → được phép (bypass authorization)', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      confRepo.save.mockResolvedValue(makeConf({ name: 'Updated' }));
      await service.updateConference(1, { name: 'Updated' } as any, ADMIN);
      expect(confRepo.save).toHaveBeenCalled();
    });

    it('[BVA-Role-Author-NoAccess] AUTHOR không có quyền (biên ngoài role) → ForbiddenException', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.updateConference(1, {} as any, AUTHOR)).rejects.toThrow(ForbiddenException);
    });

    it('[BVA-Conf-NotExist] ADMIN cập nhật id không tồn tại → NotFoundException', async () => {
      confRepo.findOne.mockResolvedValue(null);
      await expect(service.updateConference(999, {} as any, ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('BVA: deleteConference', () => {
    it('[BVA-Role-Admin] ADMIN xóa hội nghị → thành công (isActive = false)', async () => {
      const conf = makeConf();
      confRepo.findOne.mockResolvedValue(conf);
      confRepo.save.mockResolvedValue({ ...conf, isActive: false, deletedAt: new Date() });
      await service.deleteConference(1, ADMIN);
      expect(confRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('[BVA-Role-Author] AUTHOR không có quyền xóa → ForbiddenException', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteConference(1, AUTHOR)).rejects.toThrow(ForbiddenException);
    });
  });
});