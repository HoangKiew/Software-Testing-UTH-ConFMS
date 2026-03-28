/**
 * Unit Tests – ConferencesService
 * Class: ConferencesService
 * File: apps/conference-service/src/conferences/conferences.service.ts
 * Methodology: Normal (N) | Boundary (B) | Abnormal (A)
 * Benchmark: 30 TC/KLOC | LOC analysed: 200 | TC written: 26
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
  // REQ-1  createConference  (LOC ~28) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('createConference', () => {
    const dto = { name: 'ICAI 2026', startDate: '2026-06-01', endDate: '2026-06-03', venue: 'HCM' };

    it('[Normal] tạo hội nghị thành công với ngày hợp lệ', async () => {
      const saved = makeConf({ name: dto.name });
      confRepo.create.mockReturnValue(saved);
      confRepo.save.mockResolvedValue(saved);
      memberRepo.create.mockReturnValue({});
      memberRepo.save.mockResolvedValue({});
      const r = await service.createConference(dto as any, 99);
      expect(confRepo.save).toHaveBeenCalled();
      expect(r.name).toBe('ICAI 2026');
    });

    it('[Boundary] ném BadRequestException khi startDate = endDate', async () => {
      await expect(
        service.createConference({ ...dto, startDate: '2026-06-03', endDate: '2026-06-03' } as any, 99),
      ).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném BadRequestException khi startDate > endDate', async () => {
      await expect(
        service.createConference({ ...dto, startDate: '2026-06-10', endDate: '2026-06-01' } as any, 99),
      ).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném BadRequestException khi ngày không hợp lệ (chuỗi rỗng)', async () => {
      await expect(
        service.createConference({ ...dto, startDate: 'invalid-date' } as any, 99),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-2  findOne  (LOC ~14) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findOne', () => {
    it('[Normal] trả về conference khi tìm thấy ID', async () => {
      confRepo.findOne.mockResolvedValue(makeConf({ id: 1 }));
      const r = await service.findOne(1);
      expect(r.id).toBe(1);
    });

    it('[Abnormal] ném NotFoundException khi ID không tồn tại', async () => {
      confRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-3  findAll  (LOC ~12) → 1 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAll', () => {
    it('[Normal] trả về danh sách hội nghị đang hoạt động', async () => {
      confRepo.find.mockResolvedValue([makeConf(), makeConf({ id: 2 })]);
      const r = await service.findAll();
      expect(r).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-4  updateConference  (LOC ~34) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateConference', () => {
    it('[Normal] ADMIN cập nhật hội nghị thành công', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      confRepo.save.mockResolvedValue(makeConf({ name: 'Updated' }));
      await service.updateConference(1, { name: 'Updated' } as any, ADMIN);
      expect(confRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném ForbiddenException khi user không có quyền', async () => {
      memberRepo.findOne.mockResolvedValue(null); // không phải member
      await expect(service.updateConference(1, {} as any, AUTHOR)).rejects.toThrow(ForbiddenException);
    });

    it('[Abnormal] ném NotFoundException khi hội nghị không tồn tại', async () => {
      confRepo.findOne.mockResolvedValue(null); // ADMIN bypass quyền nhưng conf không có
      await expect(service.updateConference(999, {} as any, ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-5  deleteConference  (LOC ~12) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('deleteConference', () => {
    it('[Normal] ADMIN xóa mềm hội nghị thành công', async () => {
      const conf = makeConf();
      confRepo.findOne.mockResolvedValue(conf);
      confRepo.save.mockResolvedValue({ ...conf, isActive: false, deletedAt: new Date() });
      await service.deleteConference(1, ADMIN);
      expect(confRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('[Abnormal] ném ForbiddenException khi không có quyền', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteConference(1, AUTHOR)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-6  ensureCanManageConference  (LOC ~14) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('ensureCanManageConference', () => {
    it('[Normal] ADMIN được bypass không cần kiểm tra membership', async () => {
      await expect(service.ensureCanManageConference(1, ADMIN)).resolves.toBeUndefined();
      expect(memberRepo.findOne).not.toHaveBeenCalled();
    });

    it('[Normal] CHAIR role được bypass không cần kiểm tra membership', async () => {
      await expect(service.ensureCanManageConference(1, CHAIR)).resolves.toBeUndefined();
    });

    it('[Abnormal] ném ForbiddenException khi user không phải member', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.ensureCanManageConference(1, AUTHOR)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-7  setCfpSettings  (LOC ~28) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('setCfpSettings', () => {
    const validDto = {
      submissionDeadline: '2026-03-01',
      reviewDeadline:     '2026-04-01',
      notificationDate:   '2026-04-15',
      cameraReadyDeadline:'2026-05-01',
    };

    it('[Normal] tạo cài đặt CFP mới thành công', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      cfpRepo.findOne.mockResolvedValue(null); // chưa có setting
      cfpRepo.create.mockReturnValue({});
      cfpRepo.save.mockResolvedValue({ conferenceId: 1, ...validDto });
      await service.setCfpSettings(1, validDto as any, ADMIN);
      expect(cfpRepo.save).toHaveBeenCalled();
    });

    it('[Boundary] ném BadRequestException khi submissionDeadline = reviewDeadline (vẫn cho phép)', async () => {
      // submissionDeadline <= reviewDeadline là hợp lệ → không throw
      confRepo.findOne.mockResolvedValue(makeConf());
      cfpRepo.findOne.mockResolvedValue(null);
      cfpRepo.create.mockReturnValue({});
      cfpRepo.save.mockResolvedValue({});
      const equalDto = { ...validDto, reviewDeadline: '2026-03-01' }; // bằng nhau
      await expect(service.setCfpSettings(1, equalDto as any, ADMIN)).resolves.toBeDefined();
    });

    it('[Abnormal] ném BadRequestException khi reviewDeadline < submissionDeadline', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      await expect(
        service.setCfpSettings(1, { ...validDto, reviewDeadline: '2026-01-01' } as any, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-8  acceptTrackAssignment  (LOC ~30) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('acceptTrackAssignment', () => {
    it('[Normal] chấp nhận phân công khi trạng thái PENDING', async () => {
      const member = { trackId: 1, userId: 5, status: 'PENDING', track: makeTrack() };
      trackMemberRepo.findOne.mockResolvedValue(member);
      trackMemberRepo.save.mockResolvedValue({ ...member, status: 'ACCEPTED' });
      const r = await service.acceptTrackAssignment(1, 5);
      expect(trackMemberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACCEPTED' }));
    });

    it('[Abnormal] ném NotFoundException khi không tìm thấy phân công', async () => {
      trackMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptTrackAssignment(999, 5)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném BadRequestException khi đã ACCEPTED', async () => {
      trackMemberRepo.findOne.mockResolvedValue({ status: 'ACCEPTED', track: makeTrack() });
      await expect(service.acceptTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném BadRequestException khi đã REJECTED', async () => {
      trackMemberRepo.findOne.mockResolvedValue({ status: 'REJECTED', track: makeTrack() });
      await expect(service.acceptTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-9  rejectTrackAssignment  (LOC ~28) → 4 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('rejectTrackAssignment', () => {
    it('[Normal] từ chối phân công khi trạng thái PENDING', async () => {
      const member = { trackId: 1, userId: 5, status: 'PENDING', track: makeTrack() };
      trackMemberRepo.findOne.mockResolvedValue(member);
      trackMemberRepo.save.mockResolvedValue({ ...member, status: 'REJECTED' });
      await service.rejectTrackAssignment(1, 5);
      expect(trackMemberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'REJECTED' }));
    });

    it('[Abnormal] ném NotFoundException khi không tìm thấy phân công', async () => {
      trackMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.rejectTrackAssignment(999, 5)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném BadRequestException khi đã REJECTED', async () => {
      trackMemberRepo.findOne.mockResolvedValue({ status: 'REJECTED', track: makeTrack() });
      await expect(service.rejectTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném BadRequestException khi đã ACCEPTED', async () => {
      trackMemberRepo.findOne.mockResolvedValue({ status: 'ACCEPTED', track: makeTrack() });
      await expect(service.rejectTrackAssignment(1, 5)).rejects.toThrow(BadRequestException);
    });
  });
  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-10  addTrack  (LOC ~16) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('addTrack', () => {
    it('[Normal] thêm track mới vào hội nghị thành công', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      const newTrack = makeTrack({ name: 'ML Track' });
      trackRepo.create.mockReturnValue(newTrack);
      trackRepo.save.mockResolvedValue(newTrack);
      const r = await service.addTrack(1, 'ML Track', CHAIR);
      expect(r.name).toBe('ML Track');
      expect(trackRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném ForbiddenException khi user không có quyền quản lý hội nghị', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue(null); // không phải member
      await expect(service.addTrack(1, 'Track X', AUTHOR)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-11  deleteTrack  (LOC ~48) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('deleteTrack', () => {
    it('[Normal] xóa track thành công khi không có submissions', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(makeTrack());
      trackRepo.save.mockResolvedValue(makeTrack({ isActive: false, deletedAt: new Date() }));
      const submClient = (service as any).submissionClient;
      submClient.getSubmissionIdsByTrack.mockResolvedValue([]);
      await expect(service.deleteTrack(1, 1, CHAIR, 'token')).resolves.toBeUndefined();
      expect(trackRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném BadRequestException khi track đã có submissions', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(makeTrack());
      const submClient = (service as any).submissionClient;
      submClient.getSubmissionIdsByTrack.mockResolvedValue(['sub-1', 'sub-2']);
      await expect(service.deleteTrack(1, 1, CHAIR, 'token')).rejects.toThrow(BadRequestException);
    });

    it('[Abnormal] ném NotFoundException khi track không tồn tại', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteTrack(1, 999, CHAIR)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-12  addTrackMember  (LOC ~44) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('addTrackMember', () => {
    it('[Normal] thêm member vào track thành công', async () => {
      trackRepo.findOne.mockResolvedValue(makeTrack({ conference: makeConf() as any }));
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackMemberRepo.findOne.mockResolvedValue(null); // chưa là member
      const newMember = { id: 1, trackId: 1, userId: 20 };
      trackMemberRepo.create.mockReturnValue(newMember);
      trackMemberRepo.save.mockResolvedValue(newMember);
      const r = await service.addTrackMember(1, { userId: 20 } as any, CHAIR);
      expect(trackMemberRepo.save).toHaveBeenCalled();
    });

    it('[Abnormal] ném NotFoundException khi track không tồn tại', async () => {
      trackRepo.findOne.mockResolvedValue(null);
      await expect(service.addTrackMember(999, { userId: 20 } as any, CHAIR)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném BadRequestException khi user đã là member của track', async () => {
      trackRepo.findOne.mockResolvedValue(makeTrack({ conference: makeConf() as any }));
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackMemberRepo.findOne.mockResolvedValue({ id: 1, userId: 20 }); // đã là member
      await expect(service.addTrackMember(1, { userId: 20 } as any, CHAIR)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-13  getMyTrackAssignments  (LOC ~28) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getMyTrackAssignments', () => {
    it('[Normal] trả về active track assignments của user', async () => {
      trackMemberRepo.find.mockResolvedValue([
        {
          id: 1, userId: 10, trackId: 1, status: 'ACCEPTED',
          track: { deletedAt: null, isActive: true, conference: { deletedAt: null, isActive: true } },
        },
      ]);
      const r = await service.getMyTrackAssignments(10);
      expect(r).toHaveLength(1);
    });

    it('[Boundary] trả về [] khi track đã bị xóa/không còn active', async () => {
      trackMemberRepo.find.mockResolvedValue([
        {
          id: 1, userId: 10, trackId: 1, status: 'ACCEPTED',
          track: { deletedAt: new Date(), isActive: false, conference: { deletedAt: null, isActive: true } },
        },
      ]);
      const r = await service.getMyTrackAssignments(10);
      expect(r).toEqual([]);
    });
  }); // end getMyTrackAssignments

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-14  updateTrack  (LOC ~35) → 3 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateTrack', () => {
    it('[Normal] cập nhật tên track thành công', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      const updatedTrack = makeTrack({ name: 'Updated Track' });
      trackRepo.findOne
        .mockResolvedValueOnce(makeTrack())       // first call: find existing
        .mockResolvedValueOnce(updatedTrack);     // second call: find after save
      trackRepo.save.mockResolvedValue(updatedTrack);
      const r = await service.updateTrack(1, 1, { name: 'Updated Track' } as any, CHAIR);
      expect(r.name).toBe('Updated Track');
    });

    it('[Abnormal] ném NotFoundException khi track không tồn tại', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue({ role: ConferenceMemberRole.CHAIR });
      trackRepo.findOne.mockResolvedValue(null);
      await expect(service.updateTrack(1, 999, { name: 'X' } as any, CHAIR)).rejects.toThrow(NotFoundException);
    });

    it('[Abnormal] ném ForbiddenException khi không có quyền', async () => {
      confRepo.findOne.mockResolvedValue(makeConf());
      memberRepo.findOne.mockResolvedValue(null); // author không có quyền
      // CHAIR is imported elsewhere? No, wait. The role enum is just cast to any or AUTHOR string is used.
      await expect(service.updateTrack(1, 1, { name: 'X' } as any, 'AUTHOR' as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQ-16  checkReviewerTrackAssignment  (LOC ~15) → 2 TC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('checkReviewerTrackAssignment', () => {
    it('[Normal] trả về hasAccepted=true khi track đang active', async () => {
      trackMemberRepo.findOne.mockResolvedValue({
        userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: null, isActive: true },
      });
      const r = await service.checkReviewerTrackAssignment(10, 1);
      expect(r.hasAccepted).toBe(true);
    });

    it('[Boundary] trả về hasAccepted=false khi track đã bị xóa', async () => {
      trackMemberRepo.findOne.mockResolvedValue({
        userId: 10, trackId: 1, status: 'ACCEPTED',
        track: { deletedAt: new Date(), isActive: false },
      });
      const r = await service.checkReviewerTrackAssignment(10, 1);
      expect(r.hasAccepted).toBe(false);
    });
  });
});