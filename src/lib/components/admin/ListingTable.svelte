<!--
@component
Market listings as staff see them, with a remove button on active listings when `onremove` is set.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { AdminListing } from "$lib/api";
  import { dangerStyle } from "$lib/components/dashboard/styles";
  import PokemonSprite from "$lib/components/pokeflux/PokemonSprite.svelte";
  import { displayName } from "$lib/components/pokeflux/pokemon";
  import DataTable from "./DataTable.svelte";
  import UserRef from "./UserRef.svelte";
  import { formatDateTime, LISTING_STATUSES } from "./format";

  interface Props {
    listings: AdminListing[];
    onremove?: (listing: AdminListing) => void;
  }

  let { listings, onremove }: Props = $props();

  const columns = $derived([
    m.pokefluxMarket.listingTitle(),
    m.features.pokemon(),
    m.pokefluxMarket.price(),
    m.admin.colStatus(),
    m.pokefluxMarket.seller(),
    m.admin.colBuyer(),
    m.pokefluxMarket.listedAt(),
    ...(onremove ? [m.admin.colActions()] : []),
  ]);

  const statusColor = (status: AdminListing["status"]) =>
    status === "active" ? $colorStore.primary : status === "sold" ? "#22c55e" : $colorStore.muted;
</script>

{#snippet pokemon(l: AdminListing)}
  {#if l.pokemon}
    <span class="flex items-center gap-2 min-w-0">
      <PokemonSprite src={l.pokemon.spriteUrl} size={36} />
      <span class="min-w-0">
        <span class="block font-medium truncate" style="color: {$colorStore.text};">{displayName(l.pokemon)}</span>
        <span class="block text-xs tabular-nums" style="color: {$colorStore.muted};">
          {m.pokeflux.levelShort({ level: l.pokemon.level })} · {l.pokemon.ivPercent.toFixed(2)}%
        </span>
      </span>
    </span>
  {:else}
    <span style="color: {$colorStore.muted};">{m.admin.pokemonGone()}</span>
  {/if}
{/snippet}

{#snippet status(l: AdminListing)}
  <span class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium" style="background: {statusColor(l.status)}20; color: {statusColor(l.status)};">
    {LISTING_STATUSES[l.status]()}
  </span>
{/snippet}

{#snippet remove(l: AdminListing)}
  {#if onremove && l.status === "active"}
    <button
      type="button"
      class="rounded-lg px-3 min-h-[36px] text-xs font-medium transition-all hover:opacity-80"
      style={dangerStyle($colorStore)}
      onclick={() => onremove?.(l)}
    >
      {m.pokefluxMarket.removeListing()}
    </button>
  {/if}
{/snippet}

<DataTable rows={listings} key={(l) => l.listingId} {columns} caption={m.admin.navMarket()}>
  {#snippet row(l)}
    <td class="px-3 py-2 font-mono" style="color: {$colorStore.muted};">#{l.listingId}</td>
    <td class="px-3 py-2">{@render pokemon(l)}</td>
    <td class="px-3 py-2 tabular-nums whitespace-nowrap" style="color: {$colorStore.text};">{m.pokefluxMarket.amountCredits({ amount: l.price.toLocaleString() })}</td>
    <td class="px-3 py-2">{@render status(l)}</td>
    <td class="px-3 py-2"><UserRef user={l.seller} /></td>
    <td class="px-3 py-2">{#if l.buyer}<UserRef user={l.buyer} />{:else}<span style="color: {$colorStore.muted};">-</span>{/if}</td>
    <td class="px-3 py-2 whitespace-nowrap" style="color: {$colorStore.muted};">{formatDateTime(l.listedAt)}</td>
    {#if onremove}<td class="px-3 py-2 text-right">{@render remove(l)}</td>{/if}
  {/snippet}
  {#snippet card(l)}
    <div class="flex items-center justify-between gap-2">
      <span class="font-mono text-sm" style="color: {$colorStore.muted};">#{l.listingId}</span>
      {@render status(l)}
    </div>
    <div class="mt-2">{@render pokemon(l)}</div>
    <p class="mt-2 text-sm font-semibold tabular-nums" style="color: {$colorStore.text};">{m.pokefluxMarket.amountCredits({ amount: l.price.toLocaleString() })}</p>
    <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
      <div>
        <p class="text-xs" style="color: {$colorStore.muted};">{m.pokefluxMarket.seller()}</p>
        <UserRef user={l.seller} />
      </div>
      {#if l.buyer}
        <div>
          <p class="text-xs" style="color: {$colorStore.muted};">{m.admin.colBuyer()}</p>
          <UserRef user={l.buyer} />
        </div>
      {/if}
    </div>
    <p class="mt-2 text-xs" style="color: {$colorStore.muted};">{formatDateTime(l.listedAt)}</p>
    {#if onremove && l.status === "active"}<div class="mt-3">{@render remove(l)}</div>{/if}
  {/snippet}
</DataTable>
