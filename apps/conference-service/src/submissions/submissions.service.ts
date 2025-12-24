// apps/conference-service/src/submissions/submissions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { ConferencesService } from '../conferences/conferences.service';
import { ConferenceStatus } from '../conferences/entities/conference.entity';
// Nếu SubmissionStatus đã có trong submission.entity thì import ở đây
import { SubmissionStatus } from './entities/submission.entity';

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

  // GIỮ LẠI CHỈ 1 METHOD – PHIÊN BẢN CÓ ORDER DESC ĐỂ ĐẸP HƠN
  async findAllByConference(conferenceId: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { conferenceId },
      order: { createdAt: 'DESC' },
    });
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

  async uploadCameraReady(id: string, fileUrl: string, userId: number) {
    const submission = await this.findOne(id);
    if (!submission.authors.includes(userId)) throw new ForbiddenException('Only authors can upload camera-ready');

    submission.files.final = fileUrl;
    submission.cameraReadyUploaded = true;

    // Nếu SubmissionStatus chưa có CAMERA_READY thì tạm comment
    // submission.status = SubmissionStatus.CAMERA_READY;

    return this.submissionRepository.save(submission);
  }
}