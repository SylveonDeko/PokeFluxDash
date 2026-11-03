<!--
@component
A species' other forms as sprite tiles linking to their Pokédex pages.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { SpeciesDetail } from "$lib/api";
  import PokemonSprite from "./PokemonSprite.svelte";
  import { humanize, speciesHref } from "./pokemon";

  interface Props {
    forms: SpeciesDetail["forms"];
  }

  let { forms }: Props = $props();
</script>

{#if forms.length}
  <ul class="flex flex-wrap gap-2" data-sveltekit-preload-data="hover">
    {#each forms as form (form.identifier)}
      <li>
        <a
          href={speciesHref(form.identifier)}
          class="w-24 h-full flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-sm font-medium border transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
          style="background: {$colorStore.primary}05; border-color: {$colorStore.primary}20; color: {$colorStore.text}; --tw-ring-color: {$colorStore.primary};"
        >
          <PokemonSprite src={form.spriteUrl} size={48} />
          <span class="text-center leading-tight break-words w-full">{humanize(form.identifier)}</span>
        </a>
      </li>
    {/each}
  </ul>
{:else}
  <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxPokemon.noForms()}</p>
{/if}
