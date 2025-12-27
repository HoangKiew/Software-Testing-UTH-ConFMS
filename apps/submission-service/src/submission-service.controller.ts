import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionServiceService } from './submission-service.service';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { UpdateStatusDto } from './dtos/update-status.dto';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import type { Express } from 'express';

@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionServiceController {
  constructor(private readonly submissionService: SubmissionServiceService) { }

  // --- 1. API NỘP BÀI (POST) ---
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @Roles('AUTHOR', 'CHAIR', 'ADMIN')
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|word|zip)/ }),
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
    @Body() createDto: CreateSubmissionDto,
    @Request() req,
  ) {
    // Lấy User ID từ Token
    createDto.createdBy = req.user.userId;

    // Xử lý type conversion cho conferenceId (do formData gửi lên là string)
    if (typeof createDto.conferenceId === 'string') {
      createDto.conferenceId = parseInt(createDto.conferenceId, 10);
    }

    return this.submissionService.handleSubmission(file, createDto);
  }

  // --- 2. API LẤY DANH SÁCH BÀI NỘP CỦA USER (GET) ---
  @Get('user/me')
  @Roles('AUTHOR', 'CHAIR')
  async getMySubmissions(@Request() req) {
    const userId = req.user.id;
    return this.submissionService.getSubmissionsByUser(userId);
  }

  // Giữ lại API cũ admin có thể dùng
  @Get('user/:userId')
  @Roles('CHAIR')
  async getByUserId(@Param('userId') userId: string) {
    return this.submissionService.getSubmissionsByUser(Number(userId));
  }

  // --- 3. API LẤY CHI TIẾT MỘT SUBMISSION (GET) ---
  @Get(':id')
  @Roles('AUTHOR', 'CHAIR')
  async getSubmissionById(@Param('id') id: string, @Request() req) {
    return this.submissionService.getSubmissionById(
      Number(id),
      req.user.userId,
      req.user.roles
    );
  }

  // --- 4. API LẤY DANH SÁCH SUBMISSIONS THEO CONFERENCE (GET) ---
  @Get('conference/:conferenceId')
  @Roles('CHAIR')
  async getByConference(@Param('conferenceId') conferenceId: string) {
    return this.submissionService.getSubmissionsByConference(Number(conferenceId));
  }

  // --- 5. API CẬP NHẬT METADATA SUBMISSION (AUTHOR ONLY) ---
  @Patch(':id')
  @Roles('AUTHOR')
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubmissionDto,
    @Request() req
  ) {
    return this.submissionService.updateSubmission(
      Number(id),
      req.user.userId,
      updateDto
    );
  }

  // --- 6. API CẬP NHẬT TRẠNG THÁI SUBMISSION (PATCH) ---
  @Patch(':id/status')
  @Roles('CHAIR')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req
  ) {
    return this.submissionService.updateStatus(
      Number(id),
      updateStatusDto.status,
      updateStatusDto.comment || '',
      req.user.userId
    );
  }

  // --- 7. API WITHDRAW SUBMISSION (DELETE) ---
  @Delete(':id')
  @Roles('AUTHOR')
  async withdrawSubmission(@Param('id') id: string, @Request() req) {
    return this.submissionService.withdrawSubmission(Number(id), req.user.userId);
  }

  // --- 8. API UPLOAD CAMERA-READY (POST) ---
  @Post(':id/camera-ready')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @Roles('AUTHOR')
  async uploadCameraReady(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB for camera-ready
          new FileTypeValidator({ fileType: /(pdf)/ }), // Only PDF for final version
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
    @Request() req,
  ) {
    return this.submissionService.uploadCameraReady(
      Number(id),
      file,
      req.user.userId
    );
  }
}