import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class SuperAdminGuard extends AuthGuard {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // First run the base AuthGuard logic
        const isAuthenticated = await super.canActivate(context);
        if (!isAuthenticated) return false;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user?.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Super Admin access required');
        }

        return true;
    }
}
