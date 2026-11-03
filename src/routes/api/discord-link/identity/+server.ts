import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { sessionManager } from "$lib/server/redisSession";

export const DELETE: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: "unauthorized" }, { status: 401 });

  await sessionManager.clearDiscordIdentity(locals.user.id.toString());
  return json({ cleared: true });
};
