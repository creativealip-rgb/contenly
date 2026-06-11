import { BadRequestException } from '@nestjs/common';
import { HttpErrorFilter } from './http-exception.filter';

describe('HttpErrorFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/v1/test', requestId: 'req-1' }),
      }),
    } as any;
    return { host, status, json };
  };

  it('returns standard error shape with request id', () => {
    const filter = new HttpErrorFilter();
    const { host, status, json } = createHost();

    filter.catch(
      new BadRequestException({ message: 'Bad payload', code: 'BAD_PAYLOAD' }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Bad payload',
        code: 'BAD_PAYLOAD',
        requestId: 'req-1',
        path: '/api/v1/test',
      }),
    );
  });

  it('sends 500 errors to observability provider', () => {
    const observability = { captureException: jest.fn() };
    const filter = new HttpErrorFilter(observability as any);
    const { host, status } = createHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(observability.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        requestId: 'req-1',
        status: 500,
        path: '/api/v1/test',
        message: 'Internal server error',
      }),
    );
  });
});
