import { Injectable } from '@nestjs/common';

@Injectable()
export class ConferenceServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
