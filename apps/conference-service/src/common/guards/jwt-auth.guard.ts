import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // Nếu có lỗi hoặc không có user, throw UnauthorizedException (sẽ trả 401)
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}