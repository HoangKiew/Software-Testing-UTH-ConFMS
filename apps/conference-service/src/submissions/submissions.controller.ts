import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.AUTHOR)  // Chỉ AUTHOR nộp bài
  create(
    @Body() createDto: CreateSubmissionDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.submissionsService.create(createDto, userId);
  }

  @Get('conference/:conferenceId')
  findAllByConference(@Param('conferenceId') conferenceId: string) {
    return this.submissionsService.findAllByConference(conferenceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.AUTHOR)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubmissionDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.submissionsService.update(id, updateDto, userId);
  }
  @Patch(':id/camera-ready')
  @UseGuards(RolesGuard)
  @Roles(RoleName.AUTHOR)
  async uploadCameraReady(
    @Param('id') id: string,
    @Body('fileUrl') fileUrl: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.submissionsService.uploadCameraReady(id, fileUrl, userId);
  }
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.AUTHOR)
  delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.submissionsService.delete(id, userId);
  }
}