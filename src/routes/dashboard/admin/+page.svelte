<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle } from "$lib/components/dashboard/styles";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import DetectionTable from "$lib/components/admin/DetectionTable.svelte";
  import AuditTable from "$lib/components/admin/AuditTable.svelte";
  import { hrefWith } from "$lib/components/admin/query";
  import { hoursLabel, STAT_WINDOWS } from "./windows";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const linkClass =
    "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] min-h-[36px]";
</script>

<DashboardPageLayout title={m.pokefluxMarket.admin()} subtitle={m.admin.overviewSubtitle()} icon="fa-shield-halved">
  <StaffState response={data.stats}>
    {#snippet children(stats)}
      <Panel icon="fa-solid fa-chart-simple" title={m.admin.fraudStats()}>
        {#snippet actions()}
          <div class="w-full sm:w-56">
            <DiscordSelector
              type="custom"
              customIcon="fa-calendar"
              options={STAT_WINDOWS.map((days) => ({ id: days, name: hoursLabel(Number(days) * 24) }))}
              selected={String(data.days)}
              searchable={false}
              ariaLabel={m.admin.windowLabel()}
              onchange={({ selected }) =>
                typeof selected === "string" && goto(hrefWith(page.url, { days: selected === "7" ? null : selected }), { noScroll: true, keepFocus: true })}
            />
          </div>
        {/snippet}
        <div class="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-2">
          <StatTile label={m.admin.statTotal()} value={stats.totalDetections} />
          <StatTile label={m.admin.statBlocked()} value={stats.blockedTrades} tint={$colorStore.accent} />
          <StatTile label={m.admin.statHigh()} value={stats.highRisk} tint={$colorStore.accent} />
          <StatTile label={m.admin.statMedium()} value={stats.mediumRisk} tint="#f59e0b" />
          <StatTile label={m.admin.statLow()} value={stats.lowRisk} tint="#22c55e" />
          <StatTile label={m.admin.fraudAlt()} value={stats.altAccountFlags} tint={$colorStore.secondary} />
          <StatTile label={m.admin.fraudRmt()} value={stats.rmtFlags} tint={$colorStore.secondary} />
          <StatTile label={m.admin.fraudNewbie()} value={stats.newbieExploitFlags} tint={$colorStore.secondary} />
        </div>
      </Panel>

      <Panel icon="fa-solid fa-circle-exclamation" title={m.admin.riskiestToday()}>
        {#snippet actions()}
          <a href="/dashboard/admin/detections" class={linkClass} style={buttonStyle($colorStore)}>
            {m.admin.viewAll()}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </a>
        {/snippet}
        <StaffState response={data.detections}>
          {#snippet children(list)}
            {#if list.items.length === 0}
              <EmptyState title={m.admin.noDetections()} icon="fa-solid fa-circle-check" compact />
            {:else}
              <DetectionTable detections={list.items} />
            {/if}
          {/snippet}
        </StaffState>
      </Panel>

      <Panel icon="fa-solid fa-clipboard-check" title={m.admin.recentActions()}>
        {#snippet actions()}
          <a href="/dashboard/admin/audit" class={linkClass} style={buttonStyle($colorStore)}>
            {m.admin.viewAll()}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </a>
        {/snippet}
        <StaffState response={data.audit}>
          {#snippet children(audit)}
            {#if audit.items.length === 0}
              <EmptyState title={m.admin.noActions()} icon="fa-solid fa-clipboard" compact />
            {:else}
              <AuditTable entries={audit.items} />
            {/if}
          {/snippet}
        </StaffState>
      </Panel>
    {/snippet}
  </StaffState>
</DashboardPageLayout>
