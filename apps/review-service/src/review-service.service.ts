import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewServiceService {
  // Để trống tạm thời cũng được, hoặc thêm hàm test
  getHello(): string {
    return 'Review Service is running';
  }
}