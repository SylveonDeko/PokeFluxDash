<!--
@component
A modal on the native dialog element. Bind `open`.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    open?: boolean;
    title: string;
    /** Icon classes for the header, such as "fa-solid fa-paw". */
    icon?: string;
    iconColor?: string;
    size?: "sm" | "md" | "lg" | "xl";
    /** Block Escape and backdrop clicks, such as while a request runs. */
    locked?: boolean;
    /** Element to focus on open, the first focusable one otherwise. */
    initialFocus?: HTMLElement | null;
    onclose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    icon,
    iconColor,
    size = "md",
    locked = false,
    initialFocus = null,
    onclose,
    children,
    footer,
  }: Props = $props();

  const titleId = `pf-modal-${Math.random().toString(36).slice(2, 10)}`;
  let dialog = $state<HTMLDialogElement>();

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
  };

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => {
        const target =
          initialFocus ??
          dialog?.querySelector<HTMLElement>("[data-autofocus]") ??
          dialog?.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([data-close]), [href]',
          );
        target?.focus();
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  function requestClose() {
    if (locked) return;
    open = false;
    onclose?.();
  }

  function oncancel(event: Event) {
    event.preventDefault();
    requestClose();
  }

  function onclick(event: MouseEvent) {
    if (event.target === dialog) requestClose();
  }

  function onnativeclose() {
    if (!open) return;
    open = false;
    onclose?.();
  }
</script>

<dialog
  bind:this={dialog}
  class="pf-modal m-auto p-0 bg-transparent border-0 w-[calc(100%-1.5rem)] {widths[size]} max-h-[calc(100dvh-1.5rem)] overflow-visible"
  aria-labelledby={titleId}
  {oncancel}
  {onclick}
  onclose={onnativeclose}
>
  {#if open}
    <div
      class="flex flex-col max-h-[calc(100dvh-1.5rem)] rounded-2xl border overflow-hidden"
      style="background: color-mix(in srgb, {$colorStore.primary} 5%, {$colorStore.background}); border-color: {$colorStore.primary}30; color: {$colorStore.text};"
    >
      <header class="flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0" style="border-color: {$colorStore.primary}20;">
        <div class="flex items-center gap-3 min-w-0">
          {#if icon}
            <div class="w-8 h-8 flex items-center justify-center rounded-lg shrink-0" style="background: {iconColor ?? $colorStore.primary}20;">
              <i class="{icon}" style="color: {iconColor ?? $colorStore.primary}; font-size: 16px;" aria-hidden="true"></i>
            </div>
          {/if}
          <h2 id={titleId} class="text-lg font-semibold truncate" style="color: {$colorStore.text}">{title}</h2>
        </div>
        <button
          type="button"
          data-close
          class="p-2 shrink-0 rounded-lg transition-colors hover:opacity-70 disabled:opacity-40"
          style="background: {$colorStore.primary}10; color: {$colorStore.muted}"
          aria-label={m.layout.confirmClose()}
          disabled={locked}
          onclick={requestClose}
        >
          <i class="fa-solid fa-xmark" style="font-size: 16px;" aria-hidden="true"></i>
        </button>
      </header>

      <div class="flex-1 min-h-0 overflow-y-auto p-5">
        {@render children?.()}
      </div>

      {#if footer}
        <footer class="p-5 pt-0 shrink-0">
          {@render footer()}
        </footer>
      {/if}
    </div>
  {/if}
</dialog>

<style>
  .pf-modal::backdrop {
    background: transparent;
    backdrop-filter: blur(12px);
  }

  .pf-modal[open] {
    animation: pf-modal-in 200ms ease-out;
  }

  @keyframes pf-modal-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pf-modal[open] {
      animation: none;
    }
  }
</style>
