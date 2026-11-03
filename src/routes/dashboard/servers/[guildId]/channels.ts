import { m } from "$lib/i18n";
import type { GuildCategory, GuildTextChannel } from "$lib/api";

export interface ChannelGroup {
  id: string;
  label: string;
  channels: GuildTextChannel[];
}

/**
 * Groups text channels by their parent category, in channel order. Channels without a category
 * come first, then each category in its own order. A category the bot did not send is numbered.
 */
export function groupChannels(channels: GuildTextChannel[], categories: GuildCategory[]): ChannelGroup[] {
  const sorted = [...channels].sort((a, b) => a.position - b.position);
  const groups = new Map<string, GuildTextChannel[]>();
  for (const channel of sorted) {
    const key = channel.parentId ?? "";
    const list = groups.get(key);
    if (list) list.push(channel);
    else groups.set(key, [channel]);
  }
  const byId = new Map(categories.map((category) => [category.id, category]));
  const order = (id: string) => (id === "" ? -Infinity : (byId.get(id)?.position ?? Infinity));
  let n = 0;
  return [...groups.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([id, list]) => ({
      id: id || "none",
      label: id
        ? byId.get(id)?.name || m.pokefluxMarket.categoryNumbered({ n: ++n })
        : m.pokefluxMarket.noCategory(),
      channels: list,
    }));
}
