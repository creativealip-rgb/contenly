import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { auth } from '../../auth/auth.config';

jest.mock('../../auth/auth.config', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

describe('AuthGuard', () => {
  const getSession = auth.api.getSession as unknown as jest.Mock;

  function createContext(request: Record<string, any>) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows valid Better Auth session and attaches user/session to request', async () => {
    const guard = new AuthGuard();
    const request = { headers: { cookie: 'better-auth.session_token=valid' } };
    const session = { user: { id: 'user-1', email: 'u@test.com' }, session: { id: 'session-1' } };
    getSession.mockResolvedValue(session);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toMatchObject({ user: session.user, session: session.session });
  });

  it('allows valid bearer API key when session is missing', async () => {
    const usersService = { validateApiKey: jest.fn().mockResolvedValue({ id: 'user-2' }) };
    const guard = new AuthGuard(usersService as any);
    const request = { headers: { authorization: 'Bearer sk-test' } };
    getSession.mockResolvedValue(null);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(usersService.validateApiKey).toHaveBeenCalledWith('sk-test');
    expect(request).toMatchObject({ user: { id: 'user-2' } });
  });

  it('allows x-api-key header fallback', async () => {
    const usersService = { validateApiKey: jest.fn().mockResolvedValue({ id: 'user-3' }) };
    const guard = new AuthGuard(usersService as any);
    const request = { headers: { 'x-api-key': 'sk-header' } };
    getSession.mockResolvedValue(null);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(usersService.validateApiKey).toHaveBeenCalledWith('sk-header');
  });

  it('rejects when session and API key are invalid', async () => {
    const usersService = { validateApiKey: jest.fn().mockResolvedValue(null) };
    const guard = new AuthGuard(usersService as any);
    const request = { headers: { authorization: 'Bearer bad-key' } };
    getSession.mockRejectedValue(new Error('bad session'));

    await expect(guard.canActivate(createContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
