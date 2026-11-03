<script lang="ts">
  import FluxerIcon from "$lib/components/brand/FluxerIcon.svelte";
  import { fade, fly } from "svelte/transition";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { INVITE_URL } from "$lib/config/site";
  import HeroChatShowcase from "./HeroChatShowcase.svelte";

  /** Real commands with the default prefix, shown under the buttons and linked to their entry on the commands page. */
  const commands = [
    { text: ";p", name: "pokemon list" },
    { text: ";duel npc", name: "duel npc" },
    { text: ";hatchery", name: "hatchery" },
    { text: ";breeding breed", name: "breeding breed" },
    { text: ";market list", name: "market list" },
    { text: ";missions list", name: "missions list" },
  ];
</script>

<div class="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-12 px-2 sm:px-6"
     in:fade={{ duration: 300 }}>
  <div class="order-2 lg:order-1 text-center lg:text-left">
    <p class="text-sm sm:text-base font-semibold" style="color: {$colorStore.primary}">
      {m.home.heroEyebrow()}
    </p>
    <h1 class="font-extrabold tracking-tight leading-[1.04] text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mt-3"
        style="color: {$colorStore.text}">
      {@html m.home.heroTitle({ color: $colorStore.primary })}
    </h1>
    <p class="text-base sm:text-lg lg:text-xl leading-relaxed mt-5 max-w-xl mx-auto lg:mx-0" style="color: {$colorStore.muted}">
      {m.home.heroSubtitle()}
    </p>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mt-7">
      <a href={INVITE_URL} target="_blank" rel="noreferrer"
         class="inline-flex items-center justify-center gap-3 px-6 min-h-[52px] rounded-2xl text-base sm:text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
         style="background: {$colorStore.primary}30; color: {$colorStore.text}; border: 1px solid {$colorStore.primary}80;
                box-shadow: 0 8px 28px {$colorStore.primary}25;">
        <FluxerIcon />
        {m.home.addToFluxer()}
      </a>
      <a href="/dashboard"
         class="inline-flex items-center justify-center gap-3 px-5 min-h-[52px] rounded-2xl text-base sm:text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
         style="background: {$colorStore.primary}08; color: {$colorStore.text}; border: 1px solid {$colorStore.primary}25;">
        <i class="fa-solid fa-sliders" aria-hidden="true"></i>
        {m.home.openDashboard()}
      </a>
    </div>

    <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-7">
      {#each commands as command, index (command.name)}
        <a href="/commands?command={encodeURIComponent(command.name)}#cmd-{command.name.replace(/ /g, '-')}"
           in:fly={{ y: 8, duration: 300, delay: 150 + index * 50 }}
           class="font-mono text-xs sm:text-sm px-3 py-2 rounded-lg transition-colors hover:underline"
           style="background: {$colorStore.primary}10; color: {$colorStore.text}; border: 1px solid {$colorStore.primary}20;">
          {command.text}
        </a>
      {/each}
    </div>
  </div>

  <div class="order-1 lg:order-2 relative flex justify-center">
    <div class="relative w-full max-w-[560px]">
      <HeroChatShowcase />
    </div>
  </div>
</div>
