<!--
@component
Time left until `until` or for `seconds`, then `readyText` once it runs out.
-->
<script lang="ts">
  import { m } from "$lib/i18n";

  interface Props {
    until?: number | string | null;
    seconds?: number;
    readyText: string;
    /** Called once when it reaches zero. */
    ondone?: () => void;
  }

  let { until: end = null, seconds, readyText, ondone }: Props = $props();

  let until = $derived.by(() => {
    if (seconds !== undefined) return seconds > 0 ? Date.now() + seconds * 1000 : null;
    if (end === null) return null;
    const time = typeof end === "number" ? end : Date.parse(end);
    return Number.isFinite(time) ? time : null;
  });

  let now = $state(Date.now());
  let left = $derived(until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000)));

  $effect(() => {
    const target = until;
    now = Date.now();
    if (target === null || target <= now) return;
    const timer = setInterval(() => {
      now = Date.now();
      if (now >= target) {
        clearInterval(timer);
        ondone?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  });

  function format(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (h > 0) return m.pokefluxCollection.durationHours({ h, m: pad(min), s: pad(s) });
    if (min > 0) return m.pokefluxCollection.durationMinutes({ m: min, s: pad(s) });
    return m.pokefluxCollection.durationSeconds({ s });
  }
</script>

{#if left > 0}
  <time class="tabular-nums" datetime="PT{left}S">{format(left)}</time>
{:else}
  <span>{readyText}</span>
{/if}
