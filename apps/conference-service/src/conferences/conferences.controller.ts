import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConferencesService } from './conferences.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConferenceStatus } from './entities/conference.entity';
import { RoleName } from '../common/role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes, // ✅ QUAN TRỌNG
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Conferences')
@ApiBearerAuth('JWT-auth')
@Controller('conferences')
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  // ================= PUBLIC API =================

  @Get('public')
  @Public()
  getPublicConferences() {
    return this.conferencesService.findPublic();
  }

  @Get('public/conference/:id')
  @Public()
  getPublicConference(@Param('id') id: string) {
    return this.conferencesService.findPublicOne(id);
  }

  @Get('public/conference/:id/program')
  @Public()
  async getPublicProgram(@Param('id') id: string) {
    const conf = await this.conferencesService.findPublicOne(id);
    return {
      name: conf.name,
      schedule: conf.schedule,
    };
  }

  // ================= PRIVATE API =================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  create(
    @Body() createDto: CreateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.create(createDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('status') status?: ConferenceStatus) {
    return this.conferencesService.findAll(status ? { status } : {});
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.conferencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.update(id, updateDto, userId);
  }

  @Patch(':id/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  updateTopics(
    @Param('id') id: string,
    @Body('topics') topics: string[],
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateTopics(id, topics, userId);
  }

  @Patch(':id/deadlines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  updateDeadlines(
    @Param('id') id: string,
    @Body() deadlinesDto: {
      submission?: string;
      review?: string;
      cameraReady?: string;
    },
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateDeadlines(
      id,
      {
        submission: deadlinesDto.submission
          ? new Date(deadlinesDto.submission)
          : undefined,
        review: deadlinesDto.review
          ? new Date(deadlinesDto.review)
          : undefined,
        cameraReady: deadlinesDto.cameraReady
          ? new Date(deadlinesDto.cameraReady)
          : undefined,
      },
      userId,
    );
  }

  // ================= UPDATE STATUS (FIX SWAGGER) =================

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  @ApiConsumes('application/json') // ✅ BẮT BUỘC
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ConferenceStatus),
          example: ConferenceStatus.PUBLISHED,
        },
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateConferenceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateStatus(
      id,
      updateDto.status,
      userId,
    );
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  updateSchedule(
    @Param('id') id: string,
    @Body('schedule') schedule: any,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.updateSchedule(id, schedule, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR)
  delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.conferencesService.delete(id, userId);
  }
}
