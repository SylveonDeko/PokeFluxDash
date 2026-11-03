<script lang="ts">
  import * as cdn from "$lib/utils/cdn";
  import { m } from "$lib/i18n";
  import { page } from "$app/state";
  import { fade, slide } from "svelte/transition";
  import { browser } from "$app/environment";
  import PokeFluxMark from "$lib/components/brand/PokeFluxMark.svelte";
  import LocaleSwitcher from "$lib/components/layout/LocaleSwitcher.svelte";
  import { onMount } from "svelte";
  import { colorStore } from "$lib/stores/colorStore";
  import { dashboardSections } from "$lib/config/navigation";
  import { userStore } from "$lib/stores/userStore";
  import { dyslexicFontStore } from "$lib/stores/accessibilityStore";
  import { themeStore } from "$lib/stores/themeStore";
  import { safeLocalStorage } from "$lib/safeStorage";
  import { adminSections, hasRank } from "$lib/staff";
  import type { StaffInfo } from "$lib/api";

  interface Props {
    collapsed?: boolean;
    mobileOpen?: boolean;
  }

  let { collapsed = $bindable(false), mobileOpen = $bindable(false) }: Props = $props();
  let searchTerm = $state("");
  let searchInputRef = $state<HTMLInputElement>();
  let hoveringItem = $state<string | null>(null);
  let tooltipPosition = $state<{ top: number } | null>(null);
  let isMobile = $state(browser ? window.innerWidth < 1024 : false);

  let currentPath = $derived(page.url.pathname);
  let isDashboardHome = $derived(currentPath === "/dashboard" || currentPath === "/dashboard/");
  let showUserMenu = $state(false);

  let userAvatarUrl = $derived.by(() => {
    const user = $userStore;
    if (!user?.avatar) return cdn.defaultAvatarUrl();
    return cdn.userAvatarUrl(user.id, user.avatar);
  });

  /** Every section, in alphabetical order. The overview is pinned above the list. */
  let filteredFeatures = $derived.by(() => {
    let features = dashboardSections.filter(item => item.href !== "/dashboard");

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      features = features.filter(f => f.label().toLowerCase().includes(term));
    }

    return [...features].sort((a, b) => a.label().localeCompare(b.label()));
  });

  let staffRank = $derived((page.data.staff as StaffInfo | undefined)?.staffRank);

  /** The Admin entries the user's rank can open, narrowed by the search. */
  let adminFeatures = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();
    return adminSections.filter(
      (item) => hasRank(staffRank, item.rank) && (!term || item.label().toLowerCase().includes(term)),
    );
  });

  /** The letter to show above an entry, when it is the first of its letter. */
  function letterFor(index: number): string | null {
    const letter = filteredFeatures[index].label()[0].toUpperCase();

    if (index === 0) return letter;

    return filteredFeatures[index - 1].label()[0].toUpperCase() === letter ? null : letter;
  }

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return isDashboardHome;
    }
    if (href === "/dashboard/admin") {
      return currentPath === href || currentPath === href + "/";
    }
    return currentPath === href || currentPath.startsWith(href + "/");
  }

  function toggleSidebar() {
    collapsed = !collapsed;
    if (browser) {
      safeLocalStorage.setItem("sidebar-collapsed", collapsed.toString());
      window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: collapsed }));
    }
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      searchTerm = "";
      searchInputRef?.blur();
    }
  }

  function closeMobile() {
    mobileOpen = false;
    if (browser) {
      document.body.style.overflow = "";
    }
  }

  // Close mobile sidebar on route change
  let prevPath = $state("");
  $effect(() => {
    if (currentPath !== prevPath) {
      prevPath = currentPath;
      if (mobileOpen) {
        closeMobile();
      }
    }
  });

  // Lock body scroll when mobile sidebar is open
  $effect(() => {
    if (!browser || !mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  });

  function handleGlobalKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

    if ((event.ctrlKey || event.metaKey) && event.key === "b") {
      event.preventDefault();
      toggleSidebar();
    }

    if (event.key === "/" && !collapsed) {
      event.preventDefault();
      searchInputRef?.focus();
    }
  }

  function showTooltip(event: MouseEvent, label: string) {
    if (!collapsed) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tooltipPosition = { top: rect.top + rect.height / 2 };
    hoveringItem = label;
  }

  function hideTooltip() {
    hoveringItem = null;
    tooltipPosition = null;
  }

  function handleWindowResize() {
    isMobile = window.innerWidth < 1024;
  }

  onMount(() => {
    if (browser) {
      collapsed = safeLocalStorage.getItem("sidebar-collapsed") === "true";

      window.addEventListener("keydown", handleGlobalKeydown);
      window.addEventListener("resize", handleWindowResize);
    }

    return () => {
      if (browser) {
        window.removeEventListener("keydown", handleGlobalKeydown);
        window.removeEventListener("resize", handleWindowResize);
      }
    };
  });
</script>

<aside
  class="flex flex-col shrink-0 fixed top-0 z-40 transition-[width,transform] duration-300 ease-out h-dvh overflow-hidden lg:left-0 lg:border-r max-lg:right-0 max-lg:border-l"
  class:max-lg:translate-x-0={mobileOpen}
  class:max-lg:translate-x-full={!mobileOpen}
  style="width: {isMobile ? 'min(85vw, 320px)' : collapsed ? '68px' : '280px'};
         background: linear-gradient(180deg, {$colorStore.primary}15, {$colorStore.secondary}10, {$colorStore.accent}08);
         border-color: {$colorStore.primary}15;"
  aria-label={m.layout.sidebarAria()}
>
<div class="flex flex-col h-full shrink-0" style="width: {isMobile ? 'min(85vw, 320px)' : collapsed ? '68px' : '280px'};">
  <div class="border-b shrink-0 flex items-center px-3 py-3 gap-2"
       class:justify-center={collapsed}
       style="border-color: {$colorStore.primary}15;">
    <a href="/dashboard" class="flex items-center gap-3 overflow-hidden min-w-0"
       class:flex-1={!collapsed}
       class:justify-center={collapsed}>
      <PokeFluxMark label={null} class="w-9 h-9 shrink-0" />
      {#if !collapsed}
        <span class="text-lg font-semibold whitespace-nowrap" style="color: {$colorStore.text};">
          PokeFlux
        </span>
      {/if}
    </a>
    {#if !collapsed}
      <a
        href="/"
        class="flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-200 hover:scale-[1.05] shrink-0"
        style="color: {$colorStore.muted}; background: {$colorStore.primary}08;"
        title={m.layout.sidebarBackToHome()}
        aria-label={m.layout.sidebarBackToHome()}
      >
        <i class="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden="true"></i>
      </a>
    {/if}
  </div>

  {#if !collapsed}
  <div class="px-3 pt-3 pb-1 shrink-0">
    <div class="relative">
      <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs"
         style="color: {$colorStore.muted};" aria-hidden="true"></i>
      <input
        bind:this={searchInputRef}
        type="text"
        placeholder={m.layout.sidebarSearchFeaturesPlaceholder()}
        bind:value={searchTerm}
        onkeydown={handleSearchKeydown}
        class="w-full pl-8 pr-3 py-2 rounded-lg text-sm border transition-colors duration-200"
        style="background: {$colorStore.primary}08;
               border-color: {$colorStore.primary}15;
               color: {$colorStore.text};"
      >
      {#if searchTerm}
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-[color,background-color,border-color,transform] hover:scale-110"
          style="color: {$colorStore.muted};"
          onclick={() => { searchTerm = ""; }}
          aria-label={m.common.ariaClearSearch()}
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      {/if}
    </div>
  </div>
  {/if}

  <nav class="flex-1 overflow-y-auto overflow-x-hidden py-2 sidebar-scrollbar" aria-label={m.layout.sidebarNavAria()}>
    {#if !isDashboardHome}
      <div class="px-2 mb-1">
        <a
          href="/dashboard"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-[color,background-color,border-color,transform] duration-200 group hover:scale-[1.01]"
          style="background: transparent;
                 color: {$colorStore.muted};
                 border: 1px solid transparent;"
          onmouseenter={(e) => showTooltip(e, m.layout.sidebarDashboardHome())}
          onmouseleave={hideTooltip}
        >
          <i class="fa-utility-duo fa-regular fa-home text-base shrink-0"
             style="--fa-primary-color: {$colorStore.muted};
                    --fa-secondary-color: {$colorStore.muted};
                    --fa-secondary-opacity: 0.4;
                    width: 20px; text-align: center;"
             aria-hidden="true"></i>
          {#if !collapsed}
            <span class="text-[15px] font-medium">{m.common.dashboard()}</span>
          {/if}
        </a>
      </div>

      <div class="mx-3 my-2 h-px" style="background: {$colorStore.primary}10;"></div>
    {/if}

    <div class="px-2 space-y-0.5">
      {#each filteredFeatures as feature, index (feature.href)}
        {@const active = isActive(feature.href)}
        {@const letter = collapsed || searchTerm.trim() ? null : letterFor(index)}

        {#if letter}
          <div class="px-3 pt-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wider"
               style="color: {$colorStore.muted}; opacity: 0.5;"
               aria-hidden="true">
            {letter}
          </div>
        {/if}

        {@render navLink(feature, active)}
      {/each}
    </div>

    {#if adminFeatures.length > 0}
      <div class="mx-3 my-2 h-px" style="background: {$colorStore.primary}10;"></div>
      {#if !collapsed}
        <div class="px-5 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wider"
             style="color: {$colorStore.muted}; opacity: 0.5;"
             aria-hidden="true">
          {m.pokefluxMarket.admin()}
        </div>
      {/if}
      <div class="px-2 space-y-0.5" role="group" aria-label={m.pokefluxMarket.admin()}>
        {#each adminFeatures as feature (feature.href)}
          {@render navLink(feature, isActive(feature.href))}
        {/each}
      </div>
    {/if}

    {#if searchTerm && filteredFeatures.length === 0 && adminFeatures.length === 0}
      <div class="px-4 py-8 text-center">
        <i class="fa-solid fa-search text-2xl mb-2 block" style="color: {$colorStore.muted}; opacity: 0.3;"></i>
        <p class="text-xs" style="color: {$colorStore.muted};">{m.layout.sidebarNoFeaturesMatch({ term: searchTerm })}</p>
      </div>
    {/if}
  </nav>

  {#snippet navLink(feature: { href: string; label: () => string; icon: string }, active: boolean)}
        <a
          href={feature.href}
                  class="flex items-center gap-3 px-3 py-2 max-lg:py-3 rounded-xl transition-[color,background-color,border-color,transform] duration-200 group relative hover:scale-[1.01]"
                  class:justify-center={collapsed}
                  style="background: {active ? $colorStore.primary + '12' : 'transparent'};
                         color: {active ? $colorStore.text : $colorStore.muted};
                         border: 1px solid {active ? $colorStore.primary + '20' : 'transparent'};"
                  aria-current={active ? 'page' : undefined}
                  onmouseenter={(e) => showTooltip(e, feature.label())}
                  onmouseleave={hideTooltip}
                >
                  {#if active}
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                         style="background: linear-gradient(180deg, {$colorStore.primary}, {$colorStore.secondary});"
                         transition:fade={{ duration: 150 }}></div>
                  {/if}

                  <i class="{feature.icon} text-sm shrink-0 transition-colors duration-200"
                     style="--fa-primary-color: {active ? $colorStore.primary : $colorStore.muted};
                            --fa-secondary-color: {active ? $colorStore.secondary : $colorStore.muted};
                            --fa-secondary-opacity: {active ? 0.5 : 0.3};
                            width: 20px; text-align: center;"
                     aria-hidden="true"></i>

                  {#if !collapsed}
                    <span class="text-[15px] max-lg:text-base truncate flex-1 transition-colors duration-200"
                          style="color: {active ? $colorStore.text : $colorStore.muted};">
                      {feature.label()}
                    </span>
                  {/if}
        </a>
  {/snippet}

  <!-- User profile & controls -->
  <div class="border-t shrink-0 relative" style="border-color: {$colorStore.primary}10;">
    <!-- Expandable menu (opens upward) -->
    {#if showUserMenu && !collapsed}
      <div class="border-b p-2 space-y-1" style="border-color: {$colorStore.primary}10;"
           transition:slide={{ duration: 200, axis: 'y' }}>
        <LocaleSwitcher />

        <!-- Dyslexia-friendly font -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2 max-lg:py-2.5 rounded-xl transition-[color,background-color,border-color,transform] duration-200 hover:scale-[1.01] group"
          style="color: {$colorStore.text};"
          onclick={() => dyslexicFontStore.toggle()}
          aria-pressed={$dyslexicFontStore}
        >
          <i class="fa-solid fa-universal-access text-sm shrink-0" style="color: {$colorStore.primary}; width: 20px; text-align: center;" aria-hidden="true"></i>
          <span class="text-sm flex-1 text-left">{m.common.dyslexiaFriendlyFont()}</span>
          <span class="w-9 h-5 rounded-full transition-colors relative shadow-inner block shrink-0"
                style="background: {$dyslexicFontStore ? $colorStore.primary : '#374151'};">
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform block"
              class:translate-x-4={$dyslexicFontStore}>
            </span>
          </span>
        </button>

        <!-- Frutiger Aero theme -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2 max-lg:py-2.5 rounded-xl transition-[color,background-color,border-color,transform] duration-200 hover:scale-[1.01] group"
          style="color: {$colorStore.text};"
          onclick={() => themeStore.toggleAero()}
          aria-pressed={$themeStore === "aero"}
        >
          <i class="fa-solid fa-palette text-sm shrink-0" style="color: {$colorStore.primary}; width: 20px; text-align: center;" aria-hidden="true"></i>
          <span class="text-sm flex-1 text-left">{m.layout.navAeroTheme()}</span>
          <span class="w-9 h-5 rounded-full transition-colors relative shadow-inner block shrink-0"
                style="background: {$themeStore === 'aero' ? $colorStore.primary : '#374151'};">
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform block"
              class:translate-x-4={$themeStore === "aero"}>
            </span>
          </span>
        </button>

        <!-- Logout -->
        <form action="/api/auth/logout" method="GET" class="w-full">
          <button
            type="submit"
            class="w-full flex items-center gap-3 px-3 py-2 max-lg:py-2.5 rounded-xl transition-[color,background-color,border-color,transform] duration-200 hover:scale-[1.01] group"
            style="color: {$colorStore.accent};"
          >
            <i class="fa-solid fa-right-from-bracket text-sm shrink-0" style="width: 20px; text-align: center;" aria-hidden="true"></i>
            <span class="text-sm">{m.common.logout()}</span>
          </button>
        </form>
      </div>
    {/if}

    <div class="p-2 flex items-center gap-1" class:justify-center={collapsed}>
      <!-- User profile button -->
      {#if $userStore}
        <button
          class="flex items-center gap-3 px-2 py-2 rounded-xl transition-[color,background-color,border-color,transform] duration-200 hover:scale-[1.01] min-w-0"
          class:flex-1={!collapsed}
          class:justify-center={collapsed}
          style="background: {showUserMenu ? $colorStore.primary + '10' : 'transparent'}; color: {$colorStore.text};"
          onclick={() => { if (collapsed) { toggleSidebar(); } else { showUserMenu = !showUserMenu; } }}
          onmouseenter={(e) => collapsed && showTooltip(e, m.layout.sidebarExpandTooltip())}
          onmouseleave={hideTooltip}
          aria-label={collapsed ? m.layout.sidebarExpand() : m.layout.navUserMenu()}
          aria-expanded={showUserMenu}
        >
          <div class="relative shrink-0">
            <img
              src={userAvatarUrl}
              alt={$userStore.username}
              class="w-9 h-9 rounded-full shrink-0"
            >
            {#if collapsed}
              <span
                class="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full border-2"
                style="background: {$colorStore.primary}; border-color: {$colorStore.gradientStart};"
              >
                <i class="fa-solid fa-angles-right text-[7px]" style="color: {$colorStore.text};" aria-hidden="true"></i>
              </span>
            {/if}
          </div>
          {#if !collapsed}
            <div class="flex-1 min-w-0 text-left">
              <div class="text-sm font-medium truncate">{$userStore.username}</div>
            </div>
            <i class="fa-solid fa-chevron-up text-xs shrink-0 transition-transform duration-200"
               style="color: {$colorStore.muted}; transform: rotate({showUserMenu ? '180deg' : '0deg'});"
               aria-hidden="true"></i>
          {/if}
        </button>
      {/if}

      {#if !collapsed}
        <!-- Collapse toggle (desktop only) -->
        <button
          class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-[color,background-color,border-color,transform] duration-200 hover:scale-[1.05] shrink-0"
          style="color: {$colorStore.muted}; background: {$colorStore.primary}08;"
          onclick={toggleSidebar}
          title={m.layout.sidebarCollapseTitle()}
          aria-label={m.layout.sidebarCollapse()}
        >
          <i class="fa-solid fa-angles-left text-xs" aria-hidden="true"></i>
        </button>

        <!-- Close (mobile only) -->
        <button
          class="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-[color,background-color,border-color,transform] duration-200 hover:scale-[1.05] shrink-0"
          style="color: {$colorStore.muted}; background: {$colorStore.primary}08;"
          onclick={closeMobile}
          aria-label={m.layout.sidebarClose()}
        >
          <i class="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
        </button>
      {/if}
    </div>
  </div>
</div>
</aside>

<!-- Mobile backdrop -->
{#if mobileOpen}
  <div
    class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
    onclick={closeMobile}
    transition:fade={{ duration: 200 }}
    aria-hidden="true"
  ></div>
{/if}

{#if collapsed && hoveringItem && tooltipPosition}
  <div
    class="fixed z-50 pointer-events-none px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap"
    style="left: 76px;
           top: {tooltipPosition.top}px;
           transform: translateY(-50%);
           background: {$colorStore.gradientStart}f5;
           color: {$colorStore.text};
           border: 1px solid {$colorStore.primary}25;
           backdrop-filter: blur(8px);"
    transition:fade={{ duration: 100 }}
  >
    {hoveringItem}
  </div>
{/if}

<style>
  .sidebar-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  .sidebar-scrollbar:hover {
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  }

  .sidebar-scrollbar::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 4px;
  }

  .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }

  .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
