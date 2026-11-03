<!--
@component
Shows the dashboard's current toast with the base's Notification.
-->
<script lang="ts">
  import Notification from "$lib/components/ui/Notification.svelte";
  import { toast } from "$lib/stores/toast.svelte";
</script>

<div role="status" aria-live="polite" aria-atomic="true">
  {#if toast.current}
    {#key toast.current.id}
      <Notification message={toast.current.message} type={toast.current.type} onDismiss={toast.dismiss} />
    {/key}
  {/if}
</div>
