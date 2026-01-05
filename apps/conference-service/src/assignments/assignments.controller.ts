// apps/conference-service/src/assignments/assignments.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

// Swagger imports
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-auth')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('conference/:id')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy toàn bộ phân công reviewer của một hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Danh sách các assignment (submission → reviewers)' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async findAllByConference(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.findAllByConference(conferenceId, chairId);
  }

  @Get('suggest/:submissionId')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ 
    summary: 'Gợi ý danh sách PC Member phù hợp nhất để review một bài nộp' 
  })
  @ApiParam({ name: 'submissionId', description: 'ID của bài nộp (submission)', type: String })
  @ApiQuery({ 
    name: 'top', 
    description: 'Số lượng gợi ý trả về (mặc định: 5)', 
    required: false, 
    type: Number,
    example: 10 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách PC Member được sắp xếp theo độ phù hợp giảm dần (có điểm similarity)' 
  })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được sử dụng gợi ý' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài nộp' })
  async suggest(
    @Param('submissionId') submissionId: string,
    @Query('top') topStr?: string,
  ) {
    const top = topStr ? parseInt(topStr, 10) : 5;
    const limit = isNaN(top) || top <= 0 ? 5 : top;
    return this.assignmentsService.suggestReviewers(submissionId, limit);
  }

  @Post('assign')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Phân công reviewer(s) cho một bài nộp' })
  @ApiBody({ type: AssignReviewersDto })
  @ApiResponse({ status: 201, description: 'Phân công thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc reviewer không thuộc hội nghị' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được phân công' })
  @ApiResponse({ status: 409, description: 'Reviewer đã được phân công trước đó' })
  async assign(
    @Body() dto: AssignReviewersDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.assignReviewers(dto, chairId);
  }

  @Delete(':id')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Hủy phân công một reviewer khỏi bài nộp' })
  @ApiParam({ name: 'id', description: 'ID của assignment (assignment entity ID)', type: String })
  @ApiResponse({ status: 200, description: 'Hủy phân công thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được hủy phân công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
  async unassign(
    @Param('id') id: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.unassign(id, chairId);
  }
}