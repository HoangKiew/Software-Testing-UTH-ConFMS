import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../users/entities/role.entity';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);









