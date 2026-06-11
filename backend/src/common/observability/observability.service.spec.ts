import { ConfigService } from '@nestjs/config';
import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  const createService = (env: Record<string, string> = {}) =>
    new ObservabilityService({
      get: jest.fn((key: string) => env[key]),
    } as unknown as ConfigService);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('is disabled without webhook url', async () => {
    const service = createService();
    const fetchSpy = jest.spyOn(global, 'fetch' as any);

    expect(service.isEnabled()).toBe(false);
    await service.capture({ level: 'error', message: 'boom' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends events to configured webhook', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValue({ ok: true } as any);
    const service = createService({
      OBSERVABILITY_WEBHOOK_URL: 'https://logs.example.com/event',
      OBSERVABILITY_PROVIDER: 'logtail',
      NODE_ENV: 'test',
    });

    await service.capture({
      level: 'error',
      message: 'boom',
      requestId: 'req-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://logs.example.com/event',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('boom'),
      }),
    );
  });
});
