<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import FluxerChatCompact from "./FluxerChatCompact.svelte";
  import { catchScene, duelScene, hatchScene, missionsScene } from "./scenes";

  const scenes = [
    { label: m.home.pillCatching, scene: catchScene },
    { label: m.home.pillDuels, scene: duelScene() },
    { label: m.common.breeding, scene: hatchScene },
    { label: m.home.pillProgress, scene: missionsScene },
  ];

  const MESSAGE_MS = 1600;
  const HOLD_MS = 4500;

  let index = $state(0);
  let shown = $state(1);
  let animate = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  let current = $derived(scenes[index]);
  let visible = $derived(
    animate ? { ...current.scene, messages: current.scene.messages.slice(0, shown) } : current.scene,
  );

  function step() {
    const total = current.scene.messages.length;
    if (shown < total) {
      shown += 1;
      timer = setTimeout(step, MESSAGE_MS);
    } else {
      timer = setTimeout(() => show((index + 1) % scenes.length), HOLD_MS);
    }
  }

  function show(next: number) {
    clearTimeout(timer);
    index = next;
    if (!animate) return;
    shown = 1;
    timer = setTimeout(step, MESSAGE_MS);
  }

  onMount(() => {
    animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) timer = setTimeout(step, MESSAGE_MS);
    return () => clearTimeout(timer);
  });
</script>

<div class="w-full">
  <div class="grid">
    {#key index}
      <div class="[grid-area:1/1]" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}>
        <FluxerChatCompact scene={visible} label={m.home.heroMockLabel()} width={560} height={600} composer />
      </div>
    {/key}
  </div>

  <div class="flex flex-wrap justify-center gap-2 mt-4" role="group" aria-label={m.home.heroMockFeatures()}>
    {#each scenes as item, i (i)}
      {@const active = i === index}
      <button
        type="button"
        class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
        style="background: {active ? $colorStore.selectedSurface : `${$colorStore.primary}08`}; color: {active ? $colorStore.text : $colorStore.muted}; border: 1px solid {active ? $colorStore.selectedBorder : `${$colorStore.primary}15`};"
        aria-pressed={active}
        onclick={() => show(i)}
      >
        {item.label()}
      </button>
    {/each}
  </div>
</div>
