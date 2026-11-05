<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Streamed from "$lib/components/collection/Streamed.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle, dangerStyle } from "$lib/components/dashboard/styles";
  import Meter from "$lib/components/collection/Meter.svelte";
  import Countdown from "$lib/components/collection/Countdown.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import {
    EmptyState,
    PokemonCard,
    PokemonPicker,
    PokemonSprite,
    POKEMON_GRID,
    displayName,
  } from "$lib/components/pokeflux";
  import type {
    ApiMessage,
    BreedingFemalesResponse,
    Hatchery,
    HatcheryGroupNumber,
    PokemonCard as Pokemon,
  } from "$lib/api";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const SLOT_GRID = "grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-10 gap-2";

  let busy = $state(false);
  let eggPickerOpen = $state(false);
  let eggTarget = $state<{ group: HatcheryGroupNumber; slot: number } | null>(null);
  let incubating = $state<Set<string>>(new Set());

  let femalePickerOpen = $state(false);
  let currentFemales = $state<Pokemon[]>([]);

  const refresh = () => invalidate("pokeflux:hatchery");

  const isEgg = (pokemon: Pick<Pokemon, "name">) => pokemon.name.trim().toLowerCase() === "egg";

  function openEggPicker(group: HatcheryGroupNumber, slot: number, hatchery: Hatchery) {
    eggTarget = { group, slot };
    incubating = new Set(hatchery.flatMap((g) => g.slots).flatMap((s) => (s.egg ? [s.egg.id] : [])));
    eggPickerOpen = true;
  }

  function eggDisabled(pokemon: Pokemon): boolean | string {
    if (!isEgg(pokemon)) return m.pokefluxCollection.notAnEgg();
    if (incubating.has(pokemon.id)) return m.pokefluxCollection.alreadyIncubating();
    return false;
  }

  async function mutate(request: () => Promise<ApiMessage>, fallback: string) {
    busy = true;
    try {
      try {
        const result = await request();
        toast.success(result.message || fallback);
      } catch (err) {
        toast.error(errorMessage(err));
      }
      await refresh();
    } finally {
      busy = false;
    }
  }

  function placeEgg(picked: Pokemon[]) {
    const target = eggTarget;
    const egg = picked[0];
    if (!target || !egg) return;
    void mutate(
      () => proxyRequest("POST", `hatchery/${target.group}/slot/${target.slot}`, { pokemonId: egg.id }),
      m.pokefluxCollection.eggPlaced({ group: target.group, slot: target.slot }),
    );
  }

  function removeEgg(group: HatcheryGroupNumber, slot: number) {
    void mutate(() => proxyRequest("DELETE", `hatchery/${group}/slot/${slot}`), m.pokefluxCollection.eggRemoved({ group, slot }));
  }

  function openFemalePicker(females: Pokemon[]) {
    currentFemales = females;
    femalePickerOpen = true;
  }

  async function setFemales(picked: Pokemon[]) {
    busy = true;
    try {
      try {
        const result = await proxyRequest<BreedingFemalesResponse>("POST", "breeding/females", { pokemonIds: picked.map((p) => p.id) });
        if (picked.length > 0 && result.valid.length === 0) toast.error(result.message);
        else toast.success(result.message);
      } catch (err) {
        toast.error(errorMessage(err));
      }
      await refresh();
    } finally {
      busy = false;
    }
  }

  const textButton =
    "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl min-h-[36px] text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50";
</script>

<DashboardPageLayout title={m.features.hatchery()} subtitle={m.dashboard.hatcherySubtitle()} icon="fa-heart">
  <Streamed promise={data.hatchery} notStartedOn404>
    {#snippet children(hatchery)}
      {#each hatchery as group (group.group)}
        {@const used = group.slots.filter((s) => s.egg).length}
        <Panel icon="fa-solid fa-egg" title={m.dashboard.hatcheryGroup({ group: group.group })}>
          {#snippet actions()}
            <span class="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium" style="background: {$colorStore.secondary}20; color: {$colorStore.secondary}" title={m.pokefluxCollection.speedHint({ speed: group.speedModifier })}>
              <i class="fa-solid fa-gauge-high" aria-hidden="true"></i>{m.dashboard.speedModifier({ speed: group.speedModifier })}
            </span>
            <span class="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium" style="background: {$colorStore.primary}20; color: {$colorStore.primary}">
              <i class="fa-solid fa-egg" aria-hidden="true"></i>{m.dashboard.eggsInGroup({ count: used, limit: group.maxSlots })}
            </span>
          {/snippet}

          <ol class={SLOT_GRID} aria-busy={busy}>
            {#each group.slots as slot (slot.slot)}
              <li class="min-w-0">
                {#if !slot.unlocked}
                  <div class="h-full min-h-[84px] rounded-lg border flex flex-col items-center justify-center gap-0.5 p-2 text-center opacity-60" style="background: {$colorStore.primary}05; border-color: {$colorStore.primary}20;">
                    <i class="fa-solid fa-lock text-sm" style="color: {$colorStore.muted};" aria-hidden="true"></i>
                    <p class="text-xs font-semibold" style="color: {$colorStore.muted};">{m.common.slotLabel({ slot: slot.slot })}</p>
                    <p class="text-xs" style="color: {$colorStore.muted};">{m.common.locked()}</p>
                  </div>
                {:else if slot.egg}
                  {@const egg = slot.egg}
                  {@const total = Math.max(slot.totalSteps, slot.counter, 1)}
                  <div class="h-full min-h-[84px] rounded-lg border flex flex-col items-center gap-1 p-2 text-center" style="background: {$colorStore.primary}10; border-color: {$colorStore.primary}30;">
                    <div class="flex items-center justify-between w-full text-[11px]">
                      <span class="font-semibold" style="color: {$colorStore.muted};">{m.common.slotLabel({ slot: slot.slot })}</span>
                      <button
                        type="button"
                        class="w-7 h-7 -m-1 rounded-lg flex items-center justify-center transition-all hover:scale-[1.05] disabled:opacity-50"
                        style={dangerStyle($colorStore)}
                        disabled={busy}
                        aria-label={m.pokefluxCollection.removeEggFrom({ group: group.group, slot: slot.slot })}
                        title={m.pokefluxCollection.removeEgg()}
                        onclick={() => removeEgg(group.group, slot.slot)}
                      >
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                      </button>
                    </div>
                    <PokemonSprite src={egg.spriteUrl} size={44} />
                    <p class="text-sm font-semibold truncate w-full" style="color: {$colorStore.text};">{displayName(egg)}</p>
                    <Meter
                      value={total - slot.counter}
                      max={total}
                      label={m.pokefluxCollection.hatchProgress()}
                      valueText={m.pokefluxCollection.stepsLeftOf({ steps: slot.counter.toLocaleString(), total: total.toLocaleString() })}
                      hideLabel
                      size="sm"
                      color={$colorStore.primary}
                    />
                    <p class="text-[11px]" style="color: {$colorStore.muted};">
                      {m.pokefluxCollection.messagesLeft({ count: Math.ceil(slot.counter / Math.max(1, group.speedModifier)).toLocaleString() })}
                    </p>
                  </div>
                {:else}
                  <button
                    type="button"
                    class="w-full h-full min-h-[84px] rounded-lg flex flex-col items-center justify-center gap-0.5 p-2 text-center transition-all hover:scale-[1.02] disabled:opacity-50"
                    style="background: {$colorStore.primary}08; border: 1px dashed {$colorStore.primary}40;"
                    disabled={busy}
                    aria-label={m.pokefluxCollection.addEggTo({ group: group.group, slot: slot.slot })}
                    onclick={() => openEggPicker(group.group, slot.slot, hatchery)}
                  >
                    <span class="text-[11px] font-semibold" style="color: {$colorStore.muted};">{m.common.slotLabel({ slot: slot.slot })}</span>
                    <i class="fa-solid fa-plus text-sm my-0.5" style="color: {$colorStore.primary};" aria-hidden="true"></i>
                    <span class="text-xs font-medium" style="color: {$colorStore.text};">{m.pokefluxCollection.addEgg()}</span>
                  </button>
                {/if}
              </li>
            {/each}
          </ol>
        </Panel>
      {/each}
    {/snippet}
  </Streamed>

  <Streamed promise={data.breeding} notStartedOn404>
    {#snippet children(breeding)}
      {@const females = breeding.females.map((f) => f.pokemon)}
      <Panel icon="fa-solid fa-heart" title={m.common.breeding()}>
        {#snippet actions()}
          <button type="button" class={textButton} style={buttonStyle($colorStore)} disabled={busy} onclick={() => openFemalePicker(females)}>
            <i class="fa-solid fa-venus" aria-hidden="true"></i>{m.pokefluxCollection.setFemales()}
          </button>
        {/snippet}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div class="rounded-xl px-3 py-2.5 flex flex-col justify-center" style="background: {$colorStore.secondary}10;">
            <Meter
              value={breeding.daycareUsed}
              max={breeding.daycareLimit}
              label={m.dashboard.daycare()}
              valueText={m.pokefluxCollection.daycareValue({ used: breeding.daycareUsed, limit: breeding.daycareLimit })}
              color={breeding.daycareUsed >= breeding.daycareLimit ? $colorStore.accent : undefined}
            />
            {#if breeding.daycareUsed >= breeding.daycareLimit}
              <p class="text-xs mt-1.5" style="color: {$colorStore.accent};">{m.pokefluxCollection.daycareFull()}</p>
            {/if}
          </div>
          <StatTile label={m.pokefluxCollection.breedingCooldown()} tint={$colorStore.accent}>
            <span class="text-2xl font-bold leading-tight" style="color: {breeding.cooldownSeconds > 0 ? $colorStore.accent : '#10b981'};" aria-live="off">
              <Countdown seconds={breeding.cooldownSeconds} readyText={m.pokefluxCollection.readyNow()} ondone={refresh} />
            </span>
          </StatTile>
        </div>

        {#if females.length === 0}
          <EmptyState title={m.pokefluxCollection.noFemales()} icon="fa-solid fa-venus">
            <button type="button" class={textButton} style={buttonStyle($colorStore)} disabled={busy} onclick={() => openFemalePicker(females)}>
              <i class="fa-solid fa-plus" aria-hidden="true"></i>{m.pokefluxCollection.setFemales()}
            </button>
          </EmptyState>
        {:else}
          <ul class={POKEMON_GRID.regular}>
            {#each breeding.females as female (female.pokemon.id)}
              <li>
                <PokemonCard pokemon={female.pokemon} href="/dashboard/pokemon/{female.pokemon.id}">
                  {@const cooling = !!female.cooldownEndsAt && Date.parse(female.cooldownEndsAt) > Date.now()}
                  <p class="text-xs font-medium flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-md" style="background: {cooling ? `${$colorStore.accent}20` : '#10b98120'}; color: {cooling ? $colorStore.accent : '#10b981'};">
                    <i class="fa-solid {cooling ? 'fa-hourglass-half' : 'fa-heart'}" aria-hidden="true"></i>
                    <span class="sr-only">{m.dashboard.cooldown()}:</span>
                    <Countdown until={female.cooldownEndsAt} readyText={m.pokefluxCollection.readyToBreed()} ondone={refresh} />
                  </p>
                </PokemonCard>
              </li>
            {/each}
          </ul>
        {/if}
      </Panel>
    {/snippet}
  </Streamed>
</DashboardPageLayout>

<PokemonPicker
  bind:open={eggPickerOpen}
  title={eggTarget ? m.pokefluxCollection.pickEggFor({ group: eggTarget.group, slot: eggTarget.slot }) : undefined}
  query={{ filter: "egg" }}
  showControls={false}
  emptyTitle={m.pokefluxCollection.noEggs()}
  emptyMessage={m.pokefluxCollection.noEggsHint()}
  isDisabled={eggDisabled}
  onpick={placeEgg}
/>

<PokemonPicker
  bind:open={femalePickerOpen}
  title={m.pokefluxCollection.pickFemales()}
  multiple
  allowEmpty
  initialSelected={currentFemales}
  query={{ breedable: true }}
  isDisabled={(pokemon) => (isEgg(pokemon) ? m.pokefluxCollection.eggCannotBreed() : false)}
  onpick={setFemales}
/>
