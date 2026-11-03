<!--
@component
A labelled horizontal bar for a value out of a maximum, such as experience or steps left.
-->
<script lang="ts">
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    value: number;
    max: number;
    /** Accessible name, also shown above the bar unless `hideLabel`. */
    label: string;
    /** Text at the right, such as "2,880 / 3,012". */
    valueText?: string;
    color?: string;
    hideLabel?: boolean;
    size?: "sm" | "md";
    class?: string;
  }

  let { value, max, label, valueText, color, hideLabel = false, size = "md", class: className = "" }: Props = $props();

  let percent = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div class="w-full {className}">
  {#if !hideLabel || valueText}
    <div class="flex items-center justify-between gap-2 text-xs mb-1">
      {#if !hideLabel}<span style="color: {$colorStore.muted};">{label}</span>{/if}
      {#if valueText}<span class="tabular-nums font-medium ml-auto" style="color: {$colorStore.text};">{valueText}</span>{/if}
    </div>
  {/if}
  <div
    class="{size === 'sm' ? 'h-1.5' : 'h-2'} rounded-full overflow-hidden"
    style="background: {$colorStore.primary}15;"
    role="meter"
    aria-label={label}
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuetext={valueText}
  >
    <div
      class="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
      style="width: {percent}%; background: {color ?? $colorStore.primary};"
    ></div>
  </div>
</div>
