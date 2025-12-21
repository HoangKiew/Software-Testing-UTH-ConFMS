// src/conferences/conferences.controller.ts
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

@Controller('conferences')
@UseGuards(JwtAuthGuard)
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async create(
    @Body() createDto: CreateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.create(createDto, userId);
  }

  @Get()
  async findAll(@Query('status') status?: ConferenceStatus) {
    return this.conferencesService.findAll(status ? { status } : {});
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conferencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.delete(id, userId);
  }

  @Patch(':id/topics')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateTopics(
    @Param('id') id: string,
    @Body('topics') topics: string[],
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateTopics(id, topics, userId);
  }

  @Patch(':id/deadlines')
  @UseGuards(RolesGuard)
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
    // Chuyển đổi string ISO → Date, giữ undefined nếu không có field
    const deadlines = {
      submission: deadlinesDto.submission ? new Date(deadlinesDto.submission) : undefined,
      review: deadlinesDto.review ? new Date(deadlinesDto.review) : undefined,
      cameraReady: deadlinesDto.cameraReady ? new Date(deadlinesDto.cameraReady) : undefined,
    };

    return this.conferencesService.updateDeadlines(id, deadlines, userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') newStatus: ConferenceStatus,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateStatus(id, newStatus, userId);
  }
}