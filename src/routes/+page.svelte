<script lang="ts">
  import { m } from "$lib/i18n";
  import { fade, fly } from "svelte/transition";
  import { colorStore } from "$lib/stores/colorStore";
  import HomeHero from "$lib/components/home/HomeHero.svelte";
  import FluxerChatDesktop from "$lib/components/home/FluxerChatDesktop.svelte";
  import FluxerChatMobile from "$lib/components/home/FluxerChatMobile.svelte";
  import FluxerChatCompact from "$lib/components/home/FluxerChatCompact.svelte";
  import { catchScene, duelScene, hatchScene, missionsScene } from "$lib/components/home/scenes";
  import { PokemonCard } from "$lib/components/pokeflux";
  import type { PokemonCard as PokemonCardData } from "$lib/api";
  import { COMMUNITY_URL, SITE_URL } from "$lib/config/site";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const CDN = "https://cdn.mewdeko.tech/eevee";

  function sample(fields: Partial<PokemonCardData> & Pick<PokemonCardData, "id" | "name" | "types">): PokemonCardData {
    return {
      number: null,
      nickname: null,
      level: 1,
      ivPercent: 50,
      shiny: false,
      radiant: false,
      skin: null,
      gender: "male",
      favorite: false,
      inParty: false,
      selected: false,
      champion: false,
      marketListed: false,
      heldItem: null,
      spriteUrl: null,
      ...fields
    };
  }

  const listed = [
    { pokemon: sample({ id: "5", name: "Larvesta", level: 54, ivPercent: 51.08, gender: "female", types: ["bug", "fire"], spriteUrl: `${CDN}/9d27de830c350600649ea771bcbdf2bc.png` }), price: 12500 },
    { pokemon: sample({ id: "6", name: "Corphish", level: 41, ivPercent: 66.67, gender: "female", types: ["water"], spriteUrl: `${CDN}/b2f4b1a73f071a26e073d999a721565d.png` }), price: 4200 }
  ];

  const MEDALS = ["#FFD700", "#C0C0C0", "#CD7F32"];
</script>

<svelte:head>
  <title>{m.home.pageTitle()}</title>

  <meta content={m.home.pageTitle()} property="og:title" />
  <meta content={m.home.metaDescription()} property="og:description" />
  <meta content="{SITE_URL}/" property="og:url" />

  <meta content={m.home.metaDescription()} name="description" />
  <link href="{SITE_URL}/" rel="canonical" />
</svelte:head>

<div
  style="--color-primary: {$colorStore.primary};
         --color-secondary: {$colorStore.secondary};
         --color-accent: {$colorStore.accent};
         --color-text: {$colorStore.text};
         --color-muted: {$colorStore.muted};"
>
  <header class="py-12 sm:py-16 px-4 sm:px-12 flex flex-col items-center relative" in:fade={{ duration: 300 }}>
    <HomeHero />

    <section aria-labelledby="top-trainers-heading" class="relative mt-16 w-full">
      <div class="text-center mb-8">
        <h2 id="top-trainers-heading" class="mb-3 text-2xl lg:text-3xl font-bold" style="color: {$colorStore.text}">
          {m.home.topTrainersHeading()}
        </h2>
        {#if data.stats}
          <p class="text-sm lg:text-base" style="color: {$colorStore.muted}">
            {m.home.topTrainersSubtitle({ players: data.stats.players.toLocaleString(), caught: data.stats.pokemonCaught.toLocaleString() })}
          </p>
        {/if}
      </div>
      {#if data.trainers.length > 0}
        <div class="w-full max-w-6xl mx-auto px-4">
          <div class="flex flex-wrap justify-center gap-4" role="list">
            {#each data.trainers as trainer, index (trainer.userId)}
              {@const medal = MEDALS[trainer.rank - 1] ?? $colorStore.primary}
              <div
                class="rounded-xl border overflow-hidden p-4 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]"
                style="background: {$colorStore.primary}08; border-color: {$colorStore.primary}20;"
                in:fly={{ y: 20, duration: 300, delay: index * 50 }}
                role="listitem"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold tabular-nums"
                       style="background: {medal}20; color: {medal};">
                    <span class="sr-only">{m.pokefluxMarket.rank()} </span>#{trainer.rank}
                  </div>

                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-sm sm:text-base truncate"
                        style="color: {trainer.name?.trim() ? $colorStore.text : $colorStore.muted}">
                      {trainer.name?.trim() || m.pokefluxMarket.hiddenTrainer()}
                    </h3>
                    <div class="flex items-center gap-1 mt-1">
                      <i class="fa-solid fa-paw text-xs sm:text-sm" style="color: {$colorStore.muted}" aria-hidden="true"></i>
                      <span class="text-xs sm:text-sm" style="color: {$colorStore.muted}">
                        {m.home.topTrainersValue({ count: trainer.value.toLocaleString() })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="text-center py-8">
          <p style="color: {$colorStore.muted}">{m.home.topTrainersEmpty()}</p>
        </div>
      {/if}

      <div class="text-center mt-6">
        {@render action("/leaderboard", m.pokefluxMarket.viewLeaderboard())}
      </div>
    </section>
  </header>

  <section aria-labelledby="features-heading" class="py-24 relative overflow-hidden">
    <div class="container mx-auto px-4 max-w-7xl relative z-10">
      <h2 class="text-3xl lg:text-4xl font-extrabold mb-16 text-center leading-tight scroll-mt-28"
          id="features-heading"
          style="color: {$colorStore.text}">
        {m.home.featuresHeading()}
      </h2>

      <div class="mb-16 px-4">
        <div class="max-w-6xl mx-auto space-y-16">

          <div class="relative left-1/2 -translate-x-1/2 w-[96vw] max-w-[1440px]" in:fly={{ y: 20, duration: 400, delay: 100 }}>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-10 items-center">
              <div class="pb-6 lg:py-0 flex flex-col justify-center order-1">
                {@render copy(m.home.featureCatchTitle(), m.home.featureCatchText(), "/dashboard/pokemon", m.home.openPokemon())}
              </div>

              <div class="order-2 lg:col-span-3 flex items-center justify-center">
                <div class="hidden sm:block w-full max-w-[1024px]"><FluxerChatDesktop scene={catchScene} label={m.home.catchMockDesktopLabel()} /></div>
                <div class="w-full max-w-[360px] mx-auto py-4 sm:hidden"><FluxerChatMobile scene={catchScene} label={m.home.catchMockMobileLabel()} /></div>
              </div>
            </div>
          </div>

          <div class="relative left-1/2 -translate-x-1/2 w-[96vw] max-w-[1440px]" in:fly={{ y: 20, duration: 400, delay: 200 }}>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div class="order-2 lg:order-1 flex items-center justify-center">
                <div class="w-full max-w-[480px]"><FluxerChatCompact scene={hatchScene} label={m.home.hatchMockLabel()} width={480} height={270} /></div>
              </div>

              <div class="pb-6 lg:py-0 flex flex-col justify-center order-1 lg:order-2">
                {@render copy(m.home.featureBreedTitle(), m.home.featureBreedText(), "/dashboard/hatchery", m.home.openHatchery())}
              </div>
            </div>
          </div>

          <div class="relative left-1/2 -translate-x-1/2 w-[96vw] max-w-[1440px]" in:fly={{ y: 20, duration: 400, delay: 300 }}>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div class="pb-6 lg:py-0 flex flex-col justify-center order-1">
                {@render copy(m.home.featureTradeTitle(), m.home.featureTradeText(), "/dashboard/market", m.home.openMarket())}
              </div>

              <div class="order-2 flex items-center justify-center">
                <div class="grid grid-cols-2 gap-3 w-full max-w-md" aria-hidden="true" inert>
                  {#each listed as listing (listing.pokemon.id)}
                    <PokemonCard pokemon={listing.pokemon} showNumber={false}>
                      <p class="text-xs font-semibold" style="color: {$colorStore.text}">
                        {m.home.showcasePrice({ price: listing.price.toLocaleString() })}
                      </p>
                    </PokemonCard>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <div class="relative left-1/2 -translate-x-1/2 w-[96vw] max-w-[1440px]" in:fly={{ y: 20, duration: 400, delay: 400 }}>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div class="order-2 lg:order-1 flex items-center justify-center">
                <div class="w-full max-w-[480px]"><FluxerChatCompact scene={missionsScene} label={m.home.missionsMockLabel()} width={480} height={500} /></div>
              </div>

              <div class="pb-6 lg:py-0 flex flex-col justify-center order-1 lg:order-2">
                {@render copy(m.home.featureProgressTitle(), m.home.featureProgressText(), "/dashboard/missions", m.home.openMissions())}
              </div>
            </div>
          </div>

          <div class="relative left-1/2 -translate-x-1/2 w-[96vw] max-w-[1440px]" in:fly={{ y: 20, duration: 400, delay: 500 }}>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div class="pb-6 lg:py-0 flex flex-col justify-center order-1">
                {@render copy(m.home.featureDuelTitle(), m.home.featureDuelText(), "/commands?module=duels", m.home.openDuelCommands())}
              </div>

              <div class="order-2 flex items-center justify-center">
                <div class="w-full max-w-[560px]"><FluxerChatCompact scene={duelScene()} label={m.home.duelMockLabel()} width={560} height={680} /></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <p class="text-center text-xs sm:text-sm" style="color: {$colorStore.muted}">
        <a href="https://www.flaticon.com/free-icons/eevee" target="_blank" rel="noreferrer" class="hover:underline">
          {m.home.iconCredit()}
        </a>
      </p>
      <p class="text-center text-xs sm:text-sm mt-2 space-x-4" style="color: {$colorStore.muted}">
        <a href={COMMUNITY_URL} target="_blank" rel="noreferrer" class="hover:underline">{m.common.community()}</a>
        <a href="/privacy" class="hover:underline">{m.common.privacy()}</a>
        <a href="/terms" class="hover:underline">{m.common.terms()}</a>
      </p>
    </div>
  </section>
</div>

{#snippet action(href: string, label: string)}
  <a class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors self-start"
     {href}
     style="background: {$colorStore.primary}10; color: {$colorStore.text}; border: 1px solid {$colorStore.primary}30;">
    {label}
  </a>
{/snippet}

{#snippet copy(title: string, text: string, href: string, label: string)}
  <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-3" style="color: {$colorStore.text}">{title}</h3>
  <p class="text-base sm:text-lg mb-6 leading-relaxed" style="color: {$colorStore.muted}">{text}</p>
  {@render action(href, label)}
{/snippet}
