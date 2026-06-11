import { ForbiddenException } from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';

describe('SuperAdminGuard', () => {
  function createContext(user: unknown) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('allows super_admin user', () => {
    const guard = new SuperAdminGuard();

    expect(guard.canActivate(createContext({ id: 'u1', role: 'super_admin' }))).toBe(true);
  });

  it('rejects regular admin user', () => {
    const guard = new SuperAdminGuard();

    expect(() => guard.canActivate(createContext({ id: 'u1', role: 'admin' }))).toThrow(ForbiddenException);
  });

  it('rejects missing user', () => {
    const guard = new SuperAdminGuard();

    expect(() => guard.canActivate(createContext(null))).toThrow(ForbiddenException);
  });
});
