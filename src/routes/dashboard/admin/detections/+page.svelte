<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { m } from "$lib/i18n";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import Pagination from "$lib/components/dashboard/Pagination.svelte";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import DetectionTable from "$lib/components/admin/DetectionTable.svelte";
  import { percent } from "$lib/components/admin/format";
  import { hrefWith } from "$lib/components/admin/query";
  import { DETECTION_WINDOWS, hoursLabel } from "../windows";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<DashboardPageLayout title={m.admin.navDetections()} subtitle={m.admin.detectionsSubtitle()} icon="fa-circle-exclamation">
  <StaffState response={data.detections}>
    {#snippet children(list)}
      {@const pages = Math.max(1, Math.ceil(list.total / list.pageSize))}
      <Panel
        icon="fa-solid fa-circle-exclamation"
        title={hoursLabel(list.hours)}
        subtitle={m.admin.detectionsHint({ min: percent(list.minRiskScore), total: list.total })}
      >
        {#snippet actions()}
          <div class="w-full sm:w-56">
            <DiscordSelector
              type="custom"
              customIcon="fa-clock"
              options={DETECTION_WINDOWS.map((hours) => ({ id: hours, name: hoursLabel(Number(hours)) }))}
              selected={String(data.hours)}
              searchable={false}
              ariaLabel={m.admin.windowLabel()}
              onchange={({ selected }) =>
                typeof selected === "string" &&
                goto(hrefWith(page.url, { hours: selected === "24" ? null : selected, page: null }), { noScroll: true, keepFocus: true })}
            />
          </div>
        {/snippet}
        {#if list.items.length === 0}
          <EmptyState title={m.admin.noDetections()} icon="fa-solid fa-circle-check" compact />
        {:else}
          <DetectionTable detections={list.items} />
          {#if pages > 1}
            <Pagination
              class="mt-4"
              page={list.page}
              {pages}
              label={m.admin.navDetections()}
              hrefFor={(p) => hrefWith(page.url, { page: p === 1 ? null : p })}
            />
          {/if}
        {/if}
      </Panel>
    {/snippet}
  </StaffState>
</DashboardPageLayout>
