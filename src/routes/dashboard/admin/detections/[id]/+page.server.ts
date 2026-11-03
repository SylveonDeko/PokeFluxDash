import { error } from "@sveltejs/kit";
import { createApi } from "$lib/api/client.server";
import { m } from "$lib/i18n";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const id = Number(event.params.id);
  if (!Number.isInteger(id) || id <= 0) error(404, m.common.notFound());
  return { id, detection: await createApi(event).admin.detection(id) };
};
