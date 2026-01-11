import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
  NotFoundException,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('assignments')
@ApiBearerAuth('JWT-auth')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('conference/:id')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy tất cả phân công reviewer theo topic của một hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị (UUID)', example: 'c2a65b80-fd67-474e-8390-895c76422f10' })
  @ApiResponse({ status: 200, description: 'Danh sách assignments (topic → reviewers)' })
  @ApiForbiddenResponse({ description: 'Chỉ Chair/Admin của hội nghị mới được xem' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  async findAllByConference(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.findAllByConference(conferenceId, chairId);
  }

  @Get('suggest/:conferenceId/:topic')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Gợi ý reviewer phù hợp nhất cho một topic trong hội nghị cụ thể',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID hội nghị (UUID)', example: 'c2a65b80-fd67-474e-8390-895c76422f10' })
  @ApiParam({ name: 'topic', description: 'Topic cần gợi ý reviewer', example: 'Large Language Models' })
  @ApiQuery({
    name: 'top',
    description: 'Số lượng gợi ý tối đa (default: 5, max: 20)',
    required: false,
    type: Number,
    example: 8,
  })
  @ApiResponse({ status: 200, description: 'Danh sách reviewer gợi ý (sắp xếp theo độ phù hợp)' })
  @ApiForbiddenResponse({ description: 'Chỉ Chair của hội nghị này mới được gợi ý' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiBadRequestResponse({ description: 'Topic không hợp lệ hoặc hội nghị không có topic nào' })
  async suggestForConference(
    @CurrentUser('userId') currentUserId: number,
    @Param('conferenceId') conferenceId: string,
    @Param('topic') topic: string,
    @Query('top') topStr?: string,
  ) {
    const top = topStr ? parseInt(topStr, 10) : 5;
    const limit = isNaN(top) || top <= 0 ? 5 : Math.min(top, 20);

    // Kiểm tra quyền chair ngay từ controller
    const canSuggest = await this.assignmentsService.canChairSuggest(currentUserId, conferenceId);
    if (!canSuggest) {
      throw new ForbiddenException('Chỉ Chair của hội nghị này mới được gợi ý reviewer');
    }

    return this.assignmentsService.suggestReviewersForTopic(conferenceId, topic, limit);
  }

  @Post('assign')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Phân công (gán thủ công) một hoặc nhiều reviewer cho topic' })
  @ApiBody({ type: AssignReviewersDto })
  @ApiResponse({ status: 201, description: 'Phân công thành công' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ / reviewer không phù hợp / đã phân công trước đó' })
  @ApiForbiddenResponse({ description: 'Chỉ Chair của hội nghị mới được phân công' })
  async assign(
    @Body() dto: AssignReviewersDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.assignReviewersToTopic(dto, chairId);
  }

  @Delete(':id')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Hủy phân công một assignment cụ thể' })
  @ApiParam({ name: 'id', description: 'ID của assignment (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Hủy phân công thành công' })
  @ApiForbiddenResponse({ description: 'Chỉ Chair của hội nghị mới được hủy' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy assignment' })
  async unassign(
    @Param('id') id: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.unassign(id, chairId);
  }
}