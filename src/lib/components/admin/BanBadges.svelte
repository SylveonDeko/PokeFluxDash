<!--
@component
A user's trade and market bans as small tags, or a dash when there are none.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    trade: boolean;
    market: boolean;
  }

  let { trade, market }: Props = $props();

  const tag = "inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium";
</script>

{#if trade || market}
  <span class="inline-flex flex-wrap gap-1">
    {#if trade}<span class={tag} style="background: {$colorStore.accent}20; color: {$colorStore.accent};">{m.admin.tradeBanned()}</span>{/if}
    {#if market}<span class={tag} style="background: {$colorStore.accent}20; color: {$colorStore.accent};">{m.admin.marketBanned()}</span>{/if}
  </span>
{:else}
  <span style="color: {$colorStore.muted};">-</span>
{/if}
