import { 
  Controller, 
  Post, 
  Get,
  Param,
  Body, 
  UploadedFile, 
  UseInterceptors, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionServiceService } from './submission-service.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import type { Express } from 'express';

@Controller('submissions')
export class SubmissionServiceController {
  constructor(private readonly submissionService: SubmissionServiceService) {}

  // --- 1. API NỘP BÀI (POST) ---
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file')) // Key gửi từ Postman phải là 'file'
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Giới hạn 10MB
          new MaxFileSizeValidator({ 
            maxSize: 10 * 1024 * 1024, 
            message: 'File quá lớn! Dung lượng tối đa là 10MB.' 
          }),
          // Chấp nhận PDF, Word, và các file nén
          new FileTypeValidator({ 
            fileType: /(pdf|vnd.openxmlformats-officedocument.wordprocessingml.document|msword|zip|x-rar-compressed)/,
          }),
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
    @Body() createDto: CreateSubmissionDto,
  ) {
    // Kiểm tra Deadline
    await this.submissionService.checkDeadline(createDto.conferenceId);
    
    // Xử lý lưu bài và upload cloud
    return this.submissionService.handleSubmission(file, createDto);
  }

  // --- 2. API LẤY DANH SÁCH BÀI NỘP CỦA USER (GET) ---
  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string) {
    // Chuyển userId sang kiểu number nếu cần thiết
    return this.submissionService.getSubmissionsByUser(Number(userId));
  }
}