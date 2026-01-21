import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ConferencesService } from '../conferences/conferences.service';
import { TemplatesService } from '../template/templates.service';

@Controller('public/conferences')
export class PublicController {
  constructor(
    private readonly conferencesService: ConferencesService,
    private readonly templatesService: TemplatesService,
  ) {}
//  Lấy thông tin deadline CFP công khai
  @Get(':conferenceId/cfp/check-deadline')
  async checkDeadline(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Query('type') type: 'submission' | 'review' | 'notification' | 'camera-ready',
  ) {
    const cfpSetting = await this.conferencesService.getCfpSetting(conferenceId);

    if (!cfpSetting) {
      return {
        valid: false,
        message: 'CFP settings chưa được thiết lập',
      };
    }

    const now = new Date();
    let deadline: Date;
    let deadlineName: string;

    switch (type) {
      case 'submission':
        deadline = cfpSetting.submissionDeadline;
        deadlineName = 'Submission deadline';
        break;
      case 'review':
        deadline = cfpSetting.reviewDeadline;
        deadlineName = 'Review deadline';
        break;
      case 'notification':
        deadline = cfpSetting.notificationDate;
        deadlineName = 'Notification date';
        break;
      case 'camera-ready':
        deadline = cfpSetting.cameraReadyDeadline;
        deadlineName = 'Camera-ready deadline';
        break;
      default:
        return {
          valid: false,
          message: 'Invalid deadline type',
        };
    }

    const valid = now <= deadline;

    return {
      valid,
      deadline,
      message: valid
        ? `${deadlineName} chưa qua`
        : `${deadlineName} đã qua`,
    };
  }
// lấy thông tin track và xác thực track công khai
  @Get(':conferenceId/tracks/:trackId/validate')
  async validateTrack(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('trackId', ParseIntPipe) trackId: number,
  ) {
    const tracks = await this.conferencesService.findAllTracks(conferenceId);
    const track = tracks.find((t) => t.id === trackId);

    return {
      valid: !!track,
      track: track || undefined,
    };
  }
// Lấy thông tin CFP công khai
  @Get(':id/cfp')
  async getPublicCfp(@Param('id', ParseIntPipe) conferenceId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    const tracks = await this.conferencesService.findAllTracks(conferenceId);
    const cfpSetting = await this.conferencesService.getCfpSetting(conferenceId);
    const cfpTemplate = await this.templatesService.getCfpTemplate(conferenceId);

    return {
      message: 'Lấy thông tin CFP công khai thành công',
      data: {
        conference: {
          id: conference.id,
          name: conference.name,
          startDate: conference.startDate,
          endDate: conference.endDate,
          venue: conference.venue,
          description: conference.description,
          shortDescription: conference.shortDescription,
          contactEmail: conference.contactEmail,
        },
        tracks: tracks.map((track) => ({
          id: track.id,
          name: track.name,
        })),
        deadlines: cfpSetting
          ? {
              submissionDeadline: cfpSetting.submissionDeadline,
              reviewDeadline: cfpSetting.reviewDeadline,
              notificationDate: cfpSetting.notificationDate,
              cameraReadyDeadline: cfpSetting.cameraReadyDeadline,
            }
          : null,
        template: cfpTemplate
          ? {
              htmlContent: cfpTemplate.htmlContent,
              customStyles: cfpTemplate.customStyles,
            }
          : null,
      },
    };
  }
// lấy danh sách track công khai
  @Get(':id/tracks')
  async getPublicTracks(@Param('id', ParseIntPipe) conferenceId: number) {
    const tracks = await this.conferencesService.findAllTracks(conferenceId);

    return {
      message: 'Lấy danh sách tracks công khai thành công',
      data: tracks.map((track) => ({
        id: track.id,
        name: track.name,
      })),
    };
  }
}






