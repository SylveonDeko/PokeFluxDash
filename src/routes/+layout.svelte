<!-- routes/+layout.svelte -->
<script lang="ts">
  import * as cdn from "$lib/utils/cdn";
  import { m } from "$lib/i18n";

  import "../app.css";
  import UnifiedNav from "$lib/components/layout/UnifiedNav.svelte";
  import ErrorBoundary from "$lib/components/ui/ErrorBoundary.svelte";
  import type { LayoutData } from "./$types";
  import type { FluxerUser } from "$lib/types/fluxer";
  import type { NavItem } from "$lib/config/navigation";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/state";
  import { colorStore } from "$lib/stores/colorStore";
  import { userStore } from "$lib/stores/userStore";
  import { initAuthRefresh } from "$lib/authRefresh";
  import { dyslexicFontStore } from "$lib/stores/accessibilityStore";
  import { themeStore } from "$lib/stores/themeStore";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import { pendingConfirmation, resolveConfirmation } from "$lib/stores/confirmationStore";
  import { SITE_URL } from "$lib/config/site";

  interface Props {
        data: LayoutData;
        children?: import('svelte').Snippet;
    }

    let {data, children}: Props = $props();

  async function extractColors(user: FluxerUser | null) {
      if (!browser) {
          return;
      }

    try {
      if (user?.avatar) {
          const avatarUrl = cdn.userAvatarUrl(user.id, user.avatar);

          await colorStore.extractFromImage(avatarUrl);
      } else if (!user) {
        colorStore.reset();
      }
    } catch (err) {
      colorStore.reset(); // Reset to default colors
    }
  }

  onMount(async () => {
    if (browser) {
      // Initialize auth refresh system
      initAuthRefresh();
      dyslexicFontStore.init();
      themeStore.init();
    }
  });

  // Main navigation items
  const navItems: NavItem[] = $derived([
    { title: m.common.home(), elements: [{ href: "/" }] },
    { title: m.common.dashboard(), elements: [{ href: "/dashboard" }] },
    { title: m.common.commands(), elements: [{ href: "/commands" }] },
    { title: m.pokefluxMarket.leaderboardTitle(), elements: [{ href: "/leaderboard" }] },
    {
      title: m.layout.navLegal(),
      elements: [
        { title: m.common.privacy(), href: "/privacy" },
        { title: m.common.terms(), href: "/terms" }
      ]
    }
  ]);

    // Keep user store in sync with server data and handle color extraction
    let lastExtractedUserId: string | null = null;
    let colorExtractionPromise: Promise<void> | null = null;

  $effect(() => {
        if (!browser) return;

        // Update user store if needed
        if (data?.user) {
            if (!$userStore || $userStore.id !== data.user.id) {
                userStore.set(data.user);
            }

          if (data.user.id !== lastExtractedUserId && !colorExtractionPromise) {
                lastExtractedUserId = data.user.id;

                // Extract colors and track the promise to avoid duplicates
                colorExtractionPromise = extractColors(data.user);
                colorExtractionPromise.finally(() => {
                    colorExtractionPromise = null;
                });
            }
        } else if ($userStore) {
          // Clear user store if server says no user (logged out)
            userStore.set(null);
            lastExtractedUserId = null;

          if (!colorExtractionPromise) {
            colorExtractionPromise = extractColors(null);
            colorExtractionPromise.finally(() => {
              colorExtractionPromise = null;
            });
            }
        } else if (!data?.user && !$userStore && !lastExtractedUserId && !colorExtractionPromise) {
          // Handle initial page load when not logged in
          lastExtractedUserId = "default";
          colorExtractionPromise = extractColors(null);
          colorExtractionPromise.finally(() => {
            colorExtractionPromise = null;
          });
        }
    });

    // Sync colorStore to CSS custom properties for Font Awesome Jelly Duo icons
    $effect(() => {
        if (browser && document.documentElement) {
            document.documentElement.style.setProperty('--color-primary', $colorStore.primary);
            document.documentElement.style.setProperty('--color-secondary', $colorStore.secondary);
            document.documentElement.style.setProperty('--color-accent', $colorStore.accent);
            document.documentElement.style.setProperty('--color-text', $colorStore.text);
            document.documentElement.style.setProperty('--color-muted', $colorStore.muted);
        }
    });
</script>

<svelte:head>
  <meta content={$themeStore === "aero" ? "#04122b" : "#ff5a5f"} name="theme-color" />
  <meta content="website" property="og:type" />
  <meta content="{SITE_URL}/img/pokeflux.png" property="og:image" />
  <meta content="PokeFlux" property="og:site_name" />
  <meta content="summary" name="twitter:card" />
  <meta content="index, follow" name="robots" />
</svelte:head>

{#if !page.url.pathname.startsWith("/dashboard")}
  <UnifiedNav data={data} items={navItems} />
{:else}
  <div class="lg:hidden">
    <UnifiedNav data={data} items={navItems} />
  </div>
{/if}

<ErrorBoundary fallback={m.common.errorUnexpected()} showDetails={true}>
  <main class="bg-pf-dark-grey w-full">
      {@render children?.()}
  </main>
</ErrorBoundary>

<ConfirmationModal
  isOpen={!!$pendingConfirmation}
  title={$pendingConfirmation?.title}
  message={$pendingConfirmation?.message}
  confirmText={$pendingConfirmation?.confirmText}
  cancelText={$pendingConfirmation?.cancelText}
  variant={$pendingConfirmation?.variant}
  onconfirm={() => resolveConfirmation(true)}
  oncancel={() => resolveConfirmation(false)}
/>
