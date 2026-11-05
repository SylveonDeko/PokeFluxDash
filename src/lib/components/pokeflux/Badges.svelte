<!--
@component
Compact icons for a Pokémon's flags, each with a tooltip and a label for screen readers.
-->
<script lang="ts" module>
  export type BadgeKind =
    | "shiny"
    | "radiant"
    | "shadow"
    | "skin"
    | "favorite"
    | "inParty"
    | "selected"
    | "champion"
    | "marketListed";
</script>

<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { PokemonCard } from "$lib/api";
  import { humanize, isShadow, skinOf } from "./pokemon";
  import { FLAGS } from "./labels";
  import Tooltip from "$lib/components/ui/Tooltip.svelte";

  type Flags = Partial<
    Pick<
      PokemonCard,
      "shiny" | "radiant" | "skin" | "favorite" | "inParty" | "selected" | "champion" | "marketListed"
    >
  >;

  interface Props {
    pokemon: Flags;
    /** Leave these out, such as `marketListed` on market pages. */
    hide?: BadgeKind[];
    size?: "sm" | "md";
    /** Put each badge in the tab order. Leave off inside links and buttons. */
    focusable?: boolean;
    class?: string;
  }

  let { pokemon, hide = [], size = "sm", focusable = false, class: className = "" }: Props = $props();

  interface Badge {
    kind: BadgeKind;
    icon: string;
    color: string;
    label: string;
  }

  let badges = $derived.by(() => {
    const skin = skinOf({ skin: pokemon.skin ?? null });
    const shadow = isShadow({ skin: pokemon.skin ?? null });
    const all: (Badge | false)[] = [
      !!pokemon.shiny && { kind: "shiny", ...FLAGS.shiny, label: m.common.shiny() },
      !!pokemon.radiant && { kind: "radiant", ...FLAGS.radiant, label: m.common.radiant() },
      shadow && { kind: "shadow", ...FLAGS.shadow, label: m.dashboard.shadow() },
      !!skin && !shadow && {
        kind: "skin",
        icon: "fa-palette",
        color: "#0ea5e9",
        label: m.pokeflux.badgeSkin({ name: humanize(skin) }),
      },
      !!pokemon.favorite && { kind: "favorite", ...FLAGS.favorite, label: m.common.favorite() },
      !!pokemon.inParty && { kind: "inParty", icon: "fa-users", color: $colorStore.primary, label: m.pokeflux.badgeInParty() },
      !!pokemon.selected && { kind: "selected", icon: "fa-location-crosshairs", color: "#22c55e", label: m.common.selectedPokemon() },
      !!pokemon.champion && { kind: "champion", icon: "fa-trophy", color: "#ca8a04", label: m.pokeflux.badgeChampion() },
      !!pokemon.marketListed && { kind: "marketListed", icon: "fa-tag", color: "#14b8a6", label: m.pokeflux.badgeMarketListed() },
    ];
    return all.filter((b): b is Badge => !!b && !hide.includes(b.kind));
  });

  const sizes = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-6 h-6 text-[11px]",
  };
</script>

{#if badges.length}
  <ul class="flex flex-wrap items-center gap-1 {className}">
    {#each badges as badge (badge.kind)}
      <li class="flex">
        <Tooltip text={badge.label}>
          {#snippet triggerSnippet()}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <span
              class="inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 {sizes[size]}"
              style="background: {badge.color}20; color: {badge.color}; border: 1px solid {badge.color}30; --tw-ring-color: {badge.color};"
              role="img"
              aria-label={badge.label}
              tabindex={focusable ? 0 : undefined}
            >
              <i class="fa-solid {badge.icon}" aria-hidden="true"></i>
            </span>
          {/snippet}
        </Tooltip>
      </li>
    {/each}
  </ul>
{/if}
