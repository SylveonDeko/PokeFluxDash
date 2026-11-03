<!--
@component
ApiState for staff pages: a 403 from the bot shows a staff-only message.
-->
<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import type { BotResponse } from "$lib/api";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import EmptyState from "$lib/components/pokeflux/EmptyState.svelte";

  interface Props {
    response: BotResponse<T>;
    children: Snippet<[T]>;
  }

  let { response, children }: Props = $props();
</script>

{#if !response.ok && response.status === 403}
  <EmptyState title={m.admin.forbiddenTitle()} message={response.error} icon="fa-solid fa-lock" />
{:else}
  <ApiState {response} {children} />
{/if}
