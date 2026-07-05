import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { errorHandler } from './lib/errors';
import { configureCors } from './lib/cors';
import type { Bindings, Variables } from './lib/env';

import patterns from './routes/patterns';
import tags from './routes/tags';
import difficulty from './routes/difficulty';
import search from './routes/search';
import recommend from './routes/recommend';
import media from './routes/media';
import bulk from './routes/bulk';
import sitemap from './routes/sitemap';
import newsletter from './routes/newsletter';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', logger());
app.use('*', prettyJSON());
configureCors(app);

app.onError(errorHandler);

app.get('/health', (c) => c.json({ status: 'ok', requestId: c.get('requestId') }));

app.route('/api/patterns', patterns);
app.route('/api/tags', tags);
app.route('/api/difficulty', difficulty);
app.route('/api/search', search);
app.route('/api/recommend', recommend);
app.route('/api/admin', media);
app.route('/api/bulk', bulk);
app.route('/api/sitemap', sitemap);
app.route('/api/newsletter', newsletter);

// Fallback 404
app.notFound((c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, 404));

export default app;
