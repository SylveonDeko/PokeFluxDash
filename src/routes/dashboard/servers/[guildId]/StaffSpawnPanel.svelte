<!--
@component
The owner-only spawn tools for a server: spawn storm and the spawn debug output. Renders nothing for
anyone who is not a bot owner.
-->
<script lang="ts">
  import { page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import type { AdminSpawnDebug, AdminSpawnStorm, StaffInfo } from "$lib/api";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import AsyncState from "$lib/components/stats/AsyncState.svelte";
  import { buttonStyle, dangerStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import ReasonDialog from "$lib/components/admin/ReasonDialog.svelte";

  interface Props {
    guildId: string;
  }

  let { guildId }: Props = $props();

  let owner = $derived((page.data.staff as StaffInfo | undefined)?.botOwner === true);
  let storm = $state<boolean | null>(null);
  let lines = $state<string[] | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let stormOpen = $state(false);

  async function load(id: string) {
    loading = true;
    error = null;
    try {
      const [state, debug] = await Promise.all([
        proxyRequest<AdminSpawnStorm>("GET", "admin/spawns/storm"),
        proxyRequest<AdminSpawnDebug>("GET", `admin/spawns/debug/${encodeURIComponent(id)}`),
      ]);
      storm = state.enabled;
      lines = debug.lines;
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (owner) load(guildId);
  });

  async function toggleStorm(reason: string) {
    const result = await proxyRequest<AdminSpawnStorm>("POST", "admin/spawns/storm", { reason });
    storm = result.enabled;
    toast.success(result.message ?? (result.enabled ? m.admin.stormOn() : m.admin.stormOff()));
  }
</script>

{#if owner}
  <Panel icon="fa-solid fa-bolt" title={m.admin.staffSpawnTools()} subtitle={m.admin.staffSpawnToolsHint()}>
    <AsyncState {loading} {error}>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="rounded-xl p-3 space-y-2 self-start" style="background: {$colorStore.primary}10;">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold" style="color: {$colorStore.text};">{m.admin.spawnStorm()}</h3>
            {#if storm !== null}
              <span
                class="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium"
                style="background: {storm ? $colorStore.accent : $colorStore.muted}20; color: {storm ? $colorStore.accent : $colorStore.muted};"
              >
                {storm ? m.pokefluxMarket.on() : m.pokefluxMarket.off()}
              </span>
            {/if}
          </div>
          <p class="text-sm" style="color: {$colorStore.muted};">{m.admin.spawnStormHint()}</p>
          <button
            type="button"
            class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px] disabled:opacity-50"
            style={storm ? buttonStyle($colorStore) : dangerStyle($colorStore)}
            disabled={storm === null}
            onclick={() => (stormOpen = true)}
          >
            <i class="fa-solid fa-bolt" aria-hidden="true"></i>{storm ? m.admin.stopStorm() : m.admin.startStorm()}
          </button>
        </div>

        <div class="rounded-xl p-3" style="background: {$colorStore.primary}10;">
          <div class="flex items-center justify-between gap-3 mb-2">
            <h3 class="font-semibold" style="color: {$colorStore.text};">{m.admin.spawnDebug()}</h3>
            <button
              type="button"
              class="rounded-lg px-3 min-h-[36px] text-xs font-medium transition-all hover:opacity-80"
              style={buttonStyle($colorStore)}
              onclick={() => load(guildId)}
            >
              <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i> {m.admin.refresh()}
            </button>
          </div>
          <pre class="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words font-mono" style="background: {$colorStore.primary}08; color: {$colorStore.text};">{(lines ?? []).join("\n")}</pre>
        </div>
      </div>
    </AsyncState>
  </Panel>

  <ReasonDialog
    bind:open={stormOpen}
    title={storm ? m.admin.stopStorm() : m.admin.startStorm()}
    message={storm ? m.admin.stopStormMessage() : m.admin.startStormMessage()}
    confirmLabel={storm ? m.admin.stopStorm() : m.admin.startStorm()}
    variant="warning"
    onconfirm={toggleStorm}
  />
{/if}
