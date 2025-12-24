// apps/conference-service/src/assignments/assignments.service.ts
import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { PcMembersService } from '../pc-members/pc-members.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { ConferencesService } from '../conferences/conferences.service';
import { AuditService } from '../audit/audit.service';
import { UsersClient } from '../users/users.client';
import { PcMemberStatus } from '../pc-members/entities/pc-member.entity';
@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    private pcMembersService: PcMembersService,
    private submissionsService: SubmissionsService,
    private conferencesService: ConferencesService,
    private auditService: AuditService,
    private usersClient: UsersClient,
  ) {}

  private async findOne(assignmentId: string): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  // Gợi ý reviewer tự động (AI similarity + filter COI)
  async suggestReviewers(submissionId: string, top: number = 5) {
    const submission = await this.submissionsService.findOne(submissionId);

    const keywords = (submission.keywords || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    if (keywords.length === 0) {
      return { message: 'Submission has no keywords for matching', suggestions: [] };
    }

    const pcMembers = await this.pcMembersService.findAllAcceptedByConference(submission.conferenceId);

    if (pcMembers.length === 0) {
      return { message: 'No accepted PC members in this conference', suggestions: [] };
    }

    const suggestions = await Promise.all(
      pcMembers.map(async (member) => {
        const suggestion = await this.pcMembersService.getSimilaritySuggestion(
          submission.conferenceId,
          keywords,
          member.id,
        );

        const authors = submission.authors || [];
        let hasCoi = authors.some((authorId: number) => member.coiUserIds.includes(authorId));

        return {
          memberId: member.id,
          userId: member.userId,
          role: member.role,
          topics: member.topics,
          score: hasCoi ? 0 : suggestion.score,
          reason: hasCoi ? 'Conflict of Interest detected' : suggestion.reason,
          hasCoi,
        };
      }),
    );

    const validSuggestions = suggestions
      .filter((s) => !s.hasCoi && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, top);

    return validSuggestions.length > 0
      ? validSuggestions
      : { message: 'No suitable reviewers found (all have COI or low similarity)', suggestions: [] };
  }

  async assignReviewers(dto: AssignReviewersDto, chairId: number) {
    const submission = await this.submissionsService.findOne(dto.submissionId);
    const conference = await this.conferencesService.findOne(submission.conferenceId);

    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only conference chair can assign reviewers');
    }

    const results: Assignment[] = [];

    for (const reviewerId of dto.reviewerIds) {
      const member = await this.pcMembersService.findOne(reviewerId);

      // SỬA: member.conference.id thay vì member.conferenceId
      if (member.conference.id !== conference.id || member.status !== PcMemberStatus.ACCEPTED) {
        throw new BadRequestException(`Reviewer ${reviewerId} is invalid or not accepted`);
      }

      let assignment = await this.assignmentRepo.findOne({
        where: { submissionId: dto.submissionId, reviewerId },
      });

      if (!assignment) {
        assignment = this.assignmentRepo.create({
          conferenceId: conference.id,
          submissionId: dto.submissionId,
          reviewerId,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
          similarityScore: 0,
          hasCoi: false,
        });
      } else {
        assignment.status = AssignmentStatus.ASSIGNED;
        assignment.assignedAt = new Date();
      }

      await this.assignmentRepo.save(assignment);
      results.push(assignment);

      await this.auditService.log('ASSIGN_REVIEWER', chairId, 'Assignment', assignment.id, {
        submissionId: dto.submissionId,
        reviewerId,
      });
    }

    return {
      message: 'Reviewers assigned successfully',
      count: results.length,
      assignments: results,
    };
  }

  async findAllByConference(conferenceId: string, chairId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can view assignments');
    }

    return this.assignmentRepo.find({
      where: { conferenceId },
      relations: ['reviewer', 'submission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllBySubmission(submissionId: string) {
    return this.assignmentRepo.find({
      where: { submissionId },
      relations: ['reviewer'],
      order: { assignedAt: 'DESC' },
    });
  }

  async unassign(assignmentId: string, chairId: number) {
    const assignment = await this.findOne(assignmentId);
    const conference = await this.conferencesService.findOne(assignment.conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can unassign');
    }

    await this.assignmentRepo.remove(assignment);
    await this.auditService.log('UNASSIGN_REVIEWER', chairId, 'Assignment', assignmentId);

    return { message: 'Reviewer unassigned successfully' };
  }
}