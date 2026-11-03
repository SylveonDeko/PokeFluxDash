import { env } from "$env/dynamic/public";
import { authenticateUser } from "$lib/server/fluxerApi";
import { logBackendJwtInit } from "$lib/server/backendJwt";
import * as Sentry from "@sentry/sveltekit";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle, ServerInit } from "@sveltejs/kit";
import { resolveLocale, runWithLocale } from "$lib/i18n/server";
import { resolveFluxerInstance } from "$lib/server/fluxerInstance";

const dsn = env.PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: env.PUBLIC_SENTRY_ENVIRONMENT ?? "production",
  tracesSampleRate: 0.1,
});

logBackendJwtInit();

export const init: ServerInit = async () => {
  await resolveFluxerInstance();
};

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const appHandle: Handle = async ({ event, resolve }) => {
  try {
    const pathname = event.url.pathname;
    if (
      pathname.startsWith("/api/auth/callback") ||
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/logout")
    ) {
      return resolve(event);
    }

    event.locals.user = await authenticateUser(event, event.cookies);

    const response = await resolve(event);

    response.headers.set("Content-Security-Policy", CSP);
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch {
    event.locals.user = null;
    return resolve(event);
  }
};

/**
 * Serves the whole request in the viewer's locale: the message accessors read it during SSR and
 * the <html lang> attribute follows it.
 */
const localeHandle: Handle = async ({ event, resolve }) => {
  const locale = resolveLocale(event.cookies, event.request.headers.get("accept-language"));
  event.locals.locale = locale;
  return runWithLocale(locale, async () =>
    resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", locale) })
  );
};

export const handle = sequence(Sentry.sentryHandle(), localeHandle, appHandle);

/** Reports uncaught server-side errors to Sentry. */
export const handleError = Sentry.handleErrorWithSentry();
