import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@ApiTags('Reviewers')
@ApiBearerAuth('JWT-auth')
@Controller('reviewers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PcMembersProxyController {
  constructor(private readonly http: HttpService) {}

  @Get('conference/:id')
  @Roles('CHAIR', 'ADMIN')
  @ApiOperation({ summary: 'Proxy: Lấy danh sách PC/Reviewer của hội nghị' })
  async findAllByConference(@Param('id') id: string, @Req() req: any) {
    const url = `http://conference-service:3002/api/reviewers/conference/${id}`;
    const headers = { Authorization: req.headers.authorization };
    const res$ = this.http.get(url, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }

  @Patch(':id/accept')
  @Roles('REVIEWER')
  @ApiOperation({ summary: 'Proxy: Chấp nhận lời mời (Reviewer nhận invite)' })
  async acceptInvite(@Param('id') id: string, @Req() req: any) {
    const url = `http://conference-service:3002/api/reviewers/${id}/accept`;
    const headers = { Authorization: req.headers.authorization };
    const res$ = this.http.patch(url, {}, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }

  @Patch(':id/coi')
  @Roles('REVIEWER')
  @ApiOperation({ summary: 'Proxy: Khai báo COI (Reviewer)' })
  async declareCoi(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const url = `http://conference-service:3002/api/reviewers/${id}/coi`;
    const headers = { Authorization: req.headers.authorization };
    const res$ = this.http.patch(url, body, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }

  @Patch(':id/decline')
  @Roles('REVIEWER')
  @ApiOperation({ summary: 'Proxy: Từ chối lời mời (Reviewer)' })
  async declineInvite(@Param('id') id: string, @Req() req: any) {
    const url = `http://conference-service:3002/api/reviewers/${id}/decline`;
    const headers = { Authorization: req.headers.authorization };
    const res$ = this.http.patch(url, {}, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }
}
