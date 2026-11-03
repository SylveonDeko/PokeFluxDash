<!--
@component
A user's nickname and ID, linking to their staff lookup.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { AdminUserRef } from "$lib/api";

  interface Props {
    user: AdminUserRef;
    /** Leave out the link, such as for a staff member. */
    plain?: boolean;
  }

  let { user, plain = false }: Props = $props();
</script>

{#if plain}
  <span class="min-w-0">
    <span class="font-medium" style="color: {$colorStore.text};">{user.name ?? m.admin.noNickname()}</span>
    <span class="block text-xs font-mono" style="color: {$colorStore.muted};">{user.id}</span>
  </span>
{:else}
  <a href="/dashboard/admin/users/{user.id}" class="min-w-0 hover:underline">
    <span class="font-medium" style="color: {$colorStore.text};">{user.name ?? m.admin.noNickname()}</span>
    <span class="block text-xs font-mono" style="color: {$colorStore.muted};">{user.id}</span>
  </a>
{/if}
