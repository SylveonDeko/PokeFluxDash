<!-- Preview of the shared Pokémon components with fixture data. Not linked from the nav. -->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import type { MoveDetails, PokemonCard as Pokemon } from "$lib/api";
  import {
    Badges,
    ConfirmDialog,
    EmptyState,
    LoadingGrid,
    MoveCard,
    PokemonCard,
    PokemonPicker,
    PokemonSprite,
    POKEMON_GRID,
    POKEMON_TYPES,
    StatBars,
    TypeBadge,
  } from "$lib/components/pokeflux";
  import { cards, detail, edgeCards, fixtureLoader, moves, perfectIvs } from "./fixtures";
  import FluxerChatDesktop from "$lib/components/home/FluxerChatDesktop.svelte";
  import FluxerChatMobile from "$lib/components/home/FluxerChatMobile.svelte";
  import FluxerChatCompact from "$lib/components/home/FluxerChatCompact.svelte";
  import { catchScene, startScene } from "$lib/components/home/scenes";

  let checked = $state<Record<string, boolean>>(Object.fromEntries(cards.map((c) => [c.id, c.id === cards[4].id])));
  let pickedMove = $state<MoveDetails | null>(null);

  let singleOpen = $state(false);
  let multiOpen = $state(false);
  let picked = $state<Pokemon[]>([]);

  let releaseOpen = $state(false);
  let failOpen = $state(false);
  let lastAction = $state("");

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const buttonStyle = $derived(
    `background: ${$colorStore.primary}20; color: ${$colorStore.primary}; border: 1px solid ${$colorStore.primary}30;`,
  );
</script>

<DashboardPageLayout title={m.pokeflux.devComponentsTitle()} subtitle={m.pokeflux.devComponentsSubtitle()} icon="fa-layer-group">
  <Panel title="TypeBadge">
    <div class="space-y-3">
      <div class="flex flex-wrap gap-1.5">
        {#each POKEMON_TYPES as type (type)}
          <TypeBadge {type} size="md" />
        {/each}
      </div>
      <div class="grid sm:grid-cols-2 gap-3">
        <div class="flex flex-wrap gap-1.5 p-3 rounded-xl" style="background: #ffffff;">
          {#each POKEMON_TYPES as type (type)}
            <TypeBadge {type} />
          {/each}
        </div>
        <div class="flex flex-wrap gap-1.5 p-3 rounded-xl" style="background: #0b0f19;">
          {#each POKEMON_TYPES as type (type)}
            <TypeBadge {type} size="xs" />
          {/each}
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <TypeBadge type="Fire" />
        <TypeBadge type="WATER" />
        <TypeBadge type=" grass " />
        <TypeBadge type="shadow" />
        <TypeBadge type="typeless" />
        <TypeBadge type="unknown" />
        <TypeBadge type="cosmic" />
      </div>
    </div>
  </Panel>

  <Panel title="PokemonSprite and Badges">
    <div class="flex flex-wrap items-end gap-4">
      <PokemonSprite src={cards[2].spriteUrl} alt={cards[2].name} size={96} eager />
      <PokemonSprite src={cards[0].spriteUrl} alt={cards[0].name} size={64} />
      <PokemonSprite src={null} size={64} />
      <PokemonSprite src="https://cdn.mewdeko.tech/eevee/missing.png" size={64} />
      <div class="space-y-2">
        <Badges
          pokemon={{ shiny: true, radiant: true, skin: "staff_gif", favorite: true, inParty: true, selected: true, champion: true, marketListed: true }}
          size="md"
          focusable
        />
        <Badges pokemon={{ skin: "shadow", favorite: true }} focusable />
      </div>
    </div>
  </Panel>

  <Panel title="PokemonCard (regular, link)">
    <div class={POKEMON_GRID.regular}>
      {#each [...cards.slice(0, 3), ...edgeCards] as pokemon (pokemon.id)}
        <PokemonCard {pokemon} href="#{pokemon.id}" />
      {/each}
      <PokemonCard pokemon={cards[5]}>
        <p class="text-xs font-semibold" style="color: {$colorStore.secondary};">12,500 credits</p>
      </PokemonCard>
    </div>
  </Panel>

  <Panel title="PokemonCard (compact, selectable and button)">
    <div class={POKEMON_GRID.compact}>
      {#each cards.slice(3, 8) as pokemon (pokemon.id)}
        <PokemonCard {pokemon} size="compact" selectable bind:checked={checked[pokemon.id]} />
      {/each}
      <PokemonCard pokemon={cards[8]} size="compact" selectable disabled disabledReason="On cooldown" />
      <PokemonCard pokemon={cards[9]} size="compact" onclick={(p) => (lastAction = `Clicked ${p.name}`)} />
      <PokemonCard pokemon={edgeCards[0]} size="compact" onclick={(p) => (lastAction = `Clicked ${p.name}`)} />
    </div>
    <p class="text-xs mt-3" style="color: {$colorStore.muted};">
      Checked: {Object.entries(checked).filter(([, on]) => on).length} {lastAction ? `· ${lastAction}` : ""}
    </p>
  </Panel>

  <div class="grid lg:grid-cols-2 gap-6">
    <Panel title="StatBars">
      <StatBars ivs={detail.ivs} evs={detail.evs} baseStats={detail.baseStats} stats={detail.stats} />
    </Panel>
    <Panel title="StatBars (perfect IVs, no switch)">
      <StatBars ivs={perfectIvs} switchable={false} />
    </Panel>
  </div>

  <Panel title="MoveCard">
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {#each detail.moves as move, i (i)}
          <MoveCard {move} slot={i + 1} />
        {/each}
      </div>
      <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2">
        {#each moves as move (move.name)}
          <MoveCard {move} compact active={pickedMove?.name === move.name} onselect={(mv) => (pickedMove = mv)} />
        {/each}
      </div>
    </div>
  </Panel>

  <Panel title="PokemonPicker and ConfirmDialog">
    <div class="flex flex-wrap gap-2">
      <button type="button" class="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]" style={buttonStyle} onclick={() => (singleOpen = true)}>
        Pick one
      </button>
      <button type="button" class="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]" style={buttonStyle} onclick={() => (multiOpen = true)}>
        Pick up to 6
      </button>
      <button type="button" class="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]" style={buttonStyle} onclick={() => (releaseOpen = true)}>
        Release
      </button>
      <button type="button" class="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]" style={buttonStyle} onclick={() => (failOpen = true)}>
        Buy (fails)
      </button>
    </div>
    {#if picked.length}
      <div class="flex flex-wrap gap-2 mt-3">
        {#each picked as pokemon (pokemon.id)}
          <span class="px-2 py-1 rounded-lg text-xs" style="background: {$colorStore.primary}15; color: {$colorStore.text};">{pokemon.name}</span>
        {/each}
      </div>
    {/if}
    {#if lastAction}
      <p class="text-xs mt-2" style="color: {$colorStore.muted};">{lastAction}</p>
    {/if}
  </Panel>

  <div class="grid lg:grid-cols-2 gap-6">
    <Panel title="EmptyState">
      <EmptyState title="No eggs yet" message="Put a Pokémon in a hatchery slot to start an egg." icon="fa-solid fa-egg">
        <button type="button" class="px-4 py-2 rounded-xl text-sm font-medium" style={buttonStyle}>Add an egg</button>
      </EmptyState>
    </Panel>
    <Panel title="LoadingGrid (compact)">
      <LoadingGrid count={4} size="compact" gridClass="grid grid-cols-1 sm:grid-cols-2 gap-2" />
    </Panel>
  </div>

  <Panel title="LoadingGrid">
    <LoadingGrid count={6} />
  </Panel>

  <Panel title="FluxerChatDesktop, FluxerChatMobile and FluxerChatCompact">
    <div class="flex flex-wrap items-start gap-6">
      <div class="w-full max-w-[560px]">
        <FluxerChatDesktop scene={catchScene} label={m.home.catchMockDesktopLabel()} />
      </div>
      <div class="w-full max-w-[280px]">
        <FluxerChatMobile scene={catchScene} label={m.home.catchMockMobileLabel()} />
      </div>
      <div class="w-full max-w-[480px]">
        <FluxerChatCompact scene={startScene} label={m.dashboard.startMockLabel()} width={520} height={505} />
      </div>
    </div>
  </Panel>
</DashboardPageLayout>

<PokemonPicker
  bind:open={singleOpen}
  loader={fixtureLoader}
  pageSize={6}
  isDisabled={(p) => (p.marketListed ? "Listed on the market" : false)}
  onpick={(result) => (picked = result)}
/>

<PokemonPicker
  bind:open={multiOpen}
  multiple
  max={6}
  initialSelected={picked}
  loader={fixtureLoader}
  pageSize={6}
  onpick={(result) => (picked = result)}
/>

<ConfirmDialog
  bind:open={releaseOpen}
  title="Release Blaziken?"
  message="Released Pokémon are gone for good."
  confirmLabel="Release"
  onconfirm={async () => {
    await wait(800);
    lastAction = "Released";
  }}
>
  <div class="max-w-[220px] mx-auto">
    <PokemonCard pokemon={cards[0]} size="compact" />
  </div>
</ConfirmDialog>

<ConfirmDialog
  bind:open={failOpen}
  variant="warning"
  title="Buy Rare Candy x10?"
  message="This costs 5,000 credits."
  confirmLabel="Buy"
  onconfirm={async () => {
    await wait(600);
    throw new Error("Not enough credits.");
  }}
/>
