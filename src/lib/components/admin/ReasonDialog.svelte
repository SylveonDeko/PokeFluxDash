<!--
@component
A ConfirmDialog for a staff action, with a required reason that is passed to `onconfirm`.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { controlStyle } from "$lib/components/dashboard/styles";
  import ConfirmDialog from "$lib/components/pokeflux/ConfirmDialog.svelte";
  import { errorMessage } from "$lib/api/proxy";
  import { toast } from "$lib/stores/toast.svelte";

  interface Props {
    open?: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant?: "danger" | "warning" | "info";
    onconfirm: (reason: string) => void | Promise<void>;
    /** Extra fields above the reason, such as a switch. */
    children?: Snippet;
  }

  let { open = $bindable(false), title, message, confirmLabel, variant = "danger", onconfirm, children }: Props = $props();

  const MAX_REASON = 500;
  const id = `pf-reason-${Math.random().toString(36).slice(2, 9)}`;
  let reason = $state("");

  $effect(() => {
    if (open) reason = "";
  });
</script>

<ConfirmDialog
  bind:open
  {title}
  {message}
  {confirmLabel}
  {variant}
  confirmDisabled={reason.trim().length === 0}
  onconfirm={async () => {
    try {
      await onconfirm(reason.trim());
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  }}
>
  <div class="space-y-3">
    {@render children?.()}
    <label for={id} class="block text-sm font-medium" style="color: {$colorStore.text};">{m.admin.reasonLabel()}</label>
    <textarea
      {id}
      bind:value={reason}
      rows="3"
      maxlength={MAX_REASON}
      required
      placeholder={m.admin.reasonPlaceholder()}
      class="w-full p-3 rounded-lg border text-sm resize-y"
      style={controlStyle($colorStore)}
    ></textarea>
    <p class="text-xs" style="color: {$colorStore.muted};">{m.admin.reasonHint({ length: reason.trim().length, max: MAX_REASON })}</p>
  </div>
</ConfirmDialog>
