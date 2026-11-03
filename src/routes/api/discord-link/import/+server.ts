import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { callBot, relayBotResponse } from "$lib/server/botApi";
import { sessionManager } from "$lib/server/redisSession";

const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: "unauthorized" }, { status: 401 });

  const identity = await sessionManager.getDiscordIdentity(locals.user.id.toString());
  if (!identity) return json({ error: "Sign in with Discord again first." }, { status: 409 });

  const response = await callBot(`discord-import/${encodeURIComponent(identity.discordUserId)}`, {
    method: "POST",
    user: locals.user,
    signal: AbortSignal.timeout(IMPORT_TIMEOUT_MS),
  });
  if (response.ok) await sessionManager.clearDiscordIdentity(locals.user.id.toString());
  return relayBotResponse(response);
};
