import { Hono } from 'hono';
import { generateId } from '../lib/slug';
import { success } from '../lib/response';
import { AppError } from '../lib/errors';
import type { Bindings } from '../lib/env';

const media = new Hono<{ Bindings: Bindings }>();

media.post('/upload-image', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || !(file instanceof File)) {
    throw new AppError('No file uploaded', 'FILE_MISSING', 400);
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    throw new AppError('Invalid file type. Only PNG, JPEG, WebP, GIF are allowed.', 'FILE_INVALID', 400);
  }

  if (!c.env.R2) {
    throw new AppError('R2 storage is not configured', 'R2_NOT_CONFIGURED', 503);
  }

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    throw new AppError('File too large. Max 5MB.', 'FILE_TOO_LARGE', 400);
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${generateId()}.${ext}`;

  await c.env.R2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const url = c.env.R2_PUBLIC_URL
    ? `${c.env.R2_PUBLIC_URL}/${key}`
    : `/media/${key}`;

  return c.json(success({ url, key }));
});

// Direct R2 object access via public URL handled by R2 dev/binding.
// This route returns a redirect to the public URL for fallback.
media.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  if (!c.env.R2_PUBLIC_URL) {
    throw new AppError('R2 public URL not configured', 'R2_NOT_CONFIGURED', 500);
  }
  return c.redirect(`${c.env.R2_PUBLIC_URL}/${key}`, 302);
});

export default media;
