<!--
@component
Renders the children with a bot API answer's data, or the bot's error when the call failed.
-->
<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { BotResponse } from "$lib/api";
  import FluxerChatCompact from "$lib/components/home/FluxerChatCompact.svelte";
  import { startScene } from "$lib/components/home/scenes";

  interface Props {
    response: BotResponse<T>;
    /** Treat 404 as "has not started playing yet". */
    notStartedOn404?: boolean;
    children: Snippet<[T]>;
  }

  let { response, notStartedOn404 = false, children }: Props = $props();
</script>

{#if response.ok}
  {@render children(response.data)}
{:else if notStartedOn404 && response.status === 404}
  <div class="text-center py-6" style="color: {$colorStore.muted}">
    <p class="text-base">{m.dashboard.notStartedTitle()}</p>
    <p class="text-sm mt-1">{m.dashboard.notStartedHint()}</p>
    <div class="w-full max-w-[520px] mx-auto mt-4">
      <FluxerChatCompact scene={startScene} label={m.dashboard.startMockLabel()} width={520} height={505} />
    </div>
  </div>
{:else}
  <div
    class="p-4 rounded-xl mb-4"
    style="background: {$colorStore.accent}10; border: 1px solid {$colorStore.accent}40;"
    role="alert"
  >
    <div class="flex items-center gap-3">
      <i class="fa-solid fa-triangle-exclamation" style="color: {$colorStore.accent}; font-size: 20px;" aria-hidden="true"></i>
      <div class="min-w-0" style="color: {$colorStore.accent}">
        <div class="font-semibold">{m.dashboard.loadFailed({ status: response.status })}</div>
        <div class="text-sm mt-0.5 break-words" style="color: {$colorStore.accent}90">{response.error}</div>
      </div>
    </div>
  </div>
{/if}
