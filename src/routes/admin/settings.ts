import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success } from '../../lib/response';
import type { Bindings } from '../../lib/env';
import type { Setting } from '../../types';
import { UpdateSettingSchema } from '../../lib/schemas';

const settings = new Hono<{ Bindings: Bindings }>();

settings.get('/', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<Setting>('SELECT * FROM settings ORDER BY key');
  const values: Record<string, string | null> = {};
  for (const row of rows) values[row.key] = row.value;
  return c.json(success(values));
});

settings.put('/', zValidator('json', UpdateSettingSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(body.values)) {
    await db.execute(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, value ?? null, now]
    );
  }
  return c.json(success(body.values));
});

export default settings;
