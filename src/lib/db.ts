import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle>;

export function createDb(binding: unknown) {
  return drizzle(binding as any, { schema });
}

export { schema };
