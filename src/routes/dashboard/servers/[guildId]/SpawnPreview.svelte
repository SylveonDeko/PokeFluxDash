<!--
@component
Shows a spawn, or the channel after the catch, the way PokeFlux posts it with the given, possibly unsaved, settings.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { chipStyle } from "$lib/components/dashboard/styles";
  import FluxerChatCompact from "$lib/components/home/FluxerChatCompact.svelte";
  import { caughtScene, spawnScene, type SpawnPreviewSettings } from "$lib/components/home/scenes";

  let { settings, prefix }: { settings: SpawnPreviewSettings; prefix: string } = $props();

  let view = $state<"spawned" | "caught">("spawned");

  const spawned = $derived(spawnScene(settings));
  const caught = $derived(caughtScene(settings, prefix || ";"));
  const spawnHeight = $derived((settings.smallImages ? 256 : 546) + (settings.modalView ? 20 : 0));
  const caughtHeight = $derived(settings.delete ? 304 : 434 + (settings.pin ? 64 : 0) + (settings.modalView ? 20 : 0));
</script>

<div class="rounded-xl p-3 space-y-2" style="background: {$colorStore.primary}10;">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h3 class="text-sm font-semibold" style="color: {$colorStore.text}">{m.dashboard.spawnPreviewTitle()}</h3>
    <div class="flex gap-1.5" role="group" aria-label={m.dashboard.spawnPreviewTitle()}>
      {#each [["spawned", m.dashboard.spawnPreviewSpawned()], ["caught", m.dashboard.spawnPreviewCaught()]] as [id, label] (id)}
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          style={chipStyle($colorStore, view === id)}
          aria-pressed={view === id}
          onclick={() => (view = id as "spawned" | "caught")}
        >
          {label}
        </button>
      {/each}
    </div>
  </div>
  <div class="mx-auto w-full max-w-[380px]">
    {#if view === "spawned"}
      <FluxerChatCompact scene={spawned} label={m.dashboard.spawnPreviewLabel()} width={560} height={spawnHeight} />
    {:else}
      <FluxerChatCompact scene={caught} label={m.dashboard.spawnPreviewCaughtLabel()} width={560} height={caughtHeight} />
    {/if}
  </div>
  {#if view === "caught" && settings.pin && !settings.delete}
    <p class="text-xs" style="color: {$colorStore.muted}">{m.dashboard.spawnPreviewPinNote()}</p>
  {/if}
</div>
