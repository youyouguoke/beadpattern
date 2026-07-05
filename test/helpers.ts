import { D1Database } from '@cloudflare/workers-types';

export type TestEnv = {
  DB: D1Database;
  APP_ORIGIN: string;
  SITE_NAME: string;
  ASSETS: { fetch: typeof fetch };
};

export function createTestBindings(): Omit<TestEnv, 'DB'> {
  return {
    APP_ORIGIN: 'https://bead-pattern-ai.workers.dev',
    SITE_NAME: 'BeadPatternAI',
    ASSETS: { fetch: globalThis.fetch },
  };
}
