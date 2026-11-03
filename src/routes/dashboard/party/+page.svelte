<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Streamed from "$lib/components/collection/Streamed.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import { buttonStyle, dangerStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { requestConfirmation } from "$lib/stores/confirmationStore";
  import {
    EmptyState,
    LoadingGrid,
    PokemonCard,
    PokemonPicker,
    displayName,
  } from "$lib/components/pokeflux";
  import type { ApiMessage, PartySlot, PokemonCard as Pokemon, SavedParty } from "$lib/api";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const NAME_MAX = 20;
  const SLOT_GRID = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2";

  type PickerTarget = { kind: "current"; slot: PartySlot } | { kind: "saved"; name: string; slot: PartySlot };

  let busy = $state(false);
  let moving = $state<number | null>(null);

  let pickerOpen = $state(false);
  let pickerTarget = $state<PickerTarget | null>(null);
  let pickerExclude = $state<Set<string>>(new Set());

  let savedName = $state<string | null>(null);
  let saved = $state<SavedParty | null>(null);
  let savedError = $state<string | null>(null);
  let savedLoading = $state(false);
  let editing = $state(false);

  let newName = $state("");
  let nameError = $state<string | null>(null);

  const refresh = () => invalidate("pokeflux:party");

  async function mutate(request: () => Promise<ApiMessage>, fallback: string): Promise<boolean> {
    busy = true;
    try {
      let ok = true;
      try {
        const result = await request();
        toast.success(result.message || fallback);
      } catch (err) {
        toast.error(errorMessage(err));
        ok = false;
      }
      await refresh();
      return ok;
    } finally {
      busy = false;
    }
  }

  const setSlot = (slot: PartySlot, pokemonId: string | null) => () => proxyRequest("POST", "party/slot", { slot, pokemonId });
  const setSavedSlot = (name: string, slot: PartySlot, pokemonId: string | null) => () =>
    proxyRequest("POST", `party/saved/${encodeURIComponent(name)}/slot`, { slot, pokemonId });

  function openPicker(target: PickerTarget, slots: (Pokemon | null)[]) {
    pickerTarget = target;
    pickerExclude = new Set(slots.filter((p): p is Pokemon => !!p).map((p) => p.id));
    pickerOpen = true;
  }

  function disabledInPicker(pokemon: Pokemon): boolean | string {
    if (pokemon.name.toLowerCase() === "egg") return m.pokefluxCollection.eggNotAllowed();
    if (pickerExclude.has(pokemon.id)) return m.pokefluxCollection.alreadyInParty();
    return false;
  }

  async function onpick(picked: Pokemon[]) {
    const target = pickerTarget;
    const pokemon = picked[0];
    if (!target || !pokemon) return;
    if (target.kind === "current") {
      await mutate(setSlot(target.slot, pokemon.id), m.pokefluxCollection.slotSet({ slot: target.slot }));
    } else {
      await mutate(setSavedSlot(target.name, target.slot, pokemon.id), m.pokefluxCollection.slotSet({ slot: target.slot }));
      await loadSaved(target.name);
    }
  }

  function clearSlot(slot: PartySlot) {
    return mutate(setSlot(slot, null), m.pokefluxCollection.slotCleared({ slot }));
  }

  async function moveTo(target: number, slots: (Pokemon | null)[]) {
    const from = moving;
    moving = null;
    if (from === null || from === target) return;
    const source = slots[from];
    const other = slots[target];
    if (!source) return;
    const a = (from + 1) as PartySlot;
    const b = (target + 1) as PartySlot;
    await mutate(
      () => proxyRequest("POST", "party/swap", { slotA: a, slotB: b }),
      other ? m.pokefluxCollection.slotsSwapped({ a, b }) : m.pokefluxCollection.slotMoved({ name: displayName(source), slot: b }),
    );
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && moving !== null && !pickerOpen) moving = null;
  }

  async function loadSaved(name: string) {
    savedLoading = true;
    savedError = null;
    let result: SavedParty | null = null;
    let error: string | null = null;
    try {
      result = await proxyRequest<SavedParty>("GET", `party/saved/${encodeURIComponent(name)}`);
    } catch (err) {
      error = errorMessage(err);
    }
    if (savedName !== name) return;
    savedLoading = false;
    saved = result;
    savedError = error;
  }

  function selectSaved(name: string) {
    if (savedName === name) return;
    savedName = name;
    saved = null;
    editing = false;
    void loadSaved(name);
  }

  function validName(names: string[]): string | null {
    const name = newName.trim().toLowerCase();
    if (!name || /\s/.test(name)) {
      nameError = m.pokefluxCollection.nameNoSpaces();
      return null;
    }
    if (name.length > NAME_MAX) {
      nameError = m.pokefluxCollection.nameTooLong({ max: NAME_MAX });
      return null;
    }
    nameError = null;
    if (names.includes(name)) {
      void overwrite(name);
      return null;
    }
    return name;
  }

  async function register(name: string) {
    const ok = await mutate(() => proxyRequest("POST", "party/register", { name }), m.pokefluxCollection.partySaved({ name }));
    if (ok) {
      newName = "";
      savedName = null;
      selectSaved(name);
    }
  }

  async function overwrite(name: string) {
    const confirmed = await requestConfirmation({
      title: m.pokefluxCollection.overwriteTitle(),
      message: m.pokefluxCollection.overwriteMessage({ name }),
      confirmText: m.pokefluxCollection.overwrite(),
      variant: "warning",
    });
    if (confirmed) await register(name);
  }

  async function loadIntoParty() {
    const name = savedName;
    if (!name) return;
    const confirmed = await requestConfirmation({
      title: m.pokefluxCollection.loadTitle(),
      message: m.pokefluxCollection.loadMessage({ name }),
      confirmText: m.pokefluxCollection.load(),
      variant: "warning",
    });
    if (confirmed) await mutate(() => proxyRequest("POST", "party/load", { name }), m.pokefluxCollection.partyLoaded({ name }));
  }

  async function deleteSaved() {
    const name = savedName;
    if (!name) return;
    const confirmed = await requestConfirmation({
      title: m.pokefluxCollection.deleteTitle(),
      message: m.pokefluxCollection.deleteMessage({ name }),
      confirmText: m.pokefluxCollection.delete(),
    });
    if (!confirmed) return;
    if (!(await mutate(() => proxyRequest("POST", "party/deregister", { name }), m.pokefluxCollection.partyDeleted({ name })))) return;
    savedName = null;
    saved = null;
    editing = false;
  }

  async function clearSavedSlot(slot: PartySlot) {
    if (!savedName) return;
    const name = savedName;
    await mutate(setSavedSlot(name, slot, null), m.pokefluxCollection.slotCleared({ slot }));
    await loadSaved(name);
  }

  const softButtonStyle = $derived(`background: ${$colorStore.primary}08; color: ${$colorStore.text};`);
  const primaryButtonStyle = $derived(buttonStyle($colorStore));
  const dangerButtonStyle = $derived(dangerStyle($colorStore));
  const iconButton = "h-9 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-[1.05] disabled:opacity-30";
  const textButton =
    "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl min-h-[38px] text-sm font-medium whitespace-nowrap transition-all hover:scale-[1.02] disabled:opacity-50";
</script>

<svelte:window {onkeydown} />

{#snippet emptySlot(index: number, onadd: (() => void) | null)}
  <div
    class="h-full min-h-[180px] rounded-lg flex flex-col items-center justify-center gap-2 p-3 text-center"
    style="background: {$colorStore.primary}08; border: 1px dashed {$colorStore.primary}40;"
  >
    <i class="fa-solid fa-circle-dot text-xl" style="color: {$colorStore.muted};" aria-hidden="true"></i>
    <p class="text-sm" style="color: {$colorStore.muted};">{m.dashboard.emptySlot({ slot: index + 1 })}</p>
    {#if onadd}
      <button type="button" class={textButton} style={primaryButtonStyle} disabled={busy} onclick={onadd}>
        <i class="fa-solid fa-plus" aria-hidden="true"></i>{m.pokefluxCollection.addPokemon()}
      </button>
    {/if}
  </div>
{/snippet}

<DashboardPageLayout title={m.features.party()} subtitle={m.dashboard.partySubtitle()} icon="fa-users">
  <Streamed promise={data.party} notStartedOn404>
    {#snippet children(party)}
      <Panel icon="fa-solid fa-users" title={m.dashboard.currentParty()}>
        {#snippet badge()}
          <span class="text-sm font-normal ml-1" style="color: {$colorStore.muted};">
            {m.pokefluxCollection.partyFilled({ count: party.slots.filter(Boolean).length })}
          </span>
        {/snippet}
        {#snippet actions()}
          {#if moving !== null}
            <div class="flex items-center gap-2 text-sm" role="status" style="color: {$colorStore.text};">
              <i class="fa-solid fa-arrows-left-right" style="color: {$colorStore.primary};" aria-hidden="true"></i>
              {m.pokefluxCollection.movingHint({ slot: moving + 1 })}
              <button type="button" class={textButton} style={softButtonStyle} onclick={() => (moving = null)}>{m.common.cancel()}</button>
            </div>
          {/if}
        {/snippet}

        <ol class={SLOT_GRID} aria-busy={busy}>
          {#each party.slots as pokemon, index (index)}
            {@const slot = (index + 1) as PartySlot}
            <li class="relative flex flex-col gap-1.5 min-w-0">
              <div class="flex items-center justify-between text-xs px-1 min-h-6">
                <span class="font-semibold uppercase tracking-wide" style="color: {$colorStore.muted};">{m.pokefluxCollection.slotLabel({ slot })}</span>
                {#if pokemon?.selected}
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium" style="background: {$colorStore.primary}20; color: {$colorStore.primary};">
                    <i class="fa-solid fa-star text-[10px]" aria-hidden="true"></i>{m.pokefluxCollection.selected()}
                  </span>
                {/if}
              </div>

              {#if pokemon}
                <PokemonCard {pokemon} hideBadges={["inParty", "selected"]} class={pokemon.selected ? "ring-2" : ""}>
                  <div class="grid grid-cols-4 gap-1">
                    <a href="/dashboard/pokemon/{pokemon.id}" class={iconButton} style={softButtonStyle} aria-label={m.pokefluxCollection.detailsOf({ name: displayName(pokemon) })} title={m.pokefluxCollection.viewDetails()}>
                      <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                    </a>
                    <button type="button" class={iconButton} style={softButtonStyle} disabled={busy || moving !== null} aria-label={m.pokefluxCollection.replaceSlot({ slot })} title={m.pokefluxCollection.replace()} onclick={() => openPicker({ kind: "current", slot }, party.slots)}>
                      <i class="fa-solid fa-right-left" aria-hidden="true"></i>
                    </button>
                    <button type="button" class={iconButton} style={softButtonStyle} disabled={busy || moving !== null} aria-label={m.pokefluxCollection.moveSlot({ slot })} title={m.pokefluxCollection.move()} onclick={() => (moving = index)}>
                      <i class="fa-solid fa-arrows-up-down-left-right" aria-hidden="true"></i>
                    </button>
                    <button type="button" class={iconButton} style={dangerButtonStyle} disabled={busy || moving !== null} aria-label={m.pokefluxCollection.clearSlot({ slot })} title={m.pokefluxCollection.clear()} onclick={() => clearSlot(slot)}>
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                  </div>
                </PokemonCard>
              {:else}
                {@render emptySlot(index, moving === null ? () => openPicker({ kind: "current", slot }, party.slots) : null)}
              {/if}

              {#if moving !== null}
                {#if moving === index}
                  <div class="absolute inset-x-0 bottom-0 top-7 rounded-xl pointer-events-none" style="border: 1px dashed {$colorStore.primary}40;"></div>
                {:else}
                  <button
                    type="button"
                    class="absolute inset-x-0 bottom-0 top-7 rounded-xl flex flex-col items-center justify-center gap-1 text-sm font-medium backdrop-blur-[2px] transition-all disabled:opacity-50"
                    style="background: {$colorStore.background}b3; color: {$colorStore.primary}; border: 1px solid {$colorStore.primary}30;"
                    disabled={busy}
                    onclick={() => moveTo(index, party.slots)}
                  >
                    <i class="fa-solid {pokemon ? 'fa-right-left' : 'fa-arrow-down'} text-lg" style="color: {$colorStore.primary};" aria-hidden="true"></i>
                    {pokemon ? m.pokefluxCollection.swapHere({ slot }) : m.pokefluxCollection.moveHere({ slot })}
                  </button>
                {/if}
              {/if}
            </li>
          {/each}
        </ol>
      </Panel>


      <Panel icon="fa-solid fa-floppy-disk" title={m.pokefluxCollection.savedPartiesTitle()}>
        <div class="grid grid-cols-1 {party.saved.length ? 'lg:grid-cols-[280px_1fr]' : ''} gap-4">
          <div class="space-y-3 min-w-0 {party.saved.length ? '' : 'max-w-md'}">
            <form
              class="space-y-2"
              onsubmit={(event) => {
                event.preventDefault();
                const name = validName(party.saved);
                if (name) void register(name);
              }}
            >
              <label for="party-name" class="flex items-center gap-2 text-sm font-medium" style="color: {$colorStore.text}">
                <i class="fa-solid fa-tag" style="color: {$colorStore.primary}; font-size: 16px;" aria-hidden="true"></i>{m.pokefluxCollection.saveCurrentAs()}</label>
              <div class="flex gap-2">
                <input
                  id="party-name"
                  type="text"
                  bind:value={newName}
                  maxlength={NAME_MAX}
                  autocomplete="off"
                  spellcheck="false"
                  placeholder={m.pokefluxCollection.namePlaceholder()}
                  aria-invalid={!!nameError}
                  aria-describedby="party-name-hint"
                  class="flex-1 min-w-0 px-3 py-2 min-h-[38px] rounded-lg border focus:ring-2 text-sm"
                  style="background: {$colorStore.primary}08; border-color: {nameError ? $colorStore.accent : `${$colorStore.primary}30`}; color: {$colorStore.text}"
                />
                <button type="submit" class={textButton} style={primaryButtonStyle} disabled={busy || !newName.trim()}>
                  <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>{m.common.save()}
                </button>
              </div>
              <p id="party-name-hint" class="text-xs" style="color: {nameError ? $colorStore.accent : $colorStore.muted};" role={nameError ? "alert" : undefined}>
                {nameError ?? m.pokefluxCollection.nameHint({ max: NAME_MAX })}
              </p>
            </form>

            {#if party.saved.length}
              <ul class="flex flex-wrap lg:flex-col gap-2" aria-label={m.pokefluxCollection.savedPartiesTitle()}>
                {#each party.saved as name (name)}
                  {@const active = savedName === name}
                  <li class="lg:w-full">
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left min-h-[38px] transition-all"
                      style="background: {active ? $colorStore.primary + '20' : $colorStore.primary + '08'};"
                      aria-pressed={active}
                      onclick={() => selectSaved(name)}
                    >
                      <i class="fa-solid fa-users text-xs w-5 text-center" style="color: {$colorStore.primary};" aria-hidden="true"></i>
                      <span class="truncate flex-1 text-sm font-medium" style="color: {active ? $colorStore.primary : $colorStore.text}">{name}</span>
                      <i class="fa-solid fa-chevron-right text-xs hidden lg:inline" style="color: {$colorStore.muted};" aria-hidden="true"></i>
                    </button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxCollection.noSavedParties()}</p>
            {/if}
          </div>

          {#if party.saved.length}
          <div class="min-w-0" aria-live="polite">
            {#if !savedName || !party.saved.includes(savedName)}
              <EmptyState title={m.pokefluxCollection.pickSavedTitle()} message={m.pokefluxCollection.pickSavedHint()} icon="fa-solid fa-users-viewfinder" compact />
            {:else if savedError}
              <EmptyState title={m.pokefluxCollection.savedLoadError()} message={savedError} icon="fa-solid fa-circle-exclamation">
                <button type="button" class={textButton} style={primaryButtonStyle} onclick={() => savedName && loadSaved(savedName)}>
                  <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>{m.common.retry()}
                </button>
              </EmptyState>
            {:else if !saved}
              <LoadingGrid count={6} size="compact" gridClass="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2" />
            {:else}
              {@const current = saved}
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <h3 class="font-semibold flex-1 truncate" style="color: {$colorStore.text};">
                  {current.name}
                  <span class="text-sm font-normal ml-1" style="color: {$colorStore.muted};">{m.pokefluxCollection.partyFilled({ count: current.slots.filter(Boolean).length })}</span>
                </h3>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class={textButton} style={primaryButtonStyle} disabled={busy} onclick={loadIntoParty}>
                    <i class="fa-solid fa-download" aria-hidden="true"></i>{m.pokefluxCollection.load()}
                  </button>
                  <button type="button" class={textButton} style={softButtonStyle} disabled={busy} aria-pressed={editing} onclick={() => (editing = !editing)}>
                    <i class="fa-solid {editing ? 'fa-check' : 'fa-pen'}" aria-hidden="true"></i>{editing ? m.pokefluxCollection.doneEditing() : m.pokefluxCollection.edit()}
                  </button>
                  <button type="button" class={textButton} style={dangerButtonStyle} disabled={busy} onclick={deleteSaved}>
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>{m.pokefluxCollection.delete()}
                  </button>
                </div>
              </div>

              <ol class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 transition-opacity" class:opacity-60={savedLoading} aria-busy={savedLoading}>
                {#each current.slots as pokemon, index (index)}
                  {@const slot = (index + 1) as PartySlot}
                  <li class="flex items-stretch gap-2 min-w-0">
                    <div class="flex-1 min-w-0">
                      {#if pokemon}
                        <PokemonCard {pokemon} size="compact" href="/dashboard/pokemon/{pokemon.id}" hideBadges={["inParty"]} />
                      {:else}
                        <div class="h-full min-h-[72px] rounded-xl border flex items-center justify-center text-sm" style="background: {$colorStore.primary}05; border-color: {$colorStore.primary}20; color: {$colorStore.muted};">
                          {m.dashboard.emptySlot({ slot })}
                        </div>
                      {/if}
                    </div>
                    {#if editing}
                      <div class="flex flex-col gap-1 w-10 shrink-0">
                        <button type="button" class="{iconButton} flex-1" style={softButtonStyle} disabled={busy} aria-label={pokemon ? m.pokefluxCollection.replaceSlot({ slot }) : m.pokefluxCollection.fillSlot({ slot })} title={pokemon ? m.pokefluxCollection.replace() : m.pokefluxCollection.addPokemon()} onclick={() => openPicker({ kind: "saved", name: current.name, slot }, current.slots)}>
                          <i class="fa-solid {pokemon ? 'fa-right-left' : 'fa-plus'}" aria-hidden="true"></i>
                        </button>
                        {#if pokemon}
                          <button type="button" class="{iconButton} flex-1" style={dangerButtonStyle} disabled={busy} aria-label={m.pokefluxCollection.clearSlot({ slot })} title={m.pokefluxCollection.clear()} onclick={() => clearSavedSlot(slot)}>
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                          </button>
                        {/if}
                      </div>
                    {/if}
                  </li>
                {/each}
              </ol>
            {/if}
          </div>
          {/if}
        </div>
      </Panel>
    {/snippet}
  </Streamed>
</DashboardPageLayout>

<PokemonPicker
  bind:open={pickerOpen}
  title={pickerTarget ? m.pokefluxCollection.pickForSlot({ slot: pickerTarget.slot }) : undefined}
  isDisabled={disabledInPicker}
  {onpick}
/>
