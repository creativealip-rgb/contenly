import { BadRequestException } from '@nestjs/common';
import { HttpErrorFilter } from './http-exception.filter';

describe('HttpErrorFilter', () => {
  it('returns standard error shape with request id', () => {
    const filter = new HttpErrorFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/v1/test', requestId: 'req-1' }),
      }),
    } as any;

    filter.catch(new BadRequestException({ message: 'Bad payload', code: 'BAD_PAYLOAD' }), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Bad payload',
      code: 'BAD_PAYLOAD',
      requestId: 'req-1',
      path: '/api/v1/test',
    }));
  });
});
