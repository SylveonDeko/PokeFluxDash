<!--
@component
A confirmation with extra content under the message, such as the Pokémon being released. Plain
confirmations go through requestConfirmation. An error thrown by `onconfirm` shows in the dialog.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { quietStyle, tintedStyle } from "$lib/components/dashboard/styles";
  import Modal from "./Modal.svelte";

  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    confirmDisabled?: boolean;
    onconfirm?: () => void | Promise<void>;
    oncancel?: () => void;
    /** Extra content under the message, such as the Pokémon or the price. */
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = "danger",
    confirmDisabled = false,
    onconfirm,
    oncancel,
    children,
  }: Props = $props();

  let busy = $state(false);
  let error = $state<string | null>(null);
  let cancelButton = $state<HTMLButtonElement | null>(null);

  let color = $derived(variant === "danger" ? $colorStore.accent : variant === "warning" ? "#f59e0b" : $colorStore.primary);
  let icon = $derived(
    variant === "info" ? "fa-solid fa-circle-info" : "fa-solid fa-triangle-exclamation",
  );

  $effect(() => {
    if (open) error = null;
  });

  async function confirm() {
    error = null;
    busy = true;
    try {
      await onconfirm?.();
      open = false;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busy = false;
    }
  }

  function cancel() {
    open = false;
    oncancel?.();
  }
</script>

<Modal bind:open title={title ?? m.common.confirmAction()} {icon} iconColor={color} size="sm" locked={busy} initialFocus={cancelButton} onclose={oncancel}>
  <p class="text-sm leading-relaxed" style="color: {$colorStore.muted};">{message ?? m.layout.confirmMessage()}</p>
  {#if children}
    <div class="mt-4">{@render children()}</div>
  {/if}
  {#if error}
    <p class="mt-4 text-sm p-3 rounded-xl" style="background: {$colorStore.accent}10; border: 1px solid {$colorStore.accent}40; color: {$colorStore.accent};" role="alert">{error}</p>
  {/if}

  {#snippet footer()}
    <div class="flex gap-3">
      <button
        bind:this={cancelButton}
        type="button"
        class="flex-1 px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 min-h-[40px] disabled:opacity-50"
        style={quietStyle($colorStore)}
        disabled={busy}
        onclick={cancel}
      >
        {cancelLabel ?? m.common.cancel()}
      </button>
      <button
        type="button"
        class="flex-1 px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 min-h-[40px] inline-flex items-center justify-center gap-2"
        style={tintedStyle(color)}
        disabled={busy || confirmDisabled}
        aria-busy={busy}
        onclick={confirm}
      >
        {#if busy}
          <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>{m.pokeflux.working()}
        {:else}
          {confirmLabel ?? m.common.confirm()}
        {/if}
      </button>
    </div>
  {/snippet}
</Modal>
