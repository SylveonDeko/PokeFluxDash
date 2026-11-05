<!--
@component
A staff list: a table on wide screens and a card per row on phones, styled like Mewdeko's audit log.
-->
<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import { colorStore } from "$lib/stores/colorStore";

  interface Props {
    rows: T[];
    key: (row: T) => string | number;
    columns: string[];
    /** The cells of a row, as td elements. */
    row: Snippet<[T]>;
    /** The content of a row's card on phones. */
    card: Snippet<[T]>;
    caption?: string;
  }

  let { rows, key, columns, row, card, caption }: Props = $props();
</script>

<div class="hidden md:block rounded-2xl border overflow-x-auto" style="border-color: {$colorStore.primary}30;">
  <table class="w-full text-sm">
    {#if caption}<caption class="sr-only">{caption}</caption>{/if}
    <thead>
      <tr style="background: {$colorStore.primary}15;">
        {#each columns as column, i (i)}
          <th scope="col" class="text-left font-semibold px-3 py-2 whitespace-nowrap" style="color: {$colorStore.text}">{column}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as item (key(item))}
        <tr style="border-top: 1px solid {$colorStore.primary}20;">
          {@render row(item)}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<ul class="md:hidden space-y-2">
  {#each rows as item (key(item))}
    <li
      class="rounded-2xl border p-3"
      style="background: {$colorStore.primary}08; border-color: {$colorStore.primary}30;"
    >
      {@render card(item)}
    </li>
  {/each}
</ul>
