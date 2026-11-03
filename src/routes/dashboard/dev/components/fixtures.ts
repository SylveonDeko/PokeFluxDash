// Small samples of real bot answers, plus made-up ones for the cases they do not cover.
import type { MoveDetails, PokemonCard, PokemonDetail, PokemonList, PokemonListQuery, PokemonType } from "$lib/api";

/** Capitalized type names, to show the components take any casing. */
const oldCasing = (...types: string[]) => types as PokemonType[];

const CDN = "https://cdn.mewdeko.tech/eevee";

function card(fields: Partial<PokemonCard> & Pick<PokemonCard, "id" | "name" | "types">): PokemonCard {
  return {
    number: null,
    nickname: null,
    level: 1,
    ivPercent: 50,
    shiny: false,
    radiant: false,
    skin: null,
    gender: "male",
    favorite: false,
    inParty: false,
    selected: false,
    champion: false,
    marketListed: false,
    heldItem: null,
    spriteUrl: null,
    ...fields,
  };
}

export const cards: PokemonCard[] = [
  card({ id: "35174370", number: 1, name: "Blaziken", level: 42, ivPercent: 25.27, selected: true, types: ["fire", "fighting"], spriteUrl: `${CDN}/346fc8106be3c60cff79eb9e92da2e9b.png` }),
  card({ id: "35317401", number: 2, name: "Eiscue", level: 24, ivPercent: 74.19, types: ["ice"], spriteUrl: `${CDN}/1af3552d70d3c127a08e77c7c4b84450.png` }),
  card({ id: "72757540", number: 46, name: "Sylveon", nickname: "(っ◔◡◔)っ", level: 100, ivPercent: 100, skin: "staff_gif", gender: "female", inParty: true, heldItem: "life-orb", types: ["fairy"], spriteUrl: `${CDN}/1227f15419f26cbb0f242943875feb4c.gif` }),
  card({ id: "74194253", number: 115, name: "Ninjask", level: 1, ivPercent: 100, skin: "NULL", inParty: true, types: ["bug", "flying"], spriteUrl: `${CDN}/842e361bd8aba7f053411f52fc9b9c53.png` }),
  card({ id: "74194254", number: 116, name: "Ribombee", level: 1, ivPercent: 100, skin: "NULL", inParty: true, types: ["bug", "fairy"], spriteUrl: `${CDN}/e0315998d74cf2daf70537af908db1f4.png` }),
  card({ id: "74193889", number: 98, name: "Dreepy", level: 15, ivPercent: 70.43, gender: "female", types: ["dragon", "ghost"], spriteUrl: `${CDN}/f7f2f1b3e462262a180267a9af71f12b.png` }),
  card({ id: "74194149", number: 101, name: "Hydrapple", level: 43, ivPercent: 61.29, gender: "female", types: ["grass", "dragon"], spriteUrl: `${CDN}/b31f43e54dac004a26155f750843618d.png` }),
  card({ id: "74194152", number: 102, name: "Victreebel", level: 45, ivPercent: 61.29, gender: "female", types: ["grass", "poison"], spriteUrl: `${CDN}/dc1407a4d6f5edd15b352b4914c97588.png` }),
  card({ id: "74194209", number: 107, name: "Larvesta", level: 54, ivPercent: 51.08, gender: "female", types: ["bug", "fire"], spriteUrl: `${CDN}/9d27de830c350600649ea771bcbdf2bc.png` }),
  card({ id: "74194235", number: 109, name: "Corphish", level: 41, ivPercent: 66.67, gender: "female", types: ["water"], spriteUrl: `${CDN}/b2f4b1a73f071a26e073d999a721565d.png` }),
];

/** Made-up cards that show every flag, casing and fallback. */
export const edgeCards: PokemonCard[] = [
  card({ id: "900001", number: 7, name: "Gyarados", nickname: "Red", level: 88, ivPercent: 93.55, shiny: true, favorite: true, champion: true, heldItem: "mystic-water", types: oldCasing("Water", "Flying"), spriteUrl: `${CDN}/346fc8106be3c60cff79eb9e92da2e9b.png` }),
  card({ id: "900002", name: "Umbreon", level: 60, ivPercent: 81.72, radiant: true, marketListed: true, gender: "female", types: oldCasing("DARK"), spriteUrl: `${CDN}/f7f2f1b3e462262a180267a9af71f12b.png` }),
  card({ id: "900003", number: 12, name: "Lugia", level: 70, ivPercent: 12.9, skin: "shadow", gender: "genderless", types: ["psychic", "flying"], spriteUrl: `${CDN}/does-not-exist.png` }),
  card({ id: "900004", number: 13, name: "Magnemite", level: 5, ivPercent: 38.71, gender: "genderless", types: ["electric", "steel"], spriteUrl: null }),
  card({ id: "900005", number: 14, name: "Onix", level: 30, ivPercent: 45.16, types: ["rock", "ground"], spriteUrl: null }),
];

export const moves: MoveDetails[] = [
  { name: "close-combat", type: "fighting", power: 120, accuracy: 100, pp: 8, category: "physical" },
  { name: "moonblast", type: "fairy", power: 95, accuracy: 100, pp: 24, category: "special" },
  { name: "swords-dance", type: "normal", power: null, accuracy: null, pp: 32, category: "status" },
  { name: "aerial-ace", type: "flying", power: 60, accuracy: null, pp: 32, category: "physical" },
  { name: "shadow-ball", type: "ghost", power: 80, accuracy: 100, pp: 24, category: "special" },
  { name: "thunder-wave", type: "electric", power: null, accuracy: 90, pp: 32, category: "status" },
  { name: "struggle", type: "typeless", power: 50, accuracy: null, pp: 1, category: "physical" },
];

export const detail: PokemonDetail = {
  ...cards[0],
  nature: "Adamant",
  ability: "Speed Boost",
  happiness: 315,
  experience: 1260,
  experienceCap: 1681,
  moves: [moves[0], moves[3], null, null],
  ivs: { hp: 2, attack: 6, defense: 2, specialAttack: 29, specialDefense: 7, speed: 1 },
  evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
  baseStats: { hp: 80, attack: 120, defense: 70, specialAttack: 110, specialDefense: 70, speed: 80 },
  stats: { hp: 120, attack: 118, defense: 64, specialAttack: 98, specialDefense: 66, speed: 72 },
  caughtBy: null,
  caughtById: "1521568983961042944",
  caughtAt: "2021-02-17T08:37:30.993Z",
  tradable: true,
  breedable: true,
  tags: [],
  forms: ["Mega"],
  evolutionLine: [
    { speciesId: 255, name: "Torchic", spriteUrl: null },
    { speciesId: 256, name: "Combusken", spriteUrl: null },
    { speciesId: 257, name: "Blaziken", spriteUrl: null },
  ],
};

export const perfectIvs = { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };

/** Stands in for `/api/pokemon`: filters, searches and pages the fixtures after a short delay. */
export async function fixtureLoader(query: PokemonListQuery, signal?: AbortSignal): Promise<PokemonList> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 400);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  const all = [...cards, ...edgeCards];
  const search = query.search?.toLowerCase();
  const items = all.filter(
    (p) =>
      (!search || p.name.toLowerCase().includes(search) || p.nickname?.toLowerCase().includes(search)) &&
      (!query.gender || query.gender === "all" || p.gender === query.gender) &&
      (query.filter !== "shiny" || p.shiny) &&
      (query.filter !== "party" || p.inParty) &&
      (query.filter !== "favorite" || p.favorite) &&
      (query.filter !== "egg" || p.name === "Egg") &&
      (!query.heldItem || p.heldItem === query.heldItem) &&
      (!query.breedable || p.gender === "female" || p.name === "Ditto"),
  );
  if (query.sort === "iv") items.sort((a, b) => b.ivPercent - a.ivPercent);
  if (query.sort === "level") items.sort((a, b) => b.level - a.level);
  if (query.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 24;
  const count = (f: (p: PokemonCard) => boolean) => all.filter(f).length;
  return {
    items: items
      .slice((page - 1) * pageSize, page * pageSize)
      .map((p, i) => ({ ...p, index: (page - 1) * pageSize + i })),
    total: items.length,
    page,
    pageSize,
    stats: {
      totalCount: all.length,
      total: items.length,
      shiny: count((p) => p.shiny),
      radiant: count((p) => p.radiant),
      shadow: count((p) => p.skin === "shadow"),
      legendary: 0,
      favorite: count((p) => p.favorite),
      champion: count((p) => p.champion),
      market: count((p) => p.marketListed),
      male: count((p) => p.gender === "male"),
      female: count((p) => p.gender === "female"),
      genderless: count((p) => p.gender === "genderless"),
    },
  };
}
