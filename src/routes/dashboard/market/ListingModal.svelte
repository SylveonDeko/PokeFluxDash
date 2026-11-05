<!--
@component
A market listing in a modal with Buy or Remove. Loads the listing each time it opens.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { buttonStyle, dangerStyle } from "$lib/components/dashboard/styles";
  import AsyncState from "$lib/components/stats/AsyncState.svelte";
  import type { MarketListing, MarketListingDetail } from "$lib/api";
  import {
    Badges,
    displayName,
    EmptyState,
    humanize,
    ivColor,
    Modal,
    MoveCard,
    PokemonSprite,
    StatBars,
    TypeBadge,
    type StatView,
  } from "$lib/components/pokeflux";
  import { formatDate } from "$lib/components/pokeflux";
  import { sellerName } from "./format";

  interface Props {
    open?: boolean;
    /** The listing as the grid knows it, shown while the details load. */
    listing: MarketListing | null;
    userId: string | null;
    onbuy: (listing: MarketListing) => void;
    onremove: (listing: MarketListing) => void;
  }

  let { open = $bindable(false), listing, userId, onbuy, onremove }: Props = $props();

  let detail = $state<MarketListingDetail | null>(null);
  let statView = $state<StatView>("stats");
  let error = $state<string | null>(null);
  let reloadKey = $state(0);

  let shown = $derived(detail?.listing ?? listing);
  let mine = $derived(!!shown && shown.sellerId === userId);

  $effect(() => {
    if (!open || !listing) return;
    void reloadKey;
    const controller = new AbortController();
    detail = null;
    error = null;
    proxyRequest<MarketListingDetail>("GET", `market/${encodeURIComponent(listing.listingId)}`, undefined, controller.signal)
      .then((result) => (detail = result))
      .catch((err) => {
        if (!controller.signal.aborted) error = errorMessage(err);
      });
    return () => controller.abort();
  });

</script>

<Modal bind:open title={shown ? displayName(shown.pokemon) : m.pokefluxMarket.listingTitle()} icon="fa-solid fa-store" size="lg" footer={shown ? footer : undefined}>
  {#if shown}
    {@const pokemon = shown.pokemon}
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex flex-col items-center gap-2 sm:w-40 shrink-0">
        <PokemonSprite src={pokemon.spriteUrl} size={112} eager />
        <div class="flex flex-wrap justify-center gap-1">
          {#each pokemon.types as type (type)}
            <TypeBadge {type} />
          {/each}
        </div>
        <Badges {pokemon} class="justify-center" />
      </div>

      <div class="flex-1 min-w-0 space-y-3">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.price()}</dt>
            <dd class="font-semibold tabular-nums" style="color: {$colorStore.text};">
              {m.pokefluxMarket.amountCredits({ amount: shown.price.toLocaleString() })}
            </dd>
          </div>
          <div>
            <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.seller()}</dt>
            <dd class="font-semibold truncate" style="color: {$colorStore.text};">
              {sellerName(shown)}{#if mine}<span class="font-normal" style="color: {$colorStore.muted};"> · {m.pokefluxMarket.you()}</span>{/if}
            </dd>
          </div>
          <div>
            <dt style="color: {$colorStore.muted};">{m.pokeflux.sortLevel()}</dt>
            <dd class="font-semibold tabular-nums" style="color: {$colorStore.text};">{pokemon.level}</dd>
          </div>
          <div>
            <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.ivTotal()}</dt>
            <dd class="font-semibold tabular-nums" style="color: {ivColor(pokemon.ivPercent)};">{pokemon.ivPercent.toFixed(2)}%</dd>
          </div>
          <div>
            <dt style="color: {$colorStore.muted};">{m.common.nature()}</dt>
            <dd class="font-semibold" style="color: {$colorStore.text};">{detail ? humanize(detail.nature) : "…"}</dd>
          </div>
          <div>
            <dt style="color: {$colorStore.muted};">{m.common.ability()}</dt>
            <dd class="font-semibold" style="color: {$colorStore.text};">{detail ? humanize(detail.ability) : "…"}</dd>
          </div>
          <div>
            <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.listedAt()}</dt>
            <dd class="font-semibold" style="color: {$colorStore.text};">{formatDate(shown.listedAt)}</dd>
          </div>
          {#if pokemon.heldItem}
            <div class="col-span-2">
              <dt style="color: {$colorStore.muted};">{m.common.heldItem()}</dt>
              <dd class="font-semibold" style="color: {$colorStore.text};">{humanize(pokemon.heldItem)}</dd>
            </div>
          {/if}
        </dl>

        {#if error}
          <EmptyState title={m.pokefluxMarket.listingLoadError()} message={error} icon="fa-solid fa-circle-exclamation" compact>
            <button
              type="button"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px]"
              style={buttonStyle($colorStore)}
              onclick={() => reloadKey++}
            >
              <i class="fa-solid fa-rotate-right" style="font-size: 16px;" aria-hidden="true"></i>{m.common.retry()}
            </button>
          </EmptyState>
        {:else if !detail}
          <AsyncState loading children={nothing} />
        {:else}
          <section class="rounded-xl p-3" style="background: {$colorStore.primary}10;">
            <h3 class="text-sm font-semibold mb-2" style="color: {$colorStore.text};">{m.common.stats()}</h3>
            <StatBars ivs={detail.ivs} evs={detail.evs} stats={detail.stats} bind:view={statView} />
          </section>
          <section class="rounded-xl p-3" style="background: {$colorStore.primary}10;">
            <h3 class="text-sm font-semibold mb-2" style="color: {$colorStore.text};">{m.common.moves()}</h3>
            {#if detail.moves.some((move) => move)}
              <ul class="grid sm:grid-cols-2 gap-2">
                {#each detail.moves as move, i (i)}
                  <li><MoveCard {move} slot={i + 1} compact /></li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxMarket.noMoves()}</p>
            {/if}
          </section>
        {/if}
      </div>
    </div>
  {/if}
</Modal>

{#snippet nothing()}{/snippet}

{#snippet footer()}
  {#if shown}
    {@const current = shown}
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <p class="text-sm flex-1 tabular-nums" style="color: {$colorStore.muted};">
        {m.pokefluxMarket.amountCredits({ amount: current.price.toLocaleString() })}
      </p>
      {#if mine}
        <button
          type="button"
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px]"
          style={dangerStyle($colorStore)}
          onclick={() => onremove(current)}
        >
          <i class="fa-solid fa-trash-can" style="font-size: 16px;" aria-hidden="true"></i>{m.pokefluxMarket.removeListing()}
        </button>
      {:else}
        <button
          type="button"
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px]"
          style={buttonStyle($colorStore)}
          onclick={() => onbuy(current)}
        >
          <i class="fa-solid fa-cart-shopping" style="font-size: 16px;" aria-hidden="true"></i>{m.pokefluxMarket.buy()}
        </button>
      {/if}
    </div>
  {/if}
{/snippet}
