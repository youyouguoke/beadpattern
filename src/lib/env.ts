export interface Bindings {
  DB: D1Database;
  R2?: R2Bucket;
  BULK_QUEUE?: Queue;
  APP_ORIGIN: string;
  SITE_NAME: string;
  R2_PUBLIC_URL?: string;
  SITE_URL?: string;
  ASSETS?: Fetcher;
  SESSION_SECRET?: string;
  ADMIN_API_KEY?: string;
  SEED_IMPORT_SECRET?: string;
}

export type Variables = {
  requestId?: string;
  isAdmin?: boolean;
};
