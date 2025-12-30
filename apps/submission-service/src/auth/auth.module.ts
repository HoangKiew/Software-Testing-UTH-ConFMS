import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
    imports: [PassportModule],
    providers: [JwtStrategy, RolesGuard],
    exports: [PassportModule, JwtStrategy, RolesGuard],
})
export class AuthModule { }
