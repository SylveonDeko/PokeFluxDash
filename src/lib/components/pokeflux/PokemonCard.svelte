<!--
@component
The grid card for a Pokémon. A link with `href`, a button with `onclick`, a checkbox with `selectable`
(for multi-select pickers), or plain otherwise. `compact` lays it out as a short row for dense lists.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { PokemonCard } from "$lib/api";
  import PokemonSprite from "./PokemonSprite.svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import Badges, { type BadgeKind } from "./Badges.svelte";
  import { displayName, humanize, ivColor } from "./pokemon";
  import { GENDERS } from "./labels";
  import { paletteFor, spritePalettes } from "./spritePalette";

  interface Props {
    pokemon: PokemonCard;
    size?: "regular" | "compact";
    href?: string;
    onclick?: (pokemon: PokemonCard) => void;
    /** Render as a checkbox and bind `checked`. */
    selectable?: boolean;
    checked?: boolean;
    onchange?: (checked: boolean, pokemon: PokemonCard) => void;
    disabled?: boolean;
    /** Why the card is disabled, as a tooltip. */
    disabledReason?: string;
    showNumber?: boolean;
    hideBadges?: BadgeKind[];
    /** Extra content at the bottom, such as a price or a cooldown. */
    children?: Snippet;
    class?: string;
  }

  let {
    pokemon,
    size = "regular",
    href,
    onclick,
    selectable = false,
    checked = $bindable(false),
    onchange,
    disabled = false,
    disabledReason,
    showNumber = true,
    hideBadges = [],
    children,
    class: className = "",
  }: Props = $props();

  let compact = $derived(size === "compact");
  let name = $derived(displayName(pokemon));
  let iv = $derived(Number.isFinite(pokemon.ivPercent) ? pokemon.ivPercent : 0);
  let special = $derived(pokemon.shiny || pokemon.radiant);
  let summary = $derived(
    `${name}, ${m.pokeflux.levelShort({ level: pokemon.level })}, ${m.pokeflux.ivPercent({ iv: iv.toFixed(2) })}`,
  );

  let gender = $derived(GENDERS[pokemon.gender] ?? GENDERS.genderless);

  let palette = $derived(paletteFor($spritePalettes, pokemon.spriteUrl));

  let borderColor = $derived(
    checked
      ? `${$colorStore.primary}40`
      : special
        ? `${$colorStore.secondary}40`
        : palette
          ? `${palette.primary}30`
          : `${$colorStore.primary}20`,
  );

  let background = $derived(
    checked
      ? `${$colorStore.primary}20`
      : palette
        ? `linear-gradient(135deg, ${palette.primary}14, ${palette.secondary}0a)`
        : `${$colorStore.primary}05`,
  );

  let rootClass = $derived(
    `group relative h-full w-full rounded-xl border transition-all outline-none
     focus-visible:ring-2 has-[:focus-visible]:ring-2
     ${compact ? "p-2 flex items-center gap-2 text-left" : "p-2.5 flex flex-col items-center text-center gap-1"}
     ${disabled ? "opacity-50 cursor-not-allowed" : href || onclick || selectable ? "cursor-pointer hover:scale-[1.02] motion-reduce:hover:scale-100" : ""}
     ${className}`,
  );

  let rootStyle = $derived(
    `background: ${background}; border-color: ${borderColor};` +
      ` --tw-ring-color: ${$colorStore.primary};`,
  );

  function toggle(event: Event) {
    checked = (event.currentTarget as HTMLInputElement).checked;
    onchange?.(checked, pokemon);
  }
</script>

{#snippet ivBar()}
  <div class="flex {compact ? 'items-center gap-1.5' : 'flex-col-reverse items-center gap-0.5'} w-full" title={m.pokeflux.ivPercent({ iv: iv.toFixed(2) })}>
    <div
      class="h-1.5 {compact ? 'flex-1' : 'w-full'} rounded-full overflow-hidden"
      style="background: {$colorStore.primary}15;"
      role="meter"
      aria-label={m.pokeflux.ivPercent({ iv: iv.toFixed(2) })}
      aria-valuenow={iv}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div class="h-full rounded-full" style="width: {Math.min(100, Math.max(0, iv))}%; background: {ivColor(iv)};"></div>
    </div>
    <span class="text-[11px] font-semibold tabular-nums shrink-0" style="color: {ivColor(iv)};">{iv.toFixed(compact ? 1 : 2)}%</span>
  </div>
{/snippet}

{#snippet genderIcon()}
  <i
    class="fa-solid {gender.icon} text-xs"
    style="color: {gender.color};"
    role="img"
    aria-label={gender.label()}
    title={gender.label()}
  ></i>
{/snippet}

{#snippet checkmark()}
  {#if selectable}
    <span
      class="absolute top-1.5 right-1.5 w-5 h-5 rounded-md border flex items-center justify-center text-[10px] transition-colors"
      style="background: {checked ? $colorStore.primary : 'transparent'}; border-color: {checked ? $colorStore.primary : `${$colorStore.primary}30`}; color: #ffffff;"
      aria-hidden="true"
    >
      {#if checked}<i class="fa-solid fa-check"></i>{/if}
    </span>
  {/if}
{/snippet}

{#snippet body()}
  {#if compact}
    <PokemonSprite src={pokemon.spriteUrl} size={48} />
    <div class="min-w-0 flex-1 space-y-1 {selectable ? 'pr-5' : ''}">
      <div class="flex items-center gap-1 min-w-0">
        <p class="text-sm font-semibold truncate" style="color: {$colorStore.text};">{name}</p>
        {@render genderIcon()}
      </div>
      <p class="text-[11px] truncate" style="color: {$colorStore.muted};">
        {#if showNumber && pokemon.number !== null}#{pokemon.number} · {/if}{m.pokeflux.levelShort({ level: pokemon.level })}{#if pokemon.nickname} · {pokemon.name}{/if}
      </p>
      {@render ivBar()}
      <div class="flex flex-wrap items-center gap-1">
        {#each pokemon.types as type (type)}
          <TypeBadge {type} size="xs" />
        {/each}
        <Badges pokemon={pokemon} hide={hideBadges} />
      </div>
      {@render children?.()}
    </div>
  {:else}
    <div class="flex items-center justify-between w-full text-[11px] min-h-5 {selectable ? 'pr-6' : ''}">
      <span class="tabular-nums font-medium" style="color: {$colorStore.muted};">
        {#if showNumber && pokemon.number !== null}#{pokemon.number}{/if}
      </span>
      {@render genderIcon()}
    </div>
    <PokemonSprite src={pokemon.spriteUrl} size={72} />
    <div class="w-full min-w-0">
      <p class="text-sm font-semibold truncate" style="color: {$colorStore.text};" title={name}>{name}</p>
      <p class="text-xs truncate" style="color: {$colorStore.muted};">
        {m.pokeflux.levelShort({ level: pokemon.level })}{#if pokemon.nickname} · {pokemon.name}{/if}
      </p>
    </div>
    {@render ivBar()}
    <div class="flex flex-wrap items-center justify-center gap-1 min-h-5">
      {#each pokemon.types as type (type)}
        <TypeBadge {type} size="xs" />
      {/each}
    </div>
    <Badges pokemon={pokemon} hide={hideBadges} class="justify-center" />
    {#if pokemon.heldItem}
      <p class="text-[11px] truncate w-full" style="color: {$colorStore.muted};">
        <i class="fa-solid fa-hand-holding mr-1" aria-hidden="true"></i>{m.pokeflux.heldItem({ item: humanize(pokemon.heldItem) })}
      </p>
    {/if}
    {#if children}
      <div class="w-full mt-auto pt-1">{@render children()}</div>
    {/if}
  {/if}
  {@render checkmark()}
{/snippet}

{#if selectable}
  <label class={rootClass} style={rootStyle} title={disabled ? disabledReason : undefined}>
    <input type="checkbox" class="sr-only" {checked} {disabled} onchange={toggle} aria-label={summary} />
    {@render body()}
  </label>
{:else if href && !disabled}
  <a {href} class={rootClass} style={rootStyle} aria-label={summary}>
    {@render body()}
  </a>
{:else if onclick}
  <button
    type="button"
    class={rootClass}
    style={rootStyle}
    {disabled}
    aria-label={summary}
    title={disabled ? disabledReason : undefined}
    onclick={() => onclick(pokemon)}
  >
    {@render body()}
  </button>
{:else}
  <div class={rootClass} style={rootStyle} title={disabled ? disabledReason : undefined}>
    {@render body()}
  </div>
{/if}
