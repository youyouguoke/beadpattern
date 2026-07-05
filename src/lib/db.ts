import type { Bindings } from './env';

export class DBClient {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const { results } = await stmt.bind(...(params ?? [])).all<T>();
    return results ?? [];
  }

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async insert<T extends Record<string, unknown>>(
    table: string,
    record: T
  ): Promise<string> {
    const keys = Object.keys(record);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const info = await this.db
      .prepare(sql)
      .bind(...Object.values(record))
      .run();
    // @ts-expect-error D1 info types are not fully exposed
    return info.meta?.last_row_id as string;
  }

  async update<T extends Record<string, unknown>>(
    table: string,
    record: T,
    where: Record<string, unknown>
  ): Promise<void> {
    const setClauses = Object.keys(record).map((k) => `${k} = ?`).join(', ');
    const whereClauses = Object.keys(where).map((k) => `${k} = ?`).join(' AND ');
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${whereClauses}`;
    await this.db
      .prepare(sql)
      .bind(...Object.values(record), ...Object.values(where))
      .run();
  }

  async deleteWhere(table: string, where: Record<string, unknown>): Promise<void> {
    const whereClauses = Object.keys(where).map((k) => `${k} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClauses}`;
    await this.db
      .prepare(sql)
      .bind(...Object.values(where))
      .run();
  }

  async execute(sql: string, params?: unknown[]): Promise<D1Result<unknown>> {
    return this.db.prepare(sql).bind(...(params ?? [])).run();
  }
}

export function getDB(bindings: Bindings): DBClient {
  return new DBClient(bindings.DB);
}
