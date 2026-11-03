<script lang="ts">
  import type { Snippet } from "svelte";
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    label: string;
    value?: string | number | null;
    /** Colour behind the tile, the primary colour by default. */
    tint?: string;
    /** Replaces the value, such as a countdown. */
    children?: Snippet;
  }

  let { label, value, tint, children }: Props = $props();
</script>

<div class="rounded-xl px-3 py-2.5" style="background: {tint ?? $colorStore.primary}10;">
  <div class="flex flex-col min-w-0">
    <span class="text-xs truncate" style="color: {$colorStore.muted}">{label}</span>
    {#if children}
      {@render children()}
    {:else}
      <span class="text-2xl font-bold truncate tabular-nums leading-tight" style="color: {$colorStore.text}">
        {value === null || value === undefined ? "-" : typeof value === "number" ? value.toLocaleString() : value}
      </span>
    {/if}
  </div>
</div>
