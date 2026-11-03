import { env } from "$env/dynamic/private";

export const DISCORD_API_URL = "https://discord.com/api/v10",
  DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize",
  DISCORD_LINK_SCOPES = "identify",
  DISCORD_STATE_COOKIE = "discord_link_state",
  DISCORD_RETURN_COOKIE = "discord_link_return";

const FALLBACK_RETURN = "/dashboard/import";

/** Whether the Discord application for importing is set up. */
export const discordLinkConfigured = (): boolean =>
  Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_REDIRECT_URI);

/**
 * Narrows a requested return path to a same-origin relative path. Anything else, including
 * absolute URLs, protocol-relative URLs and backslash tricks, becomes the import page.
 */
export function safeReturnPath(requested: string | null | undefined): string {
  if (!requested) return FALLBACK_RETURN;
  if (!requested.startsWith("/") || requested.startsWith("//") || requested.includes("\\")) return FALLBACK_RETURN;
  if (/[\u0000-\u001f]/.test(requested)) return FALLBACK_RETURN;
  try {
    const resolved = new URL(requested, "http://localhost");
    if (resolved.origin !== "http://localhost") return FALLBACK_RETURN;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return FALLBACK_RETURN;
  }
}
