import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewServiceService {
  // Hàm test đơn giản – giữ để controller dùng nếu cần
  getHello(): string {
    return 'Review Service is running';
  }
}