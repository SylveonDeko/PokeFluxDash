import { json } from "@sveltejs/kit";
import type { RequestEvent, RequestHandler } from "./$types";
import { callBot, relayBotResponse, type BotMethod } from "$lib/server/botApi";

/**
 * Normalises the proxied path the way the bot's router reads it and rejects anything that
 * could climb out of `/api`.
 */
function normalisePath(path: string | undefined): string | null {
  if (!path) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }
  const normalised = decoded.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\/|\/$/g, "");
  if (!normalised || normalised.split("/").some((segment) => segment === ".." || segment === ".")) return null;
  return normalised;
}

async function readBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Forwards a browser call to the bot with the API key and the signed in user's backend token. */
function forward(method: BotMethod): RequestHandler {
  return async ({ params, url, request, locals }: RequestEvent) => {
    const path = normalisePath(params.path);
    if (!path || path.toLowerCase().split("/")[0] === "discord-import") return json({ error: "not_found" }, { status: 404 });

    const body = method === "GET" ? undefined : await readBody(request);
    if (body === null) return json({ error: "invalid_json" }, { status: 400 });

    const response = await callBot(path, {
      method,
      body,
      query: Object.fromEntries(url.searchParams),
      user: locals.user,
    });
    return relayBotResponse(response);
  };
}

export const GET = forward("GET");
export const POST = forward("POST");
export const PUT = forward("PUT");
export const PATCH = forward("PATCH");
export const DELETE = forward("DELETE");
