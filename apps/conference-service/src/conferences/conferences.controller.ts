// apps/conference-service/src/conferences/conferences.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConferencesService } from './conferences.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConferenceStatus } from './entities/conference.entity';
import { RoleName } from '../common/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Conferences')
@ApiBearerAuth('JWT-auth')
@Controller('conferences')
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createDto: CreateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.create(createDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('status') status?: ConferenceStatus) {
    return this.conferencesService.findAll(status ? { status } : {});
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.conferencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.update(id, updateDto, userId);
  }

  @Patch(':id/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateTopics(
    @Param('id') id: string,
    @Body('topics') topics: string[],
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateTopics(id, topics, userId);
  }

  @Patch(':id/deadlines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateDeadlines(
    @Param('id') id: string,
    @Body()
    deadlinesDto: {
      submission?: string;
      review?: string;
      cameraReady?: string;
    },
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateDeadlines(
      id,
      {
        submission: deadlinesDto.submission ? new Date(deadlinesDto.submission) : undefined,
        review: deadlinesDto.review ? new Date(deadlinesDto.review) : undefined,
        cameraReady: deadlinesDto.cameraReady ? new Date(deadlinesDto.cameraReady) : undefined,
      },
      userId,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') newStatus: ConferenceStatus,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateStatus(id, newStatus, userId);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateSchedule(
    @Param('id') id: string,
    @Body('schedule') schedule: any,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateSchedule(id, schedule, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  async delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.delete(id, userId);
  }

  // ================= PUBLIC API (KHÔNG CẦN TOKEN) =================
  @Get('public')
  async getPublicConferences() {
    return this.conferencesService.findPublic();
  }

  @Get('public/conference/:id')  // ← ĐỔI THỨ TỰ ĐỂ TRÁNH MATCH NHẦM
  async getPublicConference(@Param('id') id: string) {
    return this.conferencesService.findPublicOne(id);
  }

  @Get('public/conference/:id/program')  // ← ĐỔI THỨ TỰ
  async getPublicProgram(@Param('id') id: string) {
    const conf = await this.conferencesService.findPublicOne(id);
    return {
      name: conf.name,
      schedule: conf.schedule,
    };
  }
}