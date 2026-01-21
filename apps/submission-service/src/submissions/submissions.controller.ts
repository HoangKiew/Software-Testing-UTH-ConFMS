import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  ParseIntPipe,
  UnauthorizedException,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { Submission } from '../entities/submission.entity';

@ApiTags('Submissions')
@Controller('submissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Tạo submission mới (nộp bài)',
    description: 'Tạo một submission mới với file đính kèm. Chấp nhận các định dạng: PDF, DOCX, ZIP (tối đa 20MB).'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File PDF, DOCX hoặc ZIP (tối đa 20MB)',
        },
        title: {
          type: 'string',
          example: 'Machine Learning in Healthcare',
          description: 'Tiêu đề bài báo',
        },
        abstract: {
          type: 'string',
          example: 'This paper presents a novel approach to machine learning applications in healthcare...',
          description: 'Tóm tắt bài báo',
        },
        keywords: {
          type: 'string',
          example: 'machine learning, healthcare, AI, deep learning',
          description: 'Từ khóa (tùy chọn)',
        },
        trackId: {
          type: 'number',
          example: 1,
          description: 'ID của track',
        },
        conferenceId: {
          type: 'number',
          example: 1,
          description: 'ID của conference',
        },
      },
      required: ['file', 'title', 'abstract', 'trackId', 'conferenceId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo submission thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ, file không đúng định dạng, hoặc deadline đã qua' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
  async create(
    @Body() createDto: CreateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.create(
      createDto,
      file,
      user.sub,
      user.fullName, 
    );

    return {
      message: 'Nộp bài dự thi thành công',
      data: submission,
    };
  }
  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Cập nhật submission (chỉ Author)',
    description: 'Cập nhật thông tin submission. Tất cả các trường đều tùy chọn. Nếu upload file mới, sẽ tự động tạo version mới.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'UUID của submission cần cập nhật' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File PDF, DOCX hoặc ZIP mới (tùy chọn)',
        },
        title: { type: 'string', example: 'Updated Title', description: 'Tiêu đề mới (tùy chọn)' },
        abstract: { type: 'string', example: 'Updated abstract...', description: 'Tóm tắt mới (tùy chọn)' },
        keywords: { type: 'string', example: 'updated, keywords', description: 'Từ khóa mới (tùy chọn)' },
        trackId: { type: 'number', example: 2, description: 'ID track mới (tùy chọn)' },
        authorAffiliation: { type: 'string', example: 'Đại học Công nghệ', description: 'Tổ chức của tác giả (tùy chọn)' },
        coAuthors: { type: 'string', example: '[{"name":"Nguyễn Văn A","email":"a@example.com"}]', description: 'JSON string của đồng tác giả (tùy chọn)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật submission thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ, deadline đã qua, hoặc file không đúng định dạng' })
  @ApiResponse({ status: 403, description: 'Chỉ author mới có quyền cập nhật submission này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubmissionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Chỉ author mới được update
    const submission = await this.submissionsService.update(
      id,
      updateDto,
      file,
      user.sub,
    );

    return {
      message: 'Cập nhật bài nộp dự thi thành công',
      data: submission,
    };
  }
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách submissions (có phân trang và filter)',
    description: 'Lấy danh sách submissions với phân trang và filter. RBAC: Author chỉ thấy submissions của mình, Chair/Admin thấy tất cả.'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
  async findAll(
    @Query() queryDto: QuerySubmissionsDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    const result = await this.submissionsService.findAll(
      queryDto,
      user.sub,
      user.roles || [],
      authToken,
    );

    return {
      message: 'Lấy danh sách các bài dự thi thành công',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Lấy danh sách submissions của tôi',
    description: 'Lấy tất cả submissions của user hiện tại (không phân trang). Chỉ author mới xem được submissions của chính mình.'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách submissions của tôi thành công' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
  async findMySubmissions(@Req() req: Request) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submissions = await this.submissionsService.findAllByAuthor(user.sub);

    return {
      message: 'Lấy danh sách các bài dự thi của tôi thành công',
      data: submissions,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết submission kèm lịch sử versions',
    description: 'Lấy thông tin chi tiết của submission bao gồm tất cả các versions đã tạo. RBAC: Author chỉ xem được submissions của mình, Chair/Admin xem được tất cả.'
  })
  @ApiParam({ name: 'id', description: 'UUID của submission' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem submission này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    const submission = await this.submissionsService.findOne(
      id,
      user.sub,
      user.roles || [],
      undefined, // assignmentIds - not used in controller
      authToken,
    );

    return {
      message: 'Lấy chi tiết bài dự thi thành công',
      data: submission,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Rút submission (Withdraw) - Chỉ Author',
    description: 'Rút bài submission khỏi hội nghị. Chỉ author của submission mới được rút.'
  })
  @ApiParam({ name: 'id', description: 'UUID của submission cần rút' })
  @ApiResponse({ status: 200, description: 'Rút submission thành công' })
  @ApiResponse({ status: 400, description: 'Không thể rút (status không hợp lệ hoặc deadline đã qua)' })
  @ApiResponse({ status: 403, description: 'Chỉ author mới có quyền rút submission này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Chỉ author mới được withdraw
    const submission = await this.submissionsService.withdraw(id, user.sub);

    return {
      message: 'Rút bài dự thi thành công',
      data: submission,
    };
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái submission (Decision)',
    description: 'Cập nhật trạng thái submission (chấp nhận/từ chối). Chỉ Chair/Admin mới có quyền.'
  })
  @ApiParam({ name: 'id', description: 'UUID của submission' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 400, description: 'Chuyển trạng thái không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền cập nhật status' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Extract auth token from request header
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;

    const submission = await this.submissionsService.updateStatus(
      id,
      updateStatusDto,
      user.sub,
      user.roles || [],
      authToken,
    );

    return {
      message: 'Cập nhật trạng thái bài dự thi thành công',
      data: submission,
    };
  }

  @Post(':id/camera-ready')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload camera-ready version',
    description: 'Upload bản cuối cùng (camera-ready) của submission sau khi đã được chấp nhận. Chấp nhận file PDF, DOCX, hoặc ZIP.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'UUID của submission' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File camera-ready (PDF, DOCX, ZIP - tối đa 20MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Upload camera-ready thành công' })
  @ApiResponse({ status: 400, description: 'Submission chưa được ACCEPTED hoặc deadline đã qua, hoặc file không đúng định dạng' })
  @ApiResponse({ status: 403, description: 'Không có quyền upload camera-ready cho submission này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async uploadCameraReady(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    if (!file) {
      throw new UnauthorizedException('File là bắt buộc');
    }

    const submission = await this.submissionsService.uploadCameraReady(
      id,
      file,
      user.sub,
    );

    return {
      message: 'Upload camera-ready thành công',
      data: submission,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Xem reviews đã ẩn danh',
    description: 'Lấy danh sách reviews đã được ẩn danh để tác giả xem sau khi có quyết định.'
  })
  @ApiParam({ name: 'id', description: 'UUID của submission' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách reviews ẩn danh thành công' })
  @ApiResponse({ status: 400, description: 'Submission chưa có quyết định (chưa ACCEPTED/REJECTED)' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem reviews của submission này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async getAnonymizedReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const reviews = await this.submissionsService.getAnonymizedReviews(
      id,
      user.sub,
    );

    return {
      message: 'Lấy danh sách reviews đã ẩn danh thành công',
      data: reviews,
    };
  }

  // Guard Clause: Đếm submissions theo authorId (Case 1)
  @Get('author/:authorId/count')
  @ApiOperation({ summary: 'Đếm số submissions của author (Guard Clause - Internal)' })
  @ApiResponse({ status: 200, description: 'Đếm thành công' })
  async countSubmissionsByAuthorId(
    @Param('authorId', ParseIntPipe) authorId: number,
  ) {
    const count = await this.submissionsService.countSubmissionsByAuthorId(authorId);
    return {
      message: 'Đếm submissions thành công',
      data: { count },
    };
  }

  // Guard Clause: Lấy submission IDs theo trackId (Case 3)
  @Get('track/:trackId/ids')
  @ApiOperation({ summary: 'Lấy danh sách submission IDs theo track (Guard Clause - Internal)' })
  @ApiResponse({ status: 200, description: 'Lấy thành công' })
  async getSubmissionIdsByTrackId(
    @Param('trackId', ParseIntPipe) trackId: number,
  ) {
    const submissionIds = await this.submissionsService.getSubmissionIdsByTrackId(trackId);
    return {
      message: 'Lấy danh sách submission IDs thành công',
      data: { submissionIds },
    };
  }
}



