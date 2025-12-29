import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from '../users/entities/role.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const roleNames = Object.values(RoleName);
    
    for (const roleName of roleNames) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleName },
      });

      if (!existingRole) {
        const role = this.roleRepository.create({ name: roleName });
        await this.roleRepository.save(role);
      }
    }
  }
}
