import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConferencesService } from './conferences.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/enums/role-name.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayload } from '../common/guards/roles.guard';

@Controller('conferences')
@UseGuards(RolesGuard)
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.CHAIR)
  async createConference(
    @Body() dto: CreateConferenceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const organizerId = user.sub;
    return this.conferencesService.createConference(dto, organizerId);
  }

  @Get()
  async findAll() {
    return this.conferencesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conferencesService.findOneWithTracks(id);
  }

  @Post(':id/tracks')
  @Roles(RoleName.ADMIN, RoleName.CHAIR)
  async addTrack(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTrackDto,
  ) {
    return this.conferencesService.addTrack(id, dto);
  }
}

