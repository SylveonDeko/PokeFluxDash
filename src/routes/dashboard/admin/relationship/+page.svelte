<script lang="ts">
  import { untrack } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { proxyRequest } from "$lib/api/proxy";
  import type { AdminRelationship } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle, controlStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import UserRef from "$lib/components/admin/UserRef.svelte";
  import ReasonDialog from "$lib/components/admin/ReasonDialog.svelte";
  import { formatDateTime, percent, riskColor } from "$lib/components/admin/format";
  import { hasRank } from "$lib/staff";
  import { SNOWFLAKE_PATTERN } from "$lib/components/admin/query";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let user1 = $state(untrack(() => data.user1));
  let user2 = $state(untrack(() => data.user2));
  let whitelistOpen = $state(false);
  let target = $state<AdminRelationship | null>(null);

  $effect(() => {
    user1 = data.user1;
    user2 = data.user2;
  });

  let canWhitelist = $derived(hasRank(data.staff.staffRank, "Admin"));
  const block = $derived(`background: ${$colorStore.primary}10;`);

  async function whitelist(reason: string) {
    if (!target) return;
    const result = await proxyRequest("POST", "admin/trade/relationship/whitelist", {
      user1: target.user1.id,
      user2: target.user2.id,
      reason,
    });
    toast.success(result.message);
    await invalidateAll();
  }
</script>

<DashboardPageLayout title={m.admin.navRelationship()} subtitle={m.admin.relationshipSubtitle()} icon="fa-arrow-right-arrow-left">
  <Panel aria-label={m.admin.lookUpPair()}>
    <form method="GET" class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2" data-sveltekit-keepfocus role="search">
      <label class="sr-only" for="pf-rel-user1">{m.admin.firstUserId()}</label>
      <input
        id="pf-rel-user1"
        name="user1"
        bind:value={user1}
        inputmode="numeric"
        pattern={SNOWFLAKE_PATTERN}
        required
        autocomplete="off"
        placeholder={m.admin.firstUserId()}
        class="px-3 py-2 min-h-[38px] rounded-lg border text-sm font-mono"
        style={controlStyle($colorStore)}
      />
      <label class="sr-only" for="pf-rel-user2">{m.admin.secondUserId()}</label>
      <input
        id="pf-rel-user2"
        name="user2"
        bind:value={user2}
        inputmode="numeric"
        pattern={SNOWFLAKE_PATTERN}
        required
        autocomplete="off"
        placeholder={m.admin.secondUserId()}
        class="px-3 py-2 min-h-[38px] rounded-lg border text-sm font-mono"
        style={controlStyle($colorStore)}
      />
      <button
        type="submit"
        class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px]"
        style={buttonStyle($colorStore)}
      >
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>{m.admin.lookUp()}
      </button>
    </form>
  </Panel>

  {#if !data.relationship}
    <EmptyState title={m.admin.pairPrompt()} icon="fa-solid fa-arrow-right-arrow-left" />
  {:else if !data.relationship.ok && data.relationship.status === 404}
    <EmptyState title={m.admin.noRelationship()} message={data.relationship.error} icon="fa-solid fa-user-xmark" />
  {:else}
    <StaffState response={data.relationship}>
      {#snippet children(r)}
        <Panel icon="fa-solid fa-arrow-right-arrow-left" title={m.admin.tradeHistory()}>
          {#snippet actions()}
            {#if canWhitelist && !r.whitelisted}
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] min-h-[36px]"
                style={buttonStyle($colorStore)}
                onclick={() => {
                  target = r;
                  whitelistOpen = true;
                }}
              >
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{m.admin.whitelist()}
              </button>
            {/if}
          {/snippet}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <div class="rounded-xl p-3" style={block}>
              <p class="text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.givenValue({ value: r.user1GivenValue.toLocaleString() })}</p>
              <UserRef user={r.user1} />
            </div>
            <div class="rounded-xl p-3" style={block}>
              <p class="text-xs mb-1" style="color: {$colorStore.muted};">{m.admin.givenValue({ value: r.user2GivenValue.toLocaleString() })}</p>
              <UserRef user={r.user2} />
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <StatTile label={m.admin.totalTrades()} value={r.totalTrades} />
            <StatTile label={m.admin.balancedTrades()} value={`${r.balancedTrades}/${r.totalTrades}`} />
            <StatTile label={m.admin.colRisk()} tint={riskColor(r.riskScore, $colorStore.accent)}>
              <span class="text-2xl font-bold tabular-nums leading-tight" style="color: {riskColor(r.riskScore, $colorStore.accent)};">{percent(r.riskScore)}</span>
            </StatTile>
            <StatTile label={m.admin.valueRatio()} value={`${r.valueImbalanceRatio.toFixed(2)}x`} />
          </div>
          <dl class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.firstTrade()}</dt>
              <dd class="font-medium" style="color: {$colorStore.text};">{formatDateTime(r.firstTrade)}</dd>
            </div>
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.lastTrade()}</dt>
              <dd class="font-medium" style="color: {$colorStore.text};">{formatDateTime(r.lastTrade)}</dd>
            </div>
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.tradesPerDay()}</dt>
              <dd class="font-medium tabular-nums" style="color: {$colorStore.text};">{r.tradesPerDay.toFixed(2)}</dd>
            </div>
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.accountAgeGap()}</dt>
              <dd class="font-medium tabular-nums" style="color: {$colorStore.text};">{m.admin.daysCount({ count: r.accountAgeDifferenceDays })}</dd>
            </div>
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.suspiciousTiming()}</dt>
              <dd class="font-medium" style="color: {r.suspiciousTiming ? $colorStore.accent : $colorStore.text};">{r.suspiciousTiming ? m.common.yes() : m.common.no()}</dd>
            </div>
            <div class="px-3 py-2 rounded-lg" style={block}>
              <dt style="color: {$colorStore.muted};">{m.admin.whitelisted()}</dt>
              <dd class="font-medium" style="color: {$colorStore.text};">{r.whitelisted ? m.common.yes() : m.common.no()}</dd>
            </div>
          </dl>
          {#if r.flags.length}
            <div class="mt-4 flex flex-wrap gap-2">
              {#each r.flags as flag (flag)}
                <span class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium" style="background: {$colorStore.accent}20; color: {$colorStore.accent};">{flag}</span>
              {/each}
            </div>
          {/if}
          {#if r.adminNotes}
            <p class="mt-4 text-sm p-3 rounded-lg" style="{block} color: {$colorStore.text};">{r.adminNotes}</p>
          {/if}
        </Panel>
      {/snippet}
    </StaffState>
  {/if}
</DashboardPageLayout>

<ReasonDialog
  bind:open={whitelistOpen}
  title={m.admin.whitelistTitle()}
  message={m.admin.whitelistMessage()}
  confirmLabel={m.admin.whitelist()}
  variant="warning"
  onconfirm={whitelist}
/>
