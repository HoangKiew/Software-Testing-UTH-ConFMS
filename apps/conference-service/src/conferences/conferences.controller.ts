import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConferencesService } from './conferences.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { AddTrackMemberDto } from './dto/add-track-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Conferences')
@Controller('conferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}
// Tạo cuộc thi mới
  @Post()
  @ApiOperation({ 
    summary: 'Tạo hội nghị mới',
    description: 'Tạo một hội nghị mới. Người tạo sẽ tự động trở thành CHAIR của hội nghị.'
  })
  @ApiResponse({ status: 201, description: 'Tạo hội nghị thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConferenceDto,
  ) {
    const conference = await this.conferencesService.createConference(dto, user.sub);

    return {
      message: 'Tạo hội nghị thành công',
      data: conference,
    };
  }
// Lấy tất cả cuộc thi
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async findAll() {
    const conferences = await this.conferencesService.findAll();
    const conferencesWithDeadlines = conferences.map((conference) => ({
      ...conference,
      submissionDeadline: conference.cfpSetting?.submissionDeadline?.toISOString(),
      reviewDeadline: conference.cfpSetting?.reviewDeadline?.toISOString(),
      notificationDate: conference.cfpSetting?.notificationDate?.toISOString(),
      cameraReadyDeadline: conference.cfpSetting?.cameraReadyDeadline?.toISOString(),
    }));
    return {
      message: 'Lấy danh sách hội nghị thành công',
      data: conferencesWithDeadlines,
    };
  }
  // Lấy danh sách chủ đề được phân công cho reviewer hiện tại
  @Get('reviewer/my-track-assignments')
  @ApiOperation({ summary: 'Lấy danh sách chủ đề được phân công cho reviewer hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phân công thành công' })
  async getMyTrackAssignments(@CurrentUser() user: JwtPayload) {
    const assignments = await this.conferencesService.getMyTrackAssignments(user.sub);
    return { message: 'Lấy danh sách phân công thành công', data: assignments };
  }
  // Lấy chi tiết một cuộc thi
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const conference = await this.conferencesService.findOne(id);
    const conferenceData = {
      ...conference,
      submissionDeadline: conference.cfpSetting?.submissionDeadline?.toISOString(),
      reviewDeadline: conference.cfpSetting?.reviewDeadline?.toISOString(),
      notificationDate: conference.cfpSetting?.notificationDate?.toISOString(),
      cameraReadyDeadline: conference.cfpSetting?.cameraReadyDeadline?.toISOString(),
    };
    
    return {
      message: 'Lấy thông tin hội nghị thành công',
      data: conferenceData,
    };
  }
  // Lấy danh sách các chủ đề của cuộc thi đó
  @Get(':id/tracks')
  @ApiOperation({ summary: 'Lấy danh sách tracks của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách tracks thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getTracks(@Param('id', ParseIntPipe) id: number) {
    const tracks = await this.conferencesService.findAllTracks(id);
    return {
      message: 'Lấy danh sách tracks thành công',
      data: tracks,
    };
  }
// Thêm chủ đề vào cuộc thi đó
  @Post(':id/tracks')
  @ApiOperation({ 
    summary: 'Thêm track vào hội nghị',
    description: 'Thêm một track (lĩnh vực/chủ đề) mới vào hội nghị.',
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Thêm track thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  async addTrack(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateTrackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const track = await this.conferencesService.addTrack(id, body.name, {
      id: user.sub,
      roles: user.roles ?? [],
    });

    return {
      message: 'Thêm track thành công',
      data: track,
    };
  }
//  Thiết lập mốc thời gian deadline cho cuộc thi
  @Post(':id/cfp')
  @ApiOperation({ 
    summary: 'Thiết lập các mốc thời gian CFP (Call for Papers)',
    description: 'Thiết lập hoặc cập nhật các mốc thời gian quan trọng cho CFP của hội nghị.',
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Thiết lập CFP thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (thứ tự deadline không đúng)' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async setCfp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetCfpSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cfp = await this.conferencesService.setCfpSettings(id, dto, {
      id: user.sub,
      roles: user.roles ?? [],
    });

    return {
      message: 'Cập nhật mốc thời gian CFP thành công',
      data: cfp,
    };
  }
// Cập nhật thông tin cuộc thi đó
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin hội nghị',
    description: 'Cập nhật thông tin hội nghị. Tất cả các trường đều tùy chọn, chỉ cần gửi các trường muốn cập nhật.',
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Cập nhật hội nghị thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async updateConference(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConferenceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updated = await this.conferencesService.updateConference(id, dto, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return {
      message: 'Cập nhật hội nghị thành công',
      data: updated,
    };
  }
// Xóa cuộc thi đó
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Xóa hội nghị thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async deleteConference(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.deleteConference(id, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return {
      message: 'Xóa hội nghị thành công',
    };
  }
// Cập nhật thông tin track (lĩnh vực/chủ đề)
  @Patch(':conferenceId/tracks/:trackId')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin track (lĩnh vực/chủ đề)',
    description: 'Cập nhật tên của track. Tất cả các trường đều tùy chọn.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'trackId', description: 'ID của track cần cập nhật' })
  @ApiResponse({ status: 200, description: 'Cập nhật track thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc track' })
  async updateTrack(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('trackId', ParseIntPipe) trackId: number,
    @Body() dto: UpdateTrackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updated = await this.conferencesService.updateTrack(
      conferenceId,
      trackId,
      dto,
      { id: user.sub, roles: user.roles ?? [] },
    );
    return {
      message: 'Cập nhật track thành công',
      data: updated,
    };
  }
// Xóa track (lĩnh vực/chủ đề) khỏi cuộc thi
  @Delete(':conferenceId/tracks/:trackId')
  @ApiOperation({ summary: 'Xóa track (lĩnh vực/chủ đề) khỏi hội nghị' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'trackId', description: 'ID của track cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa track thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa track vì đã có bài nộp' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc track' })
  async deleteTrack(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    await this.conferencesService.deleteTrack(
      conferenceId,
      trackId,
      {
        id: user.sub,
        roles: user.roles ?? [],
      },
      authToken,
    );
    return { message: 'Xóa track thành công' };
  }
//  Lấy danh sách thành viên ban chương trình của chủ đề
  @Get('tracks/:trackId/reviewer/:reviewerId/check-assignment')
  @ApiOperation({ summary: 'Kiểm tra reviewer đã chấp nhận track assignment chưa' })
  @ApiParam({ name: 'trackId', description: 'ID của chủ đề' })
  @ApiParam({ name: 'reviewerId', description: 'ID của reviewer' })
  @ApiResponse({ status: 200, description: 'Kiểm tra thành công' })
  async checkReviewerTrackAssignment(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Param('reviewerId', ParseIntPipe) reviewerId: number,
  ) {
    const result = await this.conferencesService.checkReviewerTrackAssignment(reviewerId, trackId);
    return { message: 'Kiểm tra thành công', data: result };
  }
//  Lấy danh sách thành viên ban chương trình của chủ đề
  @Get('tracks/:trackId/members')
  @ApiOperation({ summary: 'Lấy danh sách thành viên ban chương trình của chủ đề' })
  @ApiParam({ name: 'trackId', description: 'ID của chủ đề' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành viên thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề' })
  async listTrackMembers(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const members = await this.conferencesService.listTrackMembers(trackId, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return { message: 'Lấy danh sách thành viên thành công', data: members };
  }
// Thêm thành viên ban chương trình vào chủ đề
  @Post('tracks/:trackId/members')
  @ApiOperation({ 
    summary: 'Thêm thành viên ban chương trình vào chủ đề',
    description: 'Thêm một user vào chủ đề với vai trò PC member.'
  })
  @ApiParam({ name: 'trackId', description: 'ID của chủ đề' })
  @ApiResponse({ status: 201, description: 'Thêm thành viên thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc user đã là thành viên' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề' })
  async addTrackMember(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Body() dto: AddTrackMemberDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;
    const member = await this.conferencesService.addTrackMember(trackId, dto, {
      id: user.sub,
      roles: user.roles ?? [],
    }, authToken);
    return { message: 'Thêm thành viên thành công vào chủ đề', data: member };
  }
//  Xóa thành viên khỏi chủ đề
  @Delete('tracks/:trackId/members/:userId')
  @ApiOperation({ summary: 'Xóa thành viên khỏi chủ đề' })
  @ApiParam({ name: 'trackId', description: 'ID của chủ đề' })
  @ApiParam({ name: 'userId', description: 'ID của user cần xóa khỏi chủ đề' })
  @ApiResponse({ status: 200, description: 'Xóa thành viên thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề hoặc thành viên' })
  async removeTrackMember(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    await this.conferencesService.removeTrackMember(trackId, userId, {
      id: user.sub,
      roles: user.roles ?? [],
    }, authToken);
    return { message: 'Xóa thành viên thành công' };
  }
// Chấp nhận phân công chủ đề
  @Post('tracks/:trackId/accept')
  @ApiOperation({ summary: 'Chấp nhận phân công chủ đề' })
  @ApiParam({ name: 'trackId', description: 'ID của chủ đề' })
  @ApiResponse({ status: 200, description: 'Chấp nhận phân công thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phân công' })
  @ApiResponse({ status: 400, description: 'Phân công đã được xử lý' })
  async acceptTrackAssignment(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const member = await this.conferencesService.acceptTrackAssignment(trackId, user.sub);
    return { message: 'Chấp nhận phân công thành công', data: member };
  }
//  Từ chối phân công chủ đề
  @Post('tracks/:trackId/reject')
  @ApiOperation({ summary: 'Từ chối phân công chủ đề' })
  @ApiParam({ name: 'trackId', description: 'ID của chủ đề' })
  @ApiResponse({ status: 200, description: 'Từ chối phân công thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phân công' })
  @ApiResponse({ status: 400, description: 'Phân công đã được xử lý' })
  async rejectTrackAssignment(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const member = await this.conferencesService.rejectTrackAssignment(trackId, user.sub);
    return { message: 'Từ chối phân công thành công', data: member };
  }
}
