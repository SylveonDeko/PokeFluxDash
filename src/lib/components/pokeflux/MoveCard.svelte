<!--
@component
A move with its type, category, power, accuracy and PP. Null renders an empty slot. With `onselect`
the card is a button, for picking moves from a learnset.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { MoveDetails } from "$lib/api";
  import TypeBadge from "./TypeBadge.svelte";
  import { humanize, normalizeType, TYPE_COLORS } from "./pokemon";

  interface Props {
    move: MoveDetails | null;
    /** Shown as a small number in the corner, 1 to 4. */
    slot?: number;
    compact?: boolean;
    active?: boolean;
    disabled?: boolean;
    onselect?: (move: MoveDetails) => void;
    class?: string;
  }

  let { move, slot, compact = false, active = false, disabled = false, onselect, class: className = "" }: Props = $props();

  const CATEGORIES: Record<string, { icon: string; color: string; label: () => string }> = {
    physical: { icon: "fa-burst", color: "#f97316", label: m.pokeflux.categoryPhysical },
    special: { icon: "fa-bullseye", color: "#3b82f6", label: m.pokeflux.categorySpecial },
    status: { icon: "fa-circle-half-stroke", color: "#a3a3a3", label: m.pokeflux.categoryStatus },
  };

  let category = $derived(move ? CATEGORIES[String(move.category).toLowerCase()] : undefined);
  let accent = $derived.by(() => {
    const type = normalizeType(move?.type);
    return type ? TYPE_COLORS[type].bg : $colorStore.primary;
  });
</script>

{#snippet body(move: MoveDetails)}
  <div class="flex items-start justify-between gap-2">
    <div class="min-w-0">
      <p class="font-semibold truncate text-sm" style="color: {$colorStore.text};">
        {humanize(move.name)}
      </p>
      <div class="flex flex-wrap items-center gap-1.5 mt-1">
        <TypeBadge type={move.type} size="xs" />
        {#if category}
          <span class="inline-flex items-center gap-1 text-[11px] font-medium" style="color: {category.color};">
            <i class="fa-solid {category.icon}" aria-hidden="true"></i>{category.label()}
          </span>
        {/if}
      </div>
    </div>
    {#if slot}
      <span class="text-[10px] font-bold tabular-nums opacity-60" style="color: {$colorStore.muted};">{slot}</span>
    {/if}
  </div>
  <dl class="grid grid-cols-3 gap-1 text-center mt-2">
    <div class="rounded-lg py-1" style="background: {$colorStore.primary}10;">
      <dt class="text-[10px] uppercase tracking-wide" style="color: {$colorStore.muted};">{m.pokeflux.power()}</dt>
      <dd class="text-sm font-semibold tabular-nums" style="color: {$colorStore.text};">{move.power ?? "-"}</dd>
    </div>
    <div class="rounded-lg py-1" style="background: {$colorStore.primary}10;">
      <dt class="text-[10px] uppercase tracking-wide" style="color: {$colorStore.muted};">{m.pokeflux.accuracy()}</dt>
      <dd class="text-sm font-semibold tabular-nums" style="color: {$colorStore.text};">
        {#if move.accuracy === null}
          <span title={m.pokeflux.neverMisses()}>∞<span class="sr-only"> {m.pokeflux.neverMisses()}</span></span>
        {:else}
          {move.accuracy}%
        {/if}
      </dd>
    </div>
    <div class="rounded-lg py-1" style="background: {$colorStore.primary}10;">
      <dt class="text-[10px] uppercase tracking-wide" style="color: {$colorStore.muted};">{m.pokeflux.pp()}</dt>
      <dd class="text-sm font-semibold tabular-nums" style="color: {$colorStore.text};">{move.pp}</dd>
    </div>
  </dl>
{/snippet}

{#if !move}
  <div
    class="rounded-xl border border-dashed flex items-center justify-center text-sm {compact ? 'p-2 min-h-[80px]' : 'p-2.5 min-h-[92px]'} {className}"
    style="border-color: {$colorStore.primary}30; color: {$colorStore.muted};"
  >
    {#if slot}<span class="mr-1 font-semibold tabular-nums">{slot}.</span>{/if}{m.pokeflux.emptyMoveSlot()}
  </div>
{:else if onselect}
  <button
    type="button"
    class="w-full text-left rounded-xl border transition-all outline-none focus-visible:ring-2 hover:scale-[1.02] motion-reduce:hover:scale-100 disabled:opacity-50 disabled:pointer-events-none {compact ? 'p-2' : 'p-2.5'} {className}"
    style="background: {active ? `${$colorStore.primary}20` : `${$colorStore.primary}05`}; border-color: {active ? `${$colorStore.primary}40` : `${$colorStore.primary}20`}; --tw-ring-color: {accent};"
    aria-pressed={active}
    {disabled}
    onclick={() => onselect(move)}
  >
    {@render body(move)}
  </button>
{:else}
  <div
    class="rounded-xl border {compact ? 'p-2' : 'p-2.5'} {className}"
    style="background: {$colorStore.primary}05; border-color: {$colorStore.primary}20;"
  >
    {@render body(move)}
  </div>
{/if}
