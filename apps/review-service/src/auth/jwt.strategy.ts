import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number | string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const publicKey = configService.get<string>('IDENTITY_JWT_PUBLIC_KEY');
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    const algo = configService.get<string>('JWT_ALGORITHM');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey || secret || 'access_secret',
      algorithms: algo ? ([algo] as any) : undefined,
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
