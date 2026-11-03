import { m } from "$lib/i18n";

/** An entry in the top navigation bar: a single link, or a dropdown when it has titled elements. */
export interface NavItem {
  title: string;
  elements: {
    title?: string;
    href: string;
  }[];
}

export interface DashboardSection {
  href: string;
  label: () => string;
  /** Font Awesome utility duo icon classes. */
  icon: string;
}

/** The dashboard sections, in sidebar order. */
export const dashboardSections: DashboardSection[] = [
  { href: "/dashboard", label: m.features.overview, icon: "fa-utility-duo fa-regular fa-id-card" },
  { href: "/dashboard/pokemon", label: m.features.pokemon, icon: "fa-utility-duo fa-regular fa-paw" },
  { href: "/dashboard/pokedex", label: m.features.pokedex, icon: "fa-utility-duo fa-regular fa-book-open" },
  { href: "/dashboard/party", label: m.features.party, icon: "fa-utility-duo fa-regular fa-users" },
  { href: "/dashboard/hatchery", label: m.features.hatchery, icon: "fa-utility-duo fa-regular fa-heart" },
  { href: "/dashboard/market", label: m.features.market, icon: "fa-utility-duo fa-regular fa-store" },
  { href: "/dashboard/shop", label: m.features.shop, icon: "fa-utility-duo fa-regular fa-bag-shopping" },
  { href: "/dashboard/missions", label: m.features.missions, icon: "fa-utility-duo fa-regular fa-trophy" },
  { href: "/dashboard/inventory", label: m.features.inventory, icon: "fa-utility-duo fa-regular fa-briefcase" },
  { href: "/dashboard/servers", label: m.features.servers, icon: "fa-utility-duo fa-regular fa-server" },
];
