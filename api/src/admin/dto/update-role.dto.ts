import { IsEnum } from 'class-validator'
import { UserRole } from '../../users/user-roles.enum'

export class UpdateRoleDto {
  @IsEnum(UserRole, { message: 'Role must be either ADMIN or REGULAR' })
  role: UserRole
}
