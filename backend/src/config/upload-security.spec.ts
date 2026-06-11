import { isAllowedUploadPath, uploadSecurityMiddleware } from './upload-security';

describe('upload security', () => {
  it('allows only image extensions', () => {
    expect(isAllowedUploadPath('/instagram-studio/a.png')).toBe(true);
    expect(isAllowedUploadPath('/instagram-studio/a.JPG')).toBe(true);
    expect(isAllowedUploadPath('/instagram-studio/a.webp')).toBe(true);
    expect(isAllowedUploadPath('/instagram-studio/a.svg')).toBe(false);
    expect(isAllowedUploadPath('/instagram-studio/a.html')).toBe(false);
    expect(isAllowedUploadPath('/instagram-studio/.env')).toBe(false);
  });

  it('blocks disallowed upload path before static serving', () => {
    const req = { path: '/x.svg' };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, setHeader: jest.fn() };
    const next = jest.fn();

    uploadSecurityMiddleware(req as any, res as any, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'File type not allowed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets safe headers for allowed upload path', () => {
    const req = { path: '/x.png' };
    const res = { status: jest.fn(), setHeader: jest.fn() };
    const next = jest.fn();

    uploadSecurityMiddleware(req as any, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
