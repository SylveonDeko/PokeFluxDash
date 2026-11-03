import { error, fail, type ActionFailure } from "@sveltejs/kit";
import { callBot, type BotQuery, type BotRequest } from "$lib/server/botApi";
import type { FluxerUser } from "$lib/types/fluxer";
import type {
  AdminAuditEntry,
  AdminDetectionDetail,
  AdminDetectionList,
  AdminFraudStats,
  AdminListing,
  AdminMarketQuery,
  AdminPage,
  AdminRelationship,
  AdminUserDetail,
  AdminUserResult,
  BotResponse,
  Achievements,
  ApiMessage,
  BotStats,
  Breeding,
  BreedingFemalesResponse,
  ChestCurrency,
  ChestType,
  CreateListingRequest,
  CreateListingResponse,
  GuildSettings,
  GuildSummary,
  Hatchery,
  HatcheryGroupNumber,
  Inventory,
  Learnset,
  Leaderboard,
  LeaderboardKind,
  MarketListingDetail,
  MarketPage,
  MarketQuery,
  MarketRules,
  Missions,
  MoveSlot,
  MyListings,
  Party,
  PartySlot,
  Pokedex,
  PokedexVariant,
  PokemonDetail,
  PokemonId,
  PokemonList,
  PokemonListFilters,
  PokemonListQuery,
  PokemonNeighbours,
  Profile,
  SavedParty,
  Shop,
  ShopCategory,
  Snowflake,
  SpawnSettingsUpdate,
  SpeciesDetail,
  StaffInfo,
} from "./types";

/** Anything carrying the signed in user, such as a load or action event. */
export interface ApiContext {
  locals: { user: FluxerUser | null };
}

const seg = (value: string | number): string => encodeURIComponent(String(value));

/**
 * Creates a typed client for the PokeFlux bot API, acting as the signed in user of `context`.
 * Pass `null` for public endpoints only. Every method resolves to a {@link BotResponse} and
 * never throws. Use {@link unwrap} in loads and {@link toAction} in form actions.
 *
 * @example
 * export const load = async (event) => {
 *   const api = createApi(event);
 *   return { profile: unwrap(await api.me.get()) };
 * };
 */
export function createApi(context: ApiContext | null) {
  const user = context?.locals.user ?? null;

  const get = <T>(path: string, query?: BotQuery) => callBot<T>(path, { user, query });
  const send = <T = ApiMessage>(method: NonNullable<BotRequest["method"]>, path: string, body?: unknown) =>
    callBot<T>(path, { user, method, body: body ?? (method === "DELETE" ? undefined : {}) });

  return {
    me: {
      get: () => get<Profile>("me"),
      staff: () => get<StaffInfo>("me/staff"),
      inventory: () => get<Inventory>("me/inventory"),
      achievements: () => get<Achievements>("me/achievements"),
      missions: () => get<Missions>("me/missions"),
      buyMissionItem: (item: string) => send("POST", "me/missions/buy", { item }),
    },

    pokemon: {
      list: (query: PokemonListQuery = {}) => get<PokemonList>("pokemon", { ...query }),
      neighbours: (id: PokemonId, filters: PokemonListFilters = {}) =>
        get<PokemonNeighbours>(`pokemon/${seg(id)}/neighbours`, { ...filters }),
      get: (id: PokemonId) => get<PokemonDetail>(`pokemon/${seg(id)}`),
      learnset: (id: PokemonId) => get<Learnset>(`pokemon/${seg(id)}/learnset`),
      select: (id: PokemonId) => send("POST", `pokemon/${seg(id)}/select`),
      favorite: (id: PokemonId, favorite: boolean) => send("POST", `pokemon/${seg(id)}/favorite`, { favorite }),
      nickname: (id: PokemonId, nickname: string | null) =>
        send("POST", `pokemon/${seg(id)}/nickname`, { nickname }),
      setMove: (id: PokemonId, slot: MoveSlot, move: string) =>
        send("POST", `pokemon/${seg(id)}/moves`, { slot, move }),
      release: (id: PokemonId) => send("POST", `pokemon/${seg(id)}/release`),
    },

    pokedex: {
      get: (variant: PokedexVariant = "national") => get<Pokedex>("pokedex", { variant }),
    },

    species: {
      get: (idOrName: string | number) => get<SpeciesDetail>(`species/${seg(idOrName)}`),
    },

    party: {
      get: () => get<Party>("party"),
      saved: (name: string) => get<SavedParty>(`party/saved/${seg(name)}`),
      setSlot: (slot: PartySlot, pokemonId: PokemonId | null) => send("POST", "party/slot", { slot, pokemonId }),
      swap: (slotA: PartySlot, slotB: PartySlot) => send("POST", "party/swap", { slotA, slotB }),
      register: (name: string) => send("POST", "party/register", { name }),
      load: (name: string) => send("POST", "party/load", { name }),
      deregister: (name: string) => send("POST", "party/deregister", { name }),
      setSavedSlot: (name: string, slot: PartySlot, pokemonId: PokemonId | null) =>
        send("POST", `party/saved/${seg(name)}/slot`, { slot, pokemonId }),
    },

    hatchery: {
      get: () => get<Hatchery>("hatchery"),
      place: (group: HatcheryGroupNumber, slot: number, pokemonId: PokemonId) =>
        send("POST", `hatchery/${seg(group)}/slot/${seg(slot)}`, { pokemonId }),
      remove: (group: HatcheryGroupNumber, slot: number) => send("DELETE", `hatchery/${seg(group)}/slot/${seg(slot)}`),
    },

    breeding: {
      get: () => get<Breeding>("breeding"),
      setFemales: (pokemonIds: PokemonId[]) =>
        send<BreedingFemalesResponse>("POST", "breeding/females", { pokemonIds }),
    },

    market: {
      list: (query: MarketQuery = {}) => get<MarketPage>("market", { ...query }),
      get: (listingId: string) => get<MarketListingDetail>(`market/${seg(listingId)}`),
      mine: () => get<MyListings>("market/mine"),
      rules: () => get<MarketRules>("market/rules"),
      create: (request: CreateListingRequest) => send<CreateListingResponse>("POST", "market", request),
      remove: (listingId: string) => send("DELETE", `market/${seg(listingId)}`),
      buy: (listingId: string) => send("POST", `market/${seg(listingId)}/buy`),
    },

    shop: {
      get: (category: ShopCategory = "general") => get<Shop>("shop", { category }),
      buy: (item: string, amount?: number) => send("POST", "shop/buy", { item, amount: amount ?? null }),
      buyChest: (type: ChestType, currency: ChestCurrency) => send("POST", "shop/chest", { type, currency }),
    },

    guilds: {
      list: () => get<GuildSummary[]>("guilds"),
      get: (guildId: Snowflake) => get<GuildSettings>(`guilds/${seg(guildId)}`),
      setPrefix: (guildId: Snowflake, prefix: string) => send("PUT", `guilds/${seg(guildId)}/prefix`, { prefix }),
      updateSpawns: (guildId: Snowflake, update: SpawnSettingsUpdate) =>
        send("PUT", `guilds/${seg(guildId)}/spawns`, update),
    },

    admin: {
      stats: (days?: number) => get<AdminFraudStats>("admin/trade/stats", { days }),
      detections: (query: { hours?: number; page?: number; pageSize?: number } = {}) =>
        get<AdminDetectionList>("admin/trade/detections", { ...query }),
      detection: (id: number) => get<AdminDetectionDetail>(`admin/trade/detections/${seg(id)}`),
      relationship: (user1: Snowflake, user2: Snowflake) =>
        get<AdminRelationship>("admin/trade/relationship", { user1, user2 }),
      searchUsers: (search: string) => get<AdminUserResult[]>("admin/users", { search }),
      user: (userId: Snowflake) => get<AdminUserDetail>(`admin/users/${seg(userId)}`),
      market: (query: AdminMarketQuery = {}) => get<AdminPage<AdminListing>>("admin/market", { ...query }),
      audit: (query: { staff?: Snowflake; target?: Snowflake; page?: number; pageSize?: number } = {}) =>
        get<AdminPage<AdminAuditEntry>>("admin/audit", { ...query }),
    },

    public: {
      stats: () => get<BotStats>("stats"),
      leaderboard: (kind: LeaderboardKind = "pokemon") => get<Leaderboard>("leaderboard", { kind }),
    },
  };
}

export type PokeFluxApi = ReturnType<typeof createApi>;

/** Returns the data of a successful answer, or throws a SvelteKit error with the bot's status and message. */
export function unwrap<T>(response: BotResponse<T>): T {
  if (response.ok) return response.data;
  error(response.status, response.error);
}

/** Returns the data, or `null` when the bot answered 404. Other failures throw like {@link unwrap}. */
export function unwrapOrNull<T>(response: BotResponse<T>): T | null {
  if (!response.ok && response.status === 404) return null;
  return unwrap(response);
}

/** Result of a form action built by {@link toAction}. */
export type ActionResult<T> = { success: true; data: T } | ActionFailure<{ error: string }>;

/** Turns a bot answer into a form action result: `{ success, data }` or `fail(status, { error })`. */
export function toAction<T>(response: BotResponse<T>): ActionResult<T> {
  if (response.ok) return { success: true, data: response.data };
  return fail(response.status >= 400 && response.status < 600 ? response.status : 500, { error: response.error });
}
