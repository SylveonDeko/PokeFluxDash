<script lang="ts">
  import { untrack } from "svelte";
  import { page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import Pagination from "$lib/components/dashboard/Pagination.svelte";
  import { buttonStyle, controlStyle, quietStyle } from "$lib/components/dashboard/styles";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import AuditTable from "$lib/components/admin/AuditTable.svelte";
  import { hrefWith, SNOWFLAKE_PATTERN } from "$lib/components/admin/query";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let staff = $state(untrack(() => data.query.staff ?? ""));
  let target = $state(untrack(() => data.query.target ?? ""));

  $effect(() => {
    staff = data.query.staff ?? "";
    target = data.query.target ?? "";
  });

  let filtered = $derived(!!data.query.staff || !!data.query.target);
  const inputClass = "w-full px-3 py-2 min-h-[38px] rounded-lg border text-sm font-mono";
</script>

<DashboardPageLayout title={m.admin.navAudit()} subtitle={m.admin.auditSubtitle()} icon="fa-clipboard-check">
  <Panel aria-label={m.admin.filters()}>
    <form method="GET" class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end" data-sveltekit-keepfocus data-sveltekit-noscroll>
      <label class="block min-w-0">
        <span class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.staffId()}</span>
        <input name="staff" bind:value={staff} inputmode="numeric" pattern={SNOWFLAKE_PATTERN} autocomplete="off" class={inputClass} style={controlStyle($colorStore)} />
      </label>
      <label class="block min-w-0">
        <span class="block text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.targetId()}</span>
        <input name="target" bind:value={target} inputmode="numeric" pattern={SNOWFLAKE_PATTERN} autocomplete="off" class={inputClass} style={controlStyle($colorStore)} />
      </label>
      <div class="flex gap-2">
        {#if filtered}
          <a href={page.url.pathname} class="flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[38px]" style={quietStyle($colorStore)}>
            {m.pokefluxPokemon.clearFilters()}
          </a>
        {/if}
        <button type="submit" class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]" style={buttonStyle($colorStore)}>
          <i class="fa-solid fa-filter" aria-hidden="true"></i>{m.admin.applyFilters()}
        </button>
      </div>
    </form>
  </Panel>

  <StaffState response={data.audit}>
    {#snippet children(audit)}
      {@const pages = Math.max(1, Math.ceil(audit.total / audit.pageSize))}
      <Panel icon="fa-solid fa-clipboard-check" title={m.admin.recentActions()} subtitle={m.admin.auditHint()}>
        {#if audit.items.length === 0}
          <EmptyState
            title={filtered ? m.admin.noMatchingActions() : m.admin.noActions()}
            icon="fa-solid fa-clipboard"
          />
        {:else}
          <AuditTable entries={audit.items} />
          {#if pages > 1}
            <Pagination
              class="mt-6"
              page={audit.page}
              {pages}
              label={m.admin.navAudit()}
              hrefFor={(p) => hrefWith(page.url, { page: p === 1 ? null : p })}
            />
          {/if}
        {/if}
      </Panel>
    {/snippet}
  </StaffState>
</DashboardPageLayout>
