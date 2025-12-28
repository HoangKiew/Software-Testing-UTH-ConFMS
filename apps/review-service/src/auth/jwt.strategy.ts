import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string; // 'reviewer' | 'chair'
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      // KHÔNG còn undefined
      secretOrKey: configService.getOrThrow<string>(
        'JWT_ACCESS_SECRET',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
