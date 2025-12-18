// apps/conference-service/src/submissions/submissions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { ConferencesService } from '../conferences/conferences.service';
import { ConferenceStatus } from '../conferences/entities/conference.entity';  // ← THÊM DÒNG NÀY

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    private conferencesService: ConferencesService,
  ) {}

  async create(createDto: CreateSubmissionDto, userId: number) {
    const conference = await this.conferencesService.findOne(createDto.conferenceId);
    if (conference.status !== ConferenceStatus.OPEN_FOR_SUBMISSION) {
      throw new ForbiddenException('Conference not open for submissions');
    }

    const submission = new Submission();
    Object.assign(submission, createDto);
    if (!submission.authors.includes(userId)) {
      submission.authors.push(userId);
    }
    return this.submissionRepository.save(submission);
  }

  async findAllByConference(conferenceId: string) {
    return this.submissionRepository.find({ where: { conferenceId } });
  }

  async findOne(id: string) {
    const submission = await this.submissionRepository.findOne({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  async update(id: string, updateDto: UpdateSubmissionDto, userId: number) {
    const submission = await this.findOne(id);
    if (!submission.authors.includes(userId)) {
      throw new ForbiddenException('Only authors can update this submission');
    }
    Object.assign(submission, updateDto);
    return this.submissionRepository.save(submission);
  }

  async delete(id: string, userId: number) {
    const submission = await this.findOne(id);
    if (!submission.authors.includes(userId)) {
      throw new ForbiddenException('Only authors can delete this submission');
    }
    return this.submissionRepository.remove(submission);
  }
}