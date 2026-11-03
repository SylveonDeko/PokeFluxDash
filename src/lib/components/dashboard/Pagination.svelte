<!--
@component
Previous and next page controls. Pass `hrefFor` for links or `onchange` for buttons; `numbered` adds
page numbers on wider screens.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { buttonStyle, chipStyle, segmentStyle } from "./styles";

  interface Props {
    page: number;
    pages: number;
    label: string;
    hrefFor?: (page: number) => string;
    onchange?: (page: number) => void;
    numbered?: boolean;
    disabled?: boolean;
    class?: string;
  }

  let { page, pages, label, hrefFor, onchange, numbered = false, disabled = false, class: className = "" }: Props = $props();

  const control =
    "min-w-9 h-9 px-2 rounded-lg flex items-center justify-center text-sm font-medium tabular-nums transition-all hover:scale-[1.02] outline-none focus-visible:ring-2 disabled:opacity-40 disabled:hover:scale-100";

  /** Page numbers around the current one, with null for a gap. */
  function pageWindow(page: number, pages: number): (number | null)[] {
    const wanted = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
    const sorted = [...wanted].sort((a, b) => a - b);
    const out: (number | null)[] = [];
    for (const p of sorted) {
      const last = out[out.length - 1];
      if (typeof last === "number" && p - last === 2) out.push(last + 1);
      else if (typeof last === "number" && p - last > 2) out.push(null);
      out.push(p);
    }
    return out;
  }
</script>

{#snippet step(target: number, blocked: boolean, icon: string, text: string, style: string, current = false)}
  {#if blocked}
    <span class="{control} opacity-40" {style} aria-hidden="true"><i class="fa-solid {icon}"></i></span>
  {:else if hrefFor}
    <a href={hrefFor(target)} class={control} {style} aria-label={text} aria-current={current ? "page" : undefined} data-sveltekit-noscroll={numbered ? "off" : ""}>
      {#if icon}<i class="fa-solid {icon}" aria-hidden="true"></i>{:else}{target}{/if}
    </a>
  {:else}
    <button type="button" class={control} {style} aria-label={text} aria-current={current ? "page" : undefined} {disabled} onclick={() => onchange?.(target)}>
      {#if icon}<i class="fa-solid {icon}" aria-hidden="true"></i>{:else}{target}{/if}
    </button>
  {/if}
{/snippet}

{#if pages > 1}
  <nav class="flex items-center {numbered ? 'gap-1' : 'gap-2 justify-between'} {className}" aria-label={label} data-sveltekit-preload-data="hover">
    {@render step(page - 1, page <= 1, "fa-chevron-left", m.pokeflux.previousPage(), buttonStyle($colorStore))}
    {#if numbered}
      <span class="hidden sm:contents">
        {#each pageWindow(page, pages) as p, i (p ?? `gap-${i}`)}
          {#if p === null}
            <span class="px-1 text-sm" style="color: {$colorStore.muted};" aria-hidden="true">…</span>
          {:else}
            {@render step(p, false, "", m.pokefluxPokemon.pageNumber({ page: p }), p === page ? segmentStyle($colorStore, true) : chipStyle($colorStore, false), p === page)}
          {/if}
        {/each}
      </span>
    {/if}
    <span class="{numbered ? 'sm:hidden px-2' : ''} text-sm tabular-nums" style="color: {$colorStore.muted};" aria-live="polite">
      {m.dashboard.pageOf({ page, pages })}
    </span>
    {@render step(page + 1, page >= pages, "fa-chevron-right", m.pokeflux.nextPage(), buttonStyle($colorStore))}
  </nav>
{/if}
