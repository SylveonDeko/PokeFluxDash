<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { requestConfirmation } from "$lib/stores/confirmationStore";
  import type { AchievementProgress, LoyaltyStatus, MissionStoreItem } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle, chipStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import { EmptyState, humanize } from "$lib/components/pokeflux";
  import Meter from "$lib/components/collection/Meter.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let category = $state<string | null>(null);

  function achievementName(a: AchievementProgress): string {
    return a.name === a.key || /_/.test(a.name) ? humanize(a.name) : a.name;
  }

  async function askBuy(item: MissionStoreItem) {
    const confirmed = await requestConfirmation({
      title: m.pokefluxMarket.shopBuyTitle(),
      message: m.pokefluxMarket.missionBuyMessage({ name: item.name, cost: item.cost.toLocaleString() }),
      confirmText: m.pokefluxMarket.buy(),
      variant: "info",
    });
    if (!confirmed) return;
    try {
      const result = await proxyRequest("POST", "me/missions/buy", { item: item.key });
      toast.success(result.message);
      await invalidateAll();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const rowStyle = $derived(`background: ${$colorStore.primary}10; border-color: ${$colorStore.primary}30;`);
</script>

{#snippet loyaltyPanel(loyalty: LoyaltyStatus)}
  <Panel icon="fa-solid fa-crown" title={m.pokefluxMarket.loyaltyTitle()}>
    <div class="flex flex-col sm:flex-row sm:items-start gap-3">
      <div class="flex-1 min-w-0 space-y-0.5">
        <p class="font-semibold" style="color: {$colorStore.text};">
          <i class="fa-solid fa-crown mr-2" style="color: {$colorStore.secondary};" aria-hidden="true"></i>{loyalty.tier.name}
        </p>
        <p class="text-sm" style="color: {$colorStore.muted};">
          {m.pokefluxMarket.tierPerks({ xp: loyalty.tier.xpMultiplier, discount: loyalty.tier.shopDiscount })}
        </p>
        <p class="text-sm" style="color: {$colorStore.muted};">
          {m.pokefluxMarket.tierBonus({ bonus: loyalty.tier.monthlyBonus.toLocaleString() })}
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:w-64 shrink-0">
        <StatTile label={m.pokefluxMarket.loyaltyPoints()} value={loyalty.points} />
        <StatTile label={m.pokefluxMarket.dailyStreak()} value={loyalty.dailyStreak} tint={$colorStore.secondary} />
      </div>
    </div>
    <div class="mt-3 min-w-0">
      {#if loyalty.nextTier}
        <Meter
          value={loyalty.points}
          max={loyalty.nextTier.requiredPoints}
          label={m.pokefluxMarket.nextTierProgress({
            points: loyalty.points.toLocaleString(),
            required: loyalty.nextTier.requiredPoints.toLocaleString(),
            tier: loyalty.nextTier.name,
          })}
        />
      {:else}
        <p class="text-sm" style="color: {$colorStore.text};">{m.pokefluxMarket.topTier({ points: loyalty.points.toLocaleString() })}</p>
      {/if}
    </div>
    {#if loyalty.nextStreakBonus > 0}
      <p class="text-sm mt-2" style="color: {$colorStore.muted};">
        {m.pokefluxMarket.nextStreakBonus({ days: loyalty.nextStreakBonus, left: Math.max(0, loyalty.nextStreakBonus - loyalty.dailyStreak) })}
      </p>
    {/if}
  </Panel>
{/snippet}

<DashboardPageLayout title={m.features.missions()} subtitle={m.dashboard.missionsSubtitle()} icon="fa-trophy">
  <ApiState response={data.missions} notStartedOn404>
    {#snippet children(missions)}
      {@const levelSpan = missions.nextLevelXp === null ? null : missions.nextLevelXp - missions.levelStartXp}
      <Panel class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center" aria-labelledby="pf-mission-level">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
            style="background: linear-gradient(135deg, {$colorStore.primary}20, {$colorStore.secondary}20);"
          >
            <span class="text-[10px] uppercase tracking-wide leading-tight" style="color: {$colorStore.muted};">{m.pokefluxMarket.levelShortLabel()}</span>
            <span class="text-xl font-bold leading-none tabular-nums" style="color: {$colorStore.text};">{missions.level}</span>
          </div>
          <div class="min-w-0 flex-1 space-y-1.5">
            <div>
              <h2 id="pf-mission-level" class="text-lg font-semibold truncate leading-tight" style="color: {$colorStore.text};">{missions.title}</h2>
              <p class="text-sm" style="color: {$colorStore.muted};">{m.dashboard.missionLevel({ level: missions.level })}</p>
            </div>
            {#if levelSpan === null}
              <p class="text-sm" style="color: {$colorStore.text};">{m.pokefluxMarket.maxMissionLevel({ xp: missions.xp.toLocaleString() })}</p>
            {:else}
              <Meter
                value={missions.xp - missions.levelStartXp}
                max={levelSpan}
                label={m.pokefluxMarket.xpProgress({ xp: (missions.xp - missions.levelStartXp).toLocaleString(), next: levelSpan.toLocaleString() })}
              />
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 lg:w-[22rem]">
          <StatTile label={m.pokefluxMarket.crystalSlime()} value={missions.crystalSlime} tint={$colorStore.accent} />
          <StatTile label={m.dashboard.slime()} value={missions.slime} tint={$colorStore.secondary} />
        </div>
      </Panel>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div class="space-y-4 min-w-0">
        <Panel icon="fa-solid fa-list-check" title={m.dashboard.activeMissions({ count: missions.missions.length })}>
          {#if missions.missions.length}
            <ul class="space-y-2">
              {#each missions.missions as mission (mission.key)}
                {@const done = mission.progress >= mission.target}
                <li class="px-3 py-2.5 rounded-lg border transition-all duration-200" style="background: {$colorStore.primary}10; border-color: {done ? '#22c55e55' : $colorStore.primary + '30'};">
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div class="min-w-0">
                      <h3 class="font-medium" style="color: {$colorStore.text};">
                        {#if done}<i class="fa-solid fa-circle-check mr-1" style="color: #22c55e;" aria-hidden="true"></i>{/if}{mission.name.trim()}
                      </h3>
                      <p class="text-sm" style="color: {$colorStore.muted};">{mission.description}</p>
                    </div>
                    <span
                      class="text-xs font-medium px-2 py-1 rounded-lg shrink-0 tabular-nums"
                      style="background: {$colorStore.accent}20; color: {$colorStore.accent};"
                      title={m.pokefluxMarket.rewardLabel()}
                    >
                      <i class="fa-solid fa-gem mr-1" aria-hidden="true"></i>
                      <span class="sr-only">{m.pokefluxMarket.rewardLabel()}: </span>{m.pokefluxMarket.amountCrystalSlime({ amount: mission.reward.toLocaleString() })}
                    </span>
                  </div>
                  <Meter
                    value={mission.progress}
                    max={mission.target}
                    color={done ? "#22c55e" : undefined}
                    label={m.pokefluxMarket.progressOf({ value: Math.min(mission.progress, mission.target).toLocaleString(), max: mission.target.toLocaleString() })}
                  />
                </li>
              {/each}
            </ul>
          {:else}
            <EmptyState title={m.pokefluxMarket.noMissions()} icon="fa-solid fa-list-check" compact />
          {/if}
        </Panel>
        {#if data.achievements.ok}
          {@render loyaltyPanel(data.achievements.data.loyalty)}
        {/if}
        </div>

        <Panel icon="fa-solid fa-gem" title={m.pokefluxMarket.missionStore()} subtitle={m.pokefluxMarket.missionStoreHint()}>
          {#if missions.store.length}
            <ul class="space-y-2">
              {#each missions.store as item (item.key)}
                {@const affordable = missions.crystalSlime >= item.cost}
                <li class="px-3 py-2.5 rounded-lg border flex items-center justify-between gap-3" style={rowStyle}>
                  <div class="min-w-0">
                    <h3 class="font-medium" style="color: {$colorStore.text};">{item.name}</h3>
                    <p class="text-sm" style="color: {$colorStore.muted};">{item.description}</p>
                    {#if item.commandOnly}
                      <p class="text-xs mt-1" style="color: {$colorStore.secondary};">
                        <i class="fa-solid fa-terminal mr-1" aria-hidden="true"></i>{m.pokefluxMarket.commandOnly()}
                      </p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="font-bold tabular-nums" class:opacity-60={!affordable} style="color: {$colorStore.text};">
                      <i class="fa-solid fa-gem mr-1" style="color: {$colorStore.accent};" aria-hidden="true"></i>
                      <span class="sr-only">{m.pokefluxMarket.amountCrystalSlime({ amount: item.cost.toLocaleString() })}</span>
                      <span aria-hidden="true">{item.cost.toLocaleString()}</span>
                    </span>
                    {#if !item.commandOnly}
                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[36px] disabled:opacity-40 disabled:hover:scale-100"
                        style={buttonStyle($colorStore)}
                        disabled={!affordable}
                        title={affordable ? undefined : m.pokefluxMarket.notEnough()}
                        aria-label={m.pokefluxMarket.buyNamed({ name: item.name })}
                        onclick={() => askBuy(item)}
                      >
                        {m.pokefluxMarket.buy()}
                      </button>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
            <a
              href="/dashboard/shop?category=crystal"
              class="mt-3 inline-flex items-center gap-2 px-4 py-2 min-h-[38px] rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={buttonStyle($colorStore)}
            >
              {m.pokefluxMarket.openCrystalShop()}<span aria-hidden="true">→</span>
            </a>
          {:else}
            <EmptyState icon="fa-solid fa-gem" compact />
          {/if}
        </Panel>
      </div>
    {/snippet}
  </ApiState>

  <ApiState response={data.achievements} notStartedOn404>
    {#snippet children(achievements)}
      {@const categories = achievements.categories}
      {@const active = categories.find((c) => c.name === category) ?? categories[0]}
      {#if !data.missions.ok}
        {@render loyaltyPanel(achievements.loyalty)}
      {/if}

      <Panel
        icon="fa-solid fa-medal"
        title={m.dashboard.achievementsTitle()}
        subtitle={m.pokefluxMarket.totalMilestones({ count: achievements.totalMilestones.toLocaleString() })}
      >
        {#if !active}
          <EmptyState title={m.pokefluxMarket.noAchievements()} icon="fa-solid fa-medal" compact />
        {:else}
          <div class="flex flex-wrap gap-2 mb-4" role="tablist" aria-label={m.pokefluxMarket.achievementCategories()}>
            {#each categories as c (c.name)}
              {@const selected = c.name === active.name}
              {@const reached = c.achievements.reduce((sum, a) => sum + a.milestones.filter((x) => a.value >= x).length, 0)}
              <button
                type="button"
                role="tab"
                id="pf-ach-tab-{c.name}"
                aria-selected={selected}
                aria-controls="pf-ach-panel"
                tabindex={selected ? 0 : -1}
                class="flex items-center gap-2 px-3 py-1.5 min-h-[36px] rounded-lg text-sm transition-all hover:scale-[1.02] font-medium"
                style={chipStyle($colorStore, selected)}
                onclick={() => (category = c.name)}
                onkeydown={(event) => {
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                  event.preventDefault();
                  const index = categories.indexOf(c) + (event.key === "ArrowRight" ? 1 : -1);
                  const next = categories[(index + categories.length) % categories.length];
                  category = next.name;
                  document.getElementById(`pf-ach-tab-${next.name}`)?.focus();
                }}
              >
                {humanize(c.name)}
                <span class="text-xs tabular-nums" style="color: {$colorStore.muted};">{reached}</span>
              </button>
            {/each}
          </div>

          <div id="pf-ach-panel" role="tabpanel" aria-labelledby="pf-ach-tab-{active.name}">
          <ul class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {#each active.achievements as achievement (achievement.key)}
              {@const next = achievement.nextMilestone}
              {@const reachedCount = achievement.milestones.filter((x) => achievement.value >= x).length}
              <li class="px-3 py-2.5 rounded-lg border space-y-2 transition-all duration-200" style="background: {$colorStore.primary}10; border-color: {next === null ? '#22c55e55' : $colorStore.primary + '30'};">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="text-sm font-medium" style="color: {$colorStore.text};">{achievementName(achievement)}</h3>
                  <span class="text-xs shrink-0 tabular-nums" style="color: {$colorStore.muted};">
                    {m.pokefluxMarket.milestonesReached({ reached: reachedCount, total: achievement.milestones.length })}
                  </span>
                </div>
                {#if next === null}
                  <p class="text-sm font-medium" style="color: #22c55e;">
                    <i class="fa-solid fa-medal mr-1" aria-hidden="true"></i>{m.pokefluxMarket.allMilestones({ value: achievement.value.toLocaleString() })}
                  </p>
                {:else}
                  <Meter
                    value={achievement.value - achievement.lastMilestone}
                    max={next - achievement.lastMilestone}
                    label={m.pokefluxMarket.toNextMilestone({ value: achievement.value.toLocaleString(), next: next.toLocaleString() })}
                  />
                {/if}
                <ol class="flex flex-wrap gap-1" aria-label={m.pokefluxMarket.milestoneLadder()}>
                  {#each achievement.milestones as milestone, i (i)}
                    {@const hit = achievement.value >= milestone}
                    {@const isNext = milestone === next}
                    <li
                      class="text-[10px] px-1.5 py-0.5 rounded-md tabular-nums border"
                      style="background: {hit ? $colorStore.primary + '20' : 'transparent'}; color: {hit ? $colorStore.primary : isNext ? $colorStore.text : $colorStore.muted}; border-color: {isNext ? $colorStore.primary + '60' : hit ? $colorStore.primary + '30' : $colorStore.primary + '15'};"
                      title={hit ? m.pokefluxMarket.milestoneReached() : isNext ? m.pokefluxMarket.milestoneNext() : undefined}
                    >
                      {#if hit}<i class="fa-solid fa-check mr-0.5" aria-hidden="true"></i><span class="sr-only">{m.pokefluxMarket.milestoneReached()}: </span>{/if}{#if isNext}<span class="sr-only">{m.pokefluxMarket.milestoneNext()}: </span>{/if}{milestone.toLocaleString()}
                    </li>
                  {/each}
                </ol>
              </li>
            {/each}
          </ul>
          </div>
        {/if}
      </Panel>
    {/snippet}
  </ApiState>
</DashboardPageLayout>
