import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../role.enum';

export const Roles = (...roles: RoleName[]) => SetMetadata('roles', roles);