import { createTmpAuthMiddleware } from './tmp-auth.middleware';

describe('createTmpAuthMiddleware', () => {
  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  const logger = { warn: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows request when Better Auth session has user', async () => {
    const getSession = jest.fn().mockResolvedValue({ user: { id: 'user-1' } });
    const middleware = createTmpAuthMiddleware(logger, getSession as any);
    const req = { headers: { cookie: 'better-auth.session_token=real-token' } } as any;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res as any, next);

    expect(getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    const headers = getSession.mock.calls[0][0].headers as Headers;
    expect(headers.get('cookie')).toBe('better-auth.session_token=real-token');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects request when cookie name exists but session is invalid', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const middleware = createTmpAuthMiddleware(logger, getSession as any);
    const req = { headers: { cookie: 'better-auth.session_token=fake-token' } } as any;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('rejects request when session validation throws', async () => {
    const getSession = jest.fn().mockRejectedValue(new Error('bad session'));
    const middleware = createTmpAuthMiddleware(logger, getSession as any);
    const req = { headers: { cookie: 'better-auth.session_token=broken-token' } } as any;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(logger.warn).toHaveBeenCalledWith('Tmp file auth failed: bad session');
  });
});
