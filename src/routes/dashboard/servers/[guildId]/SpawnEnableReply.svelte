<!--
@component
The reply PokeFlux gives to `spawn enable` in a channel, with the server's prefix and channel name.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import FluxerChatCompact from "$lib/components/home/FluxerChatCompact.svelte";
  import { spawnEnableScene } from "$lib/components/home/scenes";

  let { prefix, channel }: { prefix: string; channel?: string } = $props();

  const scene = $derived(spawnEnableScene(prefix || ";", channel || "general"));
</script>

<div class="mt-3 space-y-2 max-w-[300px]">
  <p class="text-xs" style="color: {$colorStore.muted}">{m.dashboard.spawnEnableHint()}</p>
  <FluxerChatCompact {scene} label={m.dashboard.spawnEnableLabel()} width={440} height={232} />
</div>
