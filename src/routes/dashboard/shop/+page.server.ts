import { createApi } from "$lib/api/client.server";
import type { ShopCategory } from "$lib/api";
import type { PageServerLoad } from "./$types";

const CATEGORIES: ShopCategory[] = ["general", "radiant", "crystal"];

export const load: PageServerLoad = async (event) => {
  const asked = event.url.searchParams.get("category") as ShopCategory | null;
  const category = asked && CATEGORIES.includes(asked) ? asked : "general";
  return { category, categories: CATEGORIES, shop: await createApi(event).shop.get(category) };
};
