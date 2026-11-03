<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { proxyRequest } from "$lib/api/proxy";
  import type { AdminBanStatus, AdminTradeLogEntry } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle, dangerStyle } from "$lib/components/dashboard/styles";
  import SettingToggle from "$lib/components/forms/SettingToggle.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";
  import StaffState from "$lib/components/admin/StaffState.svelte";
  import DataTable from "$lib/components/admin/DataTable.svelte";
  import UserRef from "$lib/components/admin/UserRef.svelte";
  import ListingTable from "$lib/components/admin/ListingTable.svelte";
  import DetectionTable from "$lib/components/admin/DetectionTable.svelte";
  import ReasonDialog from "$lib/components/admin/ReasonDialog.svelte";
  import { formatDateTime, splitWords } from "$lib/components/admin/format";
  import { hasRank } from "$lib/staff";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let banOpen = $state(false);
  let unbanOpen = $state(false);
  let marketBan = $state(true);

  let canBan = $derived(hasRank(data.staff.staffRank, "Admin"));
  const block = $derived(`background: ${$colorStore.primary}10;`);
  const actionClass =
    "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] min-h-[36px]";
  const tradeColumns = $derived([m.admin.colWhen(), m.admin.colKind(), m.admin.colPartner(), m.admin.colSent(), m.admin.colReceived()]);

  const partner = (t: AdminTradeLogEntry) => (t.sender.id === data.userId ? t.receiver : t.sender);
  const sent = (t: AdminTradeLogEntry) => t.sender.id === data.userId;

  function moved(credits: number, redeems: number, pokemon: number, tokens: Record<string, number>): string {
    const parts = [
      credits ? m.pokefluxMarket.amountCredits({ amount: credits.toLocaleString() }) : null,
      redeems ? m.pokefluxMarket.amountRedeems({ amount: redeems.toLocaleString() }) : null,
      pokemon ? m.admin.pokemonCount({ count: pokemon }) : null,
      ...Object.entries(tokens).map(([type, count]) => m.admin.tokensCount({ type, count: count.toLocaleString() })),
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "-";
  }

  const given = (t: AdminTradeLogEntry) =>
    sent(t)
      ? moved(t.senderCredits, t.senderRedeems, t.senderPokemon, t.senderTokens)
      : moved(t.receiverCredits, t.receiverRedeems, t.receiverPokemon, t.receiverTokens);
  const got = (t: AdminTradeLogEntry) =>
    sent(t)
      ? moved(t.receiverCredits, t.receiverRedeems, t.receiverPokemon, t.receiverTokens)
      : moved(t.senderCredits, t.senderRedeems, t.senderPokemon, t.senderTokens);

  async function tradeBan(reason: string) {
    const result = await proxyRequest("POST", `admin/trade/users/${encodeURIComponent(data.userId)}/tradeban`, { reason, marketBan });
    toast.success(result.message);
    await invalidateAll();
  }

  async function removeBans(reason: string) {
    const result = await proxyRequest("POST", `admin/trade/users/${encodeURIComponent(data.userId)}/detradeban`, { reason });
    toast.success(result.message);
    await invalidateAll();
  }
</script>

{#snippet ban(label: string, status: AdminBanStatus)}
  <div class="rounded-xl p-3" style={block}>
    <div class="flex items-center justify-between gap-2">
      <span class="font-semibold" style="color: {$colorStore.text};">{label}</span>
      <span
        class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium"
        style="background: {status.active ? $colorStore.accent : '#22c55e'}20; color: {status.active ? $colorStore.accent : '#22c55e'};"
      >
        {status.active ? m.admin.banned() : m.admin.notBanned()}
      </span>
    </div>
    {#if status.active && status.reason}
      <p class="mt-2 text-sm break-words" style="color: {$colorStore.text};">{status.reason}</p>
    {/if}
    {#if status.date}
      <p class="mt-1 text-xs" style="color: {$colorStore.muted};">{m.admin.lastChanged({ date: formatDateTime(status.date) })}</p>
    {/if}
  </div>
{/snippet}

{#snippet partnerCell(t: AdminTradeLogEntry)}
  {@const other = partner(t)}
  <div class="flex flex-col gap-1">
    <UserRef user={other} />
    <a href="/dashboard/admin/relationship?user1={data.userId}&user2={other.id}" class="text-xs hover:underline" style="color: {$colorStore.primary};">
      {m.admin.viewRelationship()}
    </a>
  </div>
{/snippet}

<DashboardPageLayout
  title={data.user.ok ? (data.user.data.name ?? data.userId) : m.admin.navUsers()}
  subtitle={m.admin.userSubtitle()}
  icon="fa-circle-user"
>
  {#snippet actions()}
    <a
      href="/dashboard/admin/users"
      class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-[1.02] min-h-[40px] flex-1 sm:flex-initial min-w-0 whitespace-nowrap font-medium focus:outline-hidden focus:ring-2 focus:ring-offset-2"
      style={buttonStyle($colorStore)}
    >
      <i class="fa-solid fa-arrow-left" style="font-size: 15px;" aria-hidden="true"></i>
      <span class="text-sm">{m.admin.findUser()}</span>
    </a>
  {/snippet}

  <StaffState response={data.user}>
    {#snippet children(user)}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatTile label={m.dashboard.credits()} value={user.credits} />
        <StatTile label={m.dashboard.redeems()} value={user.redeems} tint={$colorStore.secondary} />
        <StatTile label={m.pokefluxMarket.leaderboardPokemonValue()} value={user.pokemonCount} />
        <StatTile label={m.admin.colRank()} value={user.staffRank} tint={$colorStore.secondary} />
      </div>

      <Panel icon="fa-solid fa-gavel" title={m.admin.bans()}>
        {#snippet actions()}
          {#if canBan}
            {#if !user.tradeBan.active}
              <button type="button" class={actionClass} style={dangerStyle($colorStore)} onclick={() => { marketBan = true; banOpen = true; }}>
                <i class="fa-solid fa-ban" aria-hidden="true"></i>{m.admin.tradeBan()}
              </button>
            {/if}
            {#if user.tradeBan.active || user.marketBan.active}
              <button type="button" class={actionClass} style={buttonStyle($colorStore)} onclick={() => (unbanOpen = true)}>
                <i class="fa-solid fa-unlock" aria-hidden="true"></i>{m.admin.removeBans()}
              </button>
            {/if}
          {/if}
        {/snippet}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          {@render ban(m.admin.tradeBan(), user.tradeBan)}
          {@render ban(m.admin.marketBanLabel(), user.marketBan)}
        </div>
        <dl class="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <div class="px-3 py-2 rounded-lg" style={block}>
            <dt style="color: {$colorStore.muted};">{m.admin.userId()}</dt>
            <dd class="font-mono break-all" style="color: {$colorStore.text};">{user.id}</dd>
          </div>
          <div class="px-3 py-2 rounded-lg" style={block}>
            <dt style="color: {$colorStore.muted};">{m.dashboard.region()}</dt>
            <dd class="font-medium" style="color: {$colorStore.text};">{splitWords(user.region)}</dd>
          </div>
          <div class="px-3 py-2 rounded-lg" style={block}>
            <dt style="color: {$colorStore.muted};">{m.admin.tradeLock()}</dt>
            <dd class="font-medium" style="color: {$colorStore.text};">{user.tradeLocked ? m.common.yes() : m.common.no()}</dd>
          </div>
          <div class="px-3 py-2 rounded-lg" style={block}>
            <dt style="color: {$colorStore.muted};">{m.admin.botBanned()}</dt>
            <dd class="font-medium" style="color: {user.botBanned ? $colorStore.accent : $colorStore.text};">{user.botBanned ? m.common.yes() : m.common.no()}</dd>
          </div>
        </dl>
      </Panel>

      <Panel icon="fa-solid fa-arrow-right-arrow-left" title={m.admin.tradesAndGifts()} subtitle={m.admin.tradesAndGiftsHint()}>
        {#if user.recentTrades.length === 0}
          <EmptyState title={m.admin.noTrades()} icon="fa-solid fa-arrow-right-arrow-left" compact />
        {:else}
          <DataTable rows={user.recentTrades} key={(t) => t.id} columns={tradeColumns} caption={m.admin.tradesAndGifts()}>
            {#snippet row(t)}
              <td class="px-3 py-2 whitespace-nowrap" style="color: {$colorStore.muted};">{formatDateTime(t.time)}</td>
              <td class="px-3 py-2" style="color: {$colorStore.text};">{splitWords(t.command)}</td>
              <td class="px-3 py-2">{@render partnerCell(t)}</td>
              <td class="px-3 py-2 tabular-nums" style="color: {$colorStore.text};">{given(t)}</td>
              <td class="px-3 py-2 tabular-nums" style="color: {$colorStore.text};">{got(t)}</td>
            {/snippet}
            {#snippet card(t)}
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium text-sm" style="color: {$colorStore.text};">{splitWords(t.command)}</span>
                <span class="text-xs" style="color: {$colorStore.muted};">{formatDateTime(t.time)}</span>
              </div>
              <div class="mt-2 text-sm">{@render partnerCell(t)}</div>
              <dl class="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><dt style="color: {$colorStore.muted};">{m.admin.colSent()}</dt><dd style="color: {$colorStore.text};">{given(t)}</dd></div>
                <div><dt style="color: {$colorStore.muted};">{m.admin.colReceived()}</dt><dd style="color: {$colorStore.text};">{got(t)}</dd></div>
              </dl>
            {/snippet}
          </DataTable>
        {/if}
      </Panel>

      <Panel icon="fa-solid fa-tag" title={m.admin.recentListings()}>
        {#if user.recentListings.length === 0}
          <EmptyState title={m.admin.noListings()} icon="fa-solid fa-store" compact />
        {:else}
          <ListingTable listings={user.recentListings} />
        {/if}
      </Panel>

      <Panel icon="fa-solid fa-cart-shopping" title={m.admin.recentPurchases()}>
        {#if user.recentPurchases.length === 0}
          <EmptyState title={m.admin.noPurchases()} icon="fa-solid fa-cart-shopping" compact />
        {:else}
          <ListingTable listings={user.recentPurchases} />
        {/if}
      </Panel>

      <Panel icon="fa-solid fa-circle-exclamation" title={m.admin.userDetections()}>
        {#if user.detections.length === 0}
          <EmptyState title={m.admin.noUserDetections()} icon="fa-solid fa-circle-check" compact />
        {:else}
          <DetectionTable detections={user.detections} />
        {/if}
      </Panel>
    {/snippet}
  </StaffState>
</DashboardPageLayout>

<ReasonDialog
  bind:open={banOpen}
  title={m.admin.tradeBanTitle()}
  message={m.admin.tradeBanMessage()}
  confirmLabel={m.admin.tradeBan()}
  onconfirm={tradeBan}
>
  <SettingToggle
    id="pf-market-ban"
    label={m.admin.alsoMarketBan()}
    hint={m.admin.alsoMarketBanHint()}
    checked={marketBan}
    onchange={(checked) => (marketBan = checked)}
  />
</ReasonDialog>

<ReasonDialog
  bind:open={unbanOpen}
  title={m.admin.removeBansTitle()}
  message={m.admin.removeBansMessage()}
  confirmLabel={m.admin.removeBans()}
  variant="warning"
  onconfirm={removeBans}
/>
