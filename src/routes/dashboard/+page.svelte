<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import * as cdn from "$lib/utils/cdn";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import SectionHeader from "$lib/components/stats/SectionHeader.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle } from "$lib/components/dashboard/styles";
  import Streamed from "$lib/components/collection/Streamed.svelte";
  import Meter from "$lib/components/collection/Meter.svelte";
  import { Badges, EmptyState, FILTER_LABELS, FLAGS, PokemonSprite, StatBars, TypeBadge, displayName, humanize, ivColor } from "$lib/components/pokeflux";
  import { paletteFor, spritePalettes } from "$lib/components/pokeflux/spritePalette";
  import type { PokemonCounts, PokemonFilter } from "$lib/api";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let userName = $derived(data.user?.global_name || data.user?.username || "");
  let avatar = $derived(data.user ? cdn.userAvatarUrl(data.user.id, data.user.avatar, 128) : cdn.defaultAvatarUrl());

  const COUNTS: { key: keyof PokemonCounts; label: () => string; icon: string; color: string; filter: PokemonFilter }[] = [
    { key: "total", label: m.dashboard.totalPokemon, icon: "fa-solid fa-paw", color: "#60a5fa", filter: "all" },
    ...(["shiny", "radiant", "shadow", "legendary"] as const).map((key) => ({
      key,
      label: FILTER_LABELS[key],
      icon: `fa-solid ${FLAGS[key].icon}`,
      color: FLAGS[key].color,
      filter: key,
    })),
  ];


  let tileColors = $derived([$colorStore.primary, $colorStore.secondary, $colorStore.accent]);
  const card = $derived(`background: ${$colorStore.primary}05; border-color: ${$colorStore.primary}15;`);
  const bone = $derived(`background: ${$colorStore.primary}15;`);

  let selectedSprite = $state<string | null>(null);
  $effect(() => {
    let current = true;
    Promise.resolve(data.selected).then((response) => {
      if (current) selectedSprite = response?.ok ? response.data.spriteUrl : null;
    });
    return () => (current = false);
  });

  const selectedPalette = $derived(paletteFor($spritePalettes, selectedSprite));
  const selectedCard = $derived(
    selectedPalette
      ? `background: ${selectedPalette.primary}10; border-color: ${selectedPalette.primary}30;`
      : card,
  );
</script>

{#snippet skeleton(height: string)}
  <div class="rounded-2xl border animate-pulse motion-reduce:animate-none {height}" style={card} role="status" aria-busy="true">
    <span class="sr-only">{m.pokeflux.loading()}</span>
  </div>
{/snippet}

<DashboardPageLayout title={m.features.overview()} subtitle={m.dashboard.overviewSubtitle()} icon="fa-id-card">
  <Streamed promise={data.profile} notStartedOn404>
    {#snippet pending()}
      {@render skeleton("h-48")}
      {@render skeleton("h-60")}
      {@render skeleton("h-24")}
    {/snippet}

    {#snippet children(profile)}
      <section
        class="rounded-2xl p-4 md:p-5 border"
        style={card}
        aria-labelledby="trainer-card-title"
      >
        <div class="flex items-center gap-3 mb-4">
          <img src={avatar} alt="" class="w-11 h-11 rounded-xl border-2 shrink-0" style="border-color: {$colorStore.primary}30;" />
          <div class="min-w-0 flex-1">
            <h2 id="trainer-card-title" class="text-lg font-bold truncate leading-tight" style="color: {$colorStore.text};">
              {profile.trainerNickname || userName || m.common.trainer()}
            </h2>
            {#if profile.trainerNickname && userName}
              <p class="text-sm truncate" style="color: {$colorStore.muted};">{userName}</p>
            {/if}
          </div>
          <span
            class="shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style="background: {$colorStore.primary}15; border: 1px solid {$colorStore.primary}30; color: {$colorStore.primary};"
          >
            <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i>
            <span class="sr-only">{m.dashboard.region()}:</span>{humanize(profile.region)}
          </span>
        </div>

        <div class="space-y-3">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
            <div class="grid grid-cols-2 gap-3">
              <StatTile label={m.common.credits()} value={profile.credits} />
              <StatTile label={m.common.redeems()} value={profile.redeems} tint={$colorStore.secondary} />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 content-center rounded-xl px-3 py-2.5" style="background: {$colorStore.primary}10;">
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span style="color: {$colorStore.muted};"><i class="fa-solid fa-bolt mr-1" style="color: #facc15;" aria-hidden="true"></i>{m.dashboard.energy()}</span>
                  <span class="tabular-nums font-medium" style="color: {$colorStore.text};">{m.pokefluxCollection.energyValue({ energy: profile.energy, max: 10 })}</span>
                </div>
                <div class="grid grid-cols-10 gap-1" role="meter" aria-label={m.dashboard.energy()} aria-valuenow={profile.energy} aria-valuemin={0} aria-valuemax={10}>
                  {#each { length: 10 }, i (i)}
                    <span class="h-2 rounded-sm" style="background: {i < profile.energy ? '#facc15' : `${$colorStore.primary}20`};"></span>
                  {/each}
                </div>
              </div>

              <div>
                <Meter
                  value={profile.fishingExp}
                  max={profile.fishingLevelCap}
                  label={m.pokefluxCollection.fishingLevelValue({ level: profile.fishingLevel })}
                  valueText={m.pokefluxCollection.expValue({ exp: profile.fishingExp.toLocaleString(), cap: profile.fishingLevelCap.toLocaleString() })}
                  color="#22d3ee"
                />
              </div>
            </div>
          </div>

          <div class="px-3 py-2 rounded-lg flex items-center gap-3" style="background: {$colorStore.primary}10;">
            <i class="fa-solid fa-moon shrink-0" style="color: #a78bfa; font-size: 16px;" aria-hidden="true"></i>
            <div class="flex-1 min-w-0">
              <p class="text-xs" style="color: {$colorStore.muted};">{m.pokefluxCollection.shadowHunt()}</p>
              <p class="text-sm font-medium truncate" style="color: {$colorStore.text};">{profile.hunt ? humanize(profile.hunt) : m.pokefluxCollection.noHunt()}</p>
            </div>
            {#if profile.hunt}
              <div class="text-right">
                <p class="text-xs" style="color: {$colorStore.muted};">{m.dashboard.chain()}</p>
                <p class="text-sm font-bold tabular-nums" style="color: {$colorStore.text};">{profile.chain.toLocaleString()}</p>
              </div>
            {/if}
          </div>
        </div>
      </section>

      <section class="rounded-2xl p-4 md:p-5 border" style={selectedCard} aria-label={m.common.selectedPokemon()}>
        <SectionHeader icon="fa-arrow-pointer" title={m.common.selectedPokemon()} />
        {#await data.selected}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true">
            <span class="sr-only">{m.pokeflux.loading()}</span>
            <div class="flex flex-col items-center gap-2">
              <div class="w-28 h-28 rounded-full" style={bone}></div>
              <div class="h-4 w-1/2 rounded" style={bone}></div>
              <div class="h-3 w-1/3 rounded" style={bone}></div>
            </div>
            <div class="h-40 rounded" style={bone}></div>
            <div class="h-40 rounded" style={bone}></div>
          </div>
        {:then selected}
          {#if !selected || (!selected.ok && selected.status === 404)}
            <EmptyState title={m.pokefluxCollection.noSelected()} icon="fa-solid fa-hand-pointer" compact>
              <a
                href="/dashboard/pokemon"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px]"
                style={buttonStyle($colorStore)}
              >
                {m.pokefluxCollection.browsePokemon()}
              </a>
            </EmptyState>
          {:else}
            <ApiState response={selected}>
              {#snippet children(pokemon)}
                {@const iv = pokemon.ivPercent}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                  <div class="flex flex-col items-center text-center gap-1.5">
                    <PokemonSprite src={pokemon.spriteUrl} size={112} eager />
                    <div class="min-w-0 w-full">
                      <p class="text-lg font-bold truncate leading-tight" style="color: {$colorStore.text};">{displayName(pokemon)}</p>
                      <p class="text-sm truncate" style="color: {$colorStore.muted};">
                        {#if pokemon.number !== null}#{pokemon.number} · {/if}{m.pokeflux.levelShort({ level: pokemon.level })}{#if pokemon.nickname} · {pokemon.name}{/if}
                      </p>
                    </div>
                    <div class="flex flex-wrap justify-center items-center gap-1">
                      {#each pokemon.types as type (type)}
                        <TypeBadge {type} />
                      {/each}
                      <Badges pokemon={pokemon} hide={["selected"]} focusable />
                    </div>
                  </div>

                  <div>
                    <dl class="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div class="px-3 py-2 rounded-lg" style="background: {$colorStore.primary}10;">
                        <dt style="color: {$colorStore.muted};">{m.common.iv()}</dt>
                        <dd class="font-medium tabular-nums" style="color: {ivColor(iv)};">{iv.toFixed(2)}%</dd>
                      </div>
                      <div class="px-3 py-2 rounded-lg" style="background: {$colorStore.primary}10;">
                        <dt style="color: {$colorStore.muted};">{m.common.nature()}</dt>
                        <dd class="font-medium truncate" style="color: {$colorStore.text};">{humanize(pokemon.nature)}</dd>
                      </div>
                      <div class="px-3 py-2 rounded-lg" style="background: {$colorStore.primary}10;">
                        <dt style="color: {$colorStore.muted};">{m.common.ability()}</dt>
                        <dd class="font-medium truncate" style="color: {$colorStore.text};">{humanize(pokemon.ability)}</dd>
                      </div>
                      <div class="px-3 py-2 rounded-lg" style="background: {$colorStore.primary}10;">
                        <dt style="color: {$colorStore.muted};">{m.common.heldItem()}</dt>
                        <dd class="font-medium truncate" style="color: {$colorStore.text};">{pokemon.heldItem ? humanize(pokemon.heldItem) : m.common.none()}</dd>
                      </div>
                    </dl>
                    <Meter
                      value={pokemon.experience}
                      max={pokemon.experienceCap}
                      label={m.pokefluxCollection.experience()}
                      valueText={m.pokefluxCollection.expValue({ exp: pokemon.experience.toLocaleString(), cap: pokemon.experienceCap.toLocaleString() })}
                      size="sm"
                      class="mb-3"
                    />
                    <a
                      href="/dashboard/pokemon/{pokemon.id}"
                      class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px]"
                      style={buttonStyle($colorStore)}
                    >
                      {m.pokefluxCollection.viewDetails()}
                    </a>
                  </div>

                  <StatBars ivs={pokemon.ivs} stats={pokemon.stats} baseStats={pokemon.baseStats} evs={pokemon.evs} />
                </div>
              {/snippet}
            </ApiState>
          {/if}
        {/await}
      </section>

      <section class="rounded-2xl p-4 md:p-5 border" style={card} aria-label={m.common.collection()}>
        <SectionHeader icon="fa-paw" title={m.common.collection()} />
        <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {#each COUNTS as count, index (count.key)}
            <li>
              <a
                href={count.filter === "all" ? "/dashboard/pokemon" : `/dashboard/pokemon?filter=${count.filter}`}
                class="h-full rounded-xl px-3 py-2.5 flex flex-col transition-all hover:scale-[1.02]"
                style="background: {tileColors[index % 3]}10;"
              >
                <span class="text-xs flex items-center gap-1.5 min-w-0" style="color: {$colorStore.muted}">
                  <i class={count.icon} style="color: {count.color};" aria-hidden="true"></i>
                  <span class="truncate">{count.label()}</span>
                </span>
                <span class="text-2xl font-bold tabular-nums leading-tight" style="color: {$colorStore.text}">{profile.counts[count.key].toLocaleString()}</span>
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/snippet}
  </Streamed>

</DashboardPageLayout>
