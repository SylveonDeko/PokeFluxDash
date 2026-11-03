<script lang="ts">
  import { m } from "$lib/i18n";
  import { onMount, untrack } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { safeLocalStorage } from "$lib/safeStorage";
  import ErrorBoundary from "$lib/components/ui/ErrorBoundary.svelte";
  import { userStore } from "$lib/stores/userStore";
  import DashboardSidebar from "$lib/components/layout/DashboardSidebar.svelte";
  import Toasts from "$lib/components/dashboard/Toasts.svelte";
  import { browser } from "$app/environment";

  let { data, children } = $props();

  let sidebarCollapsed = $state(browser ? safeLocalStorage.getItem("sidebar-collapsed") === "true" : false);
  let mobileSidebarOpen = $state(false);
  let contentEl = $state<HTMLElement>();
  let prevCollapsed = untrack(() => sidebarCollapsed);
  let slideCleanup: (() => void) | null = null;

  /**
   * On large screens the content pane is the scroll container rather than
   * the document, so SvelteKit's own scroll reset never reaches it.
   */
  afterNavigate(() => {
    contentEl?.scrollTo({ top: 0 });
  });

  $effect(() => {
    const now = sidebarCollapsed;
    if (now === prevCollapsed) return;
    const delta = now ? 212 : -212;
    prevCollapsed = now;
    const el = contentEl;
    if (!browser || !el || window.innerWidth < 1024) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    slideCleanup?.();
    el.style.transition = "none";
    el.style.transform = `translateX(${delta}px)`;
    el.style.willChange = "transform";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 300ms ease-out";
        el.style.transform = "translateX(0)";
      });
    });
    const done = (e?: TransitionEvent) => {
      if (e && (e.target !== el || e.propertyName !== "transform")) return;
      el.style.transition = "";
      el.style.transform = "";
      el.style.willChange = "";
      el.removeEventListener("transitionend", done);
      slideCleanup = null;
    };
    slideCleanup = done;
    el.addEventListener("transitionend", done);
  });

  function handleToggleMobileSidebar() {
    mobileSidebarOpen = !mobileSidebarOpen;
  }

  onMount(() => {
    // Set user from server data if available
    if (data.user) {
      userStore.set(data.user);
    }

    window.addEventListener('toggle-mobile-sidebar', handleToggleMobileSidebar);
    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggleMobileSidebar);
    };
  });
</script>

<div class="flex w-full overflow-x-hidden lg:h-dvh lg:overflow-hidden">
  <DashboardSidebar bind:collapsed={sidebarCollapsed} bind:mobileOpen={mobileSidebarOpen} />

  <div bind:this={contentEl} class="flex-1 w-full min-w-0 lg:h-dvh lg:overflow-y-auto lg:overflow-x-hidden"
       class:lg:ml-[280px]={!sidebarCollapsed}
       class:lg:ml-[68px]={sidebarCollapsed}>
    <ErrorBoundary fallback={m.dashboard.errorBoundary()}
                   showDetails={true}>
        {@render children?.()}
    </ErrorBoundary>
  </div>
</div>

<Toasts />
