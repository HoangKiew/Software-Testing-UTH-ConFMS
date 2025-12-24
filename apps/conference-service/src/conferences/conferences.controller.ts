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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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

  // Tạo hội nghị – ADMIN & CHAIR
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async create(
    @Body() createDto: CreateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.create(createDto, userId);
  }

  // Lấy danh sách (có filter status)
  @Get()
  async findAll(@Query('status') status?: ConferenceStatus) {
    return this.conferencesService.findAll(status ? { status } : {});
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conferencesService.findOne(id);
  }

  // Cập nhật chung
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

  // Soft delete
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.delete(id, userId);
  }

  // Quản lý riêng topics, deadlines, status, schedule
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

  @Patch(':id/schedule')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async updateSchedule(
    @Param('id') id: string,
    @Body('schedule') schedule: any,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateSchedule(id, schedule, userId);
  }

  // === SIÊU PHẨM: Endpoint thống nhất xuất kỷ yếu ===
  @Get(':id/export-proceedings')
  @UseGuards(RolesGuard)
  @Roles(RoleName.CHAIR)
  async exportProceedings(
    @Param('id') id: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    if (format === 'pdf') {
      const buffer = await this.conferencesService.exportProceedingsPdf(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proceedings_${id}.pdf"`,
      });
      return res.send(buffer);
    }

    const csv = await this.conferencesService.exportProceedings(id);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${csv.filename}"`,
    });
    return res.send(csv.data);
  }

  // (Tùy chọn) Giữ endpoint cũ để backward compatible
  // @Get(':id/export-proceedings/pdf') ...
  // conferences.controller.ts – thêm các route public

  @Get('public')
  async getPublicConferences() {
    return this.conferencesService.findPublic(); // chỉ hội nghị isActive && status không phải DRAFT
  }

  @Get('public/:id')
  async getPublicConference(@Param('id') id: string) {
    return this.conferencesService.findPublicOne(id);
  }

  @Get('public/:id/program')
  async getPublicProgram(@Param('id') id: string) {
    const conf = await this.conferencesService.findOne(id);
    return { name: conf.name, schedule: conf.schedule };
  }

  @Get('public/:id/proceedings')
  async getPublicProceedings(@Param('id') id: string, @Query('format') format: 'csv' | 'pdf' = 'csv', @Res() res: Response) {
    // Tương tự exportProceedings nhưng không check role
    // Có thể thêm flag openAccess trong entity để kiểm soát
  }
}