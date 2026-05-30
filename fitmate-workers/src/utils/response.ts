import type { Context } from 'hono';

export function success<T>(c: Context, data: T, message = 'success') {
  return c.json({ code: 0, data, message });
}

export function error(c: Context, message = 'error', code = 500) {
  return c.json({ code, data: null, message }, code as any);
}
