import { createApi } from "$lib/api/client.server";
import type { LeaderboardKind } from "$lib/api";
import type { PageServerLoad } from "./$types";

const KINDS: LeaderboardKind[] = ["pokemon", "shiny", "credits"];

export const load: PageServerLoad = async ({ url }) => {
  const asked = url.searchParams.get("kind") as LeaderboardKind | null;
  const kind = asked && KINDS.includes(asked) ? asked : "pokemon";
  return { kind, kinds: KINDS, leaderboard: await createApi(null).public.leaderboard(kind) };
};
