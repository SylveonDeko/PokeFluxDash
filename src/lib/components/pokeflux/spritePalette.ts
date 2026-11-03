import { browser } from "$app/environment";
import { writable, type Readable } from "svelte/store";

/** Two colours picked from a sprite, by how much of it they cover. */
export interface SpritePalette {
  primary: string;
  secondary: string;
}

/** Colours (empty when the sprite has none worth using) and how far the art's centre sits from the image centre, in thousandths. */
type SpriteInfo = [primary: string, secondary: string, dx: number, dy: number];
type SpriteInfoMap = Record<string, SpriteInfo>;

const sprites = writable<SpriteInfoMap | null>(null);
let requested = false;

/**
 * The precomputed sprite colours and art offsets, keyed by the first 12 characters of the hosted file name.
 * Loaded once on first use and empty until then, or for good if the file fails to load.
 */
export const spritePalettes: Readable<SpriteInfoMap | null> = {
  subscribe(run) {
    if (browser && !requested) {
      requested = true;
      fetch("/sprite-palettes.json")
        .then((response) => (response.ok ? response.json() : null))
        .then((map: SpriteInfoMap | null) => map && sprites.set(map))
        .catch(() => {});
    }
    return sprites.subscribe(run);
  },
};

function lookup(map: SpriteInfoMap | null, spriteUrl: string | null | undefined): SpriteInfo | null {
  if (!map || !spriteUrl) return null;
  const start = spriteUrl.lastIndexOf("/") + 1;
  return map[spriteUrl.slice(start, start + 12)] ?? null;
}

/** The palette for a hosted sprite URL, or null when it has none or the map is not loaded yet. */
export function paletteFor(map: SpriteInfoMap | null, spriteUrl: string | null | undefined): SpritePalette | null {
  const entry = lookup(map, spriteUrl);
  return entry?.[0] ? { primary: `#${entry[0]}`, secondary: `#${entry[1]}` } : null;
}

/** How far to shift a sprite, in percent of its box, so its art sits in the middle. */
export function centringFor(map: SpriteInfoMap | null, spriteUrl: string | null | undefined): { x: number; y: number } {
  const entry = lookup(map, spriteUrl);
  return entry ? { x: -entry[2] / 10, y: -entry[3] / 10 } : { x: 0, y: 0 };
}
