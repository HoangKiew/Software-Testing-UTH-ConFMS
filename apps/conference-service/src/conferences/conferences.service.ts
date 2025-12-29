import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference } from './entities/conference.entity';
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
      startDate,
      endDate,
      venue: dto.venue,
      organizerId,
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

  async findOneWithTracks(id: number): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: { id },
      relations: ['tracks'],
    });

    if (!conference) {
      throw new NotFoundException(`Conference with id ${id} not found`);
    }

    return conference;
  }

  async addTrack(
    conferenceId: number,
    dto: CreateTrackDto,
  ): Promise<Track> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

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

