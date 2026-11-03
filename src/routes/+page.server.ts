import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const api = createApi(null);
  const [stats, leaderboard] = await Promise.all([api.public.stats(), api.public.leaderboard("pokemon")]);
  return {
    stats: stats.ok ? stats.data : null,
    trainers: leaderboard.ok ? leaderboard.data.entries.slice(0, 8) : [],
  };
};
