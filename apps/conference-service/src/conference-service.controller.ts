import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

// Controller này chỉ để kiểm tra health của service.
// - Không xóa file này vì đã dùng tạm để đảm bảo build, nhưng ẩn khỏi Swagger
//   để không xuất hiện nhóm `ConferenceService` ở đầu trang docs.
@ApiExcludeController()
@Controller('health')
export class ConferenceServiceController {
  @Get()
  health() {
    return { status: 'conference-service OK' };
  }
}
