// apps/review-service/src/invitations/invitations.proxy.controller.ts

import {
    Controller,
    Patch,
    Param,
    UseGuards,
    Req,
    Body,
    HttpException,
    Logger,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

// DTO đơn giản cho proxy (không cần validation ở đây, để conference-service xử lý)
class UpdateTopicsProxyDto {
    topics: string[];
}

class UpdateCoiProxyDto {
    coiUserIds: number[];
    coiInstitutions: string[];
}

@ApiTags('Invitations')
@ApiBearerAuth('JWT-auth')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsProxyController {
    private readonly logger = new Logger(InvitationsProxyController.name);
    private readonly conferenceUrl: string;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {
        this.conferenceUrl =
            this.config.get<string>('CONFERENCE_SERVICE_URL') ||
            'http://conference-service:3002';
    }

    @Patch(':id/accept')
    @ApiOperation({ summary: 'Chấp nhận lời mời tham gia phản biện hội nghị (proxy)' })
    @ApiParam({ name: 'id', description: 'ID của lời mời (invitation ID)' })
    @ApiResponse({ status: 200, description: 'Chấp nhận thành công → role REVIEWER được thêm' })
    async accept(@Param('id') id: string, @Req() req: any) {
        const url = `${this.conferenceUrl}/api/internal/invitations/${id}/accept`;

        this.logger.log(`Proxy accept invitation: ${id} → ${url}`);

        const authHeader = req.headers['authorization'] || req.get('Authorization');
        const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};

        const userId: number | undefined =
            req.user?.userId ?? req.user?.id ?? req.user?.sub;

        if (!userId) {
            this.logger.error('Không lấy được userId từ token khi accept');
            throw new HttpException('Cannot determine current user', 401);
        }

        try {
            const res$ = this.http.patch(url, { userId }, { headers });
            const res = await lastValueFrom(res$);
            this.logger.log(`Accept success for invitation ${id} by user ${userId}`);
            return res.data;
        } catch (error: any) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || 'Lỗi khi proxy chấp nhận lời mời';
            this.logger.error(`Accept failed for ${id}: ${message} (status ${status})`);
            throw new HttpException(message, status);
        }
    }

    @Patch(':id/decline')
    @ApiOperation({ summary: 'Từ chối lời mời tham gia phản biện hội nghị (proxy)' })
    @ApiParam({ name: 'id', description: 'ID của lời mời (invitation ID)' })
    @ApiResponse({ status: 200, description: 'Từ chối thành công' })
    async decline(@Param('id') id: string, @Req() req: any) {
        const url = `${this.conferenceUrl}/api/internal/invitations/${id}/decline`;

        this.logger.log(`Proxy decline invitation: ${id} → ${url}`);

        const authHeader = req.headers['authorization'] || req.get('Authorization');
        const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};

        const userId: number | undefined =
            req.user?.userId ?? req.user?.id ?? req.user?.sub;

        if (!userId) {
            this.logger.error('Không lấy được userId từ token khi decline');
            throw new HttpException('Cannot determine current user', 401);
        }

        try {
            const res$ = this.http.patch(url, { userId }, { headers });
            const res = await lastValueFrom(res$);
            this.logger.log(`Decline success for invitation ${id} by user ${userId}`);
            return res.data;
        } catch (error: any) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || 'Lỗi khi proxy từ chối lời mời';
            this.logger.error(`Decline failed for ${id}: ${message} (status ${status})`);
            throw new HttpException(message, status);
        }
    }

    // MỚI: Proxy cập nhật topics
    @Patch(':id/topics')
    @ApiOperation({ summary: 'Cập nhật chuyên môn (topics) cho lời mời hội nghị (proxy)' })
    @ApiParam({ name: 'id', description: 'ID của lời mời' })
    @ApiBody({ type: UpdateTopicsProxyDto })
    @ApiResponse({ status: 200, description: 'Cập nhật topics thành công' })
    async updateTopics(
        @Param('id') id: string,
        @Body() body: UpdateTopicsProxyDto,
        @Req() req: any,
    ) {
        const url = `${this.conferenceUrl}/api/invitations/${id}/topics`;

        this.logger.log(`Proxy update topics for invitation ${id} → ${url}`);

        const authHeader = req.headers['authorization'] || req.get('Authorization');
        const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};

        try {
            const res$ = this.http.patch(url, { topics: body.topics }, { headers });
            const res = await lastValueFrom(res$);
            this.logger.log(`Update topics success for ${id}`);
            return res.data;
        } catch (error: any) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || 'Lỗi khi proxy cập nhật topics';
            this.logger.error(`Update topics failed for ${id}: ${message} (status ${status})`);
            throw new HttpException(message, status);
        }
    }

    // MỚI: Proxy cập nhật COI
    @Patch(':id/coi')
    @ApiOperation({ summary: 'Cập nhật xung đột lợi ích (COI) cho lời mời hội nghị (proxy)' })
    @ApiParam({ name: 'id', description: 'ID của lời mời' })
    @ApiBody({ type: UpdateCoiProxyDto })
    @ApiResponse({ status: 200, description: 'Cập nhật COI thành công' })
    async updateCoi(
        @Param('id') id: string,
        @Body() body: UpdateCoiProxyDto,
        @Req() req: any,
    ) {
        const url = `${this.conferenceUrl}/api/invitations/${id}/coi`;

        this.logger.log(`Proxy update COI for invitation ${id} → ${url}`);

        const authHeader = req.headers['authorization'] || req.get('Authorization');
        const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};

        try {
            const res$ = this.http.patch(url, {
                coiUserIds: body.coiUserIds,
                coiInstitutions: body.coiInstitutions,
            }, { headers });
            const res = await lastValueFrom(res$);
            this.logger.log(`Update COI success for ${id}`);
            return res.data;
        } catch (error: any) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || 'Lỗi khi proxy cập nhật COI';
            this.logger.error(`Update COI failed for ${id}: ${message} (status ${status})`);
            throw new HttpException(message, status);
        }
    }
}