<!--
@component
Staff actions taken through the dashboard, newest first.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { AdminAuditEntry } from "$lib/api";
  import DataTable from "./DataTable.svelte";
  import UserRef from "./UserRef.svelte";
  import { auditActionLabel, formatDateTime } from "./format";

  interface Props {
    entries: AdminAuditEntry[];
  }

  let { entries }: Props = $props();

  const columns = $derived([m.admin.colWhen(), m.admin.colStaff(), m.admin.colAction(), m.admin.colTarget(), m.admin.reasonLabel()]);
</script>

{#snippet action(e: AdminAuditEntry)}
  <span class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium" style="background: {$colorStore.primary}20; color: {$colorStore.primary};">
    {auditActionLabel(e.action)}
  </span>
  {#if e.details}
    <span class="block text-xs mt-1" style="color: {$colorStore.muted};">{e.details}</span>
  {/if}
{/snippet}

<DataTable rows={entries} key={(e) => e.id} {columns} caption={m.admin.navAudit()}>
  {#snippet row(e)}
    <td class="px-3 py-2 whitespace-nowrap" style="color: {$colorStore.muted};">{formatDateTime(e.createdAt)}</td>
    <td class="px-3 py-2"><UserRef user={e.staff} plain /></td>
    <td class="px-3 py-2">{@render action(e)}</td>
    <td class="px-3 py-2">
      {#if e.target}<UserRef user={e.target} />{:else}<span style="color: {$colorStore.muted};">-</span>{/if}
    </td>
    <td class="px-3 py-2 break-words max-w-xs" style="color: {$colorStore.text};">{e.reason}</td>
  {/snippet}
  {#snippet card(e)}
    <div class="flex items-center justify-between gap-2">
      <span class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium" style="background: {$colorStore.primary}20; color: {$colorStore.primary};">
        {auditActionLabel(e.action)}
      </span>
      <span class="text-xs" style="color: {$colorStore.muted};">{formatDateTime(e.createdAt)}</span>
    </div>
    {#if e.details}<p class="mt-1 text-xs" style="color: {$colorStore.muted};">{e.details}</p>{/if}
    <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
      <div>
        <p class="text-xs" style="color: {$colorStore.muted};">{m.admin.colStaff()}</p>
        <UserRef user={e.staff} plain />
      </div>
      {#if e.target}
        <div>
          <p class="text-xs" style="color: {$colorStore.muted};">{m.admin.colTarget()}</p>
          <UserRef user={e.target} />
        </div>
      {/if}
    </div>
    <p class="mt-3 text-sm break-words" style="color: {$colorStore.text};">{e.reason}</p>
  {/snippet}
</DataTable>
