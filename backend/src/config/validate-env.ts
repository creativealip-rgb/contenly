import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

const REQUIRED_IN_ALL_ENVS = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'FRONTEND_URL'] as const;
const REQUIRED_IN_PRODUCTION = ['REDIS_URL'] as const;
const URL_VARS = ['DATABASE_URL', 'FRONTEND_URL', 'API_URL'] as const;

function validateUrlList(name: string, value: string) {
  const urls = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    return [`${name} must contain at least one URL`];
  }

  return urls.flatMap((url) => {
    try {
      new URL(url);
      return [];
    } catch {
      return [`${name} contains invalid URL: ${url}`];
    }
  });
}

export function getEnvValidationErrors(env: NodeJS.ProcessEnv = process.env) {
  const errors: string[] = [];
  const required = new Set<string>(REQUIRED_IN_ALL_ENVS);

  if (env.NODE_ENV === 'production') {
    REQUIRED_IN_PRODUCTION.forEach((key) => required.add(key));
  }

  for (const key of Array.from(required)) {
    if (!env[key]?.trim()) {
      errors.push(`${key} is required`);
    }
  }

  if (
    env.NODE_ENV === 'production' &&
    !['OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'NINE_ROUTER_API_KEY'].some((key) => Boolean(env[key]?.trim()))
  ) {
    errors.push('At least one AI key is required in production: OPENAI_API_KEY, OPENROUTER_API_KEY, or NINE_ROUTER_API_KEY');
  }

  for (const key of URL_VARS) {
    const value = env[key];
    if (value?.trim()) {
      errors.push(...validateUrlList(key, value));
    }
  }

  const betterAuthSecret = env.BETTER_AUTH_SECRET;
  if (betterAuthSecret && betterAuthSecret.length < 32) {
    errors.push('BETTER_AUTH_SECRET must be at least 32 characters');
  }

  return errors;
}

export function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === '1') {
    logger.warn('Skipping environment validation because SKIP_ENV_VALIDATION=1');
    return;
  }

  const errors = getEnvValidationErrors();

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  logger.log('Environment validation passed');
}

validateEnv();
