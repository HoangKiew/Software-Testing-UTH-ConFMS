import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Conference } from './entities/conference.entity';
import { Track } from './entities/track.entity';
import {
  ConferenceMember,
  ConferenceMemberRole,
} from './entities/conference-member.entity';
import { TrackMember } from './entities/track-member.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { AddTrackMemberDto } from './dto/add-track-member.dto';
import { EmailService } from '../common/services/email.service';
import { IdentityClientService } from '../integrations/identity-client.service';
import { SubmissionClientService } from '../integrations/submission-client.service';
import { ReviewClientService } from '../integrations/review-client.service';

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private readonly conferenceMemberRepository: Repository<ConferenceMember>,
    @InjectRepository(TrackMember)
    private readonly trackMemberRepository: Repository<TrackMember>,
    @InjectRepository(CfpSetting)
    private readonly cfpSettingRepository: Repository<CfpSetting>,
    private readonly emailService: EmailService,
    private readonly identityClient: IdentityClientService,
    private readonly submissionClient: SubmissionClientService,
    private readonly reviewClient: ReviewClientService,
  ) {}
  // Tạo hội nghị mới
  async createConference(
    dto: CreateConferenceDto,
    organizerId: number,
  ): Promise<Conference> {
    this.ensureValidDateRange(dto.startDate, dto.endDate);

    const conference = this.conferenceRepository.create({
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      venue: dto.venue,
      description: dto.description ?? null,
      shortDescription: dto.shortDescription ?? null,
      contactEmail: dto.contactEmail ?? null,
      organizerId,
    });

    const saved = await this.conferenceRepository.save(conference);

    const member = this.conferenceMemberRepository.create({
      conferenceId: saved.id,
      userId: organizerId,
      role: ConferenceMemberRole.CHAIR,
    });
    await this.conferenceMemberRepository.save(member);

    return saved;
  }
  // Lấy tất cả các thông tin hội nghị
  async findAll(): Promise<Conference[]> {
    return this.conferenceRepository.find({
      where: {
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['tracks', 'members', 'cfpSetting'],
    });
  }
  // Lấy thông tin chi tiết hội nghị theo ID
  async findOne(id: number): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['tracks', 'members', 'cfpSetting'],
    });

    if (!conference) {
      throw new NotFoundException('Không có hội nghị nào với ID đã cho');
    }

    return conference;
  }
  // Thêm chủ đề mới cho hội nghị
  async addTrack(
    conferenceId: number,
    name: string,
    user: { id: number; roles: string[] },
  ): Promise<Track> {
    await this.ensureCanManageConference(conferenceId, user);
    const conference = await this.getConferenceOrThrow(conferenceId);
    const track = this.trackRepository.create({
      name,
      conferenceId: conferenceId,
      conference,
    });

    return this.trackRepository.save(track);
  }
  // Cấu hình các mốc thời gian dealdine
  async setCfpSettings(
    conferenceId: number,
    dto: SetCfpSettingDto,
    user: { id: number; roles: string[] },
  ): Promise<CfpSetting> {
    await this.ensureCanManageConference(conferenceId, user);
    const conference = await this.getConferenceOrThrow(conferenceId);
    this.ensureValidCfpDates(dto);

    let setting = await this.cfpSettingRepository.findOne({
      where: { conferenceId },
    });

    if (!setting) {
      setting = this.cfpSettingRepository.create({
        conferenceId,
        conference,
      });
    }

    setting.submissionDeadline = new Date(dto.submissionDeadline);
    setting.reviewDeadline = new Date(dto.reviewDeadline);
    setting.notificationDate = new Date(dto.notificationDate);
    setting.cameraReadyDeadline = new Date(dto.cameraReadyDeadline);

    return this.cfpSettingRepository.save(setting);
  }
  // Cập nhật thông tin hội nghị
  async updateConference(
    id: number,
    dto: UpdateConferenceDto,
    user: { id: number; roles: string[] },
  ): Promise<Conference> {
    await this.ensureCanManageConference(id, user);
    const conference = await this.getConferenceOrThrow(id);

    const nextStart = dto.startDate ?? conference.startDate.toISOString();
    const nextEnd = dto.endDate ?? conference.endDate.toISOString();
    this.ensureValidDateRange(nextStart, nextEnd);

    Object.assign(conference, {
      name: dto.name ?? conference.name,
      startDate: dto.startDate ? new Date(dto.startDate) : conference.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : conference.endDate,
      venue: dto.venue ?? conference.venue,
      description:
        dto.description !== undefined
          ? dto.description
          : conference.description,
      shortDescription:
        dto.shortDescription !== undefined
          ? dto.shortDescription
          : conference.shortDescription,
      contactEmail:
        dto.contactEmail !== undefined
          ? dto.contactEmail
          : conference.contactEmail,
    });

    return this.conferenceRepository.save(conference);
  }
  // Xóa hội nghị
  async deleteConference(
    id: number,
    user: { id: number; roles: string[] },
  ): Promise<void> {
    await this.ensureCanManageConference(id, user);
    const conference = await this.getConferenceOrThrow(id);
    conference.deletedAt = new Date();
    conference.isActive = false;
    await this.conferenceRepository.save(conference);
  }
  // Cập nhật chủ đề trong hội nghị
  async updateTrack(
    conferenceId: number,
    trackId: number,
    dto: UpdateTrackDto,
    user: { id: number; roles: string[] },
  ): Promise<Track> {
    await this.ensureCanManageConference(conferenceId, user);
    const track = await this.trackRepository.findOne({
      where: {
        id: trackId,
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }

    if (dto.name !== undefined && dto.name !== null) {
      track.name = dto.name;
    }

    await this.trackRepository.save(track);

    const updated = await this.trackRepository.findOne({
      where: {
        id: trackId,
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (!updated) {
      throw new NotFoundException('Không tìm thấy chủ đề sau khi cập nhật');
    }

    return updated;
  }
  // Xóa chủ đề khỏi hội nghị
  async deleteTrack(
    conferenceId: number,
    trackId: number,
    user: { id: number; roles: string[] },
    authToken?: string,
  ): Promise<void> {
    await this.ensureCanManageConference(conferenceId, user);
    const track = await this.trackRepository.findOne({
      where: {
        id: trackId,
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });
    if (!track) {
      throw new NotFoundException('Chủ đề không tồn tại');
    }

    // Kiểm tra xem track có submissions hay không
    if (authToken) {
      try {
        const submissionIds = await this.submissionClient.getSubmissionIdsByTrack(
          trackId,
          authToken,
        );

        if (submissionIds && submissionIds.length > 0) {
          throw new BadRequestException(
            `Không thể xóa chủ đề này vì đã có ${submissionIds.length} bài nộp. Vui lòng xóa hoặc chuyển các bài nộp trước khi xóa chủ đề.`,
          );
        }
      } catch (error: any) {
        // Nếu là BadRequestException từ việc có submissions, throw lại
        if (error instanceof BadRequestException) {
          throw error;
        }
        // Nếu là lỗi service unavailable, cho phép xóa (fallback)
        // Nhưng log warning để admin biết
        console.warn(
          `[ConferencesService] Cannot verify submissions for track ${trackId}: ${error.message}`,
        );
      }
    }

    track.deletedAt = new Date();
    track.isActive = false;
    await this.trackRepository.save(track);
  }

  private ensureValidDateRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Ngày bắt đầu/kết thúc không hợp lệ');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('startDate phải trước endDate');
    }
  }
  // Check các mốc thời gian CFP có hợp lệ không
  private ensureValidCfpDates(dto: SetCfpSettingDto) {
    const submissionDeadline = new Date(dto.submissionDeadline);
    const reviewDeadline = new Date(dto.reviewDeadline);
    const notificationDate = new Date(dto.notificationDate);
    const cameraReadyDeadline = new Date(dto.cameraReadyDeadline);
    if (
      [
        submissionDeadline,
        reviewDeadline,
        notificationDate,
        cameraReadyDeadline,
      ].some((d) => Number.isNaN(d.getTime()))
    ) {
      throw new BadRequestException('Mốc thời gian CFP không hợp lệ');
    }

    if (
      !(
        submissionDeadline <= reviewDeadline &&
        reviewDeadline <= notificationDate &&
        notificationDate <= cameraReadyDeadline
      )
    ) {
      throw new BadRequestException(
        'Thứ tự mốc thời gian CFP không hợp lệ (submissionDeadline <= reviewDeadline <= notificationDate <= cameraReadyDeadline)',
      );
    }
  }
  // Kiểm tra quyền quản lý hội nghị của người dùng
  async ensureCanManageConference(
    conferenceId: number,
    user: { id: number; roles: string[] },
  ) {
    const roles = user?.roles || [];
    if (roles.includes('ADMIN') || roles.includes('CHAIR')) {
      return;
    }
    const membership = await this.conferenceMemberRepository.findOne({
      where: { conferenceId, userId: user.id },
    });
    if (!membership || membership.role !== ConferenceMemberRole.CHAIR) {
      throw new ForbiddenException('Bạn không có quyền quản lý hội nghị này');
    }
  }
  // Lấy tất cả các chủ đề của hội nghị
  async findAllTracks(conferenceId: number): Promise<Track[]> {
    return await this.trackRepository.find({
      where: {
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
      order: { id: 'ASC' },
    });
  }
  // Lấy cài đặt thời gian của hội nghị
  async getCfpSetting(conferenceId: number): Promise<CfpSetting | null> {
    return await this.cfpSettingRepository.findOne({
      where: { conferenceId },
    });
  }
  // Lấy hội nghị hoặc ném lỗi nếu không tìm thấy
  private async getConferenceOrThrow(id: number): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
        isActive: true,
      },
    });
    if (!conference) {
      throw new NotFoundException('Không tìm thấy hội nghị');
    }
    return conference;
  }
  // Lấy tất cả thành viên có trong  chủ đề
  async listTrackMembers(
    trackId: number,
    user: { id: number; roles: string[] },
  ): Promise<TrackMember[]> {
    const track = await this.trackRepository.findOne({
      where: {
        id: trackId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    await this.ensureCanManageConference(track.conferenceId, user);
    return this.trackMemberRepository.find({
      where: { trackId },
      order: { createdAt: 'DESC' },
    });
  }
  // Thêm thành viên vào chủ đề
  async addTrackMember(
    trackId: number,
    dto: AddTrackMemberDto,
    user: { id: number; roles: string[] },
    authToken?: string,
  ): Promise<TrackMember> {
    const track = await this.trackRepository.findOne({
      where: {
        id: trackId,
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['conference'],
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    await this.ensureCanManageConference(track.conferenceId, user);

    const existing = await this.trackMemberRepository.findOne({
      where: { trackId, userId: dto.userId },
    });
    if (existing) {
      throw new BadRequestException(
        'Người dùng đã là thành viên của chủ đề này',
      );
    }

    const member = this.trackMemberRepository.create({
      trackId,
      userId: dto.userId,
      track,
    });
    const savedMember = await this.trackMemberRepository.save(member);
    if (authToken) {
      this.sendTrackAssignmentEmail(savedMember, track, authToken).catch(
        (error) => {
          throw new BadRequestException(
            'Lỗi khi gửi email thông báo phân công chủ đề',
          );
        },
      );
    }
    return savedMember;
  }
  // Gửi email thông báo phân công chủ đề
  private async sendTrackAssignmentEmail(
    member: TrackMember,
    track: Track,
    authToken: string,
  ): Promise<void> {
    try {
      // Lấy user info từ identity-service
      const userInfo = await this.identityClient.getUserById(
        member.userId,
        authToken,
      );
      if (!userInfo || !userInfo.email) {
        throw new BadRequestException(
          'Không thể gửi email: Người dùng không tồn tại hoặc không có email',
        );
      }
      const conference = await this.conferenceRepository.findOne({
        where: {
          id: track.conferenceId,
          deletedAt: IsNull(),
          isActive: true,
        },
      });
      await this.emailService.sendTrackAssignmentEmail(
        userInfo.email,
        userInfo.fullName || 'Reviewer',
        track.name,
        conference?.name || 'Hội nghị',
      );
    } catch (error) {
      throw new BadRequestException(
        'Lỗi khi gửi email thông báo phân công chủ đề',
      );
    }
  }
  // Xóa thành viên khỏi chủ đề
  async removeTrackMember(
    trackId: number,
    memberUserId: number,
    user: { id: number; roles: string[] },
    authToken?: string,
  ): Promise<void> {
    const track = await this.trackRepository.findOne({
      where: {
        id: trackId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    await this.ensureCanManageConference(track.conferenceId, user);
    // Check nếu thành viên tồn tại trong track
    const member = await this.trackMemberRepository.findOne({
      where: { trackId, userId: memberUserId },
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy thành viên này');
    }
    //
    if (!authToken) {
      throw new BadRequestException({
        message:
          'Không thể kiểm tra guard clause vì thiếu auth token. Vui lòng cung cấp token để xác minh người dùng không có reviews trong track này trước khi xóa.',
        detail: {
          trackId,
          userId: memberUserId,
          reason: 'Auth token required for cross-service guard clause checks',
        },
      });
    }
    // Check nếu người dùng đã thực hiện review cho bất kỳ submission nào trong track này
    const submissionIds = await this.submissionClient.getSubmissionIdsByTrack(
      trackId,
      authToken,
    );

    if (submissionIds && submissionIds.length > 0) {
      const hasReviews = await this.reviewClient.hasUserReviewedSubmissions(
        memberUserId,
        submissionIds,
        authToken,
      );

      if (hasReviews) {
        throw new BadRequestException({
          message:
            'Người dùng này đã thực hiện review cho track này, không thể xóa khỏi track',
          detail: {
            trackId,
            userId: memberUserId,
          },
        });
      }
    }

    await this.trackMemberRepository.remove(member);
  }
  // Lấy tất cả phân công chủ đề của người dùng
  async getMyTrackAssignments(userId: number): Promise<TrackMember[]> {
    const assignments = await this.trackMemberRepository.find({
      where: { userId },
      relations: ['track', 'track.conference'],
      order: { createdAt: 'DESC' },
    });
    const activeAssignments = assignments.filter((assignment) => {
      const track = assignment.track;
      const conference = track?.conference;
      return (
        track &&
        track.deletedAt === null &&
        track.isActive === true &&
        conference &&
        conference.deletedAt === null &&
        conference.isActive === true
      );
    });
    return activeAssignments.map((assignment) => ({
      ...assignment,
      status: assignment.status || 'PENDING',
    }));
  }
  // Chấp nhận phân công chủ đề
  async acceptTrackAssignment(
    trackId: number,
    userId: number,
  ): Promise<TrackMember> {
    const member = await this.trackMemberRepository.findOne({
      where: { trackId, userId },
      relations: ['track'],
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy phân công này');
    }
    // Check track có bị xóa không
    if (
      member.track &&
      (member.track.deletedAt !== null || member.track.isActive === false)
    ) {
      throw new NotFoundException(
        'Chủ đề này đã bị xóa hoặc không còn hoạt động',
      );
    }
    if (member.status === 'ACCEPTED') {
      throw new BadRequestException('Phân công đã được chấp nhận');
    }
    if (member.status === 'REJECTED') {
      throw new BadRequestException('Phân công đã bị từ chối');
    }
    member.status = 'ACCEPTED';
    return this.trackMemberRepository.save(member);
  }
  // Kiểm tra phân công chủ đề của reviewer
  async checkReviewerTrackAssignment(
    reviewerId: number,
    trackId: number,
  ): Promise<{ hasAccepted: boolean }> {
    const member = await this.trackMemberRepository.findOne({
      where: {
        userId: reviewerId,
        trackId: trackId,
        status: 'ACCEPTED',
      },
      relations: ['track'],
    });
    const hasAccepted =
      !!member &&
      member.track &&
      member.track.deletedAt === null &&
      member.track.isActive === true;
    return { hasAccepted };
  }
  // Từ chối phân công chủ đề
  async rejectTrackAssignment(
    trackId: number,
    userId: number,
  ): Promise<TrackMember> {
    const member = await this.trackMemberRepository.findOne({
      where: { trackId, userId },
      relations: ['track'],
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy phân công này');
    }
    if (
      member.track &&
      (member.track.deletedAt !== null || member.track.isActive === false)
    ) {
      throw new NotFoundException(
        'Chủ đề này đã bị xóa hoặc không còn hoạt động',
      );
    }
    if (member.status === 'REJECTED') {
      throw new BadRequestException('Phân công đã bị từ chối');
    }
    if (member.status === 'ACCEPTED') {
      throw new BadRequestException(
        'Không thể từ chối phân công đã được chấp nhận',
      );
    }
    member.status = 'REJECTED';
    return this.trackMemberRepository.save(member);
  }
}
