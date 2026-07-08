import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../lib/db';
import { ActionPayloadSchema } from '../lib/schemas';
import { success } from '../lib/response';
import { AppError } from '../lib/errors';
import type { Bindings } from '../lib/env';
import type { Pattern } from '../types';
import { generateId } from '../lib/slug';

const actions = new Hono<{ Bindings: Bindings }>();

function getClientFingerprint(c: any): string {
  const clientId = c.req.query('client_id');
  if (clientId) return clientId;
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const ua = c.req.header('user-agent') || 'unknown';
  return `${ip}:${ua.slice(0, 8)}`;
}

async function hasRecentAction(
  db: ReturnType<typeof getDB>,
  patternId: string,
  actionType: string,
  fingerprint: string
): Promise<boolean> {
  const row = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM action_logs
     WHERE pattern_id = ? AND action_type = ? AND fingerprint = ?
       AND created_at > datetime('now', '-60 minutes')`,
    [patternId, actionType, fingerprint]
  );
  return (row?.count ?? 0) > 0;
}

async function logAction(
  db: ReturnType<typeof getDB>,
  patternId: string,
  actionType: string,
  fingerprint: string
): Promise<void> {
  await db.insert('action_logs', {
    id: generateId(),
    pattern_id: patternId,
    action_type: actionType,
    fingerprint,
    created_at: new Date().toISOString(),
  });
}

actions.post('/', zValidator('json', ActionPayloadSchema), async (c) => {
  const body = c.req.valid('json');
  const db = getDB(c.env);
  const pattern = await db.queryOne<Pattern>('SELECT id, slug FROM patterns WHERE slug = ?', [body.pattern_slug]);
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const fingerprint = body.fingerprint ?? getClientFingerprint(c);
  const counted = !['view', 'like'].includes(body.type) || !(await hasRecentAction(db, pattern.id, body.type, fingerprint));
  if (counted) {
    await logAction(db, pattern.id, body.type, fingerprint);
  }

  const columnMap: Record<string, string> = { view: 'views', like: 'likes', share: 'shares', download: 'downloads' };
  const col = columnMap[body.type];
  if (col) {
    await db.execute(
      `INSERT INTO analytics (pattern_id, ${col}) VALUES (?, 1)
       ON CONFLICT(pattern_id) DO UPDATE SET ${col} = ${col} + 1, updated_at = ?`,
      [pattern.id, new Date().toISOString()]
    );
  }

  return c.json(success({ action: body.type, pattern_id: pattern.id, counted }));
});

export default actions;
