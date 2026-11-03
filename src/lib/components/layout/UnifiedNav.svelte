<!--
@component
A unified navigation component that provides responsive navigation.

- Responsive design that adapts to mobile and desktop
- Dynamic navigation menu with nested items
- Accessibility-compliant navigation structure

@example
```svelte
<UnifiedNav
  items={navigationItems}
  data={{ user: currentUser }}
>
```
-->
<script lang="ts">
  import * as cdn from "$lib/utils/cdn";
  import { m } from "$lib/i18n";
  import { page } from "$app/state";
  import { fade, slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import PokeFluxMark from "$lib/components/brand/PokeFluxMark.svelte";
  import { clickOutside } from "$lib/clickOutside";
  import { browser } from "$app/environment";

  import { onDestroy, onMount } from "svelte";
  import type { FluxerUser } from "$lib/types/fluxer";
  import { colorStore } from "$lib/stores/colorStore";
  import { userStore } from "$lib/stores/userStore";
  import { dyslexicFontStore } from "$lib/stores/accessibilityStore";
  import { themeStore } from "$lib/stores/themeStore";
  import type { NavItem } from "$lib/config/navigation";

  type ProcessedItem = {
    title: string;
    wrapped: boolean;
    href?: string;
    icon?: string;
    children?: { title?: string; href: string; icon?: string }[];
  };

  // Props
  interface Props {
    items?: NavItem[];
    data?: { user?: FluxerUser | null };
  }

  let { items = [], data = undefined }: Props = $props();

  let currentUser = $derived(data?.user || $userStore);

  // State
  let menuOpen = $state(false);
  let sidebarOpen = $state(false);
  let dropdownOpen = $state(false);
  let isMobile = $state(false);

  // Mouse tracking for nav hover effects
  let navItemMousePositions = $state<{ [key: string]: { x: number, y: number } }>({});
  let navMouseX = $state(0);
  let navMouseY = $state(0);
  let isNavHovered = $state(false);
  let navElement = $state<HTMLElement>();

  // Computed - only access page in browser
  let current = $derived(browser ? page.url.pathname : "");
  let isDashboard = $derived(current.startsWith("/dashboard"));
  let isMinimalMode = $derived(isDashboard); // Use minimal mode for dashboard pages

  // Derived computed items based on current state
  let computedItems = $derived.by(() => {
    if (!browser) {
      return [];
    }
    if (!page || !page.url) {
      return [];
    }
    return buildMainItems(items);
  });

  function debounce(fn: (...args: any[]) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      if (browser) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      }
    };
  }

  function handleNavMouseMove(e: MouseEvent, itemId: string) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    navItemMousePositions[itemId] = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handleNavMouseLeave(itemId: string) {
    delete navItemMousePositions[itemId];
  }

  function handleNavContainerMouseMove(e: MouseEvent) {
    if (!browser) return;
    const nav = e.currentTarget as HTMLElement;
    const rect = nav.getBoundingClientRect();
    navMouseX = e.clientX - rect.left;
    navMouseY = e.clientY - rect.top;
  }

  function handleNavContainerEnter() {
    isNavHovered = true;
  }

  function handleNavContainerLeave() {
    isNavHovered = false;
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && (menuOpen || sidebarOpen || dropdownOpen)) {
      e.preventDefault();
      closeMobileMenu();
      closeDropdown();
    }
  };

  function handleResize() {
    isMobile = browser ? window.innerWidth < 768 : false;
    // Close mobile menu if screen becomes large enough
    if (browser && window.innerWidth >= 768 && (menuOpen || sidebarOpen)) {
      closeMobileMenu();
    }
  }

  const debouncedResize = debounce(handleResize, 250);

  function checkMobile() {
    handleResize();
  }

  function buildMainItems(items: NavItem[]): ProcessedItem[] {
    return items.flatMap((item): ProcessedItem => {
      const elems = item.elements;
      if (elems.length === 1 && !elems[0].title) {
        return {
          title: item.title,
          wrapped: false,
          href: elems[0].href
        };
      }
      return {
        title: item.title,
        wrapped: true,
        children: elems
      };
    });
  }

  // UI Interaction Functions
  function toggleMenu() {
    if (isDashboard) {
      sidebarOpen = !sidebarOpen;
    } else {
      menuOpen = !menuOpen;
    }

    if (browser) {
      document.body.style.overflow = (menuOpen || sidebarOpen) ? "hidden" : "";
    }
  }

  function closeMobileMenu() {
    menuOpen = false;
    sidebarOpen = false;
    if (browser) {
      document.body.style.overflow = "";
    }
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown() {
    dropdownOpen = false;
  }

  onMount(() => {
    if (!browser) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", debouncedResize);

    checkMobile();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("keydown", handleKeyDown);
    }
  });

</script>

<nav
  aria-label={m.layout.navAria()}
  bind:this={navElement}
  class="py-2 lg:py-3 relative z-10 border-b transition-all duration-300"
  style="background: {$colorStore?.primary}05;
         border-color: {$colorStore?.primary}15;"
>
    <div class="flex items-center mx-auto px-4 lg:px-8 xl:px-12 max-w-[1920px]">
    <!-- Left section - Logo (hidden on dashboard lg+ since sidebar has branding) -->
        <div class="w-[140px] lg:w-[220px] xl:w-[240px] shrink-0"
             class:md:w-[56px]={!isDashboard}
             class:md:w-[220px]={isDashboard}
             class:lg:hidden={isDashboard}>
        <a
                class="flex items-center py-1 justify-start"
          href={isDashboard ? "/dashboard" : "/"}
          title="PokeFlux"
        >
          <PokeFluxMark label={null} class="h-10 w-10 mr-3 shrink-0" />
            <span class="hidden xs:block md:hidden lg:block self-center text-lg font-semibold whitespace-nowrap text-pf-white">
            PokeFlux
          </span>
        </a>
    </div>

    <!-- Center section (nav items) - Hidden in minimal mode -->
    {#if !isMinimalMode}
      <div class="grow flex justify-center z-20 relative"
           role="presentation"
           onmousemove={handleNavContainerMouseMove}
           onmouseenter={handleNavContainerEnter}
           onmouseleave={handleNavContainerLeave}>
        <div
          class="pointer-events-none absolute rounded-full"
          style="width: 120px;
                     height: 120px;
                     background: radial-gradient(circle at center, {$colorStore.primary}40, transparent 60%);
                     left: {navMouseX}px;
                     top: {navMouseY}px;
                     transform: translate(-50%, -50%);
                     filter: blur(20px);
                     opacity: {isNavHovered ? 0.3 : 0};
                     transition: opacity 300ms ease-out;
                     z-index: 0;"
        ></div>
        <div
          class="hidden md:flex flex-row p-2 space-x-1 xl:space-x-4 text-[15px] font-medium relative z-10"
          role="navigation"
        >
          {#each computedItems as item, i}
            {#if item.wrapped}
              <div class="relative group" in:slide|local={{ duration: 300, delay: i * 50, axis: 'x' }}>
                <button
                  class="relative overflow-hidden flex items-center space-x-2 px-2 py-1.5 xl:px-3 rounded-md transition-all duration-200 ease-out min-h-[36px] hover:scale-[1.02]"
                  style="color: {$colorStore.text};"
                  aria-expanded="false"
                  aria-haspopup="true"
                  onmousemove={(e) => handleNavMouseMove(e, `dropdown-${i}`)}
                  onmouseleave={() => handleNavMouseLeave(`dropdown-${i}`)}
                >
                  {#if navItemMousePositions[`dropdown-${i}`]}
                    <div
                      class="pointer-events-none absolute w-16 h-16 rounded-full opacity-25"
                      style="background: radial-gradient(circle at center, {$colorStore.primary}50, transparent 70%);
                             left: {navItemMousePositions[`dropdown-${i}`].x}px;
                             top: {navItemMousePositions[`dropdown-${i}`].y}px;
                             transform: translate(-50%, -50%);
                             filter: blur(10px);"
                    ></div>
                  {/if}
                  <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                       style="background: linear-gradient(135deg, {$colorStore.primary}10, {$colorStore.secondary}08);"></div>
                  <span class="relative z-10">{item.title}</span>
                  <svg class="relative z-10 w-4 h-4 transition-transform group-hover:rotate-180 duration-200"
                       viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  class="absolute left-0 mt-2 w-48 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-md border"
                  style="background: linear-gradient(135deg, {$colorStore.gradientStart}95, {$colorStore.gradientEnd}95);
                         border-color: {$colorStore.primary}30;
                         z-index: 100;"
                  role="menu"
                >
                  {#each item.children || [] as child, childIdx (child.href)}
                    <a
                      href={child.href || '#'}
                      data-sveltekit-preload-data="hover"
                      data-sveltekit-noscroll
                      class="relative overflow-hidden flex items-center p-2 transition-all duration-200 hover:scale-[1.01]"
                      style="color: {$colorStore.text};"
                      role="menuitem"
                      onmousemove={(e) => handleNavMouseMove(e, `dropdown-child-${i}-${childIdx}`)}
                      onmouseleave={() => handleNavMouseLeave(`dropdown-child-${i}-${childIdx}`)}
                    >
                      {#if navItemMousePositions[`dropdown-child-${i}-${childIdx}`]}
                        <div
                          class="pointer-events-none absolute w-14 h-14 rounded-full opacity-20"
                          style="background: radial-gradient(circle at center, {$colorStore.primary}40, transparent 70%);
                                 left: {navItemMousePositions[`dropdown-child-${i}-${childIdx}`].x}px;
                                 top: {navItemMousePositions[`dropdown-child-${i}-${childIdx}`].y}px;
                                 transform: translate(-50%, -50%);
                                 filter: blur(8px);"
                        ></div>
                      {/if}
                      <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-150"
                           style="background: {$colorStore.primary}10;"></div>
                      {#if child.icon}
                        <i class="relative z-10 fa-utility-duo fa-regular {child.icon} mr-2 text-base"
                           aria-hidden="true"
                           style="--fa-primary-color: {$colorStore.primary}; --fa-secondary-color: {$colorStore.secondary};"></i>
                      {/if}
                      <span class="relative z-10">{child.title}</span>
                    </a>
                  {/each}
                </div>
              </div>
            {:else}
              <a
                href={item.href || '#'}
                target={item.href?.startsWith("http") ? "_blank" : undefined}
                rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                data-sveltekit-preload-data={item.href?.startsWith("http") ? "off" : "hover"}
                data-sveltekit-noscroll
                class="relative overflow-hidden flex items-center space-x-2 px-2 py-1.5 xl:px-3 rounded-md transition-all duration-200 ease-out min-h-[36px] hover:scale-[1.02]"
                in:slide|local={{ duration: 300, delay: i * 50, axis: 'x' }}
                style="background: {current === item.href ? `${$colorStore.primary}25` : 'transparent'};
                       z-index: 10;"
                onmousemove={(e) => handleNavMouseMove(e, `nav-${i}`)}
                onmouseleave={() => handleNavMouseLeave(`nav-${i}`)}
              >
                {#if navItemMousePositions[`nav-${i}`]}
                  <div
                    class="pointer-events-none absolute w-16 h-16 rounded-full opacity-25"
                    style="background: radial-gradient(circle at center, {$colorStore.primary}50, transparent 70%);
                           left: {navItemMousePositions[`nav-${i}`].x}px;
                           top: {navItemMousePositions[`nav-${i}`].y}px;
                           transform: translate(-50%, -50%);
                           filter: blur(10px);"
                  ></div>
                {/if}
                <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                     style="background: linear-gradient(135deg, {$colorStore.primary}10, {$colorStore.secondary}08);"></div>
                {#if item.icon}
                  <i class="relative z-10 fa-utility-duo fa-regular {item.icon} mr-2 text-base"
                     aria-hidden="true"
                     style="--fa-primary-color: {$colorStore.primary}; --fa-secondary-color: {$colorStore.secondary};"></i>
                {/if}
                <span class="relative z-10">{item.title}</span>
              </a>
            {/if}
          {/each}
        </div>
      </div>
    {:else}
        <div class="grow flex justify-center items-center relative"></div>
    {/if}

    <!-- Right section -->
        <div class="flex items-center gap-2 min-w-[140px] md:w-[140px] lg:w-[220px] xl:w-[240px] justify-end"
             class:md:w-[220px]={isDashboard}>
      <!-- Dyslexia-friendly font toggle - always visible, no login required -->
      <button
        type="button"
        class="hidden md:flex relative z-30 items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ease-in-out hover:scale-[1.05] border shrink-0"
        style="background: {$dyslexicFontStore ? `${$colorStore.primary}30` : 'transparent'};
               border-color: {$colorStore.primary}40;
               color: {$colorStore.text};"
        onclick={() => dyslexicFontStore.toggle()}
        aria-pressed={$dyslexicFontStore}
        aria-label={m.layout.navToggleDyslexicFont()}
        title={m.layout.navToggleDyslexicFont()}
      >
        <i class="fa-solid fa-universal-access text-sm"></i>
      </button>
      <!-- Frutiger Aero theme toggle - always visible, no login required -->
      <button
        type="button"
        class="hidden md:flex relative z-30 items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ease-in-out hover:scale-[1.05] border shrink-0"
        style="background: {$themeStore === 'aero' ? `${$colorStore.primary}30` : 'transparent'};
               border-color: {$colorStore.primary}40;
               color: {$colorStore.text};"
        onclick={() => themeStore.toggleAero()}
        aria-pressed={$themeStore === "aero"}
        aria-label={m.layout.navToggleAeroTheme()}
        title={m.layout.navToggleAeroTheme()}
      >
        <i class="fa-solid fa-palette text-sm"></i>
      </button>
      {#if !currentUser}
        <a href="/api/auth/login"
           data-sveltekit-reload
           class=" rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-lg  border inline-block"
           style="background: linear-gradient(135deg, {$colorStore.primary}80, {$colorStore.secondary}80);
                  color: {$colorStore.text};
                  border-color: {$colorStore.primary}50;
                  box-shadow: 0 2px 8px {$colorStore.primary}30;">
          {m.common.login()}
        </a>
      {:else}
        <div class="hidden md:flex relative" use:clickOutside onclickoutside={closeDropdown}>
          <button
            class=" flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-lg transition-all duration-200 ease-in-out  border hover:scale-[1.02] shadow-lg hover:shadow-xl"
            style="background: linear-gradient(135deg, {$colorStore.primary}20, {$colorStore.secondary}20);
                   border-color: {$colorStore.primary}40;
                   box-shadow: 0 2px 8px {$colorStore.primary}15;"
                  onclick={toggleDropdown}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label={m.layout.navUserMenu()}
          >
            <!-- User Avatar -->
            <img
              src={currentUser.avatar
                ? (cdn.userAvatarUrl(currentUser.id, currentUser.avatar))
                : cdn.defaultAvatarUrl()}
              alt={currentUser.username}
              class="w-8 h-8 rounded-full"
              style:background="{$colorStore.primary}20"
            >

            <span class="flex flex-col items-start">
              <span class="text-sm font-medium" style:color={$colorStore.text}>
                {currentUser.username}
              </span>
            </span>

            <svg
              class="h-5 w-5 transition-transform ml-1"
              class:rotate-180={dropdownOpen}
              style:color={$colorStore.muted}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Desktop Dropdown -->
          {#if dropdownOpen}
            <!-- Dropdown arrow -->
            <div class="absolute right-4 top-full w-0 h-0 z-40"
                 style="border-left: 8px solid transparent;
                        border-right: 8px solid transparent;
                        border-bottom: 8px solid {$colorStore.primary}50;
                        margin-top: -1px;"></div>

            <div
                    class="absolute right-0 top-full mt-1 w-72 rounded-xl p-3 flex flex-col space-y-3 shadow-2xl z-50 backdrop-blur-lg border"
              style="background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.9)), linear-gradient(135deg, {$colorStore.gradientStart}20, {$colorStore.gradientMid}25, {$colorStore.gradientEnd}20);
                    border-color: {$colorStore.primary}50;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);"
              role="menu"
              transition:slide|local={{ duration: 200 }}
            >
              <!-- Enhanced User Info -->
              <div class="p-3 rounded-lg mb-3 border "
                   style="background: linear-gradient(135deg, {$colorStore.primary}15, {$colorStore.secondary}15);
                          border-color: {$colorStore.primary}40;">
                    <div class="flex items-center space-x-2">
                  <div class="relative">
                    <img
                      src={currentUser.avatar
                        ? (cdn.userAvatarUrl(currentUser.id, currentUser.avatar))
                        : cdn.defaultAvatarUrl()}
                      alt={currentUser.username}
                      class="w-10 h-10 rounded-lg border-2"
                      style="border-color: {$colorStore.primary}50;"
                    >
                    <!-- Online indicator -->
                      <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black"
                         style="background: #10b981;"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-1">
                          <h2 class="font-semibold text-base truncate"
                              style="color: {$colorStore.text};">{currentUser.username}</h2>
                      {#if currentUser.discriminator && currentUser.discriminator !== "0"}
                        <span class="text-sm" style="color: {$colorStore.muted};">#{currentUser.discriminator}</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Logout -->
              <div class="pt-2 border-t border-opacity-30" style="border-color: {$colorStore.primary};">
                <form
                  action="/api/auth/logout"
                  method="GET"
                  class="w-full"
                >
                  <button
                    type="submit"
                    class=" block w-full text-center px-3 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-[1.02] border text-sm font-medium"
                    style="background: linear-gradient(135deg, {$colorStore.accent}15, {$colorStore.accent}20);
                           color: {$colorStore.text};
                           border-color: {$colorStore.accent}30;
                           box-shadow: 0 2px 8px {$colorStore.accent}10;"
                  >
                    {m.common.logout()}
                  </button>
                </form>
              </div>
            </div>
          {/if}
        </div>

        <!-- Mobile User Display -->
        <div class="md:hidden flex items-center gap-2">
          <img
            src={currentUser.avatar
              ? (cdn.userAvatarUrl(currentUser.id, currentUser.avatar))
              : cdn.defaultAvatarUrl()}
            alt={currentUser.username}
            class="w-7 h-7 rounded-full"
            style:background="{$colorStore.primary}20"
          >
        </div>

        {#if isDashboard}
          <button
            aria-label={m.layout.navOpenSidebarMenu()}
            class="inline-flex items-center p-2 rounded-lg transition-all duration-200 ease-in-out lg:hidden min-h-[36px] min-w-[36px]"
            style="color: {$colorStore.text};"
            onclick={() => { if (browser) window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar')); }}
          >
            <i class="fa-solid fa-bars text-lg" aria-hidden="true"></i>
          </button>
        {/if}

        <!-- Mobile menu button - hide in dashboard while the sidebar drawer is there -->
        {#if !isDashboard}
          <button
            aria-controls="mobile-menu"
            aria-expanded={menuOpen || sidebarOpen}
            aria-label={m.layout.navToggleMenu()}
            class="inline-flex items-center p-2 rounded-lg border-transparent transition-all duration-200 ease-in-out md:hidden min-h-[36px] min-w-[36px] hover:bg-(--hover-bg-color)"
            style:--hover-bg-color="{$colorStore.primary}20"
            style:border-color="{$colorStore.primary}30"
            onclick={toggleMenu}
          >
            <span class="sr-only">{m.layout.navToggleMenu()}</span>
            <span class="relative w-5 h-5 flex flex-col justify-center">
              <span
                      class="block w-5 h-0.5 rounded-sm transition-all duration-200 ease-in-out"
                class:rotate-45={menuOpen || sidebarOpen}
                      class:translate-y-1.5={menuOpen || sidebarOpen}
                style:background-color={$colorStore.text}
              ></span>
              <span
                      class="block w-5 h-0.5 rounded-sm mt-1 transition-all duration-200 ease-in-out"
                class:opacity-0={menuOpen || sidebarOpen}
                style:background-color={$colorStore.text}
              ></span>
              <span
                      class="block w-5 h-0.5 rounded-sm mt-1 transition-all duration-200 ease-in-out"
                class:-rotate-45={menuOpen || sidebarOpen}
                      class:-translate-y-1.5={menuOpen || sidebarOpen}
                style:background-color={$colorStore.text}
              ></span>
            </span>
          </button>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Mobile menu -->
  {#if (menuOpen || sidebarOpen) && isMobile}
    <div
            class="fixed inset-0 backdrop-blur-sm z-40"
            style="background: rgba(0, 0, 0, 0.6);"
            onclick={closeMobileMenu}
      transition:fade={{ duration: 300, easing: cubicOut }}
      aria-hidden="true"
    ></div>

    <div
      class="fixed inset-y-0 right-0 w-72 z-50 flex flex-col overflow-hidden backdrop-blur-lg border-l shadow-2xl"
      style="background: linear-gradient(135deg, rgba(18, 24, 40, 0.98), rgba(18, 24, 40, 0.95)), linear-gradient(135deg, {$colorStore.gradientStart}15, {$colorStore.gradientMid}20, {$colorStore.gradientEnd}15);
             border-color: {$colorStore.primary}30;
             box-shadow: -8px 0 32px {$colorStore.primary}20, inset 0 0 0 1px {$colorStore.primary}10;"
      transition:slide={{ duration: 300, easing: cubicOut, axis: 'x' }}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      <!-- Mobile Header -->
      <div class="p-4 border-b border-opacity-30" style="border-color: {$colorStore.primary};">
        <div class="flex justify-between items-center">
          <div id="mobile-menu-title" class="sr-only">{m.layout.navMobileMenuTitle()}</div>
          {#if currentUser}
            <div class="flex items-center space-x-3">
              <div class="relative">
                <img
                  src={currentUser.avatar
                    ? (cdn.userAvatarUrl(currentUser.id, currentUser.avatar))
                    : cdn.defaultAvatarUrl()}
                  alt={currentUser.username}
                  class="w-10 h-10 rounded-lg border-2"
                  style="border-color: {$colorStore.primary}50;"
                >
                <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black"
                     style="background: #10b981;"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-1">
                  <h2 class="font-semibold text-base truncate"
                      style="color: {$colorStore.text};">{currentUser.username}</h2>
                  {#if currentUser.discriminator && currentUser.discriminator !== "0"}
                    <span class="text-sm" style="color: {$colorStore.muted};">#{currentUser.discriminator}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
          <button
                  class="p-2 rounded-lg transition-all hover:bg-white/10"
                  style="color: {$colorStore.text};"
                  onclick={closeMobileMenu}
            aria-label={m.layout.navCloseMenu()}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- OpenDyslexic toggle -->
        <div class="px-4 py-3 border-b border-opacity-30 flex items-center justify-between"
             style="border-color: {$colorStore.primary};">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-universal-access" style="color: {$colorStore.primary}; font-size: 16px;"></i>
            <span class="font-medium" style="color: {$colorStore.text};">{m.common.dyslexiaFriendlyFont()}</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={$dyslexicFontStore}
              onchange={() => dyslexicFontStore.toggle()}
              class="sr-only"
            >
            <span class="w-11 h-6 rounded-full transition-all relative shadow-inner block"
                  style="background: {$dyslexicFontStore ? $colorStore.primary : '#374151'};">
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform block"
                class:translate-x-5={$dyslexicFontStore}>
              </span>
            </span>
          </label>
        </div>

        <!-- Frutiger Aero theme toggle -->
        <div class="px-4 py-3 border-b border-opacity-30 flex items-center justify-between"
             style="border-color: {$colorStore.primary};">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-palette" style="color: {$colorStore.primary}; font-size: 16px;"></i>
            <span class="font-medium" style="color: {$colorStore.text};">{m.layout.navAeroTheme()}</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={$themeStore === "aero"}
              onchange={() => themeStore.toggleAero()}
              class="sr-only"
            >
            <span class="w-11 h-6 rounded-full transition-all relative shadow-inner block"
                  style="background: {$themeStore === 'aero' ? $colorStore.primary : '#374151'};">
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform block"
                class:translate-x-5={$themeStore === "aero"}>
              </span>
            </span>
          </label>
        </div>

        {#if !isDashboard}
          <nav class="p-4 space-y-1">
            {#each computedItems as item (item.href || item.title)}
              {#if item.wrapped}
                <div class="space-y-1">
                  <div class="text-sm font-medium px-2" style="color: {$colorStore.muted};">{item.title}</div>
                  {#each item.children || [] as child (child.href)}
                    <a
                      href={child.href || '#'}
                      class=" flex items-center px-4 py-3 rounded-lg transition-all duration-200 ease-in-out min-h-[44px] border hover:bg-white/5"
                      style="color: {$colorStore.text};
                             background: {current === child.href ? `${$colorStore.primary}20` : 'transparent'};
                             border-color: {current === child.href ? $colorStore.primary + '30' : 'transparent'};"
                      onclick={closeMobileMenu}
                    >
                      {#if child.icon}
                        <i class="fa-utility-duo fa-regular {child.icon} mr-3 text-xl"
                           aria-hidden="true"
                           style="--fa-primary-color: {$colorStore.primary}; --fa-secondary-color: {$colorStore.secondary};"></i>
                      {/if}
                      <span class="font-medium">{child.title}</span>
                    </a>
                  {/each}
                </div>
              {:else}
                <a
                  href={item.href || '#'}
                  target={item.href?.startsWith("http") ? "_blank" : undefined}
                  rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                  class=" flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out min-h-[44px] border hover:bg-white/5"
                  style="color: {$colorStore.text};
                         background: {current === item.href ? `${$colorStore.primary}20` : 'transparent'};
                         border-color: {current === item.href ? $colorStore.primary + '30' : 'transparent'};"
                  onclick={closeMobileMenu}
                >
                  {#if item.icon}
                    <i class="fa-utility-duo fa-regular {item.icon} text-xl"
                       aria-hidden="true"
                       style="--fa-primary-color: {$colorStore.primary}; --fa-secondary-color: {$colorStore.secondary};"></i>
                  {/if}
                  <span class="font-medium">{item.title}</span>
                </a>
              {/if}
            {/each}
          </nav>
        {/if}
      </div>

      <!-- Mobile Footer -->
      <div class="p-4 border-t border-opacity-30" style="border-color: {$colorStore.primary};">
        <form
          action="/api/auth/logout"
          method="GET"
          class="w-full"
        >
          <button
            type="submit"
            class=" block w-full text-center px-4 py-3 rounded-lg transition-all duration-200 ease-in-out hover:scale-[1.02] border font-medium"
            style="background: linear-gradient(135deg, {$colorStore.accent}15, {$colorStore.accent}20);
                   color: {$colorStore.text};
                   border-color: {$colorStore.accent}30;
                   box-shadow: 0 2px 8px {$colorStore.accent}10;"
          >
            {m.common.logout()}
          </button>
        </form>
      </div>
    </div>
  {/if}
</nav>

<style lang="postcss">
    @reference '../../../app.css';

    /* Ensure dropdowns appear above other content */
    .group:hover .group-hover\:visible {
        z-index: 100;
    }
</style>
