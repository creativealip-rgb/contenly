describe('environment validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      FRONTEND_URL: 'http://localhost:3000',
      SKIP_ENV_VALIDATION: undefined,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('passes with required local env values', async () => {
    const { getEnvValidationErrors } = await import('./validate-env');

    expect(getEnvValidationErrors(process.env)).toEqual([]);
  });

  it('reports missing required values', async () => {
    const { getEnvValidationErrors } = await import('./validate-env');

    expect(
      getEnvValidationErrors({
        NODE_ENV: 'development',
      }),
    ).toEqual(expect.arrayContaining(['DATABASE_URL is required', 'BETTER_AUTH_SECRET is required', 'FRONTEND_URL is required']));
  });

  it('requires redis and one AI key in production', async () => {
    const { getEnvValidationErrors } = await import('./validate-env');

    expect(
      getEnvValidationErrors({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'x'.repeat(32),
        FRONTEND_URL: 'https://contenly.app',
      }),
    ).toEqual(
      expect.arrayContaining([
        'REDIS_URL is required',
        'At least one AI key is required in production: OPENAI_API_KEY, OPENROUTER_API_KEY, or NINE_ROUTER_API_KEY',
      ]),
    );
  });
});
