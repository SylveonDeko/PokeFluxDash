<!-- routes/commands/+page.svelte -->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { onMount, tick } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { page } from "$app/state";
  import { colorStore } from "$lib/stores/colorStore";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import FluxerChatCompact from "$lib/components/home/FluxerChatCompact.svelte";
  import { Modal } from "$lib/components/pokeflux";
  import { SITE_URL } from "$lib/config/site";
  import modules from "./commands.json";
  import { previews } from "./previews";

  interface Command {
    name: string;
    summary: string;
    aliases: string[];
    usage: string[];
    permission?: string;
    serverOnly?: boolean;
  }

  interface Module {
    name: string;
    commands: Command[];
  }

  const allModules = modules as Module[];

  let mounted = $state(false);
  let activeTabIndex = $state(0);
  let searchValue = $state("");
  let previewing = $state<string | null>(null);
  let previewOpen = $state(false);

  function showPreview(name: string) {
    previewing = name;
    previewOpen = true;
  }

  const query = $derived(searchValue.trim().toLowerCase());
  const filteredModules = $derived.by(() => {
    if (!query) return allModules;
    return allModules
      .map((module) =>
        module.name.toLowerCase().includes(query)
          ? module
          : {
              ...module,
              commands: module.commands.filter(
                (c) =>
                  c.name.includes(query) ||
                  c.aliases.some((a) => a.includes(query)) ||
                  c.summary.toLowerCase().includes(query),
              ),
            },
      )
      .filter((module) => module.commands.length > 0);
  });
  const activeModule = $derived(filteredModules[activeTabIndex] ?? filteredModules[0]);
  const resultCount = $derived(filteredModules.reduce((n, module) => n + module.commands.length, 0));

  $effect(() => {
    if (query) activeTabIndex = 0;
  });

  function commandAnchor(name: string): string {
    return `cmd-${name.toLowerCase().replace(/\s+/g, "-")}`;
  }

  function linkCommand(name: string) {
    const url = new URL(location.href);
    url.searchParams.set("command", name);
    url.searchParams.delete("module");
    url.hash = commandAnchor(name);
    history.replaceState(history.state, "", url);
  }

  async function openRequested() {
    const requested = page.url.searchParams.get("command")?.toLowerCase();
    const requestedModule = page.url.searchParams.get("module")?.toLowerCase();
    if (!requested) {
      const index = allModules.findIndex((mod) => mod.name.toLowerCase() === requestedModule);
      if (index >= 0) activeTabIndex = index;
      return;
    }
    const index = allModules.findIndex((mod) => mod.commands.some((c) => c.name === requested));
    if (index < 0) return;
    activeTabIndex = index;
    if (previews[requested]) showPreview(requested);
    await tick();
    document.getElementById(commandAnchor(requested))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleTabKeydown(event: KeyboardEvent, index: number) {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      activeTabIndex = index - 1;
      ((event.target as HTMLElement).previousElementSibling as HTMLElement | null)?.focus();
    } else if (event.key === "ArrowRight" && index < filteredModules.length - 1) {
      event.preventDefault();
      activeTabIndex = index + 1;
      ((event.target as HTMLElement).nextElementSibling as HTMLElement | null)?.focus();
    }
  }

  /** Splits a summary into plain text and `code` parts. */
  const summaryParts = (text: string) => text.split(/(`[^`]+`)/).filter(Boolean);

  onMount(() => {
    mounted = true;
    void openRequested();
  });
</script>

<svelte:head>
  <title>{m.commands.pageTitle()}</title>
  <meta content={m.commands.pageTitle()} property="og:title" />
  <meta content={m.commands.metaDescription()} name="description" />
  <meta content={m.commands.metaDescription()} property="og:description" />
  <meta content="{SITE_URL}/commands" property="og:url" />
  <link href="{SITE_URL}/commands" rel="canonical" />
</svelte:head>

<div
  class="min-h-screen"
  style="--color-primary: {$colorStore.primary};
         --color-secondary: {$colorStore.secondary};
         --color-accent: {$colorStore.accent};
         --color-text: {$colorStore.text};
         --color-muted: {$colorStore.muted};"
>
  <div class="py-4 border-b" style="border-color: {$colorStore.primary}20;">
    <div class="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-lg lg:text-xl font-bold" in:fade={{ duration: 300 }} style="color: {$colorStore.text};">
            {m.commands.heading()}
          </h1>
        </div>
        <div class="shrink-0 lg:max-w-md lg:w-full">
          <SearchInput bind:value={searchValue} placeholder={m.commands.searchPlaceholder()} id="search" />
          {#if query}
            <div class="mt-2 text-sm" style="color: {$colorStore.muted};" in:fade={{ duration: 200 }} aria-live="polite">
              {resultCount > 0 ? m.commands.showing({ count: resultCount }) : m.commands.noResults({ query: searchValue.trim() })}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-hidden">
    <div class="container mx-auto px-4 lg:px-6 h-full flex flex-col">
      {#if filteredModules.length > 0}
        <div class="py-4">
          <div class="md:hidden mb-2">
            <label for="module-select" class="block text-sm font-medium mb-2" style="color: {$colorStore.muted};">{m.commands.selectModule()}</label>
            <DiscordSelector
              type="custom"
              id="module-select"
              searchable={false}
              options={filteredModules.map((module, index) => ({
                id: index.toString(),
                name: m.commands.moduleOption({ module: module.name, count: module.commands.length }),
              }))}
              selected={activeTabIndex.toString()}
              ariaLabel={m.commands.selectModule()}
              onchange={(e) => {
                if (typeof e.selected === "string") activeTabIndex = parseInt(e.selected);
              }}
            />
          </div>

          <div class="hidden md:block">
            <div class="flex flex-wrap gap-1.5" role="tablist" aria-label={m.commands.modulesLabel()}>
              {#each filteredModules as module, index (module.name)}
                <button
                  class="tab-button group inline-flex items-center px-3 py-2 border rounded-lg font-medium text-sm whitespace-nowrap transition-colors focus:outline-hidden"
                  style="{index === activeTabIndex
                    ? `background: ${$colorStore.selectedSurface}; border-color: ${$colorStore.selectedBorder}; color: ${$colorStore.text};`
                    : `background: transparent; border-color: ${$colorStore.primary}20; color: ${$colorStore.muted};`}"
                  role="tab"
                  aria-selected={index === activeTabIndex}
                  aria-controls="tabpanel-{index}"
                  id="tab-{index}"
                  tabindex={index === activeTabIndex ? 0 : -1}
                  onclick={() => (activeTabIndex = index)}
                  onkeydown={(e) => handleTabKeydown(e, index)}
                >
                  <span class="truncate">{module.name}</span>
                  <span class="ml-2 px-1.5 py-0.5 text-xs rounded-full"
                        style="background: {$colorStore.primary}15; color: {index === activeTabIndex ? $colorStore.text : $colorStore.muted};">
                    {module.commands.length}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        </div>

        {#if activeModule}
          <div class="pb-8" role="tabpanel" aria-labelledby="tab-{activeTabIndex}" id="tabpanel-{activeTabIndex}" tabindex="0">
            <div class="mb-4">
              <div>
                <h2 class="text-lg font-bold leading-tight" style="color: {$colorStore.text};">{activeModule.name}</h2>
                <p class="text-xs opacity-80" style="color: {$colorStore.text};">{m.commands.count({ count: activeModule.commands.length })}</p>
              </div>
            </div>

            <div class="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {#each activeModule.commands as command, cmdIndex (command.name)}
                {@const preview = previews[command.name]}
                <article
                  id={commandAnchor(command.name)}
                  class="command-card flex flex-col gap-2 border rounded-xl p-3 transition-all duration-200 overflow-hidden scroll-mt-24"
                  style="background: {$colorStore.primary}10; border-color: {$colorStore.primary}20;"
                  in:fly={{ y: 20, duration: 300, delay: mounted ? Math.min(cmdIndex, 12) * 30 : 0 }}
                >
                  <header>
                    <h3 class="text-base font-semibold font-mono break-words" style="color: {$colorStore.text};">
                      <a
                        href="?command={encodeURIComponent(command.name)}#{commandAnchor(command.name)}"
                        onclick={(event) => {
                          event.preventDefault();
                          linkCommand(command.name);
                        }}
                        title={m.commands.linkToCommand()}
                        class="hover:underline">;{command.name}</a>
                    </h3>
                  </header>

                  <p class="text-sm leading-relaxed whitespace-pre-line" style="color: {$colorStore.text}; opacity: 0.85;">
                    {#each summaryParts(command.summary) as part, i (i)}{#if part.startsWith("`")}<code class="px-1 py-0.5 rounded text-xs font-mono [overflow-wrap:anywhere]" style="background: {$colorStore.primary}20;">{part.slice(1, -1)}</code>{:else}{part}{/if}{/each}
                  </p>

                  <div>
                    <h4 class="text-xs font-semibold mb-1" style="color: {$colorStore.muted};">{m.commands.usage()}</h4>
                    <div class="space-y-1">
                      {#each command.usage as usage (usage)}
                        <code class="block text-xs px-2 py-1.5 border rounded-lg font-mono overflow-x-auto whitespace-pre-wrap break-words"
                              style="background: {$colorStore.primary}15; border-color: {$colorStore.primary}30; color: {$colorStore.text};">{usage}</code>
                      {/each}
                    </div>
                  </div>

                  {#if command.aliases.length}
                    <p class="text-xs" style="color: {$colorStore.muted};">
                      {m.commands.aliases()}:
                      {#each command.aliases as alias, i (alias)}<code class="font-mono" style="color: {$colorStore.text};">;{alias}</code>{i < command.aliases.length - 1 ? ", " : ""}{/each}
                    </p>
                  {/if}

                  {#if command.permission || command.serverOnly || preview}
                  <footer class="mt-auto flex flex-wrap items-center gap-2">
                    {#if command.permission}
                      <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md"
                            style="background: {$colorStore.secondary}20; color: {$colorStore.secondary};">
                        <i class="fa-solid fa-lock mr-1" style="font-size: 12px;" aria-hidden="true"></i>{m.commands.manageCommunity()}
                      </span>
                    {/if}
                    {#if command.serverOnly}
                      <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md"
                            style="background: {$colorStore.primary}15; color: {$colorStore.text}; border: 1px solid {$colorStore.primary}20;">
                        <i class="fa-solid fa-server mr-1" style="font-size: 12px;" aria-hidden="true"></i>{m.commands.serverOnly()}
                      </span>
                    {/if}
                    {#if preview}
                      <button
                        type="button"
                        class="ml-auto inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-opacity hover:opacity-80"
                        style="background: {$colorStore.primary}20; color: {$colorStore.text}; border: 1px solid {$colorStore.primary}30;"
                        aria-haspopup="dialog"
                        onclick={() => showPreview(command.name)}
                      >
                        <i class="fa-solid fa-comment mr-1" style="font-size: 12px;" aria-hidden="true"></i>
                        {m.commands.showReply()}
                      </button>
                    {/if}
                  </footer>
                  {/if}
                </article>
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

{#if previewing && previews[previewing]}
  <Modal bind:open={previewOpen} title=";{previewing}" icon="fa-solid fa-comment" size="lg" onclose={() => (previewing = null)}>
    {@const preview = previews[previewing]}
    <div class="mx-auto w-full max-w-[520px] space-y-3">
      <FluxerChatCompact
        scene={preview.scene}
        label={m.commands.previewLabel({ command: `;${previewing}` })}
        width={520}
        height={preview.height}
      />
      {#if preview.dm}
        <FluxerChatCompact
          scene={preview.dm.scene}
          label={m.commands.previewDmLabel({ command: `;${previewing}` })}
          width={520}
          height={preview.dm.height}
        />
      {/if}
    </div>
  </Modal>
{/if}

<style>
  .tab-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .tab-button:not([aria-selected="true"]):hover {
    color: var(--color-text);
  }
</style>
