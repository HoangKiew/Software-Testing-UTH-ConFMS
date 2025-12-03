import { Injectable } from '@nestjs/common';

@Injectable()
export class SubmissionServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
