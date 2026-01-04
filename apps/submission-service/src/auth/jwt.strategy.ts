import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        // Lấy secret từ env
        const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');

        // Nếu không có secret, báo lỗi ngay lúc khởi động ứng dụng
        if (!jwtSecret) {
            throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // Sử dụng "as string" để báo cho TypeScript đây chắc chắn là string
            secretOrKey: jwtSecret as string, 
        });
    }

    async validate(payload: any) {
        // Trả về payload để gán vào req.user
        return { userId: payload.sub, email: payload.email, roles: payload.roles };
    }
}