import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { UserRole } from '../../users/user-roles.enum'

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new HttpException(
        { error: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (user.role !== UserRole.ADMIN) {
      throw new HttpException(
        { error: 'Admin access required' },
        HttpStatus.FORBIDDEN,
      )
    }

    return true
  }
}
