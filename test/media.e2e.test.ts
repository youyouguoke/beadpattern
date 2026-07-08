import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

const baseUrl = 'http://localhost/api';

async function postMedia(fileName: string, type = 'cover', altText?: string) {
  // Build a minimal valid PNG (1x1 black pixel)
  const pngBytes = buildPng();
  const body = new FormData();
  const file = new File([pngBytes], fileName, { type: 'image/png' });
  body.append('file', file);
  body.append('type', type);
  if (altText) body.append('alt_text', altText);
  return app.fetch(
    new Request(`${baseUrl}/media/upload-image`, { method: 'POST', body }),
    env
  );
}

function buildPng(): ArrayBuffer {
  // Minimal PNG: IHDR + IDAT + IEND
  function chunk(type: string, data: Uint8Array) {
    const len = new Uint8Array(4);
    const view = new DataView(len.buffer);
    view.setUint32(0, data.length, false);
    const typeBytes = new TextEncoder().encode(type);
    const combined = new Uint8Array(typeBytes.length + data.length);
    combined.set(typeBytes, 0);
    combined.set(data, typeBytes.length);
    const crc = crc32(combined);
    const crcArr = new Uint8Array(4);
    new DataView(crcArr.buffer).setUint32(0, crc, false);
    const result = new Uint8Array(4 + typeBytes.length + data.length + 4);
    result.set(len, 0);
    result.set(typeBytes, 4);
    result.set(data, 8);
    result.set(crcArr, 8 + data.length);
    return result;
  }
  function crc32(data: Uint8Array): number {
    let c = ~0;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let n = i;
      for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
      table[i] = n >>> 0;
    }
    for (let i = 0; i < data.length; i++) {
      c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    }
    return (~c) >>> 0;
  }
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = new Uint8Array([
    0, 0, 0, 1, // width
    0, 0, 0, 1, // height
    8, 0, 0, 0, 0, // bit depth, color type, compression, filter, interlace
  ]);
  const idatData = new Uint8Array([
    0x78, 0x9c, 0x63, 0x60, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01,
  ]);
  const iendData = new Uint8Array(0);
  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', iendData);
  const out = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  out.set(signature, 0);
  out.set(ihdr, signature.length);
  out.set(idat, signature.length + ihdr.length);
  out.set(iend, signature.length + ihdr.length + idat.length);
  return out.buffer;
}

async function resetMediaById(id: string) {
  const db = env.DB;
  await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
}

async function resetPattern(slug: string) {
  const db = env.DB;
  const row = await db.prepare('SELECT id FROM patterns WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!row) return;
  await db.batch([
    db.prepare('DELETE FROM pattern_tags WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_steps WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM patterns WHERE id = ?').bind(row.id),
  ]);
}

async function json(res: Response) {
  return res.json();
}

const testSlug = 'media-test-pattern';

describe('Media API', () => {
  const createdMediaIds: string[] = [];

  beforeEach(async () => {
    await resetPattern(testSlug);
  });

  afterEach(async () => {
    for (const id of createdMediaIds) {
      await resetMediaById(id);
    }
    createdMediaIds.length = 0;
  });

  describe('POST /api/media/upload-image', () => {
    it('uploads an image and extracts dimensions', async () => {
      const res = await postMedia('test.png', 'cover', 'cover alt');
      expect(res.status).toBe(201);
      const body = (await json(res)) as { success: boolean; data: Record<string, unknown> };
      expect(body.success).toBe(true);
      expect(body.data.width).toBe(1);
      expect(body.data.height).toBe(1);
      expect(body.data.type).toBe('cover');
      expect(body.data.alt_text).toBe('cover alt');
      expect(body.data.folder).toBe('covers');
      expect(body.data.used_by_total).toBe(0);
      createdMediaIds.push(body.data.id as string);
    });

    it('rejects invalid file types', async () => {
      const body = new FormData();
      body.append('file', new File(['text'], 'test.txt', { type: 'text/plain' }));
      const res = await app.fetch(
        new Request(`${baseUrl}/media/upload-image`, { method: 'POST', body }),
        env
      );
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/media/:id', () => {
    it('returns parsed used_by and total', async () => {
      const uploadRes = await postMedia('detail.png', 'finished');
      const uploadBody = (await json(uploadRes)) as { success: boolean; data: Record<string, unknown> };
      const id = uploadBody.data.id as string;
      createdMediaIds.push(id);
      const res = await app.fetch(new Request(`${baseUrl}/media/${id}`), env);
      expect(res.status).toBe(200);
      const body = (await json(res)) as { success: boolean; data: Record<string, unknown> };
      expect(body.data.used_by).toEqual({});
      expect(body.data.used_by_total).toBe(0);
    });
  });

  describe('PUT /api/media/:id', () => {
    it('updates alt_text and returns parsed data', async () => {
      const uploadRes = await postMedia('update.png', 'cover');
      const uploadBody = (await json(uploadRes)) as { success: boolean; data: Record<string, unknown> };
      const id = uploadBody.data.id as string;
      createdMediaIds.push(id);
      const res = await app.fetch(
        new Request(`${baseUrl}/media/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alt_text: 'updated alt' }),
        }),
        env
      );
      expect(res.status).toBe(200);
      const body = (await json(res)) as { success: boolean; data: Record<string, unknown> };
      expect(body.data.alt_text).toBe('updated alt');
    });
  });

  describe('DELETE /api/media/:id', () => {
    it('prevents deletion of media used by a pattern', async () => {
      const uploadRes = await postMedia('delete-protected.png', 'cover');
      const uploadBody = (await json(uploadRes)) as { success: boolean; data: Record<string, unknown> };
      const id = uploadBody.data.id as string;
      createdMediaIds.push(id);
      const createRes = await app.fetch(
        new Request(`${baseUrl}/patterns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Media test pattern',
            slug: testSlug,
            difficulty: 'easy',
            cover_media_id: id,
            grid_width: 3,
            grid_height: 3,
            grid_data: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
            color_palette: ['#FF0000', '#00FF00', '#0000FF'],
          }),
        }),
        env
      );
      expect(createRes.status).toBe(201);

      const deleteRes = await app.fetch(
        new Request(`${baseUrl}/media/${id}`, { method: 'DELETE' }),
        env
      );
      expect(deleteRes.status).toBe(409);
    });
  });
});
