import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

const baseUrl = 'http://localhost/api';

async function subscribe(email: string) {
  return app.fetch(
    new Request(`${baseUrl}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
    env
  );
}

async function resetEmail(email: string) {
  await env.DB.prepare('DELETE FROM newsletter_subscribers WHERE email = ?').bind(email).run();
}

describe('Newsletter API', () => {
  const email = 'test@example.com';

  beforeEach(async () => {
    await resetEmail(email);
  });

  it('subscribes a new email', async () => {
    const res = await subscribe(email);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: { email: string; status: string } };
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(email.toLowerCase());
    expect(body.data.status).toBe('subscribed');
  });

  it('returns already_subscribed for duplicate email', async () => {
    await subscribe(email);
    const res = await subscribe(email);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { email: string; status: string } };
    expect(body.data.status).toBe('already_subscribed');
  });

  it('rejects invalid email', async () => {
    const res = await subscribe('not-an-email');
    expect(res.status).toBe(400);
  });

  it('normalizes uppercase email', async () => {
    const res = await subscribe('Test@Example.COM');
    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: { email: string } };
    expect(body.data.email).toBe('test@example.com');
  });
});
