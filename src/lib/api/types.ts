/*
 * Request and response shapes of the PokeFlux bot API. IDs travel as JSON strings and dates as
 * UTC ISO 8601 strings.
 */

export type Snowflake = string;
export type PokemonId = string;

/** A lowercase Pokémon type name. */
export type PokemonType =
  | "normal"
  | "fighting"
  | "flying"
  | "poison"
  | "ground"
  | "rock"
  | "bug"
  | "ghost"
  | "steel"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "psychic"
  | "ice"
  | "dragon"
  | "dark"
  | "fairy"
  | "shadow"
  | "typeless"
  | "unknown";

export type Gender = "male" | "female" | "genderless";

/**
 * The answer of a bot API call as the server-side client returns it, with the bot's error text on
 * failure.
 */
export type BotResponse<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data: null };

/** Error body of every 4xx: 400 bad input or refused action, 401, 403, 404 not found or not started, 409 locked. */
export interface ApiErrorBody {
  error: string;
}

/** Body of a successful action that returns no resource: the bot's message. */
export interface ApiMessage {
  message: string;
}

/** One value per stat. */
export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export type StatKey = keyof StatBlock;


/** How many Pokémon of each kind the user owns. */
export interface PokemonCounts {
  total: number;
  shiny: number;
  radiant: number;
  shadow: number;
  legendary: number;
}

/** `GET /api/me`. 404 when the user has not started. */
export interface Profile {
  id: Snowflake;
  trainerNickname: string | null;
  credits: number;
  redeems: number;
  /** 0 to 10. */
  energy: number;
  fishingLevel: number;
  fishingExp: number;
  /** Experience needed for the next fishing level. */
  fishingLevelCap: number;
  selectedPokemonId: PokemonId | null;
  region: string;
  /** Shadow hunt target. */
  hunt: string | null;
  chain: number;
  daycareLimit: number;
  counts: PokemonCounts;
  /** Always true. A user who has not started gets 404. */
  started: boolean;
  staffRank: StaffRank;
}

/** Staff ranks from lowest to highest. Bot owners count as Developer. */
export type StaffRank = "User" | "AI" | "Support" | "Gym" | "Helper" | "Mod" | "GymAuth" | "Investigator" | "Admin" | "Developer";

/** `GET /api/me/staff`. Answers before the user has started. */
export interface StaffInfo {
  staffRank: StaffRank;
  botOwner: boolean;
}

/** An item name and how many. Names are raw keys such as "legend chest" or "life-orb". */
export interface ItemCount {
  name: string;
  count: number;
  /**
   * The item's category from the bot's item data, as a lowercase identifier such as "held-items",
   * "evolution" or "standard-balls". Null for items the game data does not know, such as chests and boosters.
   */
  category: string | null;
}

/** `GET /api/me/inventory`. Inventory and bag sorted by name, held items by count. */
export interface Inventory {
  /** Chests, boosters and other inventory items. */
  inventory: ItemCount[];
  bag: ItemCount[];
  /** How many of the user's Pokémon hold each item. */
  heldItems: ItemCount[];
}

/** Progress on one achievement. `name` is the title-cased key when there is no display name. */
export interface AchievementProgress {
  key: string;
  name: string;
  value: number;
  /** The highest milestone the value has reached, 0 when none is. */
  lastMilestone: number;
  /** Null once every milestone is reached. */
  nextMilestone: number | null;
  milestones: number[];
}

/** An achievement category such as "battle" or "breeding". */
export interface AchievementCategory {
  name: string;
  achievements: AchievementProgress[];
}

export interface LoyaltyTier {
  name: string;
  requiredPoints: number;
  xpMultiplier: number;
  /** Percent. */
  shopDiscount: number;
  monthlyBonus: number;
}

export interface LoyaltyStatus {
  points: number;
  dailyStreak: number;
  /** Streak of the next bonus, or 0 when none is left. */
  nextStreakBonus: number;
  tier: LoyaltyTier;
  /** Null at the top tier. */
  nextTier: LoyaltyTier | null;
}

/** `GET /api/me/achievements`. */
export interface Achievements {
  categories: AchievementCategory[];
  /** Milestones reached across every achievement. */
  totalMilestones: number;
  loyalty: LoyaltyStatus;
}

/** An active mission with the user's progress. `reward` is crystal slime. */
export interface Mission {
  key: string;
  name: string;
  description: string;
  target: number;
  reward: number;
  progress: number;
}

/** An item of the crystal slime exchange. `cost` is in crystal slime. */
export interface MissionStoreItem {
  key: string;
  name: string;
  description: string;
  cost: number;
  /** True for the Meowth Ticket, a game played in chat: buy it with the missions buy command. */
  commandOnly: boolean;
}

/** `GET /api/me/missions`. */
export interface Missions {
  missions: Mission[];
  /** Mission XP earned within the current level. */
  xp: number;
  level: number;
  /** XP the current level starts at. */
  levelStartXp: number;
  /** XP that reaches the next level, or null at the top level. */
  nextLevelXp: number | null;
  title: string;
  slime: number;
  crystalSlime: number;
  store: MissionStoreItem[];
}

/** Body of `POST /api/me/missions/buy`: a store item's key or name. Refused for command-only items. */
export interface MissionBuyRequest {
  item: string;
}


export type PokemonSort =
  | "default"
  | "iv"
  | "level"
  | "name"
  | "recent"
  | "type"
  | "favorite"
  | "party"
  | "champion";

export type PokemonFilter =
  | "all"
  | "shiny"
  | "radiant"
  | "shadow"
  | "legendary"
  | "favorite"
  | "champion"
  | "party"
  | "market"
  | "egg";

export type GenderFilter = "all" | Gender;

/** The sort, filters and search shared by `GET /api/pokemon` and `GET /api/pokemon/{id}/neighbours`. */
export interface PokemonListFilters {
  sort?: PokemonSort;
  /** `market` lists the user's active listings, `egg` only eggs. */
  filter?: PokemonFilter;
  gender?: GenderFilter;
  /** Matches names, nicknames, tags and moves. */
  search?: string;
  /** Only Pokémon holding this item, matched without case. */
  heldItem?: string;
  /** Only Pokémon the breeding list accepts: females and Dittos. */
  breedable?: boolean;
}

/** Query of `GET /api/pokemon`. Defaults: page 1, pageSize 24 (max 100), sort default, filter all, gender all. */
export interface PokemonListQuery extends PokemonListFilters {
  page?: number;
  pageSize?: number;
}

/** A Pokémon as lists, parties, eggs and listings show it. */
export interface PokemonCard {
  id: PokemonId;
  /** The 1-based number players see in `;p`, or null when the user does not own it (market, `filter=market`). */
  number: number | null;
  name: string;
  nickname: string | null;
  level: number;
  /** 0 to 100, two decimals. */
  ivPercent: number;
  shiny: boolean;
  radiant: boolean;
  skin: string | null;
  gender: Gender;
  favorite: boolean;
  inParty: boolean;
  selected: boolean;
  champion: boolean;
  /** Whether it has an active market listing. */
  marketListed: boolean;
  heldItem: string | null;
  /** Lowercase type names. */
  types: PokemonType[];
  /** Absolute link, png or gif. */
  spriteUrl: string | null;
}

/** Counts of the matching Pokémon. `totalCount` is the user's whole collection, whatever the filters. */
export interface PokemonListStats {
  totalCount: number;
  total: number;
  shiny: number;
  radiant: number;
  shadow: number;
  legendary: number;
  favorite: number;
  champion: number;
  /** Matching Pokémon with an active market listing. */
  market: number;
  male: number;
  female: number;
  /** Every Pokémon that is neither male nor female. */
  genderless: number;
}

/** A card in a list, with its place in the whole sorted, filtered list. */
export interface PokemonListItem extends PokemonCard {
  /** 0-based across every page. */
  index: number;
}

/** `GET /api/pokemon`. `page` is 1-based, `total` counts the filtered list. */
export interface PokemonList {
  items: PokemonListItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: PokemonListStats;
}

/**
 * `GET /api/pokemon/{id}/neighbours` with the list's sort and filters: the Pokémon before and after it.
 * 404 when it is not in that list.
 */
export interface PokemonNeighbours {
  previous: PokemonCard | null;
  next: PokemonCard | null;
  /** 0-based. */
  index: number;
  total: number;
}

export type MoveCategory = "physical" | "special" | "status";

/** A move. `name` is the lowercase identifier ("aerial-ace"). */
export interface MoveDetails {
  name: string;
  type: PokemonType;
  power: number | null;
  /** Null for moves that never miss. */
  accuracy: number | null;
  pp: number;
  category: MoveCategory;
}

/** `GET /api/pokemon/{id}`: the card fields plus details. 404 when the user does not own it. */
export interface PokemonDetail extends PokemonCard {
  nature: string;
  ability: string;
  happiness: number;
  /** Experience towards the next level. */
  experience: number;
  experienceCap: number;
  /** Four slots, null where empty or unknown. */
  moves: (MoveDetails | null)[];
  ivs: StatBlock;
  evs: StatBlock;
  baseStats: StatBlock;
  stats: StatBlock;
  /** Original trainer's nickname, or null when unknown. */
  caughtBy: string | null;
  caughtById: Snowflake | null;
  caughtAt: string | null;
  tradable: boolean;
  breedable: boolean;
  tags: string[];
  /** Form names of the species, such as "Mega". */
  forms: string[];
  /**
   * The evolution family in order, each species before what it evolves into. Empty when it does not evolve.
   * Regional forms only show their own branch.
   */
  evolutionLine: EvolutionStage[];
}

/** A species of an evolution line. */
export interface EvolutionStage {
  speciesId: number;
  /** First letter capitalized ("Marowak-alola"). */
  name: string;
  /** The normal sprite, or null. */
  spriteUrl: string | null;
}

/**
 * `GET /api/pokemon/{id}/learnset`: the moves it can learn, each once. 400 for eggs.
 */
export type Learnset = MoveDetails[];

/** Body of `POST /api/pokemon/{id}/favorite`. */
export interface FavoriteRequest {
  favorite: boolean;
}

/** Body of `POST /api/pokemon/{id}/nickname`. Null clears it. */
export interface NicknameRequest {
  nickname: string | null;
}

export type MoveSlot = 1 | 2 | 3 | 4;

/** Body of `POST /api/pokemon/{id}/moves`. `move` comes from the learnset. */
export interface MoveRequest {
  slot: MoveSlot;
  move: string;
}

export type PokedexVariant = "national" | "shiny" | "radiant" | "shadow" | "skin" | "unowned";

/** A Pokédex entry. `name` is titleized ("Mr Mime"). */
export interface PokedexEntry {
  speciesId: number;
  name: string;
  caught: boolean;
  /** How many of this variant the user owns. */
  count: number;
  /** The species' sprite for the variant (shiny for shiny, and so on), or null. */
  spriteUrl: string | null;
}

/**
 * `GET /api/pokedex`. Missingno (species 0) is left out. For unowned, `entries` holds only species not owned.
 */
export interface Pokedex {
  variant: PokedexVariant;
  caught: number;
  total: number;
  entries: PokedexEntry[];
}

/** An ability a species can have. `name` is the identifier ("run-away"). */
export interface SpeciesAbility {
  name: string;
  hidden: boolean;
}

/** The conditions of an evolution that the bot checks. Unset conditions are null. */
export interface EvolutionMethod {
  trigger: "level-up" | "trade" | "use-item" | "shed";
  level: number | null;
  /** Item identifier to use on it. */
  item: string | null;
  /** Item identifier it must hold. */
  heldItem: string | null;
  gender: "male" | "female" | null;
  /** Move identifier it must know. */
  knownMove: string | null;
  happiness: number | null;
  attackVsDefense: "higher" | "lower" | "equal" | null;
  region: string | null;
}

/** A member of an evolution family. */
export interface SpeciesEvolution {
  speciesId: number;
  /** Lowercase identifier ("ninetales-alola"). */
  identifier: string;
  /** Titleized. */
  name: string;
  spriteUrl: string | null;
  /** Species ID it evolves from, or null for the first stage. */
  evolvesFrom: number | null;
  method: EvolutionMethod | null;
}

/** Another form of a species. */
export interface SpeciesForm {
  identifier: string;
  name: string;
  /** Null for the base form. */
  formName: string | null;
  mega: boolean;
  spriteUrl: string | null;
}

/**
 * `GET /api/species/{idOrName}`: game data for any species or form, owned or not. 404 when unknown.
 * The game data has no height and no learn methods.
 */
export interface SpeciesDetail {
  /** Pokédex number of the species whose data is shown. */
  speciesId: number;
  /** Differs from `speciesId` for megas and other forms. */
  formId: number;
  identifier: string;
  /** Titleized, as the Pokédex shows it. */
  name: string;
  formName: string | null;
  mega: boolean;
  battleOnly: boolean;
  spriteUrl: string | null;
  shinySpriteUrl: string | null;
  types: PokemonType[];
  baseStats: StatBlock;
  abilities: SpeciesAbility[];
  generation: number | null;
  eggGroups: string[];
  /** Null when genderless. */
  femalePercent: number | null;
  /** Out of 255. */
  catchRate: number | null;
  baseHappiness: number | null;
  hatchCounter: number | null;
  baby: boolean;
  weightKg: number | null;
  /** Each member after the species it evolves from. Empty when it does not evolve. */
  evolution: SpeciesEvolution[];
  forms: SpeciesForm[];
  learnset: MoveDetails[];
  owned: number;
  ownedShiny: number;
}


export type PartySlot = 1 | 2 | 3 | 4 | 5 | 6;

/** `GET /api/party`. `slots` always has six entries, null where empty. */
export interface Party {
  slots: (PokemonCard | null)[];
  /** Names of the saved parties. */
  saved: string[];
}

/** `GET /api/party/saved/{name}`. Names are lowercased. 404 when it does not exist. */
export interface SavedParty {
  name: string;
  slots: (PokemonCard | null)[];
}

/** Body of `POST /api/party/slot` and `POST /api/party/saved/{name}/slot`. Null empties the slot. */
export interface PartySlotRequest {
  slot: PartySlot;
  pokemonId: PokemonId | null;
}

/** Body of `POST /api/party/swap`: swaps two slots in one update. Either may be empty, not both. */
export interface PartySwapRequest {
  slotA: PartySlot;
  slotB: PartySlot;
}

/** Body of `POST /api/party/register`, `load` and `deregister`. Up to 20 characters, no spaces. */
export interface PartyNameRequest {
  name: string;
}


export type HatcheryGroupNumber = 1 | 2 | 3;

/** A hatchery slot. `counter` is the steps left, 0 when empty. */
export interface HatcherySlot {
  /** 1 to 10. */
  slot: number;
  unlocked: boolean;
  egg: PokemonCard | null;
  counter: number;
  /** Steps the egg started with, 0 when empty. Progress is `(totalSteps - counter) / totalSteps`. */
  totalSteps: number;
}

/** A hatchery group with its ten slots. The first `maxSlots` are unlocked. */
export interface HatcheryGroup {
  group: HatcheryGroupNumber;
  /** Steps each message takes off the eggs here. */
  speedModifier: number;
  maxSlots: number;
  slots: HatcherySlot[];
}

/** `GET /api/hatchery`: a bare array of the three groups. */
export type Hatchery = HatcheryGroup[];

/** Body of `POST /api/hatchery/{group}/slot/{slot}`. */
export interface HatcherySlotRequest {
  pokemonId: PokemonId;
}

/** A female on the breeding list. `cooldownEndsAt` is null when it can breed now. */
export interface BreedingFemale {
  pokemon: PokemonCard;
  cooldownEndsAt: string | null;
}

/** `GET /api/breeding`. */
export interface Breeding {
  females: BreedingFemale[];
  /** Seconds before the user can breed again, 0 when ready. */
  cooldownSeconds: number;
  /** Eggs the user has. */
  daycareUsed: number;
  daycareLimit: number;
}

/** Body of `POST /api/breeding/females`. Replaces the list, and an empty list clears it. */
export interface BreedingFemalesRequest {
  pokemonIds: PokemonId[];
}

/** Answer of `POST /api/breeding/females`. `invalid` holds ids not owned or not female or Ditto. */
export interface BreedingFemalesResponse {
  valid: PokemonId[];
  invalid: PokemonId[];
  /** What happened, for a toast. */
  message: string;
}


export type MarketSort =
  | "price_asc"
  | "price_desc"
  | "level_desc"
  | "level_asc"
  | "iv_desc"
  | "recent"
  | "name";

export type MarketFilter = "all" | "shiny" | "radiant" | "shadow" | "legendary";

/** Query of `GET /api/market`. Defaults: page 1, pageSize 24 (max 100), sort recent, filter all. */
export interface MarketQuery {
  page?: number;
  pageSize?: number;
  sort?: MarketSort;
  filter?: MarketFilter;
  /** Matches Pokémon names. */
  search?: string;
}

/** A listing. The card has `number: null` and `marketListed: true`. `price` is in credits. */
export interface MarketListing {
  listingId: string;
  price: number;
  sellerId: Snowflake;
  sellerName: string | null;
  listedAt: string;
  pokemon: PokemonCard;
}

/** `GET /api/market/{listingId}`. 404 when it does not exist or has ended. */
export interface MarketListingDetail {
  listing: MarketListing;
  nature: string;
  ivs: StatBlock;
  /** Four slots, null where empty or unknown. */
  moves: (MoveDetails | null)[];
  ability: string;
  evs: StatBlock;
  /** Calculated stats. */
  stats: StatBlock;
}

/** `GET /api/market/rules`: the listing rules the bot enforces and the user's active listing count. */
export interface MarketRules {
  /** Lower prices are raised to it. */
  minPrice: number;
  maxPrice: number;
  listingLimit: number;
  listingCount: number;
}

/** `GET /api/market`. `page` is 1-based. */
export interface MarketPage {
  items: MarketListing[];
  total: number;
  page: number;
  pageSize: number;
}

/** `GET /api/market/mine`: the user's active listings, newest first. */
export type MyListings = MarketListing[];

/** Body of `POST /api/market`. */
export interface CreateListingRequest {
  pokemonId: PokemonId;
  price: number;
}

/** Answer of `POST /api/market`. */
export interface CreateListingResponse {
  listingId: string;
  message: string;
}


export type ShopCategory = "general" | "radiant" | "crystal";

export type ShopCurrency = "credits" | "crystal-slime";

/** A shop item. Buy it by `buyName`. */
export interface ShopItem {
  id: string;
  name: string;
  buyName: string;
  /** May be empty. */
  description: string;
  price: number;
  currency: ShopCurrency;
  /** -1 for unlimited. */
  stock: number;
  rarity: string;
  pokemonType: PokemonType | null;
  /** Whether the user has enough of the item's currency. */
  affordable: boolean;
}

export type ChestType = "rare" | "mythic" | "legend";

export type ChestCurrency = "credits" | "redeems";

/** A chest the shop sells. Credit purchases are limited each week. */
export interface ShopChest {
  type: ChestType;
  creditPrice: number;
  redeemPrice: number;
  boughtThisWeek: number;
  weeklyLimit: number;
}

/** `GET /api/shop`. Buying items needs the shop's minimum Pokémon count. */
export interface Shop {
  category: ShopCategory;
  credits: number;
  crystalSlime: number;
  items: ShopItem[];
  redeems: number;
  minimumPokemon: number;
  pokemonCount: number;
  /** Whether the user owns at least `minimumPokemon`. */
  meetsRequirement: boolean;
  chests: ShopChest[];
}

/** Body of `POST /api/shop/chest`. */
export interface ChestBuyRequest {
  type: ChestType;
  currency: ChestCurrency;
}

/** Body of `POST /api/shop/buy`. 403 when the user owns too few Pokémon. Null or missing `amount` buys the default. */
export interface ShopBuyRequest {
  item: string;
  amount?: number | null;
}


/** One entry of `GET /api/guilds`: a server the user shares with the bot and can manage. */
export interface GuildSummary {
  id: Snowflake;
  name: string;
  /** Absolute icon link, or null. */
  iconUrl: string | null;
  owner: boolean;
}

export interface SpawnSettings {
  enableSpawnsAll: boolean;
  enabledChannels: Snowflake[];
  disabledChannels: Snowflake[];
  redirects: Snowflake[];
  /** 1 to 20. */
  speed: number;
  smallImages: boolean;
  modalView: boolean;
  delete: boolean;
  pin: boolean;
}

/** A text channel, sorted by position. */
export interface GuildTextChannel {
  id: Snowflake;
  name: string;
  position: number;
  parentId: Snowflake | null;
}

/** A channel category, sorted by position. Text channels point to it with `parentId`. */
export interface GuildCategory {
  id: Snowflake;
  name: string;
  position: number;
}

/** `GET /api/guilds/{guildId}`. 403 without Manage Server, 404 when the bot is not there. */
export interface GuildSettings {
  id: Snowflake;
  name: string;
  iconUrl: string | null;
  prefix: string;
  spawns: SpawnSettings;
  channels: GuildTextChannel[];
  categories: GuildCategory[];
}

/** Body of `PUT /api/guilds/{guildId}/prefix`. Up to 10 characters, no spaces. */
export interface PrefixRequest {
  prefix: string;
}

/** Body of `PUT /api/guilds/{guildId}/spawns`. Fields left out or null stay as they are. */
export type SpawnSettingsUpdate = { [K in keyof SpawnSettings]?: SpawnSettings[K] | null };


/** `GET /api/stats`. Needs no user. */
export interface BotStats {
  servers: number;
  players: number;
  pokemonCaught: number;
}

export type LeaderboardKind = "pokemon" | "shiny" | "credits";

export interface LeaderboardEntry {
  /** From 1. */
  rank: number;
  userId: Snowflake;
  /** Trainer nickname, or null. */
  name: string | null;
  value: number;
}

/** `GET /api/leaderboard`. Top 25 visible players. Needs no user. */
export interface Leaderboard {
  kind: LeaderboardKind;
  entries: LeaderboardEntry[];
}

/** A page of admin results. */
export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A user ID with its trainer nickname, or null. */
export interface AdminUserRef {
  id: Snowflake;
  name: string | null;
}

/** `GET /api/admin/trade/stats`. Mod. */
export interface AdminFraudStats {
  days: number;
  totalDetections: number;
  blockedTrades: number;
  /** Risk score 0.6 or more. */
  highRisk: number;
  /** Risk score from 0.4 up to 0.6. */
  mediumRisk: number;
  lowRisk: number;
  altAccountFlags: number;
  rmtFlags: number;
  newbieExploitFlags: number;
}

export interface AdminDetectionSummary {
  id: number;
  primary: AdminUserRef;
  secondary: AdminUserRef | null;
  /** From 0 to 1. */
  riskScore: number;
  /** Such as "AltAccountTrading". */
  fraudType: string;
  /** Such as "Pending". */
  investigationStatus: string;
  tradeBlocked: boolean;
  detectedAt: string;
}

/** `GET /api/admin/trade/detections`. Mod. Riskiest first. */
export interface AdminDetectionList extends AdminPage<AdminDetectionSummary> {
  hours: number;
  minRiskScore: number;
}

export interface AdminTradeAnalysis {
  senderTotalValue: number;
  receiverTotalValue: number;
  valueRatio: number;
  valueImbalanceScore: number;
  flags: string[];
}

/** `GET /api/admin/trade/detections/{id}`. Investigator. */
export interface AdminDetectionDetail {
  summary: AdminDetectionSummary;
  confidenceLevel: number;
  automatedAction: string;
  triggeredRules: string;
  adminNotes: string | null;
  analysis: AdminTradeAnalysis | null;
}

/** `GET /api/admin/trade/relationship`. Mod. User 1 has the lower ID. */
export interface AdminRelationship {
  user1: AdminUserRef;
  user2: AdminUserRef;
  totalTrades: number;
  firstTrade: string;
  lastTrade: string;
  tradesPerDay: number;
  user1GivenValue: number;
  user2GivenValue: number;
  valueImbalanceRatio: number;
  balancedTrades: number;
  riskScore: number;
  accountAgeDifferenceDays: number;
  suspiciousTiming: boolean;
  whitelisted: boolean;
  flags: string[];
  adminNotes: string | null;
  lastUpdated: string;
}

/** `GET /api/admin/users`. Mod. Up to 25 matches by ID or nickname. */
export interface AdminUserResult {
  id: Snowflake;
  name: string | null;
  staffRank: StaffRank;
  tradeBanned: boolean;
  marketBanned: boolean;
}

export interface AdminBanStatus {
  active: boolean;
  reason: string | null;
  date: string | null;
}

/** A trade log entry. Gifts appear here with a command such as "gift_credits". */
export interface AdminTradeLogEntry {
  id: number;
  command: string;
  time: string | null;
  sender: AdminUserRef;
  receiver: AdminUserRef;
  senderCredits: number;
  receiverCredits: number;
  senderRedeems: number;
  receiverRedeems: number;
  senderPokemon: number;
  receiverPokemon: number;
  senderTokens: Record<string, number>;
  receiverTokens: Record<string, number>;
}

export type AdminListingStatus = "active" | "sold" | "removed";

export interface AdminListing {
  listingId: string;
  price: number;
  status: AdminListingStatus;
  seller: AdminUserRef;
  buyer: AdminUserRef | null;
  listedAt: string;
  /** Null when the Pokémon no longer exists. */
  pokemon: PokemonCard | null;
}

/** `GET /api/admin/users/{userId}`. Mod. */
export interface AdminUserDetail {
  id: Snowflake;
  name: string | null;
  credits: number;
  redeems: number;
  pokemonCount: number;
  staffRank: StaffRank;
  region: string;
  tradeLocked: boolean;
  botBanned: boolean;
  tradeBan: AdminBanStatus;
  marketBan: AdminBanStatus;
  recentTrades: AdminTradeLogEntry[];
  recentListings: AdminListing[];
  recentPurchases: AdminListing[];
  detections: AdminDetectionSummary[];
}

/** Query of `GET /api/admin/market`. Mod. */
export interface AdminMarketQuery {
  status?: "all" | AdminListingStatus;
  seller?: Snowflake;
  buyer?: Snowflake;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

/** An entry of `GET /api/admin/audit`. Mod. */
export interface AdminAuditEntry {
  id: number;
  /** The name is the one the staff member had then. */
  staff: AdminUserRef;
  /** "whitelist", "tradeban", "detradeban", "market_remove" or "spawn_storm". */
  action: string;
  target: AdminUserRef | null;
  details: string | null;
  reason: string;
  createdAt: string;
}

/** `GET` and `POST /api/admin/spawns/storm`. Bot owners only. */
export interface AdminSpawnStorm {
  enabled: boolean;
  message: string | null;
}

/** `GET /api/admin/spawns/debug/{guildId}`. Bot owners only. */
export interface AdminSpawnDebug {
  lines: string[];
}
