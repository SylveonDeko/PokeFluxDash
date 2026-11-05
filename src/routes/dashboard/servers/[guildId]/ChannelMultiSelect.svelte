<!--
@component
Picks text channels from a server's channel list, grouped by category. Selected channels show as
removable chips; ids the server no longer has are flagged so they can be removed.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { GuildTextChannel } from "$lib/api";
  import type { ChannelGroup } from "./channels";

  interface Props {
    id: string;
    label: string;
    description?: string;
    groups: ChannelGroup[];
    selected: string[];
    disabled?: boolean;
  }

  let { id, label, description, groups, selected = $bindable(), disabled = false }: Props = $props();

  let search = $state("");

  let byId = $derived(new Map(groups.flatMap((g) => g.channels).map((c) => [c.id, c] as const)));
  let selectedSet = $derived(new Set(selected));
  let query = $derived(search.trim().toLowerCase().replace(/^#/, ""));
  let visible = $derived(
    groups
      .map((g) => ({ ...g, channels: query ? g.channels.filter((c) => c.name.toLowerCase().includes(query)) : g.channels }))
      .filter((g) => g.channels.length > 0),
  );

  function toggle(channel: GuildTextChannel, on: boolean) {
    selected = on ? [...selected.filter((x) => x !== channel.id), channel.id] : selected.filter((x) => x !== channel.id);
  }

  function setGroup(group: ChannelGroup, on: boolean) {
    const ids = new Set(group.channels.map((c) => c.id));
    const rest = selected.filter((x) => !ids.has(x));
    selected = on ? [...rest, ...ids] : rest;
  }
</script>

<fieldset class="min-w-0" {disabled} aria-describedby={description ? `${id}-hint` : undefined}>
  <legend class="block text-sm font-medium mb-1" style="color: {$colorStore.text};">{label}</legend>
  {#if description}
    <p id="{id}-hint" class="text-xs mb-2" style="color: {$colorStore.muted};">{description}</p>
  {/if}

  {#if selected.length}
    <ul class="flex flex-wrap gap-1.5 mb-2" aria-label={m.pokefluxMarket.selectedChannels()}>
      {#each selected as channelId (channelId)}
        {@const channel = byId.get(channelId)}
        <li
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm"
          style="background: {channel ? $colorStore.primary + '20' : $colorStore.accent + '20'}; color: {channel ? $colorStore.text : $colorStore.accent};"
          title={channel ? undefined : m.pokefluxMarket.missingChannel()}
        >
          {#if !channel}<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>{/if}
          <span>#{channel?.name ?? channelId}</span>
          <button
            type="button"
            class="hover:bg-black/20 rounded-sm p-0.5 w-6 h-6 flex items-center justify-center"
            style="color: {$colorStore.muted};"
            aria-label={m.pokefluxMarket.removeChannel({ name: channel?.name ?? channelId })}
            onclick={() => (selected = selected.filter((x) => x !== channelId))}
          >
            <i class="fa-solid fa-xmark" style="font-size: 12px;" aria-hidden="true"></i>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-xs mb-2" style="color: {$colorStore.muted};">{m.pokefluxMarket.noChannelsSelected()}</p>
  {/if}

  <details class="rounded-lg border group" style="border-color: {$colorStore.primary}30; background: {$colorStore.primary}08;">
    <summary
      class="px-3 py-2 text-sm cursor-pointer select-none flex items-center justify-between gap-2 rounded-lg focus:outline-hidden focus-visible:ring-2 min-h-[38px]"
      style="color: {$colorStore.text};"
    >
      <span><i class="fa-solid fa-hashtag mr-2" style="color: {$colorStore.primary};" aria-hidden="true"></i>{m.pokefluxMarket.chooseChannels({ count: selected.length })}</span>
      <i class="fa-solid fa-chevron-down transition-transform group-open:rotate-180" style="color: {$colorStore.muted}; font-size: 14px;" aria-hidden="true"></i>
    </summary>
    <div class="px-3 pb-3 pt-2 space-y-2 border-t" style="border-color: {$colorStore.primary}20;">
      <label class="relative block">
        <span class="sr-only">{m.pokefluxMarket.searchChannels()}</span>
        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: {$colorStore.muted}; font-size: 14px;" aria-hidden="true"></i>
        <input
          type="search"
          bind:value={search}
          placeholder={m.pokefluxMarket.searchChannels()}
          class="w-full pl-9 pr-3 py-1.5 rounded-lg border text-sm transition-all duration-200"
          style="background: {$colorStore.primary}08; border-color: {$colorStore.primary}30; color: {$colorStore.text};"
        />
      </label>
      <div class="max-h-72 overflow-y-auto space-y-3 pr-1">
        {#each visible as group (group.id)}
          {@const all = group.channels.every((c) => selectedSet.has(c.id))}
          <div role="group" aria-labelledby="{id}-group-{group.id}">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span id="{id}-group-{group.id}" class="text-xs font-semibold" style="color: {$colorStore.muted};">{group.label}</span>
              {#if !query}
                <button
                  type="button"
                  class="text-[11px] px-2 py-0.5 rounded-md transition-all hover:scale-[1.02]"
                  style="background: {$colorStore.primary}15; color: {$colorStore.primary};"
                  onclick={() => setGroup(group, !all)}
                >
                  {all ? m.pokefluxMarket.clearGroup({ group: group.label }) : m.pokefluxMarket.selectGroup({ group: group.label })}
                </button>
              {/if}
            </div>
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {#each group.channels as channel (channel.id)}
                <li>
                  <label
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors has-[:focus-visible]:ring-2"
                    style="background: {selectedSet.has(channel.id) ? $colorStore.primary + '12' : 'transparent'}; color: {$colorStore.text};"
                  >
                    <input
                      type="checkbox"
                      class="w-4 h-4 shrink-0"
                      style="accent-color: {$colorStore.primary};"
                      checked={selectedSet.has(channel.id)}
                      onchange={(event) => toggle(channel, event.currentTarget.checked)}
                    />
                    <span class="truncate">#{channel.name}</span>
                  </label>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <p class="text-xs" style="color: {$colorStore.muted};">{m.pokeflux.noResults()}</p>
        {/each}
      </div>
    </div>
  </details>
</fieldset>
