// apps/conference-service/src/assignments/assignments.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { ConferencesService } from '../conferences/conferences.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { SubmissionsClient } from '../integrations/submissions.client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    private conferencesService: ConferencesService,
    private aiService: AiService,
    private auditService: AuditService,
    private submissionsClient: SubmissionsClient,
    private httpService: HttpService,
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
   * Lấy danh sách reviewer từ Identity Service (hoặc fallback mock)
   */
  private async getReviewers(conferenceId: string): Promise<{ id: number; topics: string[] }[]> {
    try {
      // Tương lai: có thể thêm query param ?conferenceId=${conferenceId}
      // để chỉ lấy reviewer đã đăng ký tham gia hội nghị
      const url = `${process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001'}/api/users?role=REVIEWER`;

      const { data } = await firstValueFrom(this.httpService.get(url));

      return data.map((user: any) => ({
        id: user.id,
        topics: user.topics || [],
      }));
    } catch (error) {
      console.error('Error fetching reviewers from Identity Service:', error.message);
      // Fallback mock data cho môi trường dev/test
      return [
        { id: 2, topics: ['AI', 'Machine Learning', 'Deep Learning'] },
        { id: 3, topics: ['Natural Language Processing', 'AI Ethics'] },
        { id: 5, topics: ['Computer Vision', 'Image Processing'] },
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
    currentChairId?: number, // optional: để kiểm tra quyền trong service nếu cần
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
        context,          // submissionTopics
        conferenceId,     // conferenceId (bắt buộc) - SỬA Ở ĐÂY, bỏ dto.conferenceId
        limit,            // top
      );
    } else {
      // Fallback: Jaccard similarity
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
        .filter(s => s.similarityScore > 0.05)
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

      if (!exists) {
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

      // 1) Nếu đã có assignment ASSIGNED cho topic này → bỏ qua, không báo lỗi
      const existingAssigned = await this.assignmentRepo.findOne({
        where: {
          topic: dto.topic,
          reviewerId,
          conferenceId: dto.conferenceId,
          status: AssignmentStatus.ASSIGNED,
        },
      });

      if (existingAssigned) {
        // Idempotent: không tạo mới, không ném lỗi
        continue;
      }

      // 2) Nếu đang có SUGGESTED cho topic này → nâng cấp lên ASSIGNED
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
        // giữ nguyên similarityScore & suggestionReason
        const saved = await this.assignmentRepo.save(existingSuggested);
        assignments.push(saved);
        continue;
      }

      // 3) Chưa có bản ghi nào → tạo mới ASSIGNED
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

      assignments.push(await this.assignmentRepo.save(assignment));
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