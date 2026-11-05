<!--
@component
Picks a move slot and a move from the Pokémon's learnset, then teaches it.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { Learnset, MoveDetails, MoveSlot } from "$lib/api";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { buttonStyle, chipStyle, quietStyle } from "$lib/components/dashboard/styles";
  import { EmptyState, Modal, MoveCard, humanize } from "$lib/components/pokeflux";
  import MoveFilters from "$lib/components/pokeflux/MoveFilters.svelte";
  import { MoveFilter } from "$lib/components/pokeflux/moveFilter.svelte";

  interface Props {
    open?: boolean;
    pokemonId: string;
    moves: (MoveDetails | null)[];
    slot?: MoveSlot;
    onlearned?: (message: string) => void;
  }

  let { open = $bindable(false), pokemonId, moves, slot = $bindable(1), onlearned }: Props = $props();

  const SLOTS: MoveSlot[] = [1, 2, 3, 4];

  let learnset = $state<Learnset | null>(null);
  let loadedFor = $state<string | null>(null);
  let loadError = $state<string | null>(null);
  let reloadKey = $state(0);
  let chosen = $state<MoveDetails | null>(null);
  let busy = $state(false);
  let error = $state<string | null>(null);

  const filter = new MoveFilter(() => learnset ?? []);

  let known = $derived(new Set(moves.filter((move): move is MoveDetails => !!move).map((move) => move.name)));
  let current = $derived(moves[slot - 1] ?? null);
  let shown = $derived(filter.shown);

  $effect(() => {
    if (!open) return;
    untrack(() => {
      chosen = null;
      error = null;
      filter.search = "";
    });
  });

  $effect(() => {
    if (!open) return;
    void reloadKey;
    const id = pokemonId;
    if (untrack(() => loadedFor) === id && untrack(() => learnset)) return;
    const controller = new AbortController();
    learnset = null;
    loadError = null;
    proxyRequest<Learnset>("GET", `pokemon/${encodeURIComponent(id)}/learnset`, undefined, controller.signal)
      .then((result) => {
        learnset = result;
        loadedFor = id;
      })
      .catch((err) => {
        if (!controller.signal.aborted) loadError = errorMessage(err);
      });
    return () => controller.abort();
  });

  async function teach() {
    if (!chosen) return;
    busy = true;
    error = null;
    try {
      const result = await proxyRequest("POST", `pokemon/${encodeURIComponent(pokemonId)}/moves`, {
        slot,
        move: chosen.name,
      });
      loadedFor = null;
      open = false;
      onlearned?.(result.message);
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

</script>

<Modal bind:open title={m.pokefluxPokemon.learnTitle()} icon="fa-solid fa-book-sparkles" size="xl" locked={busy}>
  <div class="space-y-4">
    <fieldset>
      <legend class="block text-sm font-medium mb-2" style="color: {$colorStore.text};">{m.pokefluxPokemon.learnSlot()}</legend>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {#each SLOTS as value (value)}
          {@const move = moves[value - 1] ?? null}
          {@const active = slot === value}
          <label
            class="relative rounded-xl px-3 py-2 cursor-pointer transition-all hover:scale-[1.02] has-[:focus-visible]:ring-2"
            style={chipStyle($colorStore, active)}
          >
            <input type="radio" class="sr-only" name="learn-slot" {value} checked={active} onchange={() => (slot = value)} />
            <span class="block text-xs" style="color: {active ? $colorStore.primary : $colorStore.muted};">{m.common.slotLabel({ slot: value })}</span>
            <span class="block text-sm font-medium truncate" style="color: {active ? $colorStore.primary : $colorStore.text};">
              {move ? humanize(move.name) : m.pokeflux.emptyMoveSlot()}
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <MoveFilters {filter} autofocus />

    {#if loadError}
      <EmptyState title={m.pokefluxPokemon.learnsetError()} message={loadError} icon="fa-solid fa-circle-exclamation" compact>
        <button
          type="button"
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px] outline-none focus-visible:ring-2"
          style={buttonStyle($colorStore)}
          onclick={() => reloadKey++}
        >
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>{m.common.retry()}
        </button>
      </EmptyState>
    {:else if !learnset}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="status" aria-busy="true">
        <span class="sr-only">{m.pokeflux.loading()}</span>
        {#each { length: 6 }, i (i)}
          <div class="h-[104px] rounded-xl animate-pulse motion-reduce:animate-none" style="background: {$colorStore.primary}10;" aria-hidden="true"></div>
        {/each}
      </div>
    {:else if shown.length === 0}
      <EmptyState title={m.pokefluxPokemon.learnNoMatch()} icon="fa-solid fa-magnifying-glass" compact />
    {:else}
      <p class="text-xs" style="color: {$colorStore.muted};" aria-live="polite">{m.pokefluxPokemon.learnCount({ shown: shown.length, total: learnset.length })}</p>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {#each shown as move (move.name)}
          <li class="relative">
            <MoveCard {move} compact active={chosen?.name === move.name} onselect={(picked) => (chosen = picked)} />
            {#if known.has(move.name)}
              <span
                class="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none"
                style="background: {$colorStore.primary}15; border: 1px solid {$colorStore.primary}30; color: {$colorStore.primary};"
              >{m.pokefluxPokemon.known()}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#snippet footer()}
    <div class="flex flex-col md:flex-row md:items-center gap-3">
      <div class="flex-1 min-w-0 text-sm" style="color: {$colorStore.muted};" aria-live="polite">
        {#if error}
          <p class="p-3 rounded-xl" style="background: {$colorStore.accent}10; border: 1px solid {$colorStore.accent}40; color: {$colorStore.accent};" role="alert">{error}</p>
        {:else if chosen}
          {m.pokefluxPokemon.learnSummary({
            current: current ? humanize(current.name) : m.pokeflux.emptyMoveSlot(),
            move: humanize(chosen.name),
            slot,
          })}
        {:else}
          {m.pokefluxPokemon.learnPick()}
        {/if}
      </div>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[40px] outline-none focus-visible:ring-2 disabled:opacity-50"
          style={quietStyle($colorStore)}
          disabled={busy}
          onclick={() => (open = false)}
        >
          {m.common.cancel()}
        </button>
        <button
          type="button"
          class="flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[40px] outline-none focus-visible:ring-2 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          style={buttonStyle($colorStore)}
          disabled={!chosen || busy}
          aria-busy={busy}
          onclick={teach}
        >
          {#if busy}
            <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>{m.pokeflux.working()}
          {:else}
            <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>{m.pokefluxPokemon.learnConfirm()}
          {/if}
        </button>
      </div>
    </div>
  {/snippet}
</Modal>
