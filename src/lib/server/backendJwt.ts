import { createHmac, randomBytes } from "node:crypto";
import { env } from "$env/dynamic/private";
import { logger } from "$lib/logger";
import type { FluxerUser } from "$lib/types/fluxer";

/** HS256 secret the dashboard signs backend tokens with. Must equal the bot's `JwtSecret`. */
const BOT_JWT_SECRET = env.BOT_JWT_SECRET ?? "";

/** Lifetime of a backend token in seconds. */
const BACKEND_TTL = Number(env.BOT_JWT_TTL ?? 300);

/** Must match the issuer the bot validates. */
const ISSUER = "pokeflux-dashboard";
/** Must match the audience the bot validates. */
const AUDIENCE = "pokeflux-botapi";
/** Must match the scope the bot requires. */
const SCOPE = "botapi";

/** Encodes a UTF-8 string as unpadded, URL-safe base64 (base64url). */
const b64url = (text: string): string =>
  Buffer.from(text, "utf8").toString("base64url");

export function canMintBackendToken(): boolean {
  return BOT_JWT_SECRET.length >= 32;
}

function hmac(payload: string): string {
  return createHmac("sha256", BOT_JWT_SECRET)
    .update(payload)
    .digest("base64url");
}

/** Claims embedded in a backend token. `sub` is the Fluxer user id, `name` the username. */
interface BackendClaims {
  sub: string;
  name: string;
  jti: string;
  iat: number;
  exp: number;
  scope: typeof SCOPE;
  iss: typeof ISSUER;
  aud: typeof AUDIENCE;
}

/**
 * Mints a short-lived HS256 backend token identifying the given dashboard user.
 * Sent as `Authorization: Bearer` on bot API calls.
 */
export function mintBackendToken(user: FluxerUser): string | null {
  if (!canMintBackendToken()) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload: BackendClaims = {
    sub: String(user.id),
    name: user.username,
    jti: randomBytes(12).toString("base64url"),
    iat: now,
    exp: now + BACKEND_TTL,
    scope: SCOPE,
    iss: ISSUER,
    aud: AUDIENCE,
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const signature = hmac(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

/** Logs a warning at startup if `BOT_JWT_SECRET` is missing or weak. */
export function logBackendJwtInit(): void {
  if (!canMintBackendToken()) {
    logger.warn(
      "BOT_JWT_SECRET is missing or shorter than 32 bytes. It must match the bot's JwtSecret.",
    );
  }
}
