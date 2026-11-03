<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { navigating, page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { requestConfirmation } from "$lib/stores/confirmationStore";
  import type { MarketListing } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import Pagination from "$lib/components/dashboard/Pagination.svelte";
  import { buttonStyle, dangerStyle } from "$lib/components/dashboard/styles";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { ConfirmDialog, displayName, EmptyState, LoadingGrid, PokemonCard, POKEMON_GRID } from "$lib/components/pokeflux";
  import ListingModal from "./ListingModal.svelte";
  import SellFlow from "./SellFlow.svelte";
  import { formatDate } from "$lib/components/pokeflux";
  import { sellerName } from "./format";
  import { FILTERS, SORTS } from "./market";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let detailOpen = $state(false);
  let detailListing = $state<MarketListing | null>(null);
  let buyTarget = $state<MarketListing | null>(null);
  let buyOpen = $state(false);
  let sellOpen = $state(false);
  let searchText = $state(untrack(() => data.query.search));
  let searchInput = $state<HTMLInputElement>();
  let form = $state<HTMLFormElement>();
  let sortInput = $state<HTMLInputElement>();
  let filterInput = $state<HTMLInputElement>();
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const value = data.query.search;
    if (untrack(() => document.activeElement !== searchInput)) searchText = value;
  });

  let userId = $derived(data.user?.id ?? null);
  let loading = $derived(!!navigating.to && navigating.to.route.id === page.route.id);
  let filtered = $derived(data.query.search !== "" || data.query.filter !== "all");
  let shortfall = $derived(buyTarget && data.credits !== null ? Math.max(0, buyTarget.price - data.credits) : 0);

  function hrefWith(changes: Record<string, string | number | null>): string {
    const params = new URLSearchParams(page.url.searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : page.url.pathname;
  }

  function submitSoon() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => form?.requestSubmit(), 400);
  }

  function submitWith(input: HTMLInputElement | undefined, value: string | string[] | null) {
    if (!input || typeof value !== "string") return;
    input.value = value;
    form?.requestSubmit();
  }

  function openListing(listing: MarketListing) {
    detailListing = listing;
    detailOpen = true;
  }

  function askBuy(listing: MarketListing) {
    buyTarget = listing;
    buyOpen = true;
  }

  async function askRemove(listing: MarketListing) {
    detailOpen = false;
    const confirmed = await requestConfirmation({
      title: m.pokefluxMarket.removeConfirmTitle(),
      message: m.pokefluxMarket.removeConfirmMessage({ name: displayName(listing.pokemon) }),
      confirmText: m.pokefluxMarket.removeListing(),
    });
    if (!confirmed) return;
    try {
      const result = await proxyRequest("DELETE", `market/${encodeURIComponent(listing.listingId)}`);
      toast.success(result.message);
      await invalidateAll();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function buy() {
    if (!buyTarget) return;
    const result = await proxyRequest("POST", `market/${encodeURIComponent(buyTarget.listingId)}/buy`);
    detailOpen = false;
    toast.success(result.message);
    await invalidateAll();
  }

  async function listed(message: string) {
    toast.success(message);
    if (data.tab === "mine") await invalidateAll();
    else await goto("?tab=mine", { noScroll: true });
  }

  const tabs = $derived([
    { id: "browse", label: m.pokefluxMarket.tabBrowse(), icon: "fa-store" },
    {
      id: "mine",
      label: data.mine.ok ? m.dashboard.myListingsCount({ count: data.mine.data.length }) : m.dashboard.myListings(),
      icon: "fa-tags",
    },
  ]);
  const stats = $derived([
    { label: m.dashboard.activeListings(), value: data.market?.ok ? data.market.data.total : null, tint: $colorStore.primary },
    { label: m.pokefluxMarket.yourCredits(), value: data.credits, tint: $colorStore.secondary },
  ]);
</script>

{#snippet statTiles()}
  <div class="grid grid-cols-2 lg:flex gap-2 shrink-0">
    {#each stats as stat (stat.label)}
      <div class="lg:w-40"><StatTile label={stat.label} value={stat.value} tint={stat.tint} /></div>
    {/each}
  </div>
{/snippet}

<DashboardPageLayout
  title={m.features.market()}
  subtitle={m.dashboard.marketSubtitle()}
  icon="fa-store"
  {tabs}
  activeTab={data.tab}
  ontabChange={({ tabId }) => goto(tabId === "mine" ? "?tab=mine" : page.url.pathname, { noScroll: true, keepFocus: true })}
  actionButtons={[{ label: m.pokefluxMarket.sellPokemon(), icon: "fa-tag", action: () => (sellOpen = true) }]}
>
  {#if data.tab === "browse" && data.market}
    <Panel class="space-y-4" aria-label={m.dashboard.activeListings()}>
    <div class="flex flex-col lg:flex-row lg:items-center gap-2">
    {@render statTiles()}
    <form
      bind:this={form}
      method="GET"
      class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_12rem_11rem] gap-2"
      data-sveltekit-keepfocus
      data-sveltekit-noscroll
      data-sveltekit-replacestate
      role="search"
    >
      <SearchInput
        name="search"
        maxlength={50}
        bind:input={searchInput}
        bind:value={searchText}
        oninput={submitSoon}
        placeholder={m.pokefluxMarket.searchPlaceholder()}
      />
      <div class="min-w-0">
        <input type="hidden" name="sort" value={data.query.sort} bind:this={sortInput} />
        <DiscordSelector
          type="custom"
          customIcon="fa-arrow-down-wide-short"
          options={SORTS.map((option) => ({ id: option.value, name: option.label() }))}
          selected={data.query.sort}
          searchable={false}
          ariaLabel={m.pokeflux.sortLabel()}
          onchange={({ selected }) => submitWith(sortInput, selected)}
        />
      </div>
      <div class="min-w-0">
        <input type="hidden" name="filter" value={data.query.filter} bind:this={filterInput} />
        <DiscordSelector
          type="custom"
          customIcon="fa-filter"
          options={FILTERS.map((option) => ({ id: option.value, name: option.label() }))}
          selected={data.query.filter}
          searchable={false}
          ariaLabel={m.pokeflux.filterLabel()}
          onchange={({ selected }) => submitWith(filterInput, selected)}
        />
      </div>
      <noscript><button type="submit">{m.pokefluxMarket.searchLabel()}</button></noscript>
    </form>
    </div>

    <ApiState response={data.market}>
      {#snippet children(market)}
        {@const pages = Math.max(1, Math.ceil(market.total / market.pageSize))}
        {#if loading}
          <LoadingGrid count={12} />
        {:else if market.items.length === 0}
          <EmptyState
            title={filtered ? m.pokefluxMarket.noMatches() : m.pokefluxMarket.marketEmpty()}
            message={filtered ? m.pokeflux.noResultsHint() : m.pokefluxMarket.marketEmptyHint()}
            icon={filtered ? "fa-solid fa-magnifying-glass" : "fa-solid fa-store"}
          >
            {#if filtered}
              <a href={page.url.pathname} class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]" style={buttonStyle($colorStore)}>
                {m.pokefluxMarket.clearFilters()}
              </a>
            {:else}
              <button type="button" class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]" style={buttonStyle($colorStore)} onclick={() => (sellOpen = true)}>
                {m.pokefluxMarket.sellPokemon()}
              </button>
            {/if}
          </EmptyState>
        {:else}
          <ul class={POKEMON_GRID.regular}>
            {#each market.items as listing (listing.listingId)}
              <li>
                <PokemonCard pokemon={listing.pokemon} onclick={() => openListing(listing)} hideBadges={["marketListed"]}>
                  {@render priceTag(listing)}
                </PokemonCard>
              </li>
            {/each}
          </ul>
        {/if}

        <Pagination
          page={market.page}
          {pages}
          label={m.pokefluxMarket.pagination()}
          hrefFor={(target) => hrefWith({ page: target > 1 ? target : null })}
        />
      {/snippet}
    </ApiState>
    </Panel>
  {:else}
    <Panel class="space-y-4" aria-label={m.dashboard.myListings()}>
    {@render statTiles()}
    <ApiState response={data.mine} notStartedOn404>
      {#snippet children(mine)}
        {#if loading}
          <LoadingGrid count={6} />
        {:else if mine.length === 0}
          <EmptyState title={m.pokefluxMarket.noListings()} message={m.pokefluxMarket.noListingsHint()} icon="fa-solid fa-tags">
            <button type="button" class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]" style={buttonStyle($colorStore)} onclick={() => (sellOpen = true)}>
              {m.pokefluxMarket.sellPokemon()}
            </button>
          </EmptyState>
        {:else}
          <ul class={POKEMON_GRID.regular}>
            {#each mine as listing (listing.listingId)}
              <li>
                <PokemonCard pokemon={listing.pokemon} hideBadges={["marketListed"]}>
                  <p class="text-sm font-semibold tabular-nums" style="color: {$colorStore.text};">
                    <i class="fa-solid fa-coins mr-1" style="color: {$colorStore.primary};" aria-hidden="true"></i>{listing.price.toLocaleString()}
                  </p>
                  <p class="text-[11px]" style="color: {$colorStore.muted};">{m.pokefluxMarket.listedOn({ date: formatDate(listing.listedAt) })}</p>
                  <div class="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      class="px-2 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                      style={buttonStyle($colorStore)}
                      onclick={() => openListing(listing)}
                    >
                      {m.pokefluxMarket.details()}
                    </button>
                    <button
                      type="button"
                      class="px-2 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                      style={dangerStyle($colorStore)}
                      aria-label={m.pokefluxMarket.removeNamed({ name: displayName(listing.pokemon) })}
                      onclick={() => askRemove(listing)}
                    >
                      {m.pokefluxMarket.remove()}
                    </button>
                  </div>
                </PokemonCard>
              </li>
            {/each}
          </ul>
        {/if}
      {/snippet}
    </ApiState>
    </Panel>
  {/if}
</DashboardPageLayout>

{#snippet priceTag(listing: MarketListing)}
  {@const own = listing.sellerId === userId}
  <p class="text-sm font-semibold tabular-nums" style="color: {$colorStore.text};">
    <i class="fa-solid fa-coins mr-1" style="color: {$colorStore.primary};" aria-hidden="true"></i>{listing.price.toLocaleString()}
  </p>
  <p class="text-[11px] truncate" style="color: {$colorStore.muted};">
    {own ? m.pokefluxMarket.yourListing() : m.pokefluxMarket.bySeller({ seller: sellerName(listing) })}
  </p>
{/snippet}

<ListingModal bind:open={detailOpen} listing={detailListing} {userId} onbuy={askBuy} onremove={askRemove} />

<SellFlow bind:open={sellOpen} onlisted={listed} />

<ConfirmDialog
  bind:open={buyOpen}
  variant={shortfall > 0 ? "danger" : "warning"}
  title={m.pokefluxMarket.buyConfirmTitle()}
  message={buyTarget ? m.pokefluxMarket.buyConfirmMessage({ name: displayName(buyTarget.pokemon), seller: sellerName(buyTarget) }) : undefined}
  confirmLabel={m.pokefluxMarket.buy()}
  confirmDisabled={shortfall > 0}
  onconfirm={buy}
>
  {#if buyTarget}
    <dl class="text-sm space-y-1.5 tabular-nums">
      <div class="flex justify-between gap-3">
        <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.price()}</dt>
        <dd class="font-semibold" style="color: {$colorStore.text};">{m.pokefluxMarket.amountCredits({ amount: buyTarget.price.toLocaleString() })}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.yourCredits()}</dt>
        <dd class="font-semibold" style="color: {$colorStore.text};">
          {data.credits === null ? "-" : m.pokefluxMarket.amountCredits({ amount: data.credits.toLocaleString() })}
        </dd>
      </div>
      {#if data.credits !== null && shortfall === 0}
        <div class="flex justify-between gap-3 pt-1.5 border-t" style="border-color: {$colorStore.primary}20;">
          <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.afterPurchase()}</dt>
          <dd class="font-semibold" style="color: {$colorStore.text};">{m.pokefluxMarket.amountCredits({ amount: (data.credits - buyTarget.price).toLocaleString() })}</dd>
        </div>
      {/if}
    </dl>
    {#if shortfall > 0}
      <p class="mt-3 text-sm p-3 rounded-lg" style="background: {$colorStore.accent}10; color: {$colorStore.accent}; border: 1px solid {$colorStore.accent}40;" role="alert">
        {m.pokefluxMarket.cannotAfford({ amount: shortfall.toLocaleString() })}
      </p>
    {/if}
  {/if}
</ConfirmDialog>
