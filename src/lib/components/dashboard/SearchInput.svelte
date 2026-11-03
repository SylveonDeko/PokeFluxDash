<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { colorStore } from "$lib/stores/colorStore";
  import { controlStyle } from "./styles";

  interface Props extends Omit<HTMLInputAttributes, "value" | "class"> {
    value: string;
    placeholder: string;
    input?: HTMLInputElement;
    class?: string;
    /** Shown inside the box on the right, such as a keyboard hint. */
    children?: Snippet;
  }

  let { value = $bindable(), placeholder, input = $bindable(), class: className = "", children, ...rest }: Props = $props();
</script>

<label class="relative block min-w-0 {className}">
  <span class="sr-only">{placeholder}</span>
  <i
    class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
    style="color: {$colorStore.muted};"
    aria-hidden="true"
  ></i>
  <input
    bind:this={input}
    type="search"
    bind:value
    {placeholder}
    class="w-full pl-9 {children ? 'pr-10' : 'pr-3'} py-2 rounded-lg border text-sm outline-none focus-visible:ring-2 min-h-[38px]"
    style={controlStyle($colorStore)}
    {...rest}
  />
  {@render children?.()}
</label>
