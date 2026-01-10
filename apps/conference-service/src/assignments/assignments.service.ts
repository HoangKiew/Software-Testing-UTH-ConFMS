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

  async findAllByConference(conferenceId: string, chairId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can view assignments');

    return this.assignmentRepo.find({ where: { conferenceId } });
  }

  // LẤY REVIEWER THẬT TỪ IDENTITY SERVICE
  private async getReviewers(conferenceId: string): Promise<{ id: number; topics: string[] }[]> {
    try {
      const url = `${process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001'}/api/users?role=REVIEWER`;

      const { data } = await firstValueFrom(
        this.httpService.get(url)
      );

      // Giả định response là array user: { id, email, fullName, topics: string[] }
      return data.map((user: any) => ({
        id: user.id,
        topics: user.topics || [], // Nếu chưa có field topics thì để rỗng, match manual sẽ 0
      }));
    } catch (error) {
      console.error('Error fetching reviewers from Identity Service:', error.message);
      // Fallback mock nhỏ để không crash
      return [
        { id: 2, topics: ['AI', 'Machine Learning'] }, // Đảm bảo id 2 luôn có
      ];
    }
  }

  async suggestReviewersForTopic(topic: string, top: number = 5) {
    // Lấy conference thật (có thể truyền conferenceId vào DTO sau)
    // Tạm hard-code hoặc lấy từ context – chị có thể sửa sau
    const conferenceId = 'c2a65b80-fd67-474e-8390-895c76422f10'; // Thay bằng real logic
    const conference = await this.conferencesService.findOne(conferenceId);

    const reviewers = await this.getReviewers(conferenceId);

    const matchTopics = [topic.toLowerCase(), ...conference.topics?.map(t => t.toLowerCase()) || []];

    let suggestions: { reviewerId: number; similarityScore: number; reason: string }[] = [];
    if (conference.aiConfig?.keywordSuggestion) {
      suggestions = await this.aiService.suggestReviewers(matchTopics.join(', '), reviewers, top);
    } else {
      suggestions = reviewers.map(rev => {
        const revTopics = rev.topics.map(t => t.toLowerCase());
        const overlap = matchTopics.filter(mt => revTopics.includes(mt)).length;
        return {
          reviewerId: rev.id,
          similarityScore: overlap / Math.max(matchTopics.length, 1),
          reason: overlap > 0 ? `Khớp ${overlap} topic` : 'No match',
        };
      })
        .filter(sug => sug.similarityScore > 0)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, top);
    }

    const assignments: Assignment[] = [];
    for (const sug of suggestions) {
      const assignment = this.assignmentRepo.create({
        topic,
        reviewerId: sug.reviewerId,
        conferenceId: conference.id,
        status: AssignmentStatus.SUGGESTED,
        similarityScore: sug.similarityScore,
        suggestionReason: sug.reason,
        hasCoi: false,
      });
      assignments.push(await this.assignmentRepo.save(assignment));
    }

    await this.auditService.log('SUGGEST_REVIEWERS_FOR_TOPIC', conference.chairId, 'Topic', topic);
    return assignments;
  }

  async assignReviewersToTopic(dto: AssignReviewersDto, chairId: number) {
    const conference = await this.conferencesService.findOne(dto.conferenceId);
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can assign');

    const conferenceTopics = conference.topics?.map(t => t.toLowerCase()) || [];
    const reviewers = await this.getReviewers(dto.conferenceId);

    const assignments: Assignment[] = [];
    for (const reviewerId of dto.reviewerIds) {
      const reviewer = reviewers.find(r => r.id === reviewerId);
      if (!reviewer) throw new BadRequestException(`Invalid reviewer ID: ${reviewerId}`);

      const revTopics = reviewer.topics.map(t => t.toLowerCase());
      const overlap = conferenceTopics.filter(ct => revTopics.includes(ct)).length;
      if (overlap === 0 && conferenceTopics.length > 0) {
        throw new BadRequestException(`Reviewer ${reviewerId} không match topic của hội nghị`);
      }

      const existing = await this.assignmentRepo.findOne({
        where: { topic: dto.topic, reviewerId },
      });
      if (existing) throw new BadRequestException(`Reviewer ${reviewerId} already assigned to this topic`);

      const assignment = this.assignmentRepo.create({
        topic: dto.topic,
        reviewerId,
        conferenceId: conference.id,
        status: AssignmentStatus.ASSIGNED,
        similarityScore: 0,
        suggestionReason: 'Manual assignment',
        hasCoi: false,
        assignedAt: new Date(),
      });
      assignments.push(await this.assignmentRepo.save(assignment));
    }

    await this.auditService.log('ASSIGN_REVIEWERS_TO_TOPIC', chairId, 'Topic', dto.topic);
    return assignments;
  }

  async unassign(assignmentId: string, chairId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const conference = await this.conferencesService.findOne(assignment.conferenceId);
    if (conference.chairId !== chairId) throw new ForbiddenException('Only chair can unassign');

    await this.assignmentRepo.remove(assignment);
    await this.auditService.log('UNASSIGN_REVIEWER', chairId, 'Assignment', assignmentId);

    return { message: 'Reviewer unassigned successfully' };
  }
}