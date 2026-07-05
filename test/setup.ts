import { beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applyMigrations } from './migrations';

beforeAll(async () => {
  await applyMigrations(env.DB);
});
