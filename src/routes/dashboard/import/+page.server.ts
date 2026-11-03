import type { DiscordImportPreview } from "$lib/api";
import { callBot } from "$lib/server/botApi";
import { discordLinkConfigured } from "$lib/server/discordLink";
import { sessionManager } from "$lib/server/redisSession";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const configured = discordLinkConfigured();
  const identity =
    configured && locals.user ? await sessionManager.getDiscordIdentity(locals.user.id.toString()) : null;
  const preview = identity
    ? await callBot<DiscordImportPreview>(`discord-import/${encodeURIComponent(identity.discordUserId)}`, {
        user: locals.user,
      })
    : null;

  return {
    configured,
    identity: identity && {
      id: identity.discordUserId,
      username: identity.username,
      avatar: identity.avatar,
    },
    preview,
    linkResult: url.searchParams.get("discord_link"),
  };
};
