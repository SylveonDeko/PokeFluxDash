<!--
@component
Fraud detections as a staff list, each linking to its case.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { AdminDetectionSummary } from "$lib/api";
  import DataTable from "./DataTable.svelte";
  import UserRef from "./UserRef.svelte";
  import { formatDateTime, fraudTypeLabel, percent, riskColor, statusLabel } from "./format";

  interface Props {
    detections: AdminDetectionSummary[];
  }

  let { detections }: Props = $props();

  const columns = $derived([
    m.admin.colCase(),
    m.admin.colUsers(),
    m.admin.colRisk(),
    m.admin.colType(),
    m.admin.colStatus(),
    m.admin.colWhen(),
  ]);
</script>

{#snippet risk(d: AdminDetectionSummary)}
  <span
    class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold tabular-nums"
    style="background: {riskColor(d.riskScore, $colorStore.accent)}20; color: {riskColor(d.riskScore, $colorStore.accent)};"
  >
    {percent(d.riskScore)}
  </span>
  {#if d.tradeBlocked}
    <span class="ml-1 text-xs font-medium" style="color: {$colorStore.accent};">{m.admin.blocked()}</span>
  {/if}
{/snippet}

{#snippet caseLink(d: AdminDetectionSummary)}
  <a href="/dashboard/admin/detections/{d.id}" class="font-semibold font-mono hover:underline" style="color: {$colorStore.primary};">
    #{d.id}
  </a>
{/snippet}

<DataTable rows={detections} key={(d) => d.id} {columns} caption={m.admin.navDetections()}>
  {#snippet row(d)}
    <td class="px-3 py-2">{@render caseLink(d)}</td>
    <td class="px-3 py-2">
      <div class="flex flex-col gap-1">
        <UserRef user={d.primary} />
        {#if d.secondary}<UserRef user={d.secondary} />{/if}
      </div>
    </td>
    <td class="px-3 py-2 whitespace-nowrap">{@render risk(d)}</td>
    <td class="px-3 py-2" style="color: {$colorStore.text};">{fraudTypeLabel(d.fraudType)}</td>
    <td class="px-3 py-2" style="color: {$colorStore.text};">{statusLabel(d.investigationStatus)}</td>
    <td class="px-3 py-2 whitespace-nowrap" style="color: {$colorStore.muted};">{formatDateTime(d.detectedAt)}</td>
  {/snippet}
  {#snippet card(d)}
    <div class="flex items-center justify-between gap-2">
      {@render caseLink(d)}
      <span class="text-xs" style="color: {$colorStore.muted};">{formatDateTime(d.detectedAt)}</span>
    </div>
    <div class="mt-2">{@render risk(d)}</div>
    <p class="mt-2 text-sm" style="color: {$colorStore.text};">{fraudTypeLabel(d.fraudType)} · {statusLabel(d.investigationStatus)}</p>
    <div class="mt-2 flex flex-col gap-1 text-sm">
      <UserRef user={d.primary} />
      {#if d.secondary}<UserRef user={d.secondary} />{/if}
    </div>
  {/snippet}
</DataTable>
