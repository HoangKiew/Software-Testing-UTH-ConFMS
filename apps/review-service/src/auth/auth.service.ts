import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // Hàm verify token thủ công nếu cần (tạm thời)
  validateToken(token: string) {
    return this.jwtService.verify(token);
  }
}