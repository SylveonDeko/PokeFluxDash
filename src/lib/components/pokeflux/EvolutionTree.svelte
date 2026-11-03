<!--
@component
An evolution family as rows of sprites joined by arrows, with each evolution's conditions under its arrow.
Branches stack in a grid next to the species they come from.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import PokemonSprite from "./PokemonSprite.svelte";
  import { humanize, speciesHref } from "./pokemon";
  import type { EvolutionMethod, SpeciesEvolution } from "$lib/api";

  interface Props {
    stages: SpeciesEvolution[];
    identifier: string;
    speciesId: number;
  }

  let { stages, identifier, speciesId }: Props = $props();

  interface Node {
    stage: SpeciesEvolution;
    children: Node[];
  }

  let roots = $derived.by(() => {
    const ids = new Set(stages.map((stage) => stage.speciesId));
    const nodes = stages.map((stage): Node => ({ stage, children: [] }));
    const byId = new Map(nodes.map((node) => [node.stage.speciesId, node]));
    const tops: Node[] = [];
    for (const node of nodes) {
      const parent = node.stage.evolvesFrom;
      if (parent !== null && ids.has(parent) && parent !== node.stage.speciesId) byId.get(parent)?.children.push(node);
      else tops.push(node);
    }
    return tops;
  });

  let currentId = $derived(
    stages.some((stage) => stage.identifier === identifier)
      ? stages.find((stage) => stage.identifier === identifier)!.speciesId
      : speciesId,
  );

  function conditions(method: EvolutionMethod | null): string[] {
    if (!method) return [];
    const lines: string[] = [];
    if (method.trigger === "trade") lines.push(m.pokefluxPokemon.speciesEvoTrade());
    if (method.trigger === "shed") lines.push(m.pokefluxPokemon.speciesEvoShed());
    if (method.level !== null) lines.push(m.pokefluxPokemon.speciesEvoLevel({ level: method.level }));
    if (method.item) lines.push(m.pokefluxPokemon.speciesEvoItem({ item: humanize(method.item) }));
    if (method.heldItem) lines.push(m.pokefluxPokemon.speciesEvoHeld({ item: humanize(method.heldItem) }));
    if (method.happiness !== null) lines.push(m.pokefluxPokemon.speciesEvoHappiness({ value: method.happiness }));
    if (method.knownMove) lines.push(m.pokefluxPokemon.speciesEvoMove({ move: humanize(method.knownMove) }));
    if (method.gender === "female") lines.push(m.pokefluxPokemon.speciesEvoFemale());
    if (method.gender === "male") lines.push(m.pokefluxPokemon.speciesEvoMale());
    if (method.attackVsDefense === "higher") lines.push(m.pokefluxPokemon.speciesEvoAttackHigher());
    if (method.attackVsDefense === "lower") lines.push(m.pokefluxPokemon.speciesEvoAttackLower());
    if (method.attackVsDefense === "equal") lines.push(m.pokefluxPokemon.speciesEvoAttackEqual());
    if (method.region) lines.push(m.pokefluxPokemon.speciesEvoRegion({ region: humanize(method.region) }));
    if (lines.length === 0 && method.trigger === "level-up") lines.push(m.pokefluxPokemon.speciesEvoLevelUp());
    return lines;
  }
</script>

{#snippet member(stage: SpeciesEvolution)}
  {@const current = stage.speciesId === currentId}
  <a
    href={speciesHref(stage.speciesId)}
    class="shrink-0 w-24 flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-sm font-medium border transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
    style="background: {current ? `${$colorStore.primary}20` : `${$colorStore.primary}05`}; border-color: {current ? `${$colorStore.primary}30` : `${$colorStore.primary}20`}; color: {current ? $colorStore.primary : $colorStore.text}; --tw-ring-color: {$colorStore.primary};"
    aria-current={current ? "page" : undefined}
  >
    <PokemonSprite src={stage.spriteUrl} size={48} />
    <span class="text-center leading-tight break-words w-full">{humanize(stage.identifier)}</span>
  </a>
{/snippet}

{#snippet step(method: EvolutionMethod | null)}
  {@const lines = conditions(method)}
  <div class="shrink-0 w-20 flex flex-col items-center gap-1 text-center">
    <i class="fa-solid fa-arrow-right text-sm" style="color: {$colorStore.muted};" aria-hidden="true"></i>
    {#if lines.length}
      <ul class="space-y-0.5">
        {#each lines as line (line)}
          <li class="text-xs leading-tight" style="color: {$colorStore.muted};">{line}</li>
        {/each}
      </ul>
    {/if}
  </div>
{/snippet}

{#snippet branch(node: Node)}
  <div class="flex flex-wrap items-center gap-2 min-w-0">
    {@render member(node.stage)}
    {#if node.children.length === 1}
      {@render step(node.children[0].stage.method)}
      {@render branch(node.children[0])}
    {:else if node.children.length > 1}
      <ul class="flex-1 basis-56 min-w-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {#each node.children as child, i (child.stage.speciesId + "-" + i)}
          <li class="flex items-center gap-2 min-w-0">
            {@render step(child.stage.method)}
            {@render branch(child)}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/snippet}

<div class="space-y-4" data-sveltekit-preload-data="hover">
  {#each roots as root, i (root.stage.speciesId + "-" + i)}
    {@render branch(root)}
  {/each}
</div>
