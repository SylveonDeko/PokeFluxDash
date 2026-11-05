<!--
@component
A modal to search the user's own Pokémon and pick one, or several with `multiple`. Pass `loader` to
load them another way.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { PokemonCard as Pokemon, PokemonFilter, PokemonList, PokemonListQuery, PokemonSort } from "$lib/api";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import { buttonStyle, quietStyle } from "$lib/components/dashboard/styles";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import Pagination from "$lib/components/dashboard/Pagination.svelte";
  import Modal from "./Modal.svelte";
  import PokemonCard from "./PokemonCard.svelte";
  import LoadingGrid from "./LoadingGrid.svelte";
  import EmptyState from "./EmptyState.svelte";
  import { fetchPokemonPage, type PokemonPageLoader } from "./pokemon";
  import { FILTER_LABELS, POKEMON_FILTERS, POKEMON_SORTS, SORT_LABELS } from "./labels";

  interface Props {
    open?: boolean;
    title?: string;
    multiple?: boolean;
    /** Most Pokémon multi mode allows, such as 6 for a party. */
    max?: number;
    /** Let multi mode confirm with nothing picked, such as to clear a list. */
    allowEmpty?: boolean;
    /** Picked when the picker opens, in multi mode. */
    initialSelected?: Pokemon[];
    /** Fixed query fields, such as `{ gender: "female" }`. The user's search, sort, filter and page go on top. */
    query?: Omit<PokemonListQuery, "page" | "pageSize" | "search">;
    pageSize?: number;
    /** Show the sort and filter menus. */
    showControls?: boolean;
    /** Show the search box. */
    showSearch?: boolean;
    /** Text when nothing matches, such as "You have no eggs". */
    emptyTitle?: string;
    emptyMessage?: string;
    /** Return true or a reason to grey a Pokémon out. */
    isDisabled?: (pokemon: Pokemon) => boolean | string;
    loader?: PokemonPageLoader;
    onpick?: (picked: Pokemon[]) => void;
    oncancel?: () => void;
  }

  let {
    open = $bindable(false),
    title,
    multiple = false,
    max,
    allowEmpty = false,
    initialSelected = [],
    query = {},
    pageSize = 24,
    showControls = true,
    showSearch = true,
    emptyTitle,
    emptyMessage,
    isDisabled,
    loader = fetchPokemonPage,
    onpick,
    oncancel,
  }: Props = $props();

  let search = $state("");
  let appliedSearch = $state("");
  let sort = $state<PokemonSort>("default");
  let filter = $state<PokemonFilter>("all");
  let page = $state(1);
  let list = $state<PokemonList | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let picked = $state<Pokemon[]>([]);
  let reloadKey = $state(0);

  let pages = $derived(list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1);
  let pickedIds = $derived(new Set(picked.map((p) => p.id)));
  let full = $derived(max !== undefined && picked.length >= max);

  $effect(() => {
    if (!open) return;
    untrack(() => {
      search = "";
      appliedSearch = "";
      sort = query.sort ?? "default";
      filter = query.filter ?? "all";
      page = 1;
      list = null;
      picked = multiple ? [...initialSelected] : [];
    });
  });

  $effect(() => {
    const value = search.trim();
    if (value === untrack(() => appliedSearch)) return;
    const timer = setTimeout(() => {
      appliedSearch = value;
      page = 1;
    }, 300);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (!open) return;
    void reloadKey;
    const request: PokemonListQuery = { ...query, sort, filter, page, pageSize, search: appliedSearch || undefined };
    const controller = new AbortController();
    loading = true;
    error = null;
    loader(request, controller.signal)
      .then((result) => {
        list = result;
        loading = false;
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        error = err instanceof Error ? err.message : String(err);
        loading = false;
      });
    return () => controller.abort();
  });

  function disabledReason(pokemon: Pokemon): string | true | undefined {
    const result = isDisabled?.(pokemon);
    if (result) return result;
    if (multiple && full && !pickedIds.has(pokemon.id)) return true;
    return undefined;
  }

  function toggle(pokemon: Pokemon, on: boolean) {
    picked = on ? [...picked.filter((p) => p.id !== pokemon.id), pokemon] : picked.filter((p) => p.id !== pokemon.id);
  }

  function pickOne(pokemon: Pokemon) {
    open = false;
    onpick?.([pokemon]);
  }

  function confirm() {
    const result = [...picked];
    open = false;
    onpick?.(result);
  }

  function cancel() {
    open = false;
    oncancel?.();
  }

  const gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2";
</script>

<Modal
  bind:open
  title={title ?? (multiple ? m.pokeflux.pickerTitleMultiple() : m.pokeflux.pickerTitle())}
  icon="fa-solid fa-paw"
  size="xl"
  footer={multiple ? multiFooter : undefined}
  onclose={oncancel}
>
  <div class="space-y-3">
    {#if showSearch || showControls}
    <div class="flex flex-col sm:flex-row gap-2">
      {#if showSearch}
      <SearchInput class="flex-1" data-autofocus bind:value={search} placeholder={m.pokeflux.searchPlaceholder()} />
      {/if}
      {#if showControls}
        <div class="grid grid-cols-2 gap-2 sm:flex">
          <div class="min-w-0 sm:w-44">
            <DiscordSelector
              type="custom"
              customIcon="fa-arrow-down-wide-short"
              options={POKEMON_SORTS.map((value) => ({ id: value, name: SORT_LABELS[value]() }))}
              selected={sort}
              searchable={false}
              ariaLabel={m.pokeflux.sortLabel()}
              onchange={({ selected }) => {
                if (!selected) return;
                sort = selected as PokemonSort;
                page = 1;
              }}
            />
          </div>
          <div class="min-w-0 sm:w-44">
            <DiscordSelector
              type="custom"
              customIcon="fa-filter"
              options={POKEMON_FILTERS.map((value) => ({ id: value, name: FILTER_LABELS[value]() }))}
              selected={filter}
              searchable={false}
              ariaLabel={m.pokeflux.filterLabel()}
              onchange={({ selected }) => {
                if (!selected) return;
                filter = selected as PokemonFilter;
                page = 1;
              }}
            />
          </div>
        </div>
      {/if}
    </div>
    {/if}

    {#if error}
      <EmptyState title={m.pokeflux.loadError()} message={error} icon="fa-solid fa-circle-exclamation" compact>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
          style={buttonStyle($colorStore)}
          onclick={() => reloadKey++}
        >
          <i class="fa-solid fa-rotate-right mr-1" aria-hidden="true"></i>{m.common.retry()}
        </button>
      </EmptyState>
    {:else if !list}
      <LoadingGrid count={9} size="compact" {gridClass} />
    {:else if list.items.length === 0}
      <EmptyState title={emptyTitle ?? m.pokeflux.noResults()} message={emptyMessage ?? m.pokeflux.noResultsHint()} icon="fa-solid fa-magnifying-glass" compact />
    {:else}
      <ul class="{gridClass} transition-opacity" class:opacity-60={loading} aria-busy={loading}>
        {#each list.items as pokemon (pokemon.id)}
          {@const reason = disabledReason(pokemon)}
          <li>
            {#if multiple}
              <PokemonCard
                {pokemon}
                size="compact"
                selectable
                checked={pickedIds.has(pokemon.id)}
                disabled={!!reason}
                disabledReason={typeof reason === "string" ? reason : undefined}
                onchange={(on) => toggle(pokemon, on)}
              />
            {:else}
              <PokemonCard
                {pokemon}
                size="compact"
                disabled={!!reason}
                disabledReason={typeof reason === "string" ? reason : undefined}
                onclick={pickOne}
              />
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if list}
      <Pagination {page} {pages} label={m.dashboard.pageOf({ page, pages })} disabled={loading} onchange={(target) => (page = target)} class="pt-1" />
    {/if}
  </div>
</Modal>

{#snippet multiFooter()}
  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
    <p class="text-sm flex-1" style="color: {$colorStore.muted};" aria-live="polite">
      {max !== undefined
        ? m.pokeflux.selectedCountMax({ count: picked.length, max })
        : m.common.selectedCount({ count: picked.length })}
      {#if picked.length}
        <button
          type="button"
          class="ml-2 underline underline-offset-2 hover:opacity-80 outline-none focus-visible:ring-2 rounded"
          style="color: {$colorStore.primary}; --tw-ring-color: {$colorStore.primary};"
          onclick={() => (picked = [])}
        >
          {m.common.clear()}
        </button>
      {/if}
    </p>
    <div class="flex gap-3">
      <button
        type="button"
        class="flex-1 sm:flex-none px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 min-h-[40px] outline-none focus-visible:ring-2"
        style={quietStyle($colorStore)}
        onclick={cancel}
      >
        {m.common.cancel()}
      </button>
      <button
        type="button"
        class="flex-1 sm:flex-none px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 min-h-[40px] outline-none focus-visible:ring-2 disabled:opacity-50"
        style={buttonStyle($colorStore)}
        disabled={!allowEmpty && picked.length === 0}
        onclick={confirm}
      >
        {m.common.confirm()}
      </button>
    </div>
  </div>
{/snippet}
