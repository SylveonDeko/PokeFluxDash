<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { colorStore } from "$lib/stores/colorStore";
  import { sectionStyle } from "./styles";

  interface Props extends HTMLAttributes<HTMLElement> {
    title?: string;
    /** Icon classes, such as "fa-solid fa-gift". */
    icon?: string;
    subtitle?: string;
    headingId?: string;
    /** Shown in the heading after the title, such as a count. */
    badge?: Snippet;
    /** Controls on the heading's row. */
    actions?: Snippet;
    /** Drop the space under the heading, such as while the content is collapsed. */
    flush?: boolean;
    children?: Snippet;
  }

  let { title, icon, subtitle, headingId, badge, actions, flush = false, children, class: className = "", ...rest }: Props = $props();

  let gap = $derived(flush ? "" : "mb-4");
</script>

{#snippet heading()}
  <h2
    id={headingId}
    class="text-lg font-semibold flex items-center gap-2 {actions ? 'mr-auto' : ''} {subtitle || actions ? '' : gap}"
    style="color: {$colorStore.text}"
  >
    {#if icon}
      <i class={icon} style="color: {$colorStore.primary}; font-size: 18px;" aria-hidden="true"></i>
    {/if}
    {title}
    {@render badge?.()}
  </h2>
{/snippet}

<section class="rounded-2xl border p-4 md:p-5 shadow-2xl transition-all {className}" style={sectionStyle($colorStore)} {...rest}>
  {#if title}
    {#if actions}
      <div class="flex flex-wrap items-center gap-2 {subtitle ? '' : gap}">
        {@render heading()}
        {@render actions()}
      </div>
    {:else}
      {@render heading()}
    {/if}
    {#if subtitle}
      <p class="text-sm mt-0.5 {gap}" style="color: {$colorStore.muted}">{subtitle}</p>
    {/if}
  {/if}
  {@render children?.()}
</section>
