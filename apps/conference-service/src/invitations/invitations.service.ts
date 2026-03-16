// apps/conference-service/src/invitations/invitations.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { EmailsService } from '../emails/emails.service';
import { ConferencesService } from '../conferences/conferences.service';
import { UsersClient } from '../users/users.client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,

    private readonly emailsService: EmailsService,
    private readonly conferencesService: ConferencesService,
    private readonly usersClient: UsersClient,
    private readonly auditService: AuditService,
  ) { }

  async inviteReviewer(
    conferenceId: string,
    userId: number,
    chairId: number,
    reviewerEmailFromBody?: string,
    reviewerNameFromBody?: string, // NEW
  ) {
    const conference = await this.conferencesService.findOne(Number(conferenceId));
    if (!conference) throw new NotFoundException('Conference not found');
    if (conference.organizerId !== chairId) throw new ForbiddenException('Only chair can invite');

    // Lấy lời mời mới nhất của user này trong hội nghị này
    const existing = await this.invitationRepo.findOne({
      where: { conferenceId, userId },
      order: { invitedAt: 'DESC' },
    });

    if (existing) {
      if (existing.status === InvitationStatus.PENDING) {
        existing.invitedAt = new Date();
        if (reviewerEmailFromBody) {
          existing.reviewerEmail = reviewerEmailFromBody;
        }
        if (reviewerNameFromBody) {
          existing.reviewerName = reviewerNameFromBody;
        }
        await this.invitationRepo.save(existing);
        await this.auditService.log(Number(conferenceId), chairId, 'RE_INVITE_REVIEWER', 'Invitation', Number(existing.id) || null, null, { userId });
        return { message: 'Re-invitation sent', invitationId: existing.id };
      }

      if (existing.status === InvitationStatus.ACCEPTED) {
        throw new BadRequestException('User has already accepted this invitation');
      }

      // Nếu đã DECLINED thì cho phép tạo lời mời mới (không throw lỗi)
      this.logger.log(
        `[INVITE] Creating new invitation after decline for user ${userId} in conference ${conferenceId} (previous invitation ${existing.id})`,
      );
    }

    const invitation = this.invitationRepo.create({
      conferenceId,
      userId,
      status: InvitationStatus.PENDING,
      invitedAt: new Date(),
      topics: [],
      coiUserIds: [],
      coiInstitutions: [],
      reviewerEmail: undefined,
      reviewerName: undefined,
    });

    // XỬ LÝ EMAIL: Ưu tiên từ body → fallback từ identity-service
    let userEmail: string | undefined = reviewerEmailFromBody;
    if (!userEmail) {
      try {
        userEmail = await this.usersClient.getUserEmail(userId);
        this.logger.log(`[INVITE] Lấy email từ identity-service thành công cho user ${userId}: ${userEmail}`);
      } catch (err) {
        this.logger.warn(`[INVITE] Không lấy được email từ identity-service cho user ${userId}: ${err.message}`);
        userEmail = undefined;
      }
    }

    // Lưu email + name vào entity
    invitation.reviewerEmail = userEmail;
    if (reviewerNameFromBody) {
      invitation.reviewerName = reviewerNameFromBody;
    }

    const saved = await this.invitationRepo.save(invitation);

    // Gửi email nếu có email hợp lệ
    if (userEmail && userEmail !== 'unknown@author.example.com') {
      try {
        await this.emailsService.sendReviewerInvitationEmail(userEmail, {
          name: userEmail.split('@')[0],
          conferenceName: conference.name,
          acceptLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${saved.id}/accept`,
          declineLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${saved.id}/decline`,
          invitationId: saved.id,
          conferenceId,
        });
        this.logger.log(`[INVITE] Đã gửi email mời reviewer thành công đến ${userEmail} (invitation ${saved.id})`);
      } catch (emailErr) {
        this.logger.error(`[INVITE] Lỗi gửi email mời đến ${userEmail}: ${emailErr.message}`);
      }
    } else {
      this.logger.warn(`[INVITE] Không gửi email mời cho user ${userId} vì không có email hợp lệ`);
    }

    await this.auditService.log(Number(conferenceId), chairId, 'INVITE_REVIEWER', 'Invitation', Number(saved.id) || null, null, { userId, conferenceId });

    return { message: 'Invitation sent successfully', invitationId: saved.id };
  }

  async acceptInvitation(invitationId: string, userId: number) {
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('User context is required to accept an invitation');
    }

    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['conference'],
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.userId !== userId) {
      throw new ForbiddenException('Not your invitation');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Already processed');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await this.invitationRepo.save(invitation);

    try {
      await this.usersClient.addRole(invitation.userId, 'REVIEWER');
      this.logger.log(`Role REVIEWER added to user ${invitation.userId}`);
    } catch (err) {
      this.logger.error(`Failed to add REVIEWER role to user ${invitation.userId}:`, err);
    }

    await this.auditService.log(Number(invitation.conferenceId), userId, 'ACCEPT_INVITATION', 'Invitation', Number(invitationId) || null);

    return { message: 'Accepted successfully. You are now a reviewer!' };
  }

  async declineInvitation(invitationId: string, userId: number) {
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('User context is required to decline an invitation');
    }

    const invitation = await this.invitationRepo.findOne({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.userId !== userId) {
      throw new ForbiddenException('Not your invitation');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Already processed');
    }

    invitation.status = InvitationStatus.DECLINED;
    invitation.declinedAt = new Date();
    await this.invitationRepo.save(invitation);

    await this.auditService.log(Number(invitation.conferenceId), userId, 'DECLINE_INVITATION', 'Invitation', Number(invitationId) || null);

    return { message: 'Invitation declined' };
  }

  async getAcceptedReviewers(conferenceId: string, chairId: number) {
    const conference = await this.conferencesService.findOne(Number(conferenceId));
    if (conference.organizerId !== chairId) throw new ForbiddenException('Only chair can view');

    const invitations = await this.invitationRepo.find({
      where: { conferenceId, status: InvitationStatus.ACCEPTED },
      order: { acceptedAt: 'DESC' },
    });

    return invitations.map(i => ({
      invitationId: i.id,
      userId: i.userId,
      acceptedAt: i.acceptedAt,
      topics: i.topics,
      // Fallback: nếu chưa có reviewerName thì lấy phần trước @ của email
      name: i.reviewerName ?? (i.reviewerEmail ? i.reviewerEmail.split('@')[0] : undefined),
      email: i.reviewerEmail,
    }));
  }

  async getMyPendingInvitations(userId: number) {
    return this.invitationRepo.find({
      where: { userId, status: InvitationStatus.PENDING },
      relations: ['conference'],
      order: { invitedAt: 'DESC' },
    });
  }

  async removeInvitation(invitationId: string, chairId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['conference'],
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.conference.organizerId !== chairId) throw new ForbiddenException('Only chair can remove');

    await this.invitationRepo.remove(invitation);
    await this.auditService.log(Number(invitation.conferenceId), chairId, 'REMOVE_INVITATION', 'Invitation', Number(invitationId) || null);

    return { message: 'Invitation removed' };
  }

  async updateTopics(invitationId: string, topics: string[], userId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.userId !== userId) {
      throw new ForbiddenException('You can only update your own invitation topics');
    }

    if (invitation.status !== InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Can only update topics after accepting the invitation');
    }

    if (!Array.isArray(topics)) {
      throw new BadRequestException('Topics must be an array');
    }

    if (topics.length > 20) {
      throw new BadRequestException('Maximum 20 topics allowed');
    }

    const uniqueTopics = [...new Set(topics.map(t => t.trim()).filter(t => t.length > 0))];

    invitation.topics = uniqueTopics;
    await this.invitationRepo.save(invitation);

    await this.auditService.log(Number(invitation.conferenceId), userId, 'UPDATE_INVITATION_TOPICS', 'Invitation', Number(invitationId) || null, null, { topics: uniqueTopics });

    return { message: 'Topics updated successfully', invitationId, topics: uniqueTopics };
  }

  async updateCoi(invitationId: string, coiUserIds: number[], coiInstitutions: string[], userId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.userId !== userId) {
      throw new ForbiddenException('You can only update your own invitation COI');
    }

    if (invitation.status !== InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Can only update COI after accepting the invitation');
    }

    if (!Array.isArray(coiUserIds) || coiUserIds.some(id => !Number.isInteger(id))) {
      throw new BadRequestException('coiUserIds must be an array of integers');
    }

    if (!Array.isArray(coiInstitutions) || coiInstitutions.some(inst => typeof inst !== 'string' || inst.trim().length === 0)) {
      throw new BadRequestException('coiInstitutions must be an array of non-empty strings');
    }

    const uniqueCoiUserIds = [...new Set(coiUserIds)];
    const uniqueCoiInstitutions = [...new Set(coiInstitutions.map(inst => inst.trim()))];

    invitation.coiUserIds = uniqueCoiUserIds;
    invitation.coiInstitutions = uniqueCoiInstitutions;
    await this.invitationRepo.save(invitation);

    await this.auditService.log(Number(invitation.conferenceId), userId, 'UPDATE_INVITATION_COI', 'Invitation', Number(invitationId) || null, null, {
      coiUserIds: uniqueCoiUserIds,
      coiInstitutions: uniqueCoiInstitutions,
    });

    return {
      message: 'COI updated successfully',
      invitationId,
      coiUserIds: uniqueCoiUserIds,
      coiInstitutions: uniqueCoiInstitutions,
    };
  }
}