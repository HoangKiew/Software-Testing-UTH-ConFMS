// apps/conference-service/src/pc-members/pc-members.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PcMember, PcMemberStatus, PcMemberRole } from './entities/pc-member.entity';
import { EmailsService } from '../emails/emails.service';
import { ConferencesService } from '../conferences/conferences.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

export interface SimilaritySuggestion {
  score: number;
  reason: string;
}

@Injectable()
export class PcMembersService {
  constructor(
    @InjectRepository(PcMember)
    private pcRepo: Repository<PcMember>,
    private emailsService: EmailsService,
    private conferencesService: ConferencesService,
    private aiService: AiService,
    private auditService: AuditService,
  ) {}

  async findOne(id: string): Promise<PcMember> {
    const member = await this.pcRepo.findOne({
      where: { id },
      relations: ['conference'],
    });
    if (!member) throw new NotFoundException(`PC Member with ID ${id} not found`);
    return member;
  }

  async findAllAcceptedByConference(conferenceId: string): Promise<PcMember[]> {
    return this.pcRepo.find({
      where: { conference: { id: conferenceId }, status: PcMemberStatus.ACCEPTED },
      relations: ['conference'],
      order: { acceptedAt: 'DESC' },
    });
  }

  async findAllByConference(conferenceId: string, chairId: number): Promise<PcMember[]> {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only conference chair can view PC members');
    }

    return this.pcRepo.find({
      where: { conference: { id: conferenceId } },
      relations: ['conference'],
      order: { invitedAt: 'DESC' },
    });
  }

  async invite(
    conferenceId: string,
    userId: number | null,
    email: string,
    role: PcMemberRole,
    chairId: number,
  ) {
    try {
      const conference = await this.conferencesService.findOne(conferenceId);
      if (conference.chairId !== chairId) {
        throw new ForbiddenException('Only chair can invite PC members');
      }

      // Tìm member hiện có
      let member: PcMember | null = null;
      if (userId) {
        member = await this.pcRepo.findOne({
          where: { userId, conference: { id: conferenceId } },
          relations: ['conference'],
        });
      }

      // Nếu chưa có → tạo mới
      if (!member) {
        const newMember = this.pcRepo.create({
          conference,
          userId: userId ?? undefined,
          role: role || PcMemberRole.PC_MEMBER,
          status: PcMemberStatus.PENDING,
          invitedAt: new Date(),
        });
        member = await this.pcRepo.save(newMember);
      } else if (member.status !== PcMemberStatus.PENDING) {
        throw new BadRequestException('User has already processed this invitation');
      } else {
        // Mời lại → cập nhật invitedAt
        member.invitedAt = new Date();
        member = await this.pcRepo.save(member);
      }

      // Gửi email – bọc try-catch
      try {
        await this.emailsService.send('invite-pc-member', [email], {
          fullName: email.split('@')[0] || 'Reviewer',
          conferenceName: conference.name || 'Hội nghị',
          acronym: conference.acronym || '',
          startDate: conference.startDate ? new Date(conference.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định',
          endDate: conference.endDate ? new Date(conference.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định',
          submissionDeadline: conference.deadlines?.submission || 'Chưa xác định',
          role: role || 'PC Member',
          subject: `Lời mời tham gia Program Committee - ${conference.name}`,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }

      // Log audit – bọc try-catch
      try {
        await this.auditService.log('INVITE_PC_MEMBER', chairId, 'PcMember', member.id, { role });
      } catch (auditError) {
        console.error('Failed to log audit:', auditError);
      }

      return { message: 'Invitation sent successfully', memberId: member.id };
    } catch (error) {
      console.error('Error in invite PC Member:', error);
      if (error instanceof ForbiddenException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to invite PC member');
    }
  }

  async acceptInvite(id: string, userId: number) {
    const member = await this.findOne(id);
    if (member.userId !== userId) throw new ForbiddenException('Unauthorized action');
    if (member.status !== PcMemberStatus.PENDING) {
      throw new BadRequestException('Invitation already processed');
    }

    member.status = PcMemberStatus.ACCEPTED;
    member.acceptedAt = new Date();
    await this.pcRepo.save(member);

    try {
      await this.auditService.log('ACCEPT_PC_INVITE', userId, 'PcMember', id);
    } catch (error) {
      console.error('Failed to log accept invite:', error);
    }

    return { message: 'Invitation accepted successfully' };
  }

  async declineInvite(id: string, userId: number) {
    const member = await this.findOne(id);
    if (member.userId !== userId) throw new ForbiddenException('Unauthorized action');
    if (member.status !== PcMemberStatus.PENDING) {
      throw new BadRequestException('Invitation already processed');
    }

    member.status = PcMemberStatus.DECLINED;
    member.declinedAt = new Date();
    await this.pcRepo.save(member);

    try {
      await this.auditService.log('DECLINE_PC_INVITE', userId, 'PcMember', id);
    } catch (error) {
      console.error('Failed to log decline invite:', error);
    }

    return { message: 'Invitation declined' };
  }

  async declareCoi(id: string, coiUserIds: number[], coiInstitutions: string[], userId: number) {
    const member = await this.findOne(id);

    if (member.userId !== userId || member.status !== PcMemberStatus.ACCEPTED) {
      throw new ForbiddenException('Only accepted PC member can declare COI');
    }

    member.coiUserIds = coiUserIds || [];
    member.coiInstitutions = coiInstitutions || [];
    await this.pcRepo.save(member);

    try {
      await this.auditService.log('DECLARE_COI', userId, 'PcMember', id, {
        coiUserIds,
        coiInstitutions,
      });
    } catch (error) {
      console.error('Failed to log COI declaration:', error);
    }

    return { message: 'COI declared successfully' };
  }

  async removeMember(id: string, chairId: number) {
    const member = await this.findOne(id);
    if (member.conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can remove PC member');
    }

    await this.pcRepo.remove(member);

    try {
      await this.auditService.log('REMOVE_PC_MEMBER', chairId, 'PcMember', id);
    } catch (error) {
      console.error('Failed to log remove member:', error);
    }

    return { message: 'PC member removed successfully' };
  }

  async detectCoi(memberId: string, submissionId: string): Promise<boolean> {
    return false;
  }

  async getSimilaritySuggestion(
    conferenceId: string,
    submissionKeywords: string[],
    memberId: string,
  ): Promise<SimilaritySuggestion> {
    try {
      const conference = await this.conferencesService.findOne(conferenceId);

      if (!conference.aiFeaturesEnabled || !conference.aiConfig?.keywordSuggestion) {
        return { score: 0, reason: 'AI suggestion disabled for this conference' };
      }

      const member = await this.findOne(memberId);
      if (!member.topics || member.topics.length === 0) {
        return { score: 0, reason: 'PC member has no declared topics' };
      }

      const prompt = `Đánh giá độ tương đồng (thang 0-10) giữa keywords bài báo: "${submissionKeywords.join(', ')}" và chuyên môn reviewer: "${member.topics.join(', ')}". Trả về đúng định dạng JSON: {"score": number, "reason": "string mô tả lý do"}`;

      const rawResponse = await this.aiService.generateKeywordSuggestion(prompt);

      let parsed: SimilaritySuggestion;
      if (typeof rawResponse === 'string') {
        parsed = JSON.parse(rawResponse);
      } else {
        parsed = rawResponse as SimilaritySuggestion;
      }

      const score = Math.max(0, Math.min(10, Number(parsed.score) || 0));

      try {
        const inputHash = crypto.createHash('sha256').update(prompt).digest('hex');
        await this.auditService.log('AI_SIMILARITY_SUGGESTION', null, 'PcMember', memberId, {
          feature: 'keyword_similarity',
          inputHash,
          model: 'gpt-4o-mini',
          conferenceId,
          rawScore: parsed.score,
        });
      } catch (error) {
        console.error('Failed to log AI suggestion:', error);
      }

      return { score, reason: parsed.reason || 'No reason provided by AI' };
    } catch (error) {
      console.error('AI similarity error:', error);
      return { score: 0, reason: 'AI service unavailable or invalid response' };
    }
  }
  async updateTopics(
    memberId: string,
    topics: string[],
    userId: number,
  ) {
    const member = await this.findOne(memberId);

    if (member.userId !== userId) {
      throw new ForbiddenException('You can only update your own topics');
    }

    if (member.status !== PcMemberStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted PC members can update topics');
    }

    member.topics = topics;
    await this.pcRepo.save(member);

    await this.auditService.log('UPDATE_PC_TOPICS', userId, 'PcMember', memberId, { topics });

    return { message: 'Topics updated successfully', topics: member.topics };
  }
}