import { redirect } from "@sveltejs/kit";
import { createApi } from "$lib/api/client.server";
import { NO_STAFF } from "$lib/staff";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const { locals, url } = event;
  if (!locals.user) {
    redirect(303, `/api/auth/login?redirect_to=${encodeURIComponent(url.pathname + url.search)}`);
  }
  const staff = await createApi(event).me.staff();
  return { user: locals.user, staff: staff.ok ? staff.data : NO_STAFF };
};
