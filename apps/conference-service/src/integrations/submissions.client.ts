import { Injectable } from '@nestjs/common';

@Injectable()
export class SubmissionsClient {
  // ===== DÙNG CHO assignments / pc-members / decisions =====

  async getSubmission(submissionId: string): Promise<any> {
    return {
      id: submissionId,
      conferenceId: 'mock-conference-id',
      title: 'Mock Submission',
      keywords: 'AI,ML',
      authors: [],
      status: 'under_review',
    };
  }

  async getSubmissionsByConference(conferenceId: string): Promise<any[]> {
    return [
      {
        id: 'sub-1',
        conferenceId,
        title: 'Mock Submission 1',
        status: 'under_review',
      },
    ];
  }

  // ===== DÙNG CHO reports (sau này) =====
  async countByConference(conferenceId: string): Promise<number> {
    return 1;
  }

  async countByConferenceAndStatus(
    conferenceId: string,
    status: string,
  ): Promise<number> {
    return 0;
  }
}
