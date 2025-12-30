import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference, ConferenceStatus } from './entities/conference.entity';
import { Track } from './entities/track.entity';
import {
  ConferenceMember,
  ConferenceMemberRole,
} from './entities/conference-member.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { CreateTrackDto } from './dto/create-track.dto';

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private readonly conferenceMemberRepository: Repository<ConferenceMember>,
  ) {}

  async createConference(
    dto: CreateConferenceDto,
    organizerId: number,
  ): Promise<Conference> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const conference = this.conferenceRepository.create({
      name: dto.name,
      acronym: dto.name.split(' ').map((s) => s[0]).join('').toUpperCase(),
      description: null,
      startDate,
      endDate,
      topics: [],
      deadlines: { submission: null, review: null, cameraReady: null },
      status: ConferenceStatus.DRAFT,
      chairId: organizerId,
      isActive: true,
      schedule: [],
      aiFeaturesEnabled: false,
      aiConfig: { emailDraft: true, keywordSuggestion: true, neutralSummary: true },
      openAccess: false,
    });

    const savedConference = await this.conferenceRepository.save(conference);

    // Add organizer as CHAIR in conference members
    const organizerMember = this.conferenceMemberRepository.create({
      conference: savedConference,
      userId: organizerId,
      role: ConferenceMemberRole.CHAIR,
    });
    await this.conferenceMemberRepository.save(organizerMember);

    return savedConference;
  }

  async findAll(): Promise<Conference[]> {
    return this.conferenceRepository.find();
  }

  async findOneWithTracks(id: string): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: { id },
      relations: ['tracks'],
    });

    if (!conference) {
      throw new NotFoundException(`Conference with id ${id} not found`);
    }

    return conference;
  }

  async findOne(id: string): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({ where: { id } });
    if (!conference) {
      throw new NotFoundException(`Conference with id ${id} not found`);
    }
    return conference;
  }

  async updateStatus(conferenceId: string, status: ConferenceStatus, chairId: number) {
    const conference = await this.findOne(conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can update conference status');
    }
    conference.status = status;
    return this.conferenceRepository.save(conference);
  }

  async addTrack(conferenceId: string, dto: CreateTrackDto): Promise<Track> {
    const conference = await this.conferenceRepository.findOne({ where: { id: conferenceId } });

    if (!conference) {
      throw new NotFoundException(
        `Conference with id ${conferenceId} not found`,
      );
    }

    const track = this.trackRepository.create({
      name: dto.name,
      conference,
    });

    return this.trackRepository.save(track);
  }
}

