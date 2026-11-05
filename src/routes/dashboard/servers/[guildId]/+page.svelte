<script lang="ts">
  import { untrack } from "svelte";
  import { enhance } from "$app/forms";
  import { beforeNavigate, invalidateAll } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import type { SpawnSettings, SpawnSettingsUpdate } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import SectionHeader from "$lib/components/stats/SectionHeader.svelte";
  import { buttonStyle, controlStyle, quietStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import GuildIcon from "../GuildIcon.svelte";
  import ChannelMultiSelect from "./ChannelMultiSelect.svelte";
  import SpawnPreview from "./SpawnPreview.svelte";
  import SpawnEnableReply from "./SpawnEnableReply.svelte";
  import SettingToggle from "$lib/components/forms/SettingToggle.svelte";
  import { groupChannels } from "./channels";
  import { MAX_PREFIX_LENGTH, prefixError } from "./prefix";
  import type { ActionData, PageData } from "./$types";
  import StaffSpawnPanel from "./StaffSpawnPanel.svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type ChannelKey = "enabledChannels" | "disabledChannels" | "redirects";
  type FlagKey = "enableSpawnsAll" | "smallImages" | "modalView" | "delete" | "pin";

  const FIELD_LABELS: Record<keyof SpawnSettings, () => string> = {
    enableSpawnsAll: m.dashboard.spawnsEverywhere,
    enabledChannels: m.dashboard.enabledChannels,
    disabledChannels: m.pokefluxMarket.disabledChannels,
    redirects: m.dashboard.redirectChannels,
    speed: m.dashboard.spawnSpeed,
    smallImages: m.pokefluxMarket.smallImages,
    modalView: m.pokefluxMarket.buttonMode,
    delete: m.pokefluxMarket.deleteSpawns,
    pin: m.pokefluxMarket.pinSpawns,
  };
  const FIELD_ORDER = Object.keys(FIELD_LABELS) as (keyof SpawnSettings)[];
  const FLAG_TOGGLES: { key: FlagKey; label: () => string }[] = [
    { key: "enableSpawnsAll", label: m.dashboard.spawnsEverywhere },
    { key: "smallImages", label: m.pokefluxMarket.smallImages },
    { key: "modalView", label: m.pokefluxMarket.buttonMode },
    { key: "delete", label: m.pokefluxMarket.deleteSpawns },
    { key: "pin", label: m.pokefluxMarket.pinSpawns },
  ];
  const CHANNEL_KEYS: ChannelKey[] = ["enabledChannels", "disabledChannels", "redirects"];

  const clone = (s: SpawnSettings): SpawnSettings => ({
    ...s,
    enabledChannels: [...s.enabledChannels],
    disabledChannels: [...s.disabledChannels],
    redirects: [...s.redirects],
  });

  let base = $state<SpawnSettings | null>(untrack(() => (data.settings.ok ? clone(data.settings.data.spawns) : null)));
  let draft = $state<SpawnSettings | null>(untrack(() => (data.settings.ok ? clone(data.settings.data.spawns) : null)));
  let prefixBase = $state(untrack(() => (data.settings.ok ? data.settings.data.prefix : "")));
  let prefix = $state(untrack(() => prefixBase));
  let prefixTouched = $state(false);
  let loadedGuild = untrack(() => (data.settings.ok ? data.settings.data.id : null));
  let savingPrefix = $state(false);
  let savingSpawns = $state(false);
  let spawnError = $state<string | null>(null);
  let lastSave = $state<{ message: string; changes: string[] } | null>(null);

  function sameList(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((x) => set.has(x));
  }

  function same(a: SpawnSettings, b: SpawnSettings, key: keyof SpawnSettings): boolean {
    const x = a[key];
    const y = b[key];
    return Array.isArray(x) && Array.isArray(y) ? sameList(x, y) : x === y;
  }

  $effect(() => {
    if (!data.settings.ok) return;
    const settings = data.settings.data;
    untrack(() => {
      const next = clone(settings.spawns);
      if (settings.id !== loadedGuild) {
        loadedGuild = settings.id;
        draft = null;
        base = null;
        prefixBase = prefix = settings.prefix;
        lastSave = null;
        spawnError = null;
      }
      if (draft && base) {
        const current = draft;
        const before = base;
        draft = Object.fromEntries(
          FIELD_ORDER.map((key) => [key, same(current, before, key) ? next[key] : current[key]]),
        ) as unknown as SpawnSettings;
      } else {
        draft = clone(next);
      }
      base = next;
      if (prefix.trim() === prefixBase || prefix.trim() === settings.prefix) {
        prefix = settings.prefix;
        prefixTouched = false;
      }
      prefixBase = settings.prefix;
    });
  });

  let groups = $derived(data.settings.ok ? groupChannels(data.settings.data.channels, data.settings.data.categories) : []);
  let channelNames = $derived(new Map(data.settings.ok ? data.settings.data.channels.map((c) => [c.id, c.name] as const) : []));
  let prefixProblem = $derived(prefixError(prefix.trim()));
  let prefixChanged = $derived(prefix.trim() !== prefixBase);

  let changed = $derived.by(() => {
    if (!draft || !base) return [] as (keyof SpawnSettings)[];
    const d = draft;
    const b = base;
    return FIELD_ORDER.filter((key) => !same(d, b, key));
  });

  const onOff = (value: boolean) => (value ? m.pokefluxMarket.on() : m.pokefluxMarket.off());
  const channelName = (id: string) => `#${channelNames.get(id) ?? id}`;

  function describe(key: keyof SpawnSettings, before: SpawnSettings, after: SpawnSettings): string {
    const label = FIELD_LABELS[key]();
    if (CHANNEL_KEYS.includes(key as ChannelKey)) {
      const b = before[key as ChannelKey];
      const a = after[key as ChannelKey];
      const added = a.filter((x) => !b.includes(x)).map(channelName);
      const removed = b.filter((x) => !a.includes(x)).map(channelName);
      const parts = [
        added.length ? m.pokefluxMarket.channelsAdded({ channels: added.join(", ") }) : null,
        removed.length ? m.pokefluxMarket.channelsRemoved({ channels: removed.join(", ") }) : null,
      ].filter(Boolean);
      return `${label}: ${parts.join("; ")}`;
    }
    if (key === "speed") return `${label}: ${before.speed} → ${after.speed}`;
    return `${label}: ${onOff(before[key as FlagKey])} → ${onOff(after[key as FlagKey])}`;
  }

  let changeLines = $derived(draft && base ? changed.map((key) => describe(key, base!, draft!)) : []);

  function reset() {
    if (base) draft = clone(base);
    spawnError = null;
  }

  async function saveSpawns() {
    if (!draft || !base || changed.length === 0) return;
    const update: SpawnSettingsUpdate = {};
    for (const key of changed) (update as Record<string, unknown>)[key] = draft[key];
    const lines = [...changeLines];
    savingSpawns = true;
    spawnError = null;
    try {
      const result = await proxyRequest("PUT", `guilds/${encodeURIComponent(data.guildId)}/spawns`, update);
      lastSave = { message: result.message, changes: lines };
      toast.success(result.message);
      await invalidateAll();
    } catch (err) {
      spawnError = errorMessage(err);
      toast.error(spawnError);
    } finally {
      savingSpawns = false;
    }
  }

  beforeNavigate((navigation) => {
    if (changed.length === 0) return;
    if (navigation.type === "leave" || !confirm(m.pokefluxMarket.unsavedLeave())) navigation.cancel();
  });

  const inputStyle = $derived(controlStyle($colorStore));
  const primaryButton = $derived(buttonStyle($colorStore));
  const quietButton = $derived(quietStyle($colorStore));
  const blockStyle = $derived(`background: ${$colorStore.primary}10;`);
</script>

{#snippet changedDot()}
  <span class="ml-2 w-1.5 h-1.5 inline-block rounded-full align-middle" style="background: {$colorStore.primary}; color: {$colorStore.onPrimary};" aria-hidden="true"></span>
{/snippet}

<DashboardPageLayout
  title={data.settings.ok ? data.settings.data.name : m.dashboard.serverSettingsTitle()}
  subtitle={m.dashboard.serverSettingsSubtitle()}
  icon="fa-server"
>
  {#snippet actions()}
    <a
      href="/dashboard/servers"
      class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-[1.02] min-h-[40px] flex-1 sm:flex-initial min-w-0 whitespace-nowrap font-medium focus:outline-hidden focus:ring-2 focus:ring-offset-2"
      style={primaryButton}
    >
      <i class="fa-solid fa-arrow-left" style="font-size: 15px;" aria-hidden="true"></i>
      <span class="text-sm">{m.dashboard.allServers()}</span>
    </a>
  {/snippet}

  <ApiState response={data.settings}>
    {#snippet children(settings)}
      <Panel>
        <SectionHeader icon="fa-gear" title={m.dashboard.serverSettingsTitle()}>
          {#snippet actions()}
            <span class="inline-flex items-center gap-2 text-sm" style="color: {$colorStore.muted}">
              <GuildIcon name={settings.name} src={settings.iconUrl} size={24} />{m.dashboard.textChannels({ count: settings.channels.length })}
            </span>
          {/snippet}
        </SectionHeader>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <form
          method="POST"
          action="?/prefix"
          class="rounded-xl p-3 space-y-2"
          style={blockStyle}
          novalidate
          use:enhance={({ cancel }) => {
            prefixTouched = true;
            if (prefixProblem || !prefixChanged) return cancel();
            savingPrefix = true;
            return async ({ update }) => {
              await update({ reset: false, invalidateAll: true });
              savingPrefix = false;
            };
          }}
        >
          <div class="flex items-center gap-2">
            <label for="pf-prefix" class="text-sm font-semibold shrink-0" style="color: {$colorStore.text}">{m.dashboard.prefixTitle()}</label>
            <input
              id="pf-prefix"
              name="prefix"
              bind:value={prefix}
              oninput={() => (prefixTouched = true)}
              maxlength={MAX_PREFIX_LENGTH}
              autocomplete="off"
              spellcheck="false"
              aria-invalid={prefixTouched && !!prefixProblem}
              aria-describedby="pf-prefix-hint"
              class="min-w-0 flex-1 px-3 py-2 rounded-lg border transition-all font-mono text-sm"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={savingPrefix || !!prefixProblem || !prefixChanged}
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px] disabled:opacity-50 disabled:hover:scale-100"
              style={primaryButton}
            >
              {#if savingPrefix}<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>{/if}{m.common.save()}
            </button>
          </div>
          <p
            id="pf-prefix-hint"
            class="text-xs"
            style="color: {prefixTouched && prefixProblem ? $colorStore.accent : $colorStore.muted};"
            role={prefixTouched && prefixProblem ? "alert" : undefined}
          >
            {prefixTouched && prefixProblem
              ? prefixProblem
              : m.pokefluxMarket.prefixHint({ max: MAX_PREFIX_LENGTH, length: prefix.trim().length })}
          </p>
          {#if form && "error" in form}
            <p class="text-xs" style="color: {$colorStore.accent};" role="alert">{form.error}</p>
          {:else if form?.success}
            <p class="text-xs flex items-center gap-1.5" style="color: {$colorStore.text};" role="status">
              <i class="fa-solid fa-circle-check" style="color: #22c55e;" aria-hidden="true"></i>{form.data.message}
            </p>
          {/if}
        </form>

        {#if draft}
          <div class="rounded-xl p-3 space-y-2" style={blockStyle}>
            <div class="flex items-center justify-between gap-3">
              <label for="pf-speed" class="text-sm font-semibold" style="color: {$colorStore.text};">
                {m.dashboard.spawnSpeed()}{#if changed.includes("speed")}{@render changedDot()}{/if}
              </label>
              <output for="pf-speed" class="text-sm font-semibold tabular-nums px-2 py-0.5 rounded-lg" style="background: {$colorStore.primary}20; color: {$colorStore.primary};">
                {draft.speed}
              </output>
            </div>
            <input
              id="pf-speed"
              type="range"
              min="1"
              max="20"
              step="1"
              bind:value={draft.speed}
              aria-describedby="pf-speed-hint"
              class="w-full"
              style="accent-color: {$colorStore.primary};"
            />
            <p id="pf-speed-hint" class="text-xs" style="color: {$colorStore.muted};">{m.pokefluxMarket.speedHint()}</p>
          </div>
        {/if}
        </div>
      </Panel>

      {#if draft}
        <form
          class="space-y-4"
          onsubmit={(event) => {
            event.preventDefault();
            saveSpawns();
          }}
        >
          <Panel>
            <SectionHeader icon="fa-paw" title={m.dashboard.spawnsTitle()} />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div class="space-y-3 min-w-0">
              <div class="rounded-xl p-1.5 space-y-1" style={blockStyle}>
                {#each FLAG_TOGGLES as toggle (toggle.key)}
                  <SettingToggle
                    id="pf-{toggle.key}"
                    label={toggle.label()}
                    checked={draft[toggle.key]}
                    onchange={(checked) => draft && (draft[toggle.key] = checked)}
                  />
                {/each}
              </div>

              {#if settings.channels.length === 0}
                <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxMarket.noTextChannels()}</p>
              {:else}
                <div class="rounded-xl p-3" style={blockStyle}>
                  <ChannelMultiSelect
                    id="pf-enabled"
                    label={m.dashboard.enabledChannels()}
                    description={draft.enableSpawnsAll ? m.pokefluxMarket.enabledChannelsIgnored() : undefined}
                    {groups}
                    bind:selected={draft.enabledChannels}
                  />
                  <SpawnEnableReply prefix={prefixProblem ? prefixBase : prefix.trim()} channel={channelNames.get(draft.enabledChannels[0] ?? "") ?? groups[0]?.channels[0]?.name} />
                </div>
              {/if}
            </div>

            <div class="space-y-3 min-w-0">
              <SpawnPreview settings={draft} prefix={prefixProblem ? prefixBase : prefix.trim()} />
              {#if settings.channels.length > 0}
                <div class="rounded-xl p-3" style={blockStyle}>
                  <ChannelMultiSelect
                    id="pf-disabled"
                    label={m.pokefluxMarket.disabledChannels()}
                    {groups}
                    bind:selected={draft.disabledChannels}
                  />
                </div>
                <div class="rounded-xl p-3" style={blockStyle}>
                  <ChannelMultiSelect
                    id="pf-redirects"
                    label={m.dashboard.redirectChannels()}
                    description={m.pokefluxMarket.redirectsHint()}
                    {groups}
                    bind:selected={draft.redirects}
                  />
                </div>
              {/if}
            </div>
            </div>
          </Panel>

          {#if lastSave && changed.length === 0}
            <div class="rounded-xl p-3 border" style="background: #22c55e08; border-color: #22c55e30;" role="status">
              <div class="flex items-start gap-3">
                <i class="fa-solid fa-circle-check" style="color: #22c55e; font-size: 18px;" aria-hidden="true"></i>
                <div>
                  <h3 class="font-semibold mb-1" style="color: {$colorStore.text}">{lastSave.message}</h3>
                  <ul class="text-sm space-y-0.5 list-disc pl-5" style="color: {$colorStore.muted};">
                    {#each lastSave.changes as line, i (i)}
                      <li>{line}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
          {/if}

          <div
            class="sticky bottom-3 z-10 px-4 py-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3"
            style="background: color-mix(in srgb, {$colorStore.primary} 5%, {$colorStore.background}); border-color: {$colorStore.primary}30;"
          >
            <div class="flex-1 min-w-0">
            {#if changed.length}
              <p class="font-semibold" style="color: {$colorStore.text};" aria-live="polite">
                {m.pokefluxMarket.unsavedChanges({ count: changed.length })}
              </p>
              <ul class="mt-1 text-sm space-y-0.5 list-disc pl-5 max-h-32 overflow-y-auto" style="color: {$colorStore.muted};">
                {#each changeLines as line, i (i)}
                  <li>{line}</li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm" style="color: {$colorStore.muted};" aria-live="polite">{m.pokefluxMarket.noChanges()}</p>
            {/if}
            {#if spawnError}
              <p class="mt-2 text-sm p-3 rounded-lg" style="background: {$colorStore.accent}10; color: {$colorStore.accent}; border: 1px solid {$colorStore.accent}40;" role="alert">{spawnError}</p>
            {/if}
            </div>
            <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                class="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[40px] disabled:opacity-50"
                style={quietButton}
                disabled={savingSpawns || changed.length === 0}
                onclick={reset}
              >
                {m.pokefluxMarket.discardChanges()}
              </button>
              <button
                type="submit"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[40px] disabled:opacity-50 disabled:hover:scale-100"
                style={primaryButton}
                disabled={savingSpawns || changed.length === 0}
                aria-busy={savingSpawns}
              >
                {#if savingSpawns}<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>{/if}{m.pokefluxMarket.saveSpawns()}
              </button>
            </div>
          </div>
        </form>
      {/if}
      <StaffSpawnPanel guildId={data.guildId} />
    {/snippet}
  </ApiState>
</DashboardPageLayout>
