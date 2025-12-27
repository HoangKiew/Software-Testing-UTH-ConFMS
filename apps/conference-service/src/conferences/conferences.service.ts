// apps/conference-service/src/conferences/conferences.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference, ConferenceStatus } from './entities/conference.entity';
import { Submission, SubmissionStatus } from '../submissions/entities/submission.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import PDFDocument from 'pdfkit'; // ĐÚNG – import default (fix lỗi constructable)

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,

    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
  ) {}

  async create(createDto: CreateConferenceDto, userId: number) {
    const conference = this.conferenceRepository.create({
      ...createDto,
      chairId: userId,
      status: ConferenceStatus.DRAFT,
      isActive: true,
      deadlines: createDto.deadlines || { submission: null, review: null, cameraReady: null },
      topics: createDto.topics || [],
      schedule: [],
      // ĐÃ XÓA 2 DÒNG GÂY LỖI (field không tồn tại trong DTO)
      // aiFeaturesEnabled: createDto.aiFeaturesEnabled ?? false,
      // openAccess: createDto.openAccess ?? false,
    });

    return this.conferenceRepository.save(conference);
  }

  async findAll(filter?: { status?: ConferenceStatus }) {
    const where: any = { isActive: true };
    if (filter?.status) where.status = filter.status;
    return this.conferenceRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const conference = await this.conferenceRepository.findOne({ where: { id } });
    if (!conference) throw new NotFoundException('Conference not found');
    return conference;
  }

  async update(id: string, updateDto: UpdateConferenceDto, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId)
      throw new ForbiddenException('Only the chair can update this conference');

    Object.assign(conference, updateDto);
    return this.conferenceRepository.save(conference);
  }

  async delete(id: string, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId)
      throw new ForbiddenException('Only the chair can delete this conference');
    conference.isActive = false;
    return this.conferenceRepository.save(conference);
  }

  async updateTopics(id: string, topics: string[], userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId)
      throw new ForbiddenException('Only the chair can update topics');
    conference.topics = topics;
    return this.conferenceRepository.save(conference);
  }

  async updateDeadlines(
    id: string,
    deadlines: { submission?: Date; review?: Date; cameraReady?: Date },
    userId: number,
  ) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId)
      throw new ForbiddenException('Only the chair can update deadlines');

    conference.deadlines = { ...conference.deadlines, ...deadlines };
    return this.conferenceRepository.save(conference);
  }

  async updateStatus(id: string, newStatus: ConferenceStatus, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId)
      throw new ForbiddenException('Only the chair can update status');

    const currentStatus = conference.status;

    // Map chuyển trạng thái hợp lệ – ĐẦY ĐỦ TẤT CẢ TRẠNG THÁI
    const validNextStatuses: Record<ConferenceStatus, ConferenceStatus[]> = {
      [ConferenceStatus.DRAFT]: [ConferenceStatus.OPEN_FOR_SUBMISSION],
      [ConferenceStatus.OPEN_FOR_SUBMISSION]: [ConferenceStatus.SUBMISSION_CLOSED],
      [ConferenceStatus.SUBMISSION_CLOSED]: [ConferenceStatus.UNDER_REVIEW],
      [ConferenceStatus.UNDER_REVIEW]: [ConferenceStatus.REVIEW_COMPLETED],
      [ConferenceStatus.REVIEW_COMPLETED]: [ConferenceStatus.DECISION_MADE],
      [ConferenceStatus.DECISION_MADE]: [ConferenceStatus.CAMERA_READY],
      [ConferenceStatus.CAMERA_READY]: [ConferenceStatus.FINALIZED],
      [ConferenceStatus.FINALIZED]: [ConferenceStatus.ARCHIVED],
      [ConferenceStatus.ARCHIVED]: [],
    };

    const allowed = validNextStatuses[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: from "${currentStatus}" cannot go to "${newStatus}"`
      );
    }

    conference.status = newStatus;
    return this.conferenceRepository.save(conference);
  }

  async exportProceedings(conferenceId: string) {
    const accepted = await this.submissionRepository.find({
      where: { conferenceId, status: SubmissionStatus.ACCEPTED },
      select: ['title', 'authors', 'abstract', 'keywords'],
    });

    const csvLines = [
      ['Title', 'Authors', 'Abstract', 'Keywords'],
      ...accepted.map((s) => [
        s.title,
        Array.isArray(s.authors) ? s.authors.join('; ') : '',
        `"${(s.abstract || '').replace(/"/g, '""')}"`,
        s.keywords || '',
      ]),
    ];

    const csv = csvLines.map((row) => row.join(',')).join('\n');

    return {
      data: csv,
      filename: `proceedings_${conferenceId}.csv`,
      contentType: 'text/csv',
    };
  }

  async exportProceedingsPdf(conferenceId: string): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {}); // Đảm bảo event end được lắng nghe

    const accepted = await this.submissionRepository.find({
      where: { conferenceId, status: SubmissionStatus.ACCEPTED },
      order: { title: 'ASC' },
    });

    doc.fontSize(24).text('Conference Proceedings', { align: 'center' });
    doc.moveDown(2);

    if (accepted.length === 0) {
      doc.fontSize(16).text('No accepted submissions.', { align: 'center' });
    } else {
      accepted.forEach((s, i) => {
        doc.fontSize(18).text(`${i + 1}. ${s.title || 'Untitled'}`);
        doc.fontSize(12).text(`Authors: ${Array.isArray(s.authors) ? s.authors.join(', ') : 'Unknown'}`);
        doc.fontSize(11).text('Abstract:', { continued: false });
        doc.text(s.abstract || 'No abstract available.', { indent: 20 });
        doc.moveDown(2);
      });
    }

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        try {
          resolve(Buffer.concat(buffers));
        } catch (err) {
          reject(err);
        }
      });
      doc.on('error', reject);
    });
  }

  async updateSchedule(id: string, schedule: any, userId: number) {
    const conf = await this.findOne(id);
    if (conf.chairId !== userId)
      throw new ForbiddenException('Only the chair can update schedule');
    conf.schedule = schedule;
    return this.conferenceRepository.save(conf);
  }

  async findPublic() {
    return this.conferenceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPublicOne(id: string) {
    const conf = await this.findOne(id);
    if (!conf.isActive) {
      throw new ForbiddenException('Conference is not public');
    }
    return conf;
  }
}