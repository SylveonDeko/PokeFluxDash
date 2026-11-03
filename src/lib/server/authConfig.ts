import { env } from "$env/dynamic/private";

/** Fluxer OAuth application id. Also prefixes the Redis session keys. */
export const clientId = (): string => env.FLUXER_CLIENT_ID ?? "";

export const clientSecret = (): string => env.FLUXER_CLIENT_SECRET ?? "";

export const redirectUri = (): string => env.FLUXER_REDIRECT_URI ?? "";

/** Key the token cookies are encrypted with. */
export const cookieSecret = (): string => env.COOKIE_ENCRYPTION_PASSWORD ?? "";
