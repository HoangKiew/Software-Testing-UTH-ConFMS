// src/conferences/conferences.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference, ConferenceStatus } from './entities/conference.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
  ) {}

  async create(createDto: CreateConferenceDto, userId: number) {  // Đổi userId sang number
    const conference = new Conference();
    Object.assign(conference, createDto);
    conference.chairId = userId;
    conference.status = ConferenceStatus.DRAFT;
    conference.isActive = true;
    return this.conferenceRepository.save(conference);
  }

  async findAll(filter?: { status?: ConferenceStatus }) {
    const where = { isActive: true };
    if (filter?.status) where['status'] = filter.status;
    return this.conferenceRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const conference = await this.conferenceRepository.findOne({ where: { id } });
    if (!conference) throw new NotFoundException('Conference not found');
    return conference;
  }

  async update(id: string, updateDto: UpdateConferenceDto, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) throw new ForbiddenException('Only the chair can update this conference');
    Object.assign(conference, updateDto);
    return this.conferenceRepository.save(conference);
  }

  async delete(id: string, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) throw new ForbiddenException('Only the chair can delete this conference');
    conference.isActive = false;  // Soft delete
    return this.conferenceRepository.save(conference);
  }

  async updateTopics(id: string, topics: string[], userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) throw new ForbiddenException('Only the chair can update topics');
    conference.topics = topics;
    return this.conferenceRepository.save(conference);
  }

  async updateDeadlines(id: string, deadlines: { submission?: Date, review?: Date, cameraReady?: Date }, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) throw new ForbiddenException('Only the chair can update deadlines');
    conference.deadlines = { ...conference.deadlines, ...deadlines };
    return this.conferenceRepository.save(conference);
  }

  async updateStatus(id: string, newStatus: ConferenceStatus, userId: number) {
    const conference = await this.findOne(id);
    if (conference.chairId !== userId) throw new ForbiddenException('Only the chair can update status');
    // Validation transition đơn giản (ví dụ: chỉ tăng dần)
    const statusOrder = Object.values(ConferenceStatus);
    if (statusOrder.indexOf(newStatus) <= statusOrder.indexOf(conference.status)) {
      throw new BadRequestException('Invalid status transition');
    }
    conference.status = newStatus;
    return this.conferenceRepository.save(conference);
  }
}