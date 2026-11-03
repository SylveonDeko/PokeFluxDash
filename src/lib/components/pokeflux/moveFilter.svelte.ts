import type { MoveCategory, MoveDetails } from "$lib/api";
import { normalizeType, POKEMON_TYPES } from "./pokemon";

export type MoveSort = "name" | "power" | "accuracy" | "pp";

/** Search, type, category and sort state for a list of moves. */
export class MoveFilter {
  search = $state("");
  type = $state("all");
  category = $state<"all" | MoveCategory>("all");
  sort = $state<MoveSort>("name");

  #moves: () => MoveDetails[];

  constructor(moves: () => MoveDetails[]) {
    this.#moves = moves;
  }

  /** The types present in the moves, in type order. */
  types = $derived.by(() => {
    const present = new Set(this.#moves().map((move) => normalizeType(move.type) ?? move.type));
    const ordered: string[] = POKEMON_TYPES.filter((t) => present.has(t));
    for (const t of present) if (!ordered.includes(t)) ordered.push(t);
    return ordered;
  });

  /** The moves that match, sorted. */
  shown = $derived.by(() => {
    const needle = this.search.trim().toLowerCase().replace(/\s+/g, "-");
    const list = this.#moves().filter(
      (move) =>
        (!needle || move.name.includes(needle)) &&
        (this.type === "all" || (normalizeType(move.type) ?? move.type) === this.type) &&
        (this.category === "all" || move.category === this.category),
    );
    const num = (value: number | null, never = -1) => value ?? never;
    return list.sort((a, b) => {
      if (this.sort === "power") return num(b.power) - num(a.power) || a.name.localeCompare(b.name);
      if (this.sort === "accuracy") return num(b.accuracy, 101) - num(a.accuracy, 101) || a.name.localeCompare(b.name);
      if (this.sort === "pp") return b.pp - a.pp || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  });

  clear() {
    this.search = "";
    this.type = "all";
    this.category = "all";
  }
}
