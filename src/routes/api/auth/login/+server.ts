import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fluxerAuthorizeUrl, fluxerScopes } from "../fluxerAuth";
import { clientId, redirectUri } from "$lib/server/authConfig";

export const GET: RequestHandler = async ({ url, cookies }) => {
  // Capture the redirect destination from the referrer or redirect_to parameter
  const redirectTo =
    url.searchParams.get("redirect_to") ||
    url.searchParams.get("from") ||
    cookies.get("auth_redirect_to") ||
    "/dashboard";

  // Build state parameter - encode redirect URL in it (base64 for safety)
  const encodedRedirect = Buffer.from(redirectTo).toString("base64");
  const state = `${Date.now()}_${encodedRedirect}`;

  // Also set cookie as fallback
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    cookies.set("auth_redirect_to", redirectTo, {
      path: "/",
      maxAge: 600, // 10 minutes
      httpOnly: true,
    });
  }

  const authorizeUrl = new URL(fluxerAuthorizeUrl());
  authorizeUrl.searchParams.append("client_id", clientId());
  authorizeUrl.searchParams.append("redirect_uri", redirectUri());
  authorizeUrl.searchParams.append("response_type", "code");
  authorizeUrl.searchParams.append("scope", fluxerScopes());
  authorizeUrl.searchParams.append("state", state);

  redirect(302, authorizeUrl.toString());
};