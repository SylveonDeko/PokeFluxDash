<script lang="ts">
  import { onDestroy } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import { buttonStyle, sectionStyle, toggleStyle } from "$lib/components/dashboard/styles";
  import {
    EmptyState,
    EvolutionTree,
    PokemonSprite,
    SpeciesBreeding,
    SpeciesFacts,
    SpeciesForms,
    StatBars,
    TypeBadge,
    collectionHref,
    humanize,
  } from "$lib/components/pokeflux";
  import Learnset from "./Learnset.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let shinyChoice = $state<boolean | null>(null);
  let showMoves = $state(false);

  $effect(() => {
    void data.species;
    shinyChoice = null;
    showMoves = false;
  });

  $effect(() => {
    const sprite = data.species.ok ? data.species.data.spriteUrl : null;
    if (sprite) colorStore.setOverride(sprite);
    else colorStore.clearOverride();
  });

  onDestroy(() => colorStore.clearOverride());

  const actionClass =
    "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px] outline-none focus-visible:ring-2";
</script>

{#snippet backLink()}
  <a
    href="/dashboard/pokedex"
    class="min-h-[38px] px-3 rounded-xl inline-flex items-center gap-2 text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
    style={buttonStyle($colorStore)}
  >
    <i class="fa-solid fa-book-open" aria-hidden="true"></i><span>{m.features.pokedex()}</span>
  </a>
{/snippet}

{#if data.species.ok}
  {@const species = data.species.data}
  {@const name = humanize(species.identifier)}
  {@const shiny = (shinyChoice ?? data.shiny) && !!species.shinySpriteUrl}
  {@const sprite = shiny ? species.shinySpriteUrl : species.spriteUrl}

  <DashboardPageLayout
    title={name}
    subtitle={species.formName
      ? m.pokefluxPokemon.subtitleNumber({ number: String(species.speciesId).padStart(4, "0"), rest: humanize(species.formName) })
      : `#${String(species.speciesId).padStart(4, "0")}`}
    icon="fa-book-open"
  >
    {#snippet actions()}
      {@render backLink()}
    {/snippet}

    <section class="rounded-2xl border overflow-hidden" style={sectionStyle($colorStore)}>
      <div class="grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div class="flex flex-col items-center justify-center gap-2 p-4 lg:p-5" style="background: {$colorStore.primary}05;">
          <PokemonSprite src={sprite} alt={name} size={160} eager />
          <div class="flex flex-wrap justify-center gap-1.5">
            {#each species.types as type (type)}
              <TypeBadge {type} size="md" />
            {/each}
          </div>
          {#if species.shinySpriteUrl}
            <div class="flex gap-2" role="radiogroup" aria-label={m.pokefluxPokemon.speciesSprite()}>
              {#each [false, true] as value (value)}
                {@const active = shiny === value}
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  class="px-3 py-1.5 rounded-lg text-sm min-h-[34px] inline-flex items-center gap-2 transition-all outline-none focus-visible:ring-2"
                  style={toggleStyle($colorStore, active)}
                  onclick={() => (shinyChoice = value)}
                >
                  {#if value}<i class="fa-solid fa-sparkles" aria-hidden="true"></i>{/if}
                  {value ? m.common.shiny() : m.common.normal()}
                </button>
              {/each}
            </div>
          {/if}
          {#if species.mega || species.battleOnly || species.baby}
            <ul class="flex flex-wrap justify-center gap-2">
              {#if species.mega}
                <li class="px-3 py-1 rounded-full text-xs font-semibold" style="background: {$colorStore.secondary}15; border: 1px solid {$colorStore.secondary}30; color: {$colorStore.secondary};">{m.pokefluxPokemon.speciesMega()}</li>
              {/if}
              {#if species.battleOnly}
                <li class="px-3 py-1 rounded-full text-xs font-semibold" style="background: {$colorStore.secondary}15; border: 1px solid {$colorStore.secondary}30; color: {$colorStore.secondary};">{m.pokefluxPokemon.speciesBattleOnly()}</li>
              {/if}
              {#if species.baby}
                <li class="px-3 py-1 rounded-full text-xs font-semibold" style="background: {$colorStore.secondary}15; border: 1px solid {$colorStore.secondary}30; color: {$colorStore.secondary};">{m.pokefluxPokemon.speciesBaby()}</li>
              {/if}
            </ul>
          {/if}
        </div>

        <div class="p-4 md:p-5 space-y-4">
          <SpeciesFacts {species} />

          <div class="px-3 py-2.5 rounded-xl space-y-2" style="background: {$colorStore.primary}10;">
            <h2 class="text-xs" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesYourCollection()}</h2>
            {#if species.owned > 0}
              <p class="text-xl font-bold tabular-nums" style="color: {$colorStore.text};">
                {m.pokefluxPokemon.speciesOwned({ count: species.owned.toLocaleString() })}
                {#if species.ownedShiny > 0}
                  <span class="text-sm font-normal" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesOwnedShiny({ count: species.ownedShiny.toLocaleString() })}</span>
                {/if}
              </p>
              <div class="flex flex-wrap gap-2" data-sveltekit-preload-data="hover">
                <a href={collectionHref(species.name)} class={actionClass} style={buttonStyle($colorStore)}>
                  <i class="fa-solid fa-grid-2" aria-hidden="true"></i>{m.pokefluxPokemon.dexOpenCollection({ name })}
                </a>
                {#if species.ownedShiny > 0}
                  <a href={collectionHref(species.name, "shiny")} class={actionClass} style={buttonStyle($colorStore)}>
                    <i class="fa-solid fa-sparkles" aria-hidden="true"></i>{m.pokefluxPokemon.speciesOpenShiny({ name })}
                  </a>
                {/if}
              </div>
            {:else}
              <p class="text-sm" style="color: {$colorStore.text};">{m.pokefluxPokemon.speciesOwnedNone({ name })}</p>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <div class="grid lg:grid-cols-2 gap-4">
      <Panel icon="fa-solid fa-chart-simple" title={m.pokefluxPokemon.speciesBaseStats()}>
        <StatBars baseStats={species.baseStats} view="base" switchable={false} />
      </Panel>

      <Panel icon="fa-solid fa-egg" title={m.common.breeding()}>
        <SpeciesBreeding {species} />
      </Panel>
    </div>

    <Panel class="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-x-6 gap-y-4">
      <div class="min-w-0">
      <h2 class="text-lg font-semibold flex items-center gap-2 mb-3" style="color: {$colorStore.text};">
        <i class="fa-solid fa-dna" style="color: {$colorStore.primary}; font-size: 18px;" aria-hidden="true"></i>{m.pokefluxPokemon.evolutionTitle()}
      </h2>
      {#if species.evolution.length}
        <EvolutionTree stages={species.evolution} identifier={species.identifier} speciesId={species.speciesId} />
      {:else}
        <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxPokemon.noEvolution()}</p>
      {/if}
      </div>

      <div class="min-w-0">
      <h2 class="text-lg font-semibold flex items-center gap-2 mb-3" style="color: {$colorStore.text};">
        <i class="fa-solid fa-shapes" style="color: {$colorStore.primary}; font-size: 18px;" aria-hidden="true"></i>{m.pokefluxPokemon.formsTitle()}
      </h2>
      <SpeciesForms forms={species.forms} />
      </div>
    </Panel>

    <Panel
      icon="fa-solid fa-wand-sparkles"
      title={m.pokefluxPokemon.speciesLearnset()}
      subtitle={m.pokefluxPokemon.speciesLearnsetHint()}
      flush={!showMoves && species.learnset.length > 0}
    >
      {#snippet badge()}
        <span class="text-sm font-normal ml-1" style="color: {$colorStore.muted};">
          {m.pokefluxPokemon.learnsetCount({ count: species.learnset.length })}
        </span>
      {/snippet}
      {#snippet actions()}
        {#if species.learnset.length}
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl min-h-[36px] text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
            style={buttonStyle($colorStore)}
            aria-expanded={showMoves}
            aria-controls="pf-learnset"
            onclick={() => (showMoves = !showMoves)}
          >
            {showMoves ? m.pokefluxPokemon.learnsetHide() : m.pokefluxPokemon.learnsetShow()}
            <span class="transform transition-transform {showMoves ? 'rotate-180' : ''}" aria-hidden="true">↓</span>
          </button>
        {/if}
      {/snippet}
      <div id="pf-learnset">
        {#if showMoves || species.learnset.length === 0}
          {#key species.identifier}
            <Learnset moves={species.learnset} />
          {/key}
        {/if}
      </div>
    </Panel>
  </DashboardPageLayout>
{:else}
  <DashboardPageLayout title={m.features.pokedex()} subtitle={m.dashboard.pokedexSubtitle()} icon="fa-book-open">
    {#snippet actions()}
      {@render backLink()}
    {/snippet}
    <EmptyState
      title={data.species.status === 404 ? m.pokefluxPokemon.speciesNotFound() : m.dashboard.loadFailed({ status: data.species.status })}
      message={data.species.error}
      icon={data.species.status === 404 ? "fa-solid fa-ghost" : "fa-solid fa-circle-exclamation"}
    >
      {#if data.species.status !== 404}
        <button type="button" class={actionClass} style={buttonStyle($colorStore)} onclick={() => invalidateAll()}>
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>{m.common.retry()}
        </button>
      {/if}
    </EmptyState>
  </DashboardPageLayout>
{/if}
