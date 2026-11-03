<!--
@component
Horizontal bars for the six stats, with a switch between the stat blocks passed in.
-->
<script lang="ts" module>
  export type StatView = "ivs" | "evs" | "base" | "stats";
</script>

<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { StatBlock, StatKey } from "$lib/api";

  interface Props {
    ivs?: StatBlock | null;
    evs?: StatBlock | null;
    baseStats?: StatBlock | null;
    stats?: StatBlock | null;
    view?: StatView;
    /** Show the view switch when more than one block is given. */
    switchable?: boolean;
    onviewchange?: (view: StatView) => void;
    class?: string;
  }

  let {
    ivs = null,
    evs = null,
    baseStats = null,
    stats = null,
    view = $bindable(),
    switchable = true,
    onviewchange,
    class: className = "",
  }: Props = $props();

  const STATS: { key: StatKey; label: () => string; color: string }[] = [
    { key: "hp", label: m.pokeflux.statHp, color: "#ef4444" },
    { key: "attack", label: m.pokeflux.statAttack, color: "#f97316" },
    { key: "defense", label: m.pokeflux.statDefense, color: "#eab308" },
    { key: "specialAttack", label: m.pokeflux.statSpecialAttack, color: "#3b82f6" },
    { key: "specialDefense", label: m.pokeflux.statSpecialDefense, color: "#22c55e" },
    { key: "speed", label: m.pokeflux.statSpeed, color: "#ec4899" },
  ];

  let views = $derived(
    (
      [
        ["ivs", m.pokeflux.viewIvs(), ivs],
        ["evs", m.pokeflux.viewEvs(), evs],
        ["base", m.pokeflux.viewBase(), baseStats],
        ["stats", m.pokeflux.viewStats(), stats],
      ] as const
    ).flatMap(([id, label, block]) => (block ? [{ id: id as StatView, label, block }] : [])),
  );

  let current = $derived(views.find((v) => v.id === view) ?? views[0]);

  const HELP: Record<StatView, () => string> = {
    ivs: m.pokeflux.statHelpIvs,
    evs: m.pokeflux.statHelpEvs,
    base: m.pokeflux.statHelpBase,
    stats: m.pokeflux.statHelpStats,
  };

  /** Fixed caps for IVs, EVs and base stats. Calculated stats scale to the highest one. */
  let max = $derived.by(() => {
    if (!current) return 1;
    if (current.id === "ivs") return 31;
    if (current.id === "evs") return 252;
    if (current.id === "base") return 255;
    return Math.max(1, ...STATS.map((s) => current.block[s.key]));
  });

  let total = $derived(current ? STATS.reduce((sum, s) => sum + current.block[s.key], 0) : 0);

  function choose(id: StatView) {
    view = id;
    onviewchange?.(id);
  }

  function onSwitchKeydown(event: KeyboardEvent) {
    if (!current || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = views.findIndex((v) => v.id === current.id);
    const next =
      event.key === "Home" ? 0
      : event.key === "End" ? views.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
    choose(views[next].id);
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role=radio]")[next]?.focus();
  }
</script>

{#if current}
  <div class="space-y-3 {className}">
    {#if switchable && views.length > 1}
      <div
        class="inline-flex p-1 rounded-xl gap-1"
        style="background: {$colorStore.primary}08; border: 1px solid {$colorStore.primary}15;"
        role="radiogroup"
        aria-label={m.pokeflux.statView()}
        tabindex="-1"
        onkeydown={onSwitchKeydown}
      >
        {#each views as v (v.id)}
          {@const active = v.id === current.id}
          <button
            type="button"
            role="radio"
            aria-checked={active}
            tabindex={active ? 0 : -1}
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] min-h-[32px] outline-none focus-visible:ring-2"
            style="background: {active ? `${$colorStore.primary}25` : 'transparent'}; color: {active ? $colorStore.text : $colorStore.muted}; border: 1px solid {active ? `${$colorStore.primary}30` : 'transparent'}; --tw-ring-color: {$colorStore.primary};"
            onclick={() => choose(v.id)}
          >
            {v.label}
          </button>
        {/each}
      </div>
    {/if}

    <p class="text-xs leading-relaxed" style="color: {$colorStore.muted};">{HELP[current.id]()}</p>

    <dl class="space-y-1.5">
      {#each STATS as stat (stat.key)}
        {@const value = current.block[stat.key]}
        {@const percent = Math.min(100, (value / max) * 100)}
        {@const perfect = (current.id === "ivs" && value >= 31) || (current.id === "evs" && value >= 252)}
        <div class="grid grid-cols-[4.5rem_2.75rem_1fr] sm:grid-cols-[5.5rem_3rem_1fr] items-center gap-2">
          <dt class="text-xs font-medium truncate" style="color: {$colorStore.muted};">{stat.label()}</dt>
          <dd class="text-sm font-semibold tabular-nums text-right" style="color: {perfect ? stat.color : $colorStore.text};">
            {value}
          </dd>
          <dd>
            <div
              class="h-2 rounded-full overflow-hidden"
              style="background: {$colorStore.primary}15;"
              role="meter"
              aria-label={stat.label()}
              title={m.pokeflux.statOf({ value, max })}
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={max}
            >
              <div
                class="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                style="width: {percent}%; background: {stat.color};"
              ></div>
            </div>
          </dd>
        </div>
      {/each}
      <div
        class="grid grid-cols-[4.5rem_2.75rem_1fr] sm:grid-cols-[5.5rem_3rem_1fr] items-center gap-2 pt-2 border-t"
        style="border-color: {$colorStore.primary}20;"
      >
        <dt class="text-xs font-semibold" style="color: {$colorStore.muted};">{m.dashboard.total()}</dt>
        <dd class="text-sm font-bold tabular-nums text-right" style="color: {$colorStore.text};">{total}</dd>
        <dd class="text-xs" style="color: {$colorStore.muted};">
          {#if current.id === "ivs"}{((total / 186) * 100).toFixed(2)}%{:else if current.id === "evs"}{total} / 510{/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
