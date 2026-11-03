<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { toast } from "$lib/stores/toast.svelte";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import { buttonStyle, quietStyle } from "$lib/components/dashboard/styles";
  import { EmptyState } from "$lib/components/pokeflux";
  import type { DiscordImportPreview, DiscordImportResponse } from "$lib/api";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let confirmed = $state(false);
  let importing = $state(false);
  let done = $state<DiscordImportResponse | null>(null);

  const connectHref = "/api/discord-link/start?return=%2Fdashboard%2Fimport";

  const avatarUrl = (id: string, avatar: string | null) =>
    avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=64` : null;

  function blocker(preview: DiscordImportPreview): string | null {
    if (!preview.hasDiscordData) return m.discordImport.noData();
    if (preview.discordAlreadyImported) return m.discordImport.alreadyDiscord();
    if (preview.fluxerAlreadyImported) return m.discordImport.alreadyFluxer();
    if (!preview.started) return m.discordImport.notStarted();
    return null;
  }

  async function forget() {
    await fetch("/api/discord-link/identity", { method: "DELETE" });
    window.location.href = connectHref;
  }

  async function runImport() {
    importing = true;
    try {
      const response = await fetch("/api/discord-link/import", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? m.discordImport.error());
        await invalidateAll();
        return;
      }
      done = body as DiscordImportResponse;
      toast.success(done.message);
    } finally {
      importing = false;
    }
  }

  const actionClass =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px] outline-none focus-visible:ring-2 disabled:opacity-50 disabled:hover:scale-100";
</script>

<DashboardPageLayout title={m.features.import()} subtitle={m.dashboard.importSubtitle()} icon="fa-arrow-right-arrow-left">
  {#if !data.configured}
    <EmptyState title={m.discordImport.notConfigured()} icon="fa-solid fa-plug-circle-xmark" />
  {:else if done}
    <EmptyState
      title={m.discordImport.doneTitle()}
      message={m.discordImport.doneBody({ pokemon: done.result.pokemon.toLocaleString(), parties: done.result.parties.toLocaleString() })}
      icon="fa-solid fa-circle-check"
    >
      <a href="/dashboard/pokemon" class={actionClass} style={buttonStyle($colorStore)}>
        <i class="fa-solid fa-paw" aria-hidden="true"></i>{m.discordImport.openPokemon()}
      </a>
    </EmptyState>
  {:else if !data.identity}
    <Panel icon="fa-brands fa-discord" title={m.discordImport.connectTitle()}>
      {#if data.linkResult === "denied" || data.linkResult === "error"}
        <p class="text-sm mb-3" role="alert" style="color: {$colorStore.accent};">
          {data.linkResult === "denied" ? m.discordImport.denied() : m.discordImport.error()}
        </p>
      {/if}
      <p class="text-sm mb-4" style="color: {$colorStore.text};">{m.discordImport.connectBody()}</p>
      <a href={connectHref} class={actionClass} style={buttonStyle($colorStore)} data-sveltekit-reload>
        <i class="fa-brands fa-discord" aria-hidden="true"></i>{m.discordImport.connect()}
      </a>
    </Panel>
  {:else}
    {@const identity = data.identity}
    {@const avatar = avatarUrl(identity.id, identity.avatar)}
    <Panel icon="fa-solid fa-boxes-stacked" title={m.discordImport.previewTitle()}>
      {#snippet actions()}
        <button type="button" class={actionClass} style={quietStyle($colorStore)} onclick={forget}>
          <i class="fa-solid fa-right-left" aria-hidden="true"></i>{m.discordImport.switchAccount()}
        </button>
      {/snippet}

      <p class="flex items-center gap-2 text-sm mb-4" style="color: {$colorStore.text};">
        {#if avatar}
          <img src={avatar} alt="" width="24" height="24" class="rounded-full" />
        {:else}
          <i class="fa-brands fa-discord" style="color: {$colorStore.primary};" aria-hidden="true"></i>
        {/if}
        {m.discordImport.signedInAs({ name: identity.username })}
      </p>

      {#if !data.preview?.ok}
        <p class="text-sm" role="alert" style="color: {$colorStore.accent};">
          {m.discordImport.previewFailed({ error: data.preview?.error ?? "" })}
        </p>
      {:else}
        {@const preview = data.preview.data}
        {@const reason = blocker(preview)}
        <dl class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <StatTile label={m.discordImport.statPokemon()} value={preview.pokemon.toLocaleString()} />
          <StatTile label={m.discordImport.statShiny()} value={preview.shiny.toLocaleString()} />
          <StatTile label={m.discordImport.statRadiant()} value={preview.radiant.toLocaleString()} />
          <StatTile label={m.discordImport.statParties()} value={preview.parties.toLocaleString()} />
          <StatTile label={m.discordImport.statCredits()} value={preview.credits.toLocaleString()} />
          <StatTile label={m.discordImport.statRedeems()} value={preview.redeems.toLocaleString()} />
          <StatTile label={m.discordImport.statItems()} value={preview.items.toLocaleString()} />
          <StatTile label={m.discordImport.statMilestones()} value={preview.milestones.toLocaleString()} />
        </dl>

        {#if reason}
          <p class="text-sm" role="alert" style="color: {$colorStore.accent};">{reason}</p>
        {:else}
          <div class="space-y-2 text-sm mb-4" style="color: {$colorStore.text};">
            <p>{m.discordImport.howItWorks({ count: preview.currentPokemon.toLocaleString() })}</p>
            <p style="color: {$colorStore.muted};">{m.discordImport.discordUnchanged()}</p>
          </div>
          <label class="flex items-center gap-2 text-sm mb-4 cursor-pointer" style="color: {$colorStore.text};">
            <input type="checkbox" bind:checked={confirmed} class="w-4 h-4 rounded" style="accent-color: {$colorStore.primary};" />
            {m.discordImport.confirm()}
          </label>
          <button type="button" class={actionClass} style={buttonStyle($colorStore)} disabled={!confirmed || importing} onclick={runImport}>
            <i class="fa-solid {importing ? 'fa-spinner fa-spin' : 'fa-arrow-right-arrow-left'}" aria-hidden="true"></i>
            {importing ? m.discordImport.importing() : m.discordImport.import()}
          </button>
        {/if}
      {/if}
    </Panel>
  {/if}
</DashboardPageLayout>
