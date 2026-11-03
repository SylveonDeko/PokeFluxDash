import { m } from "$lib/i18n";
import type { ApiMessage } from "./types";

export type ProxyMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Calls the bot from the browser through /api/[...path] and resolves to the body, or throws the bot's error. */
export async function proxyRequest<T = ApiMessage>(
  method: ProxyMethod,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/${path.replace(/^\/+/, "")}`, {
    method,
    signal,
    headers: { accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data && typeof data.error === "string" && data.error ? data.error : m.common.requestFailed({ status: response.status }),
    );
  }
  return data as T;
}

/** The message of an error thrown by {@link proxyRequest}. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
