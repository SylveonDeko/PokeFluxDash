<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Streamed from "$lib/components/collection/Streamed.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import { toggleStyle } from "$lib/components/dashboard/styles";
  import Meter from "$lib/components/collection/Meter.svelte";
  import { EmptyState, humanize } from "$lib/components/pokeflux";
  import type { ItemCount } from "$lib/api";
  import { groupItems, groupOf, groupsOf } from "./items";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let search = $state("");
  let activeGroup = $state<string>("all");

  let query = $derived(search.trim().toLowerCase());

  function matches(item: ItemCount): boolean {
    if (!query) return true;
    return item.name.toLowerCase().includes(query) || humanize(item.name).toLowerCase().includes(query);
  }

  function visible(items: ItemCount[]) {
    return groupItems(items.filter((item) => matches(item) && (activeGroup === "all" || groupOf(item) === activeGroup)));
  }

  /** The Pokémon list showing only the Pokémon holding an item. */
  const holdersHref = (item: ItemCount) => `/dashboard/pokemon?item=${encodeURIComponent(item.name)}`;

  const sum = (items: ItemCount[]) => items.reduce((total, item) => total + item.count, 0);
</script>

{#snippet tiles(groups: ReturnType<typeof visible>)}
  <div class="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-x-4">
    {#each groups as { group, items } (group.key)}
      <section aria-labelledby="group-{group.key}" class="space-y-1.5 break-inside-avoid mb-3">
        <h3 id="group-{group.key}" class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide pt-1" style="color: {$colorStore.muted}">
          <i class={group.icon} aria-hidden="true"></i>{group.label()}
          <span class="normal-case font-normal">{items.length}</span>
        </h3>
        <ul class="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-1 gap-1.5">
          {#each items as item (item.name)}
            <li
              class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border min-w-0"
              style="background: {$colorStore.primary}08; border-color: {$colorStore.primary}20;"
            >
              <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style="background: {$colorStore.primary}20;">
                <i class={group.icon} style="color: {$colorStore.primary};" aria-hidden="true"></i>
              </span>
              <span class="flex-1 min-w-0 text-sm font-semibold truncate" style="color: {$colorStore.text}" title={item.name}>{humanize(item.name)}</span>
              <span class="text-xs px-2 py-0.5 rounded-md font-medium tabular-nums shrink-0" style="background: {$colorStore.primary}20; color: {$colorStore.primary}">
                <span class="sr-only">{m.pokefluxCollection.quantity()}</span>×{item.count.toLocaleString()}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
{/snippet}

<DashboardPageLayout title={m.features.inventory()} subtitle={m.dashboard.inventorySubtitle()} icon="fa-briefcase">
  <Streamed promise={data.inventory} notStartedOn404>
    {#snippet children(inventory)}
      {@const all = [...inventory.inventory, ...inventory.bag]}
      {@const inventoryGroups = visible(inventory.inventory)}
      {@const bagGroups = visible(inventory.bag)}
      {@const held = inventory.heldItems.filter(matches)}
      {@const heldMax = Math.max(1, ...inventory.heldItems.map((h) => h.count))}
      {@const presentGroups = groupsOf(all)}

      <div class="space-y-3">
        <div class="flex flex-col md:flex-row md:items-center gap-2">
          <div class="grid grid-cols-2 md:flex gap-2 shrink-0">
            {#each [
              { label: m.pokefluxCollection.totalItems(), value: sum(all), tint: $colorStore.primary },
              { label: m.pokefluxCollection.itemsHeld(), value: sum(inventory.heldItems), tint: $colorStore.secondary },
            ] as stat (stat.label)}
              <div class="md:w-44"><StatTile label={stat.label} value={stat.value} tint={stat.tint} /></div>
            {/each}
          </div>
          <SearchInput class="flex-1" bind:value={search} placeholder={m.pokefluxCollection.searchItems()} />
        </div>
        {#if presentGroups.length > 1}
          <div class="flex flex-wrap gap-1.5" role="group" aria-label={m.pokefluxCollection.itemGroups()}>
            {#each [{ key: "all" as const, label: m.pokefluxCollection.allItems, icon: "fa-solid fa-border-all" }, ...presentGroups] as chip (chip.key)}
              {@const active = activeGroup === chip.key}
              <button
                type="button"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm min-h-[34px] transition-all"
                style={toggleStyle($colorStore, active)}
                aria-pressed={active}
                onclick={() => (activeGroup = chip.key)}
              >
                <i class={chip.icon} aria-hidden="true"></i>{chip.label()}
              </button>
            {/each}
          </div>
        {/if}
      </div>

          <Panel icon="fa-solid fa-box-open" title={m.pokefluxCollection.inventoryTitle({ count: inventory.inventory.length })}>
            {#if inventory.inventory.length === 0}
              <EmptyState title={m.pokefluxCollection.inventoryEmpty()} icon="fa-solid fa-box-open" compact />
            {:else if inventoryGroups.length === 0}
              <EmptyState title={m.pokefluxCollection.noItemsMatch()} message={m.pokefluxCollection.noItemsMatchHint()} icon="fa-solid fa-magnifying-glass" compact />
            {:else}
              {@render tiles(inventoryGroups)}
            {/if}
          </Panel>

          <Panel icon="fa-solid fa-bag-shopping" title={m.pokefluxCollection.bagTitle({ count: inventory.bag.length })}>
            {#if inventory.bag.length === 0}
              <EmptyState title={m.pokefluxCollection.bagEmpty()} icon="fa-solid fa-bag-shopping" compact />
            {:else if bagGroups.length === 0}
              <EmptyState title={m.pokefluxCollection.noItemsMatch()} message={m.pokefluxCollection.noItemsMatchHint()} icon="fa-solid fa-magnifying-glass" compact />
            {:else}
              {@render tiles(bagGroups)}
            {/if}
          </Panel>

        <Panel icon="fa-solid fa-hand-holding" title={m.dashboard.heldItems()} subtitle={m.pokefluxCollection.heldItemsHint()}>
          {#if inventory.heldItems.length === 0}
            <EmptyState title={m.pokefluxCollection.noHeldItems()} icon="fa-solid fa-hand-holding" compact />
          {:else if held.length === 0}
            <EmptyState title={m.pokefluxCollection.noItemsMatch()} icon="fa-solid fa-magnifying-glass" compact />
          {:else}
            <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {#each held as item (item.name)}
                <li>
                  <a
                    href={holdersHref(item)}
                    class="block px-3 py-2 rounded-lg transition-all hover:scale-[1.01] outline-none focus-visible:ring-2"
                    style="background: {$colorStore.primary}10; --tw-ring-color: {$colorStore.primary};"
                    title={m.pokefluxCollection.showHolders({ item: humanize(item.name) })}
                  >
                    <Meter
                      value={item.count}
                      max={heldMax}
                      label={humanize(item.name)}
                      valueText={m.pokefluxCollection.heldBy({ count: item.count.toLocaleString() })}
                      size="sm"
                      color={$colorStore.primary}
                    />
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </Panel>
    {/snippet}
  </Streamed>
</DashboardPageLayout>
