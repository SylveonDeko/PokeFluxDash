<script lang="ts">
  import { untrack } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { proxyRequest } from "$lib/api/proxy";
  import type { AdminListing } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import Pagination from "$lib/components/dashboard/Pagination.svelte";
  import { buttonStyle, controlStyle, quietStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import { displayName } from "$lib/components/pokeflux/pokemon";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import ListingTable from "$lib/components/admin/ListingTable.svelte";
  import ReasonDialog from "$lib/components/admin/ReasonDialog.svelte";
  import { hrefWith, SNOWFLAKE_PATTERN } from "$lib/components/admin/query";
  import { hasRank } from "$lib/staff";
  import { MARKET_STATUSES, STATUS_LABELS } from "./statuses";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let form = $state<HTMLFormElement>();
  let statusInput = $state<HTMLInputElement>();
  let removeOpen = $state(false);
  let target = $state<AdminListing | null>(null);
  let fields = $state(untrack(() => fieldsFrom(data.query)));

  $effect(() => {
    fields = fieldsFrom(data.query);
  });

  function fieldsFrom(query: PageData["query"]) {
    return {
      seller: query.seller ?? "",
      buyer: query.buyer ?? "",
      minPrice: query.minPrice?.toString() ?? "",
      maxPrice: query.maxPrice?.toString() ?? "",
    };
  }

  let canRemove = $derived(hasRank(data.staff.staffRank, "Admin"));
  let filtered = $derived(
    data.query.status !== "all" || !!data.query.seller || !!data.query.buyer || data.query.minPrice !== undefined || data.query.maxPrice !== undefined,
  );
  const inputClass = "w-full px-3 py-2 min-h-[38px] rounded-lg border text-sm";

  function askRemove(listing: AdminListing) {
    target = listing;
    removeOpen = true;
  }

  async function remove(reason: string) {
    if (!target) return;
    const result = await proxyRequest("POST", `admin/market/${encodeURIComponent(target.listingId)}/remove`, { reason });
    toast.success(result.message);
    await invalidateAll();
  }
</script>

<DashboardPageLayout title={m.admin.navMarket()} subtitle={m.admin.marketSubtitle()} icon="fa-shop">
  <Panel aria-label={m.admin.filters()}>
    <form bind:this={form} method="GET" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto] gap-2 items-end" data-sveltekit-keepfocus data-sveltekit-noscroll>
      <div class="min-w-0">
        <span id="pf-market-status" class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.colStatus()}</span>
        <input type="hidden" name="status" value={data.query.status} bind:this={statusInput} />
        <DiscordSelector
          type="custom"
          customIcon="fa-filter"
          options={MARKET_STATUSES.map((s) => ({ id: s, name: STATUS_LABELS[s]() }))}
          selected={data.query.status}
          searchable={false}
          ariaLabelledby="pf-market-status"
          onchange={({ selected }) => {
            if (!statusInput || typeof selected !== "string") return;
            statusInput.value = selected;
            form?.requestSubmit();
          }}
        />
      </div>
      <label class="block min-w-0">
        <span class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.sellerId()}</span>
        <input name="seller" bind:value={fields.seller} inputmode="numeric" pattern={SNOWFLAKE_PATTERN} autocomplete="off" class="{inputClass} font-mono" style={controlStyle($colorStore)} />
      </label>
      <label class="block min-w-0">
        <span class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.buyerId()}</span>
        <input name="buyer" bind:value={fields.buyer} inputmode="numeric" pattern={SNOWFLAKE_PATTERN} autocomplete="off" class="{inputClass} font-mono" style={controlStyle($colorStore)} />
      </label>
      <label class="block min-w-0">
        <span class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.minPrice()}</span>
        <input name="minPrice" type="number" min="0" step="1" bind:value={fields.minPrice} class={inputClass} style={controlStyle($colorStore)} />
      </label>
      <label class="block min-w-0">
        <span class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.maxPrice()}</span>
        <input name="maxPrice" type="number" min="0" step="1" bind:value={fields.maxPrice} class={inputClass} style={controlStyle($colorStore)} />
      </label>
      <div class="sm:col-span-2 lg:col-span-1 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {#if filtered}
          <a href={page.url.pathname} class="flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all hover:opacity-80 min-h-[38px]" style={quietStyle($colorStore)}>
            {m.pokefluxPokemon.clearFilters()}
          </a>
        {/if}
        <button type="submit" class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all hover:scale-[1.02] min-h-[38px]" style={buttonStyle($colorStore)}>
          <i class="fa-solid fa-filter" aria-hidden="true"></i>{m.admin.applyFilters()}
        </button>
      </div>
    </form>
  </Panel>

  <StaffState response={data.market}>
    {#snippet children(market)}
      {@const pages = Math.max(1, Math.ceil(market.total / market.pageSize))}
      <Panel icon="fa-solid fa-shop" title={m.admin.listingsCount({ count: market.total.toLocaleString() })}>
        {#if market.items.length === 0}
          <EmptyState
            title={filtered ? m.pokefluxMarket.noMatches() : m.admin.noListings()}
            message={filtered ? m.pokeflux.noResultsHint() : undefined}
            icon="fa-solid fa-store"
          />
        {:else}
          <ListingTable listings={market.items} onremove={canRemove ? askRemove : undefined} />
          {#if pages > 1}
            <Pagination
              class="mt-6"
              page={market.page}
              {pages}
              label={m.admin.navMarket()}
              hrefFor={(p) => hrefWith(page.url, { page: p === 1 ? null : p })}
            />
          {/if}
        {/if}
      </Panel>
    {/snippet}
  </StaffState>
</DashboardPageLayout>

<ReasonDialog
  bind:open={removeOpen}
  title={m.pokefluxMarket.removeConfirmTitle()}
  message={target
    ? m.admin.removeListingMessage({ id: target.listingId, name: target.pokemon ? displayName(target.pokemon) : m.admin.pokemonGone() })
    : ""}
  confirmLabel={m.pokefluxMarket.removeListing()}
  onconfirm={remove}
/>
