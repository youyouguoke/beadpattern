import type { Bindings } from './env';
import { getDB } from './db';
import type { Media } from '../types';

export type MediaType = 'cover' | 'finished' | 'step' | 'gallery' | 'banner';

export function parseMediaIds(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    // ignore
  }
  return [];
}

export function stringifyMediaIds(ids: string[] | undefined): string | null {
  if (!ids || ids.length === 0) return null;
  return JSON.stringify(ids);
}

export async function expandMediaIds(db: ReturnType<typeof getDB>, ids: string[]): Promise<Media[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.query<Media>(`SELECT * FROM media WHERE id IN (${placeholders})`, ids);
  const map = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((m): m is Media => m !== undefined);
}

export function parseUsedBy(value: string | null | undefined): Record<string, number> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, number>;
  } catch {
    return {};
  }
}

export function stringifyUsedBy(value: Record<string, number> | undefined): string | null {
  if (!value || Object.keys(value).length === 0) return null;
  return JSON.stringify(value);
}

export function getTotalUsedBy(usedBy: Record<string, number>): number {
  return Object.values(usedBy).reduce((a, b) => a + b, 0);
}

export async function updateMediaUsedBy(
  db: ReturnType<typeof getDB>,
  mediaId: string,
  resourceType: string,
  delta: number
): Promise<void> {
  const row = await db.queryOne<Media>('SELECT used_by FROM media WHERE id = ?', [mediaId]);
  if (!row) return;
  const used = row.used_by ? JSON.parse(row.used_by) as Record<string, number> : {};
  used[resourceType] = Math.max(0, (used[resourceType] ?? 0) + delta);
  await db.update('media', { used_by: JSON.stringify(used) }, { id: mediaId });
}

export async function syncPatternMediaUsedBy(
  db: ReturnType<typeof getDB>,
  _patternId: string,
  oldMediaIds: Record<string, string[]>,
  newMediaIds: Record<string, string[]>
): Promise<void> {
  const types = ['cover', 'finished', 'gallery', 'step'] as const;
  for (const type of types) {
    const oldSet = new Set(oldMediaIds[type] ?? []);
    const newSet = new Set(newMediaIds[type] ?? []);
    for (const id of oldSet) {
      if (!newSet.has(id)) await updateMediaUsedBy(db, id, type, -1);
    }
    for (const id of newSet) {
      if (!oldSet.has(id)) await updateMediaUsedBy(db, id, type, 1);
    }
  }
}

export function resolveMediaUrl(env: Bindings, media: Media | null | undefined): string | null {
  if (!media) return null;
  if (media.r2_key && env.R2_PUBLIC_URL) return `${env.R2_PUBLIC_URL}/${media.r2_key}`;
  return media.url;
}
