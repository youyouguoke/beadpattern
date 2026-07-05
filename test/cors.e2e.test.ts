import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

const baseUrl = 'http://localhost';

describe('CORS headers', () => {
  it('allows requests from configured APP_ORIGIN', async () => {
    const res = await app.fetch(
      new Request(`${baseUrl}/health`, {
        headers: { Origin: env.APP_ORIGIN },
      }),
      env
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.APP_ORIGIN);
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('allows localhost origin in development', async () => {
    const res = await app.fetch(
      new Request(`${baseUrl}/health`, {
        headers: { Origin: 'http://localhost:3000' },
      }),
      env
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });

  it('does not reflect disallowed origins', async () => {
    const res = await app.fetch(
      new Request(`${baseUrl}/health`, {
        headers: { Origin: 'https://evil.example.com' },
      }),
      env
    );
    const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).toBeNull();
  });

  it('responds to OPTIONS with allowed methods', async () => {
    const res = await app.fetch(
      new Request(`${baseUrl}/api/patterns`, {
        method: 'OPTIONS',
        headers: {
          Origin: env.APP_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      }),
      env
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
