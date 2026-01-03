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
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateTopicsDto } from './dto/update-topics.dto';
import { UpdateDeadlinesDto } from './dto/update-deadlines.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateTrackDto } from './dto/create-track.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/enums/role-name.enum';
import { RolesGuard } from '../common/guards/roles.guard';
//import type { JwtPayload } from '../common/guards/roles.guard';  //của bảo

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { ConferenceStatus } from './entities/conference.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Conferences')
@ApiBearerAuth('JWT-auth')
@Controller('conferences')
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  // ================= PUBLIC API =================

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách hội nghị công khai' })
  @ApiResponse({ status: 200, description: 'Danh sách hội nghị công khai' })
  getPublicConferences() {
    return this.conferencesService.findPublic();
  }

  @Get('public/conference/:id')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết hội nghị công khai' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Thông tin hội nghị' })
  getPublicConference(@Param('id') id: string) {
    return this.conferencesService.findPublicOne(id);
  }

  @Get('public/conference/:id/program')
  @Public()
  @ApiOperation({
    summary: 'Lấy chương trình (schedule) của hội nghị công khai',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Tên hội nghị và lịch trình' })
  async getPublicProgram(@Param('id') id: string) {
    const conf = await this.conferencesService.findPublicOne(id);
    return {
      name: conf.name,
      schedule: conf.schedule,
    };
  }

  // ================= PRIVATE API =================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Tạo hội nghị mới' })
  @ApiBody({ type: CreateConferenceDto })
  @ApiResponse({ status: 201, description: 'Hội nghị được tạo thành công' })
  create(
    @Body() createDto: CreateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.create(createDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách hội nghị (lọc theo status nếu có)' })
  @ApiQuery({ name: 'status', enum: ConferenceStatus, required: false })
  @ApiResponse({ status: 200, description: 'Danh sách hội nghị' })
  findAll(@Query('status') status?: ConferenceStatus) {
    return this.conferencesService.findAll(status ? { status } : {});
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Thông tin hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.conferencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Cập nhật thông tin chung hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiBody({ type: UpdateConferenceDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.update(id, updateDto, userId);
  }

  @Patch(':id/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Cập nhật danh sách chủ đề' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiBody({ type: UpdateTopicsDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateTopics(
    @Param('id') id: string,
    @Body() dto: UpdateTopicsDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateTopics(id, dto.topics, userId);
  }

  @Patch(':id/deadlines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Cập nhật deadlines' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiBody({ type: UpdateDeadlinesDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateDeadlines(
    @Param('id') id: string,
    @Body() dto: UpdateDeadlinesDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateDeadlines(
      id,
      {
        submission: dto.submission ? new Date(dto.submission) : undefined,
        review: dto.review ? new Date(dto.review) : undefined,
        cameraReady: dto.cameraReady ? new Date(dto.cameraReady) : undefined,
      },
      userId,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Cập nhật trạng thái hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateStatus(id, dto.status, userId);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Cập nhật schedule' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiBody({ type: UpdateScheduleDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateSchedule(id, dto.schedule, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Xóa hội nghị (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  delete(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.conferencesService.delete(id, userId);
  }

  // ================= TRACK ENDPOINTS =================

  @Post(':id/tracks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiOperation({ summary: 'Tạo track mới cho hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiBody({ type: CreateTrackDto })
  @ApiResponse({ status: 201, description: 'Track được tạo thành công' })
  async createTrack(
    @Param('id') conferenceId: string,
    @Body() dto: CreateTrackDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.createTrack(conferenceId, dto, userId);
  }

  @Get(':id/tracks')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách tracks của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Danh sách tracks' })
  async getTracks(@Param('id') conferenceId: string) {
    return this.conferencesService.getTracks(conferenceId);
  }
}
