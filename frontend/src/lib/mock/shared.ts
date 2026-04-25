export type MockBody = Record<string, unknown>;

export interface MockCtx {
  path: string;
  method: string;
  body: MockBody | undefined;
  query: URLSearchParams;
}

export type MockHandler = (ctx: MockCtx) => Response | null;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function notFound(message = "Not found"): Response {
  return json({ message }, 404);
}

export function parseId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function withLatency<T>(value: T, min = 60, max = 180): Promise<T> {
  const wait = min + Math.random() * Math.max(1, max - min);
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), wait);
  });
}

export function matchesQuery<T extends Record<string, unknown>>(
  rows: T[],
  query: URLSearchParams,
  fields: (keyof T)[]
): T[] {
  const q = query.get("q")?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    fields.some((field) => String(row[field] ?? "").toLowerCase().includes(q))
  );
}
