import type { Context } from 'hono';
import type { Bindings, Variables } from './env';

export type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;
