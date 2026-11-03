import { error, fail } from "@sveltejs/kit";
import { createApi, toAction } from "$lib/api/client.server";
import { m } from "$lib/i18n";
import { prefixError } from "./prefix";
import type { Actions, PageServerLoad } from "./$types";

const SNOWFLAKE = /^\d{1,20}$/;

export const load: PageServerLoad = async (event) => {
  const { guildId } = event.params;
  if (!SNOWFLAKE.test(guildId)) error(404, m.common.notFound());
  return { guildId, settings: await createApi(event).guilds.get(guildId) };
};

export const actions: Actions = {
  prefix: async (event) => {
    const { guildId } = event.params;
    if (!SNOWFLAKE.test(guildId)) return fail(404, { error: m.common.notFound() });
    const prefix = String((await event.request.formData()).get("prefix") ?? "").trim();
    const invalid = prefixError(prefix);
    if (invalid) return fail(400, { error: invalid });
    return toAction(await createApi(event).guilds.setPrefix(guildId, prefix));
  },
};
