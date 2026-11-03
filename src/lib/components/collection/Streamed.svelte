<!--
@component
Renders a streamed bot answer from a load: `pending` or a spinner until the first one arrives, then
the answer through ApiState. A newer promise keeps the last answer on screen until it settles.
-->
<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import type { BotResponse } from "$lib/api";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import AsyncState from "$lib/components/stats/AsyncState.svelte";

  interface Props {
    promise: Promise<BotResponse<T>>;
    notStartedOn404?: boolean;
    pending?: Snippet;
    children: Snippet<[T]>;
  }

  let { promise, notStartedOn404 = false, pending, children: content }: Props = $props();

  let response = $state<BotResponse<T> | null>(null);

  $effect(() => {
    let current = true;
    promise
      .then((value) => {
        if (current) response = value;
      })
      .catch((err) => {
        if (current) response = { ok: false, status: 500, error: err instanceof Error ? err.message : String(err), data: null };
      });
    return () => {
      current = false;
    };
  });
</script>

{#snippet nothing()}{/snippet}

{#if response}
  <ApiState {response} {notStartedOn404}>
    {#snippet children(data)}
      {@render content(data)}
    {/snippet}
  </ApiState>
{:else if pending}
  {@render pending()}
{:else}
  <AsyncState loading children={nothing} />
{/if}
