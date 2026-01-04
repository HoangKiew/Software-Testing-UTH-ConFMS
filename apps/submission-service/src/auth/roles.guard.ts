import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard để kiểm tra phân quyền Author/Chair
 * Author: Người nộp bài, chỉ được thao tác với bài của mình
 * Chair: Người quản lý hội nghị, có quyền xem/cập nhật tất cả bài nộp
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có metadata roles, cho phép tất cả
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    // Kiểm tra user có ít nhất một role trong danh sách yêu cầu
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(`Yêu cầu quyền: ${requiredRoles.join(' hoặc ')}`);
    }

    return true;
  }
}