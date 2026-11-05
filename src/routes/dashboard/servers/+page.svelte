<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import { buttonStyle } from "$lib/components/dashboard/styles";
  import { EmptyState } from "$lib/components/pokeflux";
  import { INVITE_URL } from "$lib/config/site";
  import GuildIcon from "./GuildIcon.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let search = $state("");
</script>

<DashboardPageLayout title={m.features.servers()} subtitle={m.dashboard.serversSubtitle()} icon="fa-server">
  <ApiState response={data.guilds}>
    {#snippet children(guilds)}
      {@const query = search.trim().toLowerCase()}
      {@const shown = guilds.filter((g) => g.name.toLowerCase().includes(query)).sort((a, b) => a.name.localeCompare(b.name))}
      {#if guilds.length === 0}
        <EmptyState title={m.common.noServersAvailable()} message={m.pokefluxMarket.noServersHint()} icon="fa-solid fa-server">
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]"
            style={buttonStyle($colorStore)}
          >
            <i class="fa-solid fa-plus" style="font-size: 16px;" aria-hidden="true"></i>
            {m.common.inviteBot()}
          </a>
        </EmptyState>
      {:else}
        <div class="w-full flex flex-col gap-3">
          {#if guilds.length > 6}
            <label class="relative block">
              <span class="sr-only">{m.common.searchServersPlaceholder()}</span>
              <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style="color: {$colorStore.muted};" aria-hidden="true"></i>
              <input
                type="search"
                placeholder={m.common.searchServersPlaceholder()}
                bind:value={search}
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200"
                style="border-color: {$colorStore.primary}20; color: {$colorStore.text}; background: {$colorStore.primary}08;"
              />
            </label>
          {/if}

          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
            {#each shown as guild (guild.id)}
              <li>
                <a
                  href="/dashboard/servers/{guild.id}"
                  class="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] focus:outline-hidden text-left"
                  style="background: {$colorStore.primary}08; border-color: {$colorStore.primary}20;"
                >
                  <GuildIcon name={guild.name} src={guild.iconUrl} />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium truncate" style="color: {$colorStore.text}">{guild.name}</p>
                    <p class="text-xs truncate" style="color: {$colorStore.muted}">
                      {guild.owner ? m.pokefluxMarket.owner() : m.pokefluxMarket.admin()}
                    </p>
                  </div>
                </a>
              </li>
            {:else}
              <li class="col-span-full text-center py-6">
                <p class="text-sm" style="color: {$colorStore.text}">{m.pokeflux.noResults()}</p>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/snippet}
  </ApiState>
</DashboardPageLayout>
