// apps/conference-service/src/assignments/assignments.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { Invitation, InvitationStatus } from '../invitations/entities/invitation.entity'; // NEW
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { ConferencesService } from '../conferences/conferences.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { SubmissionsClient } from '../integrations/submissions.client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EmailsService } from '../emails/emails.service'; // NEW

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Invitation) // NEW
    private invitationRepo: Repository<Invitation>, // NEW
    private conferencesService: ConferencesService,
    private aiService: AiService,
    private auditService: AuditService,
    private submissionsClient: SubmissionsClient,
    private httpService: HttpService,
    private emailsService: EmailsService, // NEW
  ) { }

  /**
   * Lấy tất cả assignments của một hội nghị (dành cho Chair)
   * CHỈ trả về các assignment đã được phân công (status = ASSIGNED),
   * không bao gồm các gợi ý (SUGGESTED).
   */
  async findAllByConference(conferenceId: string, chairId: number): Promise<Assignment[]> {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) {
      throw new NotFoundException('Conference not found');
    }
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can view assignments');
    }

    return this.assignmentRepo.find({
      where: {
        conferenceId,
        status: AssignmentStatus.ASSIGNED, // ← CHỈ LẤY NHỮNG AI ĐÃ ĐƯỢC PHÂN CÔNG
      },
    });
  }

  /**
   * Kiểm tra xem user có phải là chair của hội nghị này không
   */
  async canChairSuggest(userId: number, conferenceId: string): Promise<boolean> {
    try {
      const conference = await this.conferencesService.findOne(conferenceId);
      if (!conference) return false;
      return conference.chairId === userId;
    } catch {
      return false;
    }
  }

  /**
   * Lấy danh sách reviewer cho hội nghị:
   *  - Ưu tiên: các lời mời đã ACCEPTED (có email do Chair chọn trong UI)
   *  - Fallback: gọi Identity Service lấy toàn bộ REVIEWER
   */
  private async getReviewers(
    conferenceId: string,
  ): Promise<{ id: number; topics: string[]; email?: string; name?: string }[]> {
    // 1) Ưu tiên dùng danh sách PC đã chấp nhận lời mời (Invitation.ACCEPTED)
    const acceptedInvitations = await this.invitationRepo.find({
      where: { conferenceId, status: InvitationStatus.ACCEPTED },
    });

    if (acceptedInvitations.length > 0) {
      this.logger.log(
        `[ASSIGN] Using ${acceptedInvitations.length} accepted invitations as reviewer pool for conference ${conferenceId}`,
      );

      return acceptedInvitations.map(inv => ({
        id: inv.userId,
        topics: Array.isArray(inv.topics) ? inv.topics : [],
        email: inv.reviewerEmail || undefined, // Gmail lấy từ UI khi mời
        name: inv.reviewerName || undefined,
      }));
    }

    // 2) Nếu chưa có PC nào cho hội nghị => fallback qua Identity Service như cũ
    try {
      // Hỗ trợ cả 2 kiểu:
      // - IDENTITY_SERVICE_URL=http://identity-service:3001
      // - IDENTITY_SERVICE_URL=http://identity-service:3001/api
      const rawBase = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001';
      const base = rawBase.replace(/\/+$/, '');
      const url = base.endsWith('/api')
        ? `${base}/users?role=REVIEWER`
        : `${base}/api/users?role=REVIEWER`;

      this.logger.log(`[ASSIGN] Fetching reviewers from Identity Service: ${url}`);

      const { data } = await firstValueFrom(this.httpService.get(url));

      return data.map((user: any) => ({
        id: user.id,
        topics: user.topics || [],
        email: user.email,
        name: user.fullName || user.name,
      }));
    } catch (error: any) {
      this.logger.error(
        'Error fetching reviewers from Identity Service:',
        error?.message || error,
      );
      // Fallback mock data cho môi trường dev/test
      return [
        { id: 2, topics: ['AI', 'Machine Learning', 'Deep Learning'], email: undefined, name: undefined },
        { id: 3, topics: ['Natural Language Processing', 'AI Ethics'], email: undefined, name: undefined },
        { id: 5, topics: ['Computer Vision', 'Image Processing'], email: undefined, name: undefined },
      ];
    }
  }

  /**
   * Gợi ý reviewer phù hợp cho một topic trong hội nghị cụ thể
   */
  async suggestReviewersForTopic(
    conferenceId: string,
    topic: string,
    limit: number = 5,
    currentChairId?: number,
  ): Promise<Assignment[]> {
    if (!conferenceId) {
      throw new BadRequestException('conferenceId is required for suggestion');
    }

    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) {
      throw new NotFoundException(`Conference with ID ${conferenceId} not found`);
    }

    // Kiểm tra quyền nếu truyền currentChairId
    if (currentChairId && conference.chairId !== currentChairId) {
      throw new ForbiddenException('Only chair of this conference can suggest reviewers');
    }

    const reviewers = await this.getReviewers(conferenceId);
    if (reviewers.length === 0) {
      throw new BadRequestException('No reviewers available at the moment');
    }

    const matchTopics = [
      topic.trim().toLowerCase(),
      ...(conference.topics?.map(t => t.trim().toLowerCase()) || []),
    ].filter(Boolean);

    if (matchTopics.length === 0) {
      throw new BadRequestException('No topics available for matching');
    }

    let suggestions: { reviewerId: number; similarityScore: number; reason: string }[] = [];

    if (conference.aiConfig?.keywordSuggestion) {
      const context = matchTopics.join(', ');
      suggestions = await this.aiService.suggestReviewers(
        context,
        conferenceId,
        limit,
      );
    } else {
      // Fallback: Jaccard similarity
      // SỬA: KHÔNG LOẠI BỎ reviewer similarityScore = 0, để reviewer chưa khai báo topic vẫn được gợi ý
      suggestions = reviewers
        .map(rev => {
          const revTopics = (rev.topics || []).map(t => t.trim().toLowerCase());
          const intersection = matchTopics.filter(mt => revTopics.includes(mt));
          const union = new Set([...matchTopics, ...revTopics]);
          const score = union.size > 0 ? intersection.length / union.size : 0;

          return {
            reviewerId: rev.id,
            similarityScore: score,
            reason:
              intersection.length > 0
                ? `Khớp ${intersection.length} topic: ${intersection.join(', ')}`
                : 'Không có topic trùng khớp',
          };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    }

    const assignments: Assignment[] = [];

    for (const sug of suggestions) {
      const exists = await this.assignmentRepo.findOne({
        where: {
          conferenceId,
          topic,
          reviewerId: sug.reviewerId,
          status: AssignmentStatus.SUGGESTED,
        },
      });

      if (exists) {
        // SỬA: nếu đã có bản ghi SUGGESTED trước đó thì vẫn trả về
        assignments.push(exists);
        continue;
      }

      const assignment = this.assignmentRepo.create({
        topic,
        reviewerId: sug.reviewerId,
        conferenceId,
        status: AssignmentStatus.SUGGESTED,
        similarityScore: Number(sug.similarityScore.toFixed(4)),
        suggestionReason: sug.reason,
        hasCoi: false,
      });
      assignments.push(await this.assignmentRepo.save(assignment));
    }

    await this.auditService.log(
      'SUGGEST_REVIEWERS_FOR_TOPIC',
      conference.chairId,
      'Conference-Topic',
      `${conferenceId} | ${topic}`,
    );

    return assignments;
  }

  /**
   * Gửi email thông báo khi reviewer được phân công cho topic
   */
  private async notifyReviewerAssigned(
    reviewer: { email?: string; name?: string },
    topic: string,
    conferenceName: string,
  ) {
    if (!reviewer.email) {
      this.logger.warn(
        `[ASSIGN] Không gửi email phân công cho reviewer vì không có email. Topic="${topic}", conference="${conferenceName}"`,
      );
      return;
    }

    const name = reviewer.name || reviewer.email.split('@')[0];

    try {
      await this.emailsService.sendReviewerAssignmentEmail(reviewer.email, {
        name,
        conferenceName,
        topic,
      });
      this.logger.log(
        `[ASSIGN] Đã gửi email phân công reviewer đến ${reviewer.email} cho topic "${topic}" (${conferenceName})`,
      );
    } catch (err: any) {
      this.logger.error(
        `[ASSIGN] Lỗi gửi email phân công đến ${reviewer.email}: ${err.message}`,
      );
    }
  }

  /**
   * Phân công thủ công reviewer cho một topic
   */
  async assignReviewersToTopic(dto: AssignReviewersDto, chairId: number): Promise<Assignment[]> {
    const conference = await this.conferencesService.findOne(dto.conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can assign');

    const reviewers = await this.getReviewers(dto.conferenceId);

    const assignments: Assignment[] = [];

    for (const reviewerId of dto.reviewerIds) {
      const reviewer = reviewers.find(r => r.id === reviewerId);
      if (!reviewer) {
        throw new BadRequestException(`Invalid reviewer ID: ${reviewerId}`);
      }

      // 1) Nếu đã có assignment ASSIGNED cho topic này → bỏ qua, không báo lỗi, không gửi mail nữa
      const existingAssigned = await this.assignmentRepo.findOne({
        where: {
          topic: dto.topic,
          reviewerId,
          conferenceId: dto.conferenceId,
          status: AssignmentStatus.ASSIGNED,
        },
      });

      if (existingAssigned) {
        continue;
      }

      // 2) Nếu đang có SUGGESTED cho topic này → nâng cấp lên ASSIGNED và gửi email
      const existingSuggested = await this.assignmentRepo.findOne({
        where: {
          topic: dto.topic,
          reviewerId,
          conferenceId: dto.conferenceId,
          status: AssignmentStatus.SUGGESTED,
        },
      });

      if (existingSuggested) {
        existingSuggested.status = AssignmentStatus.ASSIGNED;
        existingSuggested.assignedAt = new Date();
        const saved = await this.assignmentRepo.save(existingSuggested);
        assignments.push(saved);

        await this.notifyReviewerAssigned(reviewer, dto.topic, conference.name);
        continue;
      }

      // 3) Chưa có bản ghi nào → tạo mới ASSIGNED và gửi email
      const assignment = this.assignmentRepo.create({
        topic: dto.topic,
        reviewerId,
        conferenceId: conference.id,
        status: AssignmentStatus.ASSIGNED,
        similarityScore: 0,
        suggestionReason: 'Manual assignment by chair',
        hasCoi: false,
        assignedAt: new Date(),
      });

      const savedNew = await this.assignmentRepo.save(assignment);
      assignments.push(savedNew);

      await this.notifyReviewerAssigned(reviewer, dto.topic, conference.name);
    }

    await this.auditService.log('ASSIGN_REVIEWERS_TO_TOPIC', chairId, 'Topic', dto.topic);
    return assignments;
  }

  /**
   * Hủy phân công một assignment cụ thể
   */
  async unassign(assignmentId: string, chairId: number): Promise<{ message: string }> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const conference = await this.conferencesService.findOne(assignment.conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can unassign');

    await this.assignmentRepo.remove(assignment);

    await this.auditService.log('UNASSIGN_REVIEWER', chairId, 'Assignment', assignmentId);

    return { message: 'Reviewer unassigned successfully' };
  }
}