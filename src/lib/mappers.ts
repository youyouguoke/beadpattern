function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

export function snakeToCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map((v) => snakeToCamel(v)) as T;
  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      result[camelKey] = snakeToCamel(value);
    }
    return result as T;
  }
  return obj as T;
}

export function camelToSnake<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map((v) => camelToSnake(v)) as T;
  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, (c: string) => `_${c.toLowerCase()}`);
      result[snakeKey] = camelToSnake(value);
    }
    return result as T;
  }
  return obj as T;
}

export function parseJsonGrid(raw: unknown): (string | number)[][] | undefined {
  if (Array.isArray(raw)) return raw as (string | number)[][];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as (string | number)[][];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function stringifyIfNeeded(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.stringify(value);
}
