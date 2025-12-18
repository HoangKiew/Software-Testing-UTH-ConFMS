import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { SeedService } from './seed.service'; // Đường dẫn đúng

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, SeedService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(private readonly seedService: SeedService) {}

  async onModuleInit() {
    await this.seedService.onModuleInit();
  }
}