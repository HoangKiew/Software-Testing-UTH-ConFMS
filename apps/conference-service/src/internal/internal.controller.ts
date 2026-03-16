import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConferencesService } from '../conferences/conferences.service';

@Controller('internal')
@ApiTags('Internal API')
export class InternalController {
    constructor(private readonly conferencesService: ConferencesService) { }

    @Get('conferences/:id/deadline-check')
    @ApiOperation({
        summary: 'Check submission deadline (Internal API)',
        description: 'Internal endpoint for service-to-service calls. No authentication required.'
    })
    @ApiResponse({ status: 200, description: 'Deadline check result' })
    @ApiResponse({ status: 404, description: 'Conference not found' })
    async checkDeadline(@Param('id') id: string) {
        console.log(`[InternalController] Checking deadline for conference ID: ${id}`);
        try {
            console.log(`[InternalController] Calling findOne...`);
            const conference = await this.conferencesService.findOne(Number(id));

            if (!conference) {
                return {
                    canSubmit: false,
                    reason: 'CONFERENCE_NOT_FOUND',
                    message: 'Hội nghị không tồn tại',
                    conferenceId: id
                };
            }

            if (!conference.isActive) {
                return {
                    canSubmit: false,
                    reason: 'CONFERENCE_INACTIVE',
                    message: 'Hội nghị đang tạm khóa',
                    conferenceId: id,
                    conferenceName: conference.name
                };
            }

            // ✅ CASE 1: Check if deadline exists (check trước để biết có deadline không)
            if (!conference.deadlines?.submission) {
                return {
                    canSubmit: false,
                    reason: 'NO_DEADLINE',
                    message: 'Hội nghị chưa thiết lập deadline nộp bài',
                    conferenceId: id,
                    conferenceName: conference.name,
                    deadline: null,
                    details: 'Vui lòng liên hệ Ban tổ chức để biết thêm thông tin.'
                };
            }

            // ✅ CASE 2: Check deadline (check trước status vì quan trọng hơn)
            const now = new Date();
            const deadline = new Date(conference.deadlines!.submission!);
            deadline.setHours(23, 59, 59, 999);

            const canSubmit = now <= deadline;

            if (!canSubmit) {
                return {
                    canSubmit: false,
                    reason: 'DEADLINE_PASSED',
                    message: 'Đã quá hạn nộp bài',
                    conferenceId: id,
                    conferenceName: conference.name,
                    deadline: conference.deadlines?.submission,
                    deadlineFormatted: deadline.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                    currentTime: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                    currentStatus: conference.status ?? null,
                    details: `Deadline: ${deadline.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}. Hiện tại: ${now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
                };
            }

            // ✅ CASE 3: Check status (chỉ check khi deadline còn hạn)
            const validStatus = ['open_for_submission', 'open'];
            if (!validStatus.includes((conference.status ?? '').toLowerCase())) {
                return {
                    canSubmit: false,
                    reason: 'INVALID_STATUS',
                    message: `Hội nghị chưa mở nhận bài`,
                    conferenceId: id,
                    conferenceName: conference.name,
                    currentStatus: conference.status ?? null,
                    requiredStatus: 'OPEN_FOR_SUBMISSION',
                    deadline: conference.deadlines?.submission,
                    deadlineFormatted: deadline.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                    details: `Trạng thái hiện tại: ${conference.status ?? 'N/A'}. Cần chuyển sang OPEN_FOR_SUBMISSION để nhận bài.`
                };
            }

            // ✅ CASE 4: All checks passed - can submit
            const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return {
                canSubmit: true,
                reason: 'OK',
                message: 'Có thể nộp bài',
                conferenceId: id,
                conferenceName: conference.name,
                deadline: conference.deadlines?.submission,
                deadlineFormatted: deadline.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                currentTime: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                daysRemaining,
                details: `Còn ${daysRemaining} ngày để nộp bài. Deadline: ${deadline.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
            };
        } catch (error) {
            return {
                canSubmit: false,
                reason: 'INTERNAL_ERROR',
                message: 'Lỗi khi kiểm tra deadline',
                error: error.message
            };
        }
    }

    @Get('conferences/:id/topics')
    @ApiOperation({
        summary: 'Get conference topics (Internal API)',
        description: 'Internal endpoint for service-to-service calls. No authentication required.'
    })
    @ApiResponse({ status: 200, description: 'Conference topics' })
    @ApiResponse({ status: 404, description: 'Conference not found' })
    async getTopics(@Param('id') id: string) {
        try {
            const conference = await this.conferencesService.findOne(Number(id));

            if (!conference) {
                return {
                    success: false,
                    message: 'Hội nghị không tồn tại',
                    topics: []
                };
            }

            return {
                success: true,
                conferenceId: id,
                conferenceName: conference.name,
                topics: conference.topics || conference.tracks?.map(t => t.name) || []
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách topics',
                topics: [],
                error: error.message
            };
        }
    }
}
