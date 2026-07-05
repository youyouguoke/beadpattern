import { Hono } from 'hono';
import dashboard from './dashboard';
import patterns from './patterns';
import collections from './collections';
import categories from './categories';
import tags from './tags';
import media from './media';
import bulk from './bulk';
import seo from './seo';
import analytics from './analytics';
import newsletter from './newsletter';
import settings from './settings';
import type { Bindings } from '../../lib/env';

const admin = new Hono<{ Bindings: Bindings }>();

admin.route('/dashboard', dashboard);
admin.route('/patterns', patterns);
admin.route('/collections', collections);
admin.route('/categories', categories);
admin.route('/tags', tags);
admin.route('/media', media);
admin.route('/bulk', bulk);
admin.route('/seo', seo);
admin.route('/analytics', analytics);
admin.route('/newsletter', newsletter);
admin.route('/settings', settings);

export default admin;
