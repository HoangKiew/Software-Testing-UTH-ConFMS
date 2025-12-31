import { SetMetadata } from '@nestjs/common';
<<<<<<< HEAD
import { RoleName } from '../enums/role-name.enum';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

=======
import { RoleName } from '../role.enum';

export const Roles = (...roles: RoleName[]) => SetMetadata('roles', roles);
>>>>>>> origin/develop-new
