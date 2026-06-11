import { requestIdMiddleware, REQUEST_ID_HEADER } from './request-id.middleware';

describe('requestIdMiddleware', () => {
  it('keeps incoming request id and exposes response header', () => {
    const req = { header: jest.fn().mockReturnValue('req-in') } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe('req-in');
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'req-in');
    expect(next).toHaveBeenCalled();
  });

  it('generates request id when missing', () => {
    const req = { header: jest.fn().mockReturnValue(undefined) } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toEqual(expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, req.requestId);
    expect(next).toHaveBeenCalled();
  });
});
