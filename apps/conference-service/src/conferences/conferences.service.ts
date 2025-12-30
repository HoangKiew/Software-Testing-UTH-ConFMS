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
import { Track } from './entities/track.entity';                    // ← THÊM IMPORT
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { CreateTrackDto } from './dto/create-track.dto';              // ← THÊM IMPORT

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)                                     // ← THÊM REPOSITORY
    private trackRepository: Repository<Track>,
  ) {}

  async create(createDto: CreateConferenceDto, userId: number) {
    const conference = this.conferenceRepository.create({
      ...createDto,
      chairId: userId,
      status: ConferenceStatus.DRAFT,
      isActive: true,
      deadlines: createDto.deadlines || {
        submission: null,
        review: null,
        cameraReady: null,
      },
      topics: createDto.topics || [],
      schedule: [],
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
    if (conference.chairId !== userId) {
      throw new ForbiddenException('Only the chair can update this conference');
    }

    Object.assign(conference, updateDto);
    return this.conferenceRepository.save(conference);
  }

  async delete(id: string, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) {
      throw new ForbiddenException('Only the chair can delete this conference');
    }

    conference.isActive = false;
    return this.conferenceRepository.save(conference);
  }

  async updateTopics(id: string, topics: string[], userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) {
      throw new ForbiddenException('Only the chair can update topics');
    }

    conference.topics = topics;
    return this.conferenceRepository.save(conference);
  }

  async updateDeadlines(
    id: string,
    deadlines: { submission?: Date; review?: Date; cameraReady?: Date },
    userId: number,
  ) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) {
      throw new ForbiddenException('Only the chair can update deadlines');
    }

    conference.deadlines = { ...conference.deadlines, ...deadlines };
    return this.conferenceRepository.save(conference);
  }

  async updateStatus(id: string, newStatus: ConferenceStatus, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) {
      throw new ForbiddenException('Only the chair can update status');
    }

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

    const allowed = validNextStatuses[conference.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from "${conference.status}" to "${newStatus}"`,
      );
    }

    conference.status = newStatus;
    return this.conferenceRepository.save(conference);
  }

  async updateSchedule(id: string, schedule: any, userId: number) {
    const conf = await this.findOne(id);
    if (conf.chairId !== userId) {
      throw new ForbiddenException('Only the chair can update schedule');
    }

    conf.schedule = schedule;
    return this.conferenceRepository.save(conf);
  }

  // ================= FIX LỖI 500 PUBLIC API =================
  async findPublic() {
    return this.conferenceRepository
      .createQueryBuilder('conference')
      .select([
        'conference.id',
        'conference.name',
        'conference.acronym',
        'conference.description',
        'conference.startDate',
        'conference.endDate',
        'conference.topics',
        'conference.deadlines',
        'conference.status',
        'conference.isActive',
        'conference.createdAt',
        'conference.updatedAt',
        'conference.schedule',
        'conference.openAccess',
        'conference.aiFeaturesEnabled',
        'conference.aiConfig',
      ])
      .where('conference.isActive = :isActive', { isActive: true })
      .orderBy('conference.createdAt', 'DESC')
      .getMany();
  }

  async findPublicOne(id: string) {
    const conf = await this.conferenceRepository
      .createQueryBuilder('conference')
      .select([
        'conference.id',
        'conference.name',
        'conference.acronym',
        'conference.description',
        'conference.startDate',
        'conference.endDate',
        'conference.topics',
        'conference.deadlines',
        'conference.status',
        'conference.isActive',
        'conference.createdAt',
        'conference.updatedAt',
        'conference.schedule',
        'conference.openAccess',
        'conference.aiFeaturesEnabled',
        'conference.aiConfig',
      ])
      .where('conference.id = :id AND conference.isActive = :isActive', {
        id,
        isActive: true,
      })
      .getOne();

    if (!conf) {
      throw new ForbiddenException('Conference is not public');
    }

    return conf;
  }

  // ================= TRACK MANAGEMENT =================

  /**
   * Tạo track mới cho một hội nghị
   */
  async createTrack(conferenceId: string, dto: CreateTrackDto, userId: number) {
    const conference = await this.findOne(conferenceId);

    if (conference.chairId !== userId) {
      throw new ForbiddenException('Only the conference chair can create tracks');
    }

    const track = this.trackRepository.create({
      name: dto.name,
      conference: conference,
    });

    return this.trackRepository.save(track);
  }

  /**
   * Lấy danh sách tracks của một hội nghị
   */
  async getTracks(conferenceId: string) {
    // Kiểm tra hội nghị tồn tại (ném 404 nếu không)
    await this.findOne(conferenceId);

    return this.trackRepository.find({
      where: { conference: { id: conferenceId } },
      order: { name: 'ASC' },
    });
  }
}