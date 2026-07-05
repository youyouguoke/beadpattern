import { z } from 'zod';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../lib/db';
import { success } from '../lib/response';
import { AppError } from '../lib/errors';
import type { Bindings } from '../lib/env';

const newsletter = new Hono<{ Bindings: Bindings }>();

const SubscribeSchema = z.object({
  email: z.string().email().max(254),
});

newsletter.post('/subscribe', zValidator('json', SubscribeSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const email = body.email.toLowerCase().trim();

  try {
    await db.insert('newsletter_subscribers', {
      email,
      status: 'subscribed',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('unique')) {
      return c.json(success({ email, status: 'already_subscribed' }));
    }
    throw new AppError('Failed to subscribe', 'SUBSCRIBE_ERROR', 500);
  }

  return c.json(success({ email, status: 'subscribed' }), 201);
});

export default newsletter;
