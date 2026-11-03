<!--
@component
A coloured pill for a Pokémon type in any casing. Unknown types get a neutral pill.
-->
<script lang="ts">
  import { colorStore } from "$lib/stores/colorStore";
  import { emojiUrl } from "$lib/utils/cdn";
  import { normalizeType, typeLabel, TYPE_COLORS, TYPE_EMOJIS } from "./pokemon";

  interface Props {
    type: string;
    size?: "xs" | "sm" | "md";
    class?: string;
  }

  let { type, size = "sm", class: className = "" }: Props = $props();

  let key = $derived(normalizeType(type));
  let colors = $derived(key ? TYPE_COLORS[key] : { bg: `${$colorStore.muted}30`, fg: $colorStore.text });
  let emoji = $derived(key ? TYPE_EMOJIS[key] : undefined);

  const sizes = {
    xs: "text-[10px] px-1.5 py-px",
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };
  const iconSizes = { xs: 12, sm: 14, md: 16 };
  const iconPad = { xs: "pl-0.5", sm: "pl-0.5", md: "pl-1" };
</script>

<span
  class="inline-flex items-center justify-center gap-1 rounded-full font-semibold leading-tight whitespace-nowrap {sizes[size]} {emoji ? iconPad[size] : ''} {className}"
  style="background: {colors.bg}; color: {colors.fg};"
>
  {#if emoji}
    <img src={emojiUrl(emoji, 32)} alt="" width={iconSizes[size]} height={iconSizes[size]} class="shrink-0 rounded-full" loading="lazy" decoding="async" />
  {/if}
  {typeLabel(type)}
</span>
