<script lang="ts">
  import { untrack } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import { buttonStyle } from "$lib/components/dashboard/styles";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import DataTable from "$lib/components/admin/DataTable.svelte";
  import UserRef from "$lib/components/admin/UserRef.svelte";
  import BanBadges from "$lib/components/admin/BanBadges.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let search = $state(untrack(() => data.search));

  $effect(() => {
    search = data.search;
  });

  const columns = $derived([m.admin.colUser(), m.admin.colRank(), m.admin.bans()]);
</script>

<DashboardPageLayout title={m.admin.navUsers()} subtitle={m.admin.usersSubtitle()} icon="fa-circle-user">
  <Panel aria-label={m.admin.findUser()}>
    <form method="GET" class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2" data-sveltekit-keepfocus role="search">
      <SearchInput name="search" maxlength={50} bind:value={search} placeholder={m.admin.userSearchPlaceholder()} required />
      <button
        type="submit"
        class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]"
        style={buttonStyle($colorStore)}
      >
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>{m.admin.lookUp()}
      </button>
    </form>
  </Panel>

  {#if !data.results}
    <EmptyState title={m.admin.userPrompt()} message={m.admin.userPromptHint()} icon="fa-solid fa-circle-user" />
  {:else}
    <StaffState response={data.results}>
      {#snippet children(users)}
        {#if users.length === 0}
          <EmptyState title={m.admin.noUsers()} message={m.pokeflux.noResultsHint()} icon="fa-solid fa-magnifying-glass" />
        {:else}
          <DataTable rows={users} key={(u) => u.id} {columns} caption={m.admin.navUsers()}>
            {#snippet row(u)}
              <td class="px-3 py-2"><UserRef user={u} /></td>
              <td class="px-3 py-2" style="color: {$colorStore.text};">{u.staffRank}</td>
              <td class="px-3 py-2"><BanBadges trade={u.tradeBanned} market={u.marketBanned} /></td>
            {/snippet}
            {#snippet card(u)}
              <div class="flex items-start justify-between gap-2">
                <UserRef user={u} />
                <span class="text-xs" style="color: {$colorStore.muted};">{u.staffRank}</span>
              </div>
              <div class="mt-2"><BanBadges trade={u.tradeBanned} market={u.marketBanned} /></div>
            {/snippet}
          </DataTable>
        {/if}
      {/snippet}
    </StaffState>
  {/if}
</DashboardPageLayout>
