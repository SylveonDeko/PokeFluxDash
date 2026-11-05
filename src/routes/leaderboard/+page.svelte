<script lang="ts">
  import { goto } from "$app/navigation";
  import { navigating, page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { LeaderboardKind } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import AsyncState from "$lib/components/stats/AsyncState.svelte";
  import { EmptyState } from "$lib/components/pokeflux";
  import { SITE_URL } from "$lib/config/site";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const KIND_INFO: Record<LeaderboardKind, { label: () => string; value: () => string; icon: string }> = {
    pokemon: { label: m.common.pokemon, value: m.pokefluxMarket.leaderboardPokemonValue, icon: "fa-paw" },
    shiny: { label: m.common.shiny, value: m.pokefluxMarket.leaderboardShinyValue, icon: "fa-star" },
    credits: { label: m.common.credits, value: m.common.credits, icon: "fa-circle-dollar" },
  };

  const MEDALS = ["#FFD700", "#C0C0C0", "#CD7F32"];

  let loading = $derived(!!navigating.to && navigating.to.route.id === page.route.id);
  let info = $derived(KIND_INFO[data.kind]);
  let tabs = $derived(data.kinds.map((kind) => ({ id: kind, label: KIND_INFO[kind].label(), icon: KIND_INFO[kind].icon })));
</script>

<svelte:head>
  <meta name="description" content={m.pokefluxMarket.leaderboardDescription()} />
  <link rel="canonical" href="{SITE_URL}/leaderboard" />
</svelte:head>

<div class="relative z-0">
  <DashboardPageLayout
    title={m.pokefluxMarket.leaderboardTitle()}
    subtitle={m.pokefluxMarket.leaderboardDescription()}
    icon="fa-crown"
    {tabs}
    activeTab={data.kind}
    ontabChange={({ tabId }) => goto(`?kind=${tabId}`, { noScroll: true, keepFocus: true })}
  >
    <Panel aria-label={info.label()}>
      <ApiState response={data.leaderboard}>
        {#snippet children(board)}
          <AsyncState {loading}>
          {#if board.entries.length === 0}
            <EmptyState title={m.pokefluxMarket.leaderboardEmpty()} icon="fa-solid fa-trophy" compact />
          {:else}
            <ol class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2" aria-label={m.pokefluxMarket.leaderboardCaption({ kind: info.label() })}>
              {#each board.entries as entry (entry.userId)}
                {@const medal = MEDALS[entry.rank - 1] ?? $colorStore.primary}
                <li
                  class="rounded-xl px-3 py-2.5 border transition-all duration-200"
                  style="background: {$colorStore.primary}10; border-color: {$colorStore.primary}20;"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold shrink-0 tabular-nums"
                      style="background: {medal}20; color: {medal};"
                    >
                      <span class="sr-only">{m.pokefluxMarket.rank()} </span>#{entry.rank}
                    </div>
                    <div class="grow min-w-0">
                      {#if entry.name?.trim()}
                        <p class="font-medium truncate" style="color: {$colorStore.text}">{entry.name}</p>
                      {:else}
                        <p class="truncate" style="color: {$colorStore.muted}">
                          <i class="fa-solid fa-user-secret mr-1" aria-hidden="true"></i>{m.pokefluxMarket.hiddenTrainer()}
                        </p>
                      {/if}
                      <p class="text-sm tabular-nums" style="color: {$colorStore.muted}">
                        <span class="font-medium" style="color: {$colorStore.secondary}">{entry.value.toLocaleString()}</span>
                        {info.value()}
                      </p>
                    </div>
                  </div>
                </li>
              {/each}
            </ol>
          {/if}
          </AsyncState>
        {/snippet}
      </ApiState>
    </Panel>
  </DashboardPageLayout>
</div>
