<!--
@component
A centred message for an empty list or search, with an optional action below.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    title?: string;
    message?: string;
    /** Icon classes, such as "fa-solid fa-magnifying-glass". */
    icon?: string;
    compact?: boolean;
    /** Buttons or links under the message. */
    children?: Snippet;
    class?: string;
  }

  let { title, message, icon = "fa-solid fa-box-open", compact = false, children, class: className = "" }: Props = $props();
</script>

<div class="text-center {compact ? 'py-4' : 'py-6'} {className}" style="color: {$colorStore.muted}">
  <i class="{icon} opacity-50" style="font-size: {compact ? 24 : 32}px; display: block; margin: 0 auto {compact ? 8 : 10}px;" aria-hidden="true"></i>
  <p class={compact ? "text-sm" : "text-base"}>{title ?? m.dashboard.emptyList()}</p>
  {#if message}
    <p class="text-sm mt-1">{message}</p>
  {/if}
  {#if children}
    <div class="mt-3 flex flex-wrap items-center justify-center gap-2">{@render children()}</div>
  {/if}
</div>
