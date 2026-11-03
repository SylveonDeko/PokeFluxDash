import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";
import { logger } from "$lib/logger";
import { m } from "$lib/i18n";
import { mintBackendToken } from "$lib/server/backendJwt";
import type { FluxerUser } from "$lib/types/fluxer";
import type { BotResponse } from "$lib/api/types";

export type { BotResponse };

export type BotMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Query values. `undefined` and `null` entries are left out. */
export type BotQuery = Record<string, string | number | boolean | null | undefined>;

export interface BotRequest {
  method?: BotMethod;
  body?: unknown;
  query?: BotQuery;
  /** The signed in user the call is made for. Without one only public endpoints answer. */
  user?: FluxerUser | null;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** The bot API origin from `POKEFLUX_API_URL`, without a trailing slash. */
export function botApiBase(): string | null {
  const url = env.POKEFLUX_API_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

/** Headers every bot call carries: the API key, plus a backend token when a user is known. */
export function botHeaders(user: FluxerUser | null | undefined, withJson = false): Record<string, string> {
  const headers: Record<string, string> = { "X-API-Key": env.POKEFLUX_API_KEY ?? "" };
  if (withJson) headers["Content-Type"] = "application/json";
  const token = user ? mintBackendToken(user) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** Builds `/api/<path>?<query>` against the bot API origin. */
export function botUrl(base: string, path: string, query?: BotQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return `${base}/api/${path.replace(/^\/+/, "")}${qs ? `?${qs}` : ""}`;
}

/** Reads the bot's `{ error }` body, or a short slice of plain text. */
function errorText(data: unknown, text: string, status: number): string {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error: unknown }).error;
    if (typeof error === "string" && error) return error;
  }
  const trimmed = text.replace(/^"|"$/g, "").trim().slice(0, 200);
  return trimmed || m.common.requestFailed({ status });
}

/**
 * Calls the bot API from the server with the dashboard's API key and, when `user` is set, a
 * freshly minted backend token. Never throws: network failures come back as status 503.
 */
export async function callBot<T = unknown>(path: string, request: BotRequest = {}): Promise<BotResponse<T>> {
  const base = botApiBase();
  if (!base) return { ok: false, status: 503, error: "POKEFLUX_API_URL is not set", data: null };

  const method = request.method ?? "GET";
  const hasBody = request.body !== undefined;

  try {
    const response = await fetch(botUrl(base, path, request.query), {
      method,
      headers: botHeaders(request.user, hasBody),
      body: hasBody ? JSON.stringify(request.body) : undefined,
      signal: request.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (response.ok) return { ok: true, status: response.status, data: data as T };
    return { ok: false, status: response.status, error: errorText(data, text, response.status), data: null };
  } catch (error) {
    logger.error(`Bot API call to ${path} failed:`, error);
    return { ok: false, status: 503, error: "unavailable", data: null };
  }
}

/** Turns a bot answer into a JSON response for the browser with the same status. */
export function relayBotResponse(response: BotResponse): Response {
  if (response.status === 204) return new Response(null, { status: 204 });
  if (response.ok) return json(response.data, { status: response.status });
  return json({ error: response.error }, { status: response.status });
}
