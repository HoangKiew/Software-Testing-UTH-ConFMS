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
  Request,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubmissionServiceService } from './submission-service.service';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { UpdateStatusDto } from './dtos/update-status.dto';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';
import { QuerySubmissionsDto } from './dtos/query-submissions.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import type { Express } from 'express';

@ApiTags('submissions')
@ApiBearerAuth('JWT-auth')
@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionServiceController {
  constructor(private readonly submissionService: SubmissionServiceService) { }

  // --- 0. API LẤY TẤT CẢ BÀI NỘP VỚI PHÂN TRANG & LỌC (CHAIR) ---
  @Get()
  @Roles('CHAIR', 'ADMIN')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả bài nộp (có phân trang và lọc)',
    description: 'CHAIR có thể xem tất cả bài nộp với phân trang, lọc và sắp xếp'
  })
  @ApiResponse({ status: 200, description: 'Returns paginated submissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires CHAIR role' })
  async findAll(@Query() query: QuerySubmissionsDto) {
    return this.submissionService.findAllWithPagination(query);
  }

  // --- 1. API NỘP BÀI (POST) ---
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @Roles('AUTHOR', 'CHAIR', 'ADMIN')
  @ApiOperation({ summary: 'Nộp bài mới', description: 'Upload bài báo với metadata (PDF/Word/ZIP, tối đa 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'conferenceId', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        conferenceId: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Deep Learning for Face Recognition' },
        abstract: { type: 'string', example: 'This paper presents...' },
        authors: {
          type: 'string',
          example: '[{"name":"John Doe","email":"john@example.com","affiliation":"UTH"}]',
          description: 'JSON string of authors array'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Submission uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - file too large or invalid type' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
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



    return this.submissionService.handleSubmission(file, createDto);
  }

  // --- 2. API LẤY DANH SÁCH BÀI NỘP CỦA USER (GET) ---
  @Get('user/me')
  @Roles('AUTHOR', 'CHAIR')
  @ApiOperation({ summary: 'Lấy danh sách bài nộp của tôi' })
  async getMySubmissions(@Request() req) {
    const userId = req.user.userId; // ✅ FIXED: Changed from req.user.id to req.user.userId
    return this.submissionService.getSubmissionsByUser(userId);
  }

  // Giữ lại API cũ admin có thể dùng
  @Get('user/:userId')
  @Roles('CHAIR')
  @ApiOperation({ summary: 'Lấy danh sách bài nộp theo user ID' })
  async getByUserId(@Param('userId') userId: string) {
    return this.submissionService.getSubmissionsByUser(Number(userId));
  }

  // --- 3. API LẤY CHI TIẾT MỘT SUBMISSION (GET) ---
  @Get(':id')
  @Roles('AUTHOR', 'CHAIR')
  @ApiOperation({ summary: 'Lấy chi tiết bài nộp' })
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
  @ApiOperation({ summary: 'Lấy danh sách bài nộp theo hội nghị' })
  async getByConference(@Param('conferenceId') conferenceId: string) {
    return this.submissionService.getSubmissionsByConference(conferenceId);
  }

  // --- 5. API CẬP NHẬT METADATA SUBMISSION (AUTHOR ONLY) ---
  @Patch(':id')
  @Roles('AUTHOR')
  @ApiOperation({ summary: 'Cập nhật thông tin bài nộp' })
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
  @ApiOperation({ summary: 'Cập nhật trạng thái bài nộp (CHAIR only)' })
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
  @ApiOperation({ summary: 'Rút bài nộp (withdraw)' })
  async withdrawSubmission(@Param('id') id: string, @Request() req) {
    return this.submissionService.withdrawSubmission(Number(id), req.user.userId);
  }

  // --- 8. API UPLOAD CAMERA-READY (POST) ---
  @Post(':id/camera-ready')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @Roles('AUTHOR')
  @ApiOperation({
    summary: 'Upload bản camera-ready (chỉ khi đã ACCEPTED)',
    description: 'Upload bản PDF cuối cùng sau khi bài báo được chấp nhận (tối đa 15MB, chỉ PDF)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Camera-ready PDF file (max 15MB)'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Camera-ready uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - file too large, wrong type, or submission not accepted' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the submission owner' })
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