<script lang="ts">
  import { untrack } from "svelte";
  import { goto, replaceState } from "$app/navigation";
  import { navigating, page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import Meter from "$lib/components/collection/Meter.svelte";
  import { buttonStyle, toggleStyle } from "$lib/components/dashboard/styles";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import { EmptyState, FLAGS, PokemonSprite, speciesHref } from "$lib/components/pokeflux";
  import { paletteFor, spritePalettes } from "$lib/components/pokeflux/spritePalette";
  import type { PokedexEntry, PokedexVariant } from "$lib/api";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type Show = "all" | "caught" | "missing";
  const SHOWS: Show[] = ["all", "caught", "missing"];

  const VARIANTS: Record<PokedexVariant, { icon: string; label: () => string }> = {
    national: { icon: "fa-book-open", label: m.pokefluxPokemon.dexNational },
    shiny: { icon: FLAGS.shiny.icon, label: m.common.shiny },
    radiant: { icon: FLAGS.radiant.icon, label: m.common.radiant },
    shadow: { icon: FLAGS.shadow.icon, label: m.dashboard.shadow },
    skin: { icon: "fa-palette", label: m.pokefluxPokemon.dexSkin },
    unowned: { icon: "fa-circle-question", label: m.pokefluxPokemon.dexUnowned },
  };

  const SHOW_LABELS: Record<Show, () => string> = {
    all: m.common.all,
    caught: m.common.caught,
    missing: m.pokefluxPokemon.dexShowMissing,
  };

  const initial = untrack(() => page.url.searchParams);
  let search = $state(initial.get("q") ?? "");
  let show = $state<Show>((SHOWS as string[]).includes(initial.get("show") ?? "") ? (initial.get("show") as Show) : "all");

  let loading = $derived(navigating.to?.url.pathname === "/dashboard/pokedex");
  let canFilter = $derived(data.variant !== "unowned");

  $effect(() => {
    const q = search.trim();
    const s = show;
    const timer = setTimeout(() => {
      const url = new URL(page.url);
      if (q) url.searchParams.set("q", q);
      else url.searchParams.delete("q");
      if (s !== "all") url.searchParams.set("show", s);
      else url.searchParams.delete("show");
      if (url.search !== page.url.search) replaceState(url, page.state);
    }, 250);
    return () => clearTimeout(timer);
  });

  function variantHref(value: PokedexVariant): string {
    const params = new URLSearchParams();
    if (value !== "national") params.set("variant", value);
    if (search.trim()) params.set("q", search.trim());
    if (show !== "all" && value !== "unowned") params.set("show", show);
    const query = params.toString();
    return `/dashboard/pokedex${query ? `?${query}` : ""}`;
  }

  function matches(entry: PokedexEntry, needle: string): boolean {
    if (!needle) return true;
    const number = needle.replace(/^#/, "");
    if (/^\d+$/.test(number) && needle.startsWith("#")) return entry.speciesId === Number(number);
    if (/^\d+$/.test(number)) return String(entry.speciesId) === String(Number(number)) || String(entry.speciesId).startsWith(number);
    return entry.name.toLowerCase().includes(needle);
  }

  function visible(entries: PokedexEntry[]): PokedexEntry[] {
    const needle = search.trim().toLowerCase();
    const mode = canFilter ? show : "all";
    return entries.filter(
      (entry) => (mode === "all" || (mode === "caught") === entry.caught) && matches(entry, needle),
    );
  }

  function entryHref(entry: PokedexEntry): string {
    return speciesHref(entry.speciesId) + (data.variant === "shiny" ? "?shiny=1" : "");
  }

  let tabs = $derived(data.variants.map((value) => ({ id: value, label: VARIANTS[value].label(), icon: VARIANTS[value].icon })));
</script>

<DashboardPageLayout
  title={m.features.pokedex()}
  subtitle={m.dashboard.pokedexSubtitle()}
  icon="fa-book-open"
  {tabs}
  activeTab={data.variant}
  ontabChange={({ tabId }) => goto(variantHref(tabId as PokedexVariant), { noScroll: true, keepFocus: true })}
>
  <ApiState response={data.pokedex} notStartedOn404>
    {#snippet children(dex)}
      {@const owned = dex.entries.reduce((sum, entry) => sum + entry.count, 0)}
      {@const shown = visible(dex.entries)}

      <Panel class="flex flex-col md:flex-row md:items-center gap-3 {loading ? 'opacity-60' : ''}" aria-label={m.pokefluxPokemon.dexProgress()}>
        <div class="grid grid-cols-2 md:flex gap-2 shrink-0">
          <div class="md:w-44">
            <StatTile label={m.common.caught()}>
              <span class="text-2xl font-bold tabular-nums leading-tight" style="color: {$colorStore.text}">
                {dex.caught.toLocaleString()}<span class="text-sm font-semibold" style="color: {$colorStore.muted};">&nbsp;/ {dex.total.toLocaleString()}</span>
              </span>
            </StatTile>
          </div>
          {#if data.variant !== "unowned"}
            <div class="md:w-44"><StatTile label={m.pokefluxPokemon.dexOwned()} value={owned} tint={$colorStore.secondary} /></div>
          {/if}
        </div>
        <Meter
          class="flex-1"
          value={dex.caught}
          max={dex.total}
          label={m.pokefluxPokemon.dexProgress()}
          valueText="{dex.total ? ((dex.caught / dex.total) * 100).toFixed(1) : '0.0'}%"
        />
      </Panel>

      <Panel class="space-y-3" aria-label={m.pokefluxPokemon.dexEntries()}>
        <div class="flex flex-col sm:flex-row gap-2">
          <SearchInput class="flex-1" bind:value={search} placeholder={m.pokefluxPokemon.dexSearch()} />
          {#if canFilter}
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label={m.pokefluxPokemon.dexShowLabel()}>
              {#each SHOWS as value (value)}
                {@const active = show === value}
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  class="px-3 py-1.5 rounded-lg text-sm min-h-[38px] transition-all"
                  style={toggleStyle($colorStore, active)}
                  onclick={() => (show = value)}
                >
                  {SHOW_LABELS[value]()}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <p class="text-xs" style="color: {$colorStore.muted};" aria-live="polite">
          {m.pokefluxPokemon.dexShown({ shown: shown.length.toLocaleString(), total: dex.entries.length.toLocaleString() })}
        </p>

        {#if dex.entries.length === 0}
          <EmptyState
            title={data.variant === "unowned" ? m.pokefluxPokemon.dexCompleteTitle() : m.dashboard.emptyList()}            icon={data.variant === "unowned" ? "fa-solid fa-trophy" : "fa-solid fa-book-open"}
          />
        {:else if shown.length === 0}
          <EmptyState title={m.pokefluxPokemon.dexNoMatch()} message={m.pokeflux.noResultsHint()} icon="fa-solid fa-magnifying-glass">
            <button
              type="button"
              class="px-4 py-2 rounded-xl min-h-[38px] text-sm font-medium transition-all hover:scale-[1.02]"
              style={buttonStyle($colorStore)}
              onclick={() => {
                search = "";
                show = "all";
              }}
            >
              {m.pokefluxPokemon.clearFilters()}
            </button>
          </EmptyState>
        {:else}
          <ul
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 transition-opacity"
            class:opacity-60={loading}
            data-sveltekit-preload-data="hover"
          >
            {#each shown as entry (entry.speciesId)}
              {@const label = entry.caught
                ? m.pokefluxPokemon.dexEntryCaught({ name: entry.name, count: entry.count })
                : m.pokefluxPokemon.dexEntryMissing({ name: entry.name })}
              {@const palette = paletteFor($spritePalettes, entry.spriteUrl)}
              <li class="pf-dex-tile">
                {#snippet tile()}
                  <span
                    class="relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
                    style="background: {entry.caught ? `${$colorStore.primary}20` : `${$colorStore.primary}08`};"
                    aria-hidden="true"
                  >
                    <PokemonSprite src={entry.spriteUrl} size={38} class={entry.caught ? "" : "pf-dex-missing"} />
                    <i
                      class="fa-solid {entry.caught ? 'fa-circle-check' : 'fa-circle-question'} absolute -bottom-0.5 -right-0.5 text-xs rounded-full"
                      style="color: {entry.caught ? $colorStore.primary : $colorStore.muted}; background: {$colorStore.background};"
                    ></i>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-[11px] tabular-nums" style="color: {$colorStore.muted};">#{String(entry.speciesId).padStart(4, "0")}</span>
                    <span class="block text-sm font-semibold truncate" style="color: {entry.caught ? $colorStore.text : $colorStore.muted};">{entry.name}</span>
                  </span>
                  {#if entry.count > 0}
                    <span
                      class="shrink-0 text-xs px-2 py-0.5 rounded-md font-medium tabular-nums"
                      style="background: {$colorStore.primary}20; color: {$colorStore.primary};"
                      aria-hidden="true"
                    >×{entry.count}</span>
                  {/if}
                {/snippet}
                <a
                  href={entryHref(entry)}
                  class="h-full flex items-center gap-2 p-2 rounded-xl border transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
                  style="{entry.count > 0
                    ? `background: ${palette ? `${palette.primary}10` : `${$colorStore.primary}10`}; border-color: ${palette ? palette.primary : $colorStore.primary}30;`
                    : `background: ${$colorStore.primary}05; border-color: ${$colorStore.primary}20;`} --tw-ring-color: {$colorStore.primary};"
                  aria-label={label}
                >
                  {@render tile()}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </Panel>
    {/snippet}
  </ApiState>
</DashboardPageLayout>

<style>
  .pf-dex-tile {
    content-visibility: auto;
    contain-intrinsic-size: auto 62px;
  }

  :global(.pf-dex-missing) {
    filter: grayscale(1) brightness(0.6);
    opacity: 0.55;
  }
</style>
