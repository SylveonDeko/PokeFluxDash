<script lang="ts">
  import { untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { navigating } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import Pagination from "$lib/components/dashboard/Pagination.svelte";
  import { buttonStyle, chipStyle, dangerStyle, segmentStyle } from "$lib/components/dashboard/styles";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import {
    EmptyState,
    FILTER_LABELS,
    FLAGS,
    GENDER_FILTERS,
    GENDERS,
    humanize,
    LoadingGrid,
    PokemonCard,
    POKEMON_FILTERS,
    POKEMON_GRID,
    POKEMON_SORTS,
    SORT_LABELS,
  } from "$lib/components/pokeflux";
  import type { GenderFilter, PokemonFilter, PokemonListStats, PokemonSort } from "$lib/api";
  import { DENSITY_COOKIE, detailHref, listParams, PAGE_SIZES, type ListState } from "./query";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type Density = "regular" | "compact";
  const DENSITIES: { value: Density; icon: string; label: () => string }[] = [
    { value: "regular", icon: "fa-grip", label: m.pokefluxPokemon.densityRegular },
    { value: "compact", icon: "fa-list", label: m.pokefluxPokemon.densityCompact },
  ];

  let density = $state<Density>(untrack(() => data.density));
  let search = $state(untrack(() => data.state.search));
  let searchInput = $state<HTMLInputElement>();

  let query = $derived(data.state);
  let loading = $derived(navigating.to?.url.pathname === "/dashboard/pokemon");
  let filtered = $derived(query.filter !== "all" || query.gender !== "all" || !!query.search || !!query.heldItem);

  const GENDER_OPTIONS: Record<GenderFilter, { icon: string; color: string; label: () => string }> = {
    all: { icon: "fa-venus-mars", color: "", label: m.common.all },
    ...GENDERS,
  };

  interface Chip {
    key: string;
    label: string;
    icon: string;
    color: string;
    value: number;
    active: boolean;
    patch: Partial<ListState>;
  }

  function chipsOf(stats: PokemonListStats): Chip[] {
    const filterChip = (filter: keyof typeof FLAGS, value: number): Chip => ({
      key: filter,
      label: FILTER_LABELS[filter](),
      icon: FLAGS[filter].icon,
      color: FLAGS[filter].color,
      value,
      active: query.filter === filter,
      patch: { filter: query.filter === filter ? "all" : filter },
    });
    const genderChip = (gender: Exclude<GenderFilter, "all">, value: number): Chip => ({
      key: gender,
      label: GENDER_OPTIONS[gender].label(),
      icon: GENDER_OPTIONS[gender].icon,
      color: GENDER_OPTIONS[gender].color,
      value,
      active: query.gender === gender,
      patch: { gender: query.gender === gender ? "all" : gender },
    });
    return [
      filterChip("shiny", stats.shiny),
      filterChip("radiant", stats.radiant),
      filterChip("shadow", stats.shadow),
      filterChip("legendary", stats.legendary),
      filterChip("favorite", stats.favorite),
      genderChip("male", stats.male),
      genderChip("female", stats.female),
      genderChip("genderless", stats.genderless),
    ];
  }

  $effect(() => {
    const value = data.state.search;
    untrack(() => {
      if (document.activeElement !== searchInput) search = value;
    });
  });

  $effect(() => {
    const value = search.trim();
    if (value === untrack(() => query.search)) return;
    const timer = setTimeout(() => update({ search: value }, true), 300);
    return () => clearTimeout(timer);
  });

  function hrefFor(next: ListState): string {
    const query = listParams(next).toString();
    return `/dashboard/pokemon${query ? `?${query}` : ""}`;
  }

  function update(patch: Partial<ListState>, replaceState = false) {
    goto(hrefFor({ ...query, page: 1, ...patch }), { keepFocus: true, noScroll: true, replaceState });
  }

  function clearFilters() {
    search = "";
    update({ filter: "all", gender: "all", search: "", heldItem: "" });
  }

  function setDensity(value: Density) {
    density = value;
    document.cookie = `${DENSITY_COOKIE}=${value}; path=/dashboard/pokemon; max-age=31536000; samesite=lax`;
  }

  function onwindowkeydown(event: KeyboardEvent) {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable=true], dialog")) return;
    event.preventDefault();
    searchInput?.focus();
  }

</script>

<svelte:window onkeydown={onwindowkeydown} />

{#snippet densityToggle()}
  <div class="inline-flex items-center space-x-1 p-2 rounded-xl" style="background: {$colorStore.primary}10;" role="radiogroup" aria-label={m.pokefluxPokemon.densityLabel()}>
    {#each DENSITIES as { value, icon, label: labelOf } (value)}
      {@const active = density === value}
      {@const label = labelOf()}
      <button
        type="button"
        role="radio"
        aria-checked={active}
        title={label}
        class="w-10 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
        style={segmentStyle($colorStore, active)}
        onclick={() => setDensity(value)}
      >
        <i class="fa-solid {icon}" aria-hidden="true"></i><span class="sr-only">{label}</span>
      </button>
    {/each}
  </div>
{/snippet}

{#snippet pagination(page: number, pages: number, position: "top" | "bottom")}
  <Pagination
    {page}
    {pages}
    label={m.pokefluxPokemon.paginationLabel()}
    hrefFor={(target) => hrefFor({ ...query, page: target })}
    numbered
    class={position === "bottom" ? "justify-center" : ""}
  />
{/snippet}

<DashboardPageLayout title={m.common.pokemon()} subtitle={m.dashboard.pokemonSubtitle()} icon="fa-paw">
  {#snippet actions()}
    {@render densityToggle()}
  {/snippet}

  <ApiState response={data.list} notStartedOn404>
    {#snippet children(list)}
      {@const pages = Math.max(1, Math.ceil(list.total / list.pageSize))}
      {@const from = list.total ? (list.page - 1) * list.pageSize + 1 : 0}
      {@const to = Math.min(list.total, list.page * list.pageSize)}

      <Panel class="flex flex-col sm:flex-row sm:items-center gap-3" aria-label={m.pokefluxPokemon.summaryLabel()}>
        <div class="grid grid-cols-2 sm:flex gap-2 shrink-0">
          <div class="sm:w-36"><StatTile label={m.common.collection()} value={list.stats.totalCount} /></div>
          {#if filtered}
            <div class="sm:w-36"><StatTile label={m.pokefluxPokemon.matching()} value={list.stats.total} tint={$colorStore.secondary} /></div>
          {/if}
        </div>
        <ul class="flex flex-wrap gap-2">
          {#each chipsOf(list.stats) as chip (chip.key)}
            <li>
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2 min-h-[36px]"
                style={chipStyle($colorStore, chip.active)}
                aria-pressed={chip.active}
                title={chip.active ? m.pokefluxPokemon.chipClear({ name: chip.label }) : m.pokefluxPokemon.chipShow({ name: chip.label })}
                onclick={() => update(chip.patch)}
              >
                <i class="fa-solid {chip.icon}" style="color: {chip.color}; font-size: 14px;" aria-hidden="true"></i>
                <span>{chip.label}</span>
                <span class="tabular-nums" style="color: {$colorStore.text};">{chip.value.toLocaleString()}</span>
              </button>
            </li>
          {/each}
        </ul>
      </Panel>

      <Panel class="space-y-3" aria-label={m.pokefluxPokemon.controlsLabel()}>
        <div class="flex flex-col lg:flex-row gap-2">
          <SearchInput
            class="flex-1"
            bind:input={searchInput}
            bind:value={search}
            placeholder={m.pokeflux.searchPlaceholder()}
            aria-keyshortcuts="/"
            onkeydown={(event) => {
              if (event.key === "Enter") update({ search: search.trim() });
            }}
          >
            <kbd
              class="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 items-center justify-center rounded text-[11px] border pointer-events-none"
              style="background: {$colorStore.primary}20; border-color: {$colorStore.primary}30; color: {$colorStore.primary};"
              aria-hidden="true">/</kbd
            >
          </SearchInput>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2">
            <div class="min-w-0 lg:w-48">
              <DiscordSelector
                type="custom"
                customIcon="fa-arrow-down-wide-short"
                options={POKEMON_SORTS.map((value) => ({ id: value, name: SORT_LABELS[value]() }))}
                selected={query.sort}
                searchable={false}
                ariaLabel={m.pokeflux.sortLabel()}
                onchange={({ selected }) => selected && update({ sort: selected as PokemonSort })}
              />
            </div>
            <div class="min-w-0 lg:w-48">
              <DiscordSelector
                type="custom"
                customIcon="fa-filter"
                options={POKEMON_FILTERS.map((value) => ({ id: value, name: FILTER_LABELS[value]() }))}
                selected={query.filter}
                searchable={false}
                ariaLabel={m.pokeflux.filterLabel()}
                onchange={({ selected }) => selected && update({ filter: selected as PokemonFilter })}
              />
            </div>
            <div class="min-w-0 col-span-2 sm:col-span-1 lg:w-44">
              <DiscordSelector
                type="custom"
                customIcon="fa-grid-2"
                options={PAGE_SIZES.map((value) => ({ id: String(value), name: m.pokefluxPokemon.pageSizeOption({ count: value }) }))}
                selected={String(query.pageSize)}
                searchable={false}
                ariaLabel={m.pokefluxPokemon.pageSizeLabel()}
                onchange={({ selected }) => selected && update({ pageSize: Number(selected) })}
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap" style="background: {$colorStore.primary}10;" role="radiogroup" aria-label={m.common.gender()}>
            {#each GENDER_FILTERS as value (value)}
              {@const option = GENDER_OPTIONS[value]}
              {@const active = query.gender === value}
              <button
                type="button"
                role="radio"
                aria-checked={active}
                class="px-3 py-1.5 min-h-[34px] rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
                style={segmentStyle($colorStore, active)}
                onclick={() => update({ gender: value })}
              >
                <i class="fa-solid {option.icon}" style={option.color ? `color: ${option.color};` : ""} aria-hidden="true"></i>
                <span class={value === "all" ? "" : "hidden sm:inline"}>{option.label()}</span>
                {#if value !== "all"}<span class="sr-only sm:hidden">{option.label()}</span>{/if}
              </button>
            {/each}
          </div>
          {#if query.heldItem}
            <button
              type="button"
              class="px-3 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
              style={chipStyle($colorStore, true)}
              aria-label={m.pokefluxPokemon.clearHeldItem({ item: humanize(query.heldItem) })}
              onclick={() => update({ heldItem: "" })}
            >
              <i class="fa-solid fa-hand-holding" aria-hidden="true"></i>
              {m.pokeflux.heldItem({ item: humanize(query.heldItem) })}
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          {/if}
          {#if filtered}
            <button
              type="button"
              class="px-3 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
              style={dangerStyle($colorStore)}
              onclick={clearFilters}
            >
              <i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>{m.pokefluxPokemon.clearFilters()}
            </button>
          {/if}
        </div>
      </Panel>

      <section class="space-y-3" aria-label={m.common.pokemon()}>
        <div class="flex flex-wrap items-center justify-between gap-2 min-h-9">
          <p class="text-sm tabular-nums" style="color: {$colorStore.muted};" aria-live="polite">
            {#if loading}
              <i class="fa-solid fa-spinner fa-spin mr-1" aria-hidden="true"></i>{m.pokeflux.loading()}
            {:else if list.items.length}
              {m.pokefluxPokemon.showing({ from, to, total: list.total.toLocaleString() })}
            {/if}
          </p>
          {@render pagination(list.page, pages, "top")}
        </div>

        {#if list.stats.totalCount === 0}
          <EmptyState title={m.pokefluxPokemon.emptyTitle()} message={m.pokefluxPokemon.emptyHint()} icon="fa-solid fa-paw" />
        {:else if list.items.length === 0 && list.total > 0}
          <EmptyState title={m.pokefluxPokemon.pastEndTitle()} icon="fa-solid fa-book-open">
            <a href={hrefFor({ ...query, page: pages })} class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2" style={buttonStyle($colorStore)}>
              {m.pokefluxPokemon.goLastPage()}
            </a>
          </EmptyState>
        {:else if list.items.length === 0}
          {#if loading}
            <LoadingGrid count={Math.min(12, query.pageSize)} size={density} />
          {:else}
            <EmptyState title={m.pokeflux.noResults()} message={m.pokeflux.noResultsHint()} icon="fa-solid fa-magnifying-glass">
              <button type="button" class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2" style={buttonStyle($colorStore)} onclick={clearFilters}>
                {m.pokefluxPokemon.clearFilters()}
              </button>
            </EmptyState>
          {/if}
        {:else}
          <ul
            class="{POKEMON_GRID[density]} transition-opacity duration-150"
            class:opacity-50={loading}
            aria-busy={loading}
            data-sveltekit-preload-data="hover"
          >
            {#each list.items as pokemon, i (pokemon.id)}
              <li class="pf-card-in" style="animation-delay: {Math.min(i, 24) * 12}ms;">
                <PokemonCard {pokemon} size={density} href={detailHref(pokemon.id, query)} />
              </li>
            {/each}
          </ul>
          <div class="pt-2">{@render pagination(list.page, pages, "bottom")}</div>
        {/if}
      </section>
    {/snippet}
  </ApiState>
</DashboardPageLayout>

<style>
  .pf-card-in {
    animation: pf-card-in 220ms ease-out both;
  }

  @keyframes pf-card-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pf-card-in {
      animation: none;
    }
  }
</style>
