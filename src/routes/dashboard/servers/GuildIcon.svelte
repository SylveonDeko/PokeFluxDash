<!--
@component
A server icon, or the server's initials when it has none or the image fails.
-->
<script lang="ts">
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    name: string;
    src: string | null;
    size?: number;
  }

  let { name, src, size = 40 }: Props = $props();

  let failedSrc = $state<string | null>(null);
  let initials = $derived(
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => [...word][0])
      .join("")
      .toUpperCase(),
  );
</script>

{#if src && failedSrc !== src}
  <img {src} alt="" width={size} height={size} class="rounded-full shrink-0 object-cover" style="width: {size}px; height: {size}px;" onerror={() => (failedSrc = src)} />
{:else}
  <span
    class="rounded-full shrink-0 flex items-center justify-center font-semibold"
    style="width: {size}px; height: {size}px; font-size: {Math.round(size / 2.8)}px; background: {$colorStore.primary}20; color: {$colorStore.primary};"
    aria-hidden="true"
  >
    {initials}
  </span>
{/if}
