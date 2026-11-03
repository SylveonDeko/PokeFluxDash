<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle } from "$lib/components/dashboard/styles";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import UserRef from "$lib/components/admin/UserRef.svelte";
  import { formatDateTime, fraudTypeLabel, percent, riskColor, splitWords, statusLabel } from "$lib/components/admin/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const block = $derived(`background: ${$colorStore.primary}10;`);
</script>

<DashboardPageLayout title={m.admin.caseTitle({ id: data.id })} subtitle={m.admin.caseSubtitle()} icon="fa-circle-exclamation">
  {#snippet actions()}
    <a
      href="/dashboard/admin/detections"
      class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-[1.02] min-h-[40px] flex-1 sm:flex-initial min-w-0 whitespace-nowrap font-medium focus:outline-hidden focus:ring-2 focus:ring-offset-2"
      style={buttonStyle($colorStore)}
    >
      <i class="fa-solid fa-arrow-left" style="font-size: 15px;" aria-hidden="true"></i>
      <span class="text-sm">{m.admin.allDetections()}</span>
    </a>
  {/snippet}

  <StaffState response={data.detection}>
    {#snippet children(detection)}
      {@const s = detection.summary}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatTile label={m.admin.colRisk()} tint={riskColor(s.riskScore, $colorStore.accent)}>
          <span class="text-2xl font-bold tabular-nums leading-tight" style="color: {riskColor(s.riskScore, $colorStore.accent)};">{percent(s.riskScore)}</span>
        </StatTile>
        <StatTile label={m.admin.confidence()} value={percent(detection.confidenceLevel)} />
        <StatTile label={m.admin.colType()} value={fraudTypeLabel(s.fraudType)} tint={$colorStore.secondary} />
        <StatTile label={m.admin.colStatus()} value={statusLabel(s.investigationStatus)} tint={$colorStore.secondary} />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel icon="fa-solid fa-users" title={m.admin.colUsers()}>
          <div class="space-y-2">
            <div class="rounded-xl p-3" style={block}>
              <p class="text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.primaryUser()}</p>
              <UserRef user={s.primary} />
            </div>
            <div class="rounded-xl p-3" style={block}>
              <p class="text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.secondaryUser()}</p>
              {#if s.secondary}<UserRef user={s.secondary} />{:else}<span style="color: {$colorStore.muted};">{m.common.none()}</span>{/if}
            </div>
            {#if s.secondary}
              <a
                href="/dashboard/admin/relationship?user1={s.primary.id}&user2={s.secondary.id}"
                class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] min-h-[36px]"
                style={buttonStyle($colorStore)}
              >
                <i class="fa-solid fa-arrow-right-arrow-left" aria-hidden="true"></i>{m.admin.viewRelationship()}
              </a>
            {/if}
          </div>
        </Panel>

        <Panel icon="fa-solid fa-gavel" title={m.admin.actionsTaken()}>
          <dl class="grid grid-cols-2 gap-2 text-sm">
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.automatedAction()}</dt>
              <dd class="font-medium" style="color: {$colorStore.text};">{splitWords(detection.automatedAction)}</dd>
            </div>
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.tradeBlocked()}</dt>
              <dd class="font-medium" style="color: {s.tradeBlocked ? $colorStore.accent : $colorStore.text};">{s.tradeBlocked ? m.common.yes() : m.common.no()}</dd>
            </div>
            <div class="p-3 rounded-lg col-span-2" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.colWhen()}</dt>
              <dd class="font-medium" style="color: {$colorStore.text};">{formatDateTime(s.detectedAt)}</dd>
            </div>
          </dl>
          {#if detection.adminNotes}
            <p class="mt-4 text-sm p-3 rounded-lg whitespace-pre-wrap" style="{block} color: {$colorStore.text};">{detection.adminNotes}</p>
          {/if}
        </Panel>
      </div>

      {#if detection.analysis}
        {@const a = detection.analysis}
        <Panel icon="fa-solid fa-scale-balanced" title={m.admin.tradeAnalysis()}>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <StatTile label={m.admin.senderValue()} value={a.senderTotalValue.toLocaleString()} />
            <StatTile label={m.admin.receiverValue()} value={a.receiverTotalValue.toLocaleString()} />
            <StatTile label={m.admin.valueRatio()} value={`${a.valueRatio.toFixed(2)}x`} tint={$colorStore.secondary} />
            <StatTile label={m.admin.imbalance()} value={percent(a.valueImbalanceScore)} tint={$colorStore.secondary} />
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each a.flags as flag (flag)}
              <span class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium" style="background: {$colorStore.accent}20; color: {$colorStore.accent};">{flag}</span>
            {:else}
              <span class="text-sm" style="color: {$colorStore.muted};">{m.admin.noFlags()}</span>
            {/each}
          </div>
        </Panel>
      {/if}

      <Panel icon="fa-solid fa-list" title={m.admin.triggeredRules()}>
        <pre class="text-xs p-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-words font-mono" style="{block} color: {$colorStore.text};">{detection.triggeredRules || m.common.none()}</pre>
      </Panel>
    {/snippet}
  </StaffState>
</DashboardPageLayout>
