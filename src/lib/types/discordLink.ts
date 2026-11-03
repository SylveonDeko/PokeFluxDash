// lib/types/discordLink.ts

/**
 * A Discord identity proved by signing in with Discord. Kept server side for a short time and
 * never holds a Discord token.
 */
export type DiscordLinkIdentity = {
  discordUserId: string;
  username: string;
  avatar: string | null;
  expiresAt: string;
};
