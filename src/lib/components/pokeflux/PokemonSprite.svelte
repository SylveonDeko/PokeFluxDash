<!--
@component
A Pokémon sprite in a fixed square box. Small sprites scale up pixelated, large art scales smoothly,
and a missing or broken image shows a neutral placeholder.
-->
<script lang="ts" module>
  const pixelSprites = new Set<string>();
</script>

<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { centringFor, spritePalettes } from "./spritePalette";

  interface Props {
    src: string | null | undefined;
    /** Empty by default. */
    alt?: string;
    /** Box edge in pixels. */
    size?: number;
    /** Load right away, for sprites above the fold. */
    eager?: boolean;
    class?: string;
  }

  let { src, alt = "", size = 96, eager = false, class: className = "" }: Props = $props();

  let failedSrc = $state<string | null>(null);
  let pixelSrc = $state<string | null>(null);

  let failed = $derived(!!src && failedSrc === src);
  let pixelated = $derived(!!src && (pixelSrc === src || pixelSprites.has(`${size}:${src}`)));
  let shift = $derived(centringFor($spritePalettes, src));

  function onload(event: Event) {
    const img = event.currentTarget as HTMLImageElement;
    if (img.naturalWidth > 0 && img.naturalWidth < size) {
      pixelSrc = src ?? null;
      if (src) pixelSprites.add(`${size}:${src}`);
    }
  }
</script>

<div
  class="relative shrink-0 flex items-center justify-center {className}"
  style="width: {size}px; height: {size}px;"
>
  {#if src && !failed}
    <img
      {src}
      {alt}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding={eager ? "sync" : "async"}
      draggable="false"
      class="w-full h-full object-contain select-none"
      style="image-rendering: {pixelated ? 'pixelated' : 'auto'}; transform: translate({shift.x}%, {shift.y}%);"
      {onload}
      onerror={() => (failedSrc = src ?? null)}
    />
  {:else}
    <div
      class="w-[70%] h-[70%] rounded-full flex items-center justify-center border border-dashed"
      style="background: {$colorStore.primary}10; border-color: {$colorStore.primary}30;"
      role="img"
      aria-label={alt || m.pokeflux.spriteMissing()}
    >
      <i
        class="fa-solid fa-question"
        style="color: {$colorStore.muted}; font-size: {Math.max(12, Math.round(size * 0.22))}px;"
        aria-hidden="true"
      ></i>
    </div>
  {/if}
</div>
