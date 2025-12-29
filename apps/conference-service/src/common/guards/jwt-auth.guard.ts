// apps/conference-service/src/common/guards/jwt-auth.guard.ts

import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

// ← IMPORT KEY CHO @Public()
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // ← THÊM METHOD CANACTIVATE ĐỂ HỖ TRỢ @Public()
  canActivate(context: ExecutionContext) {
    // Kiểm tra xem endpoint có được đánh dấu @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Nếu là public → bỏ qua xác thực JWT, cho phép truy cập
      return true;
    }

    // Nếu không public → chạy bình thường JwtAuthGuard
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Nếu có lỗi hoặc không có user → throw 401
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}