<!--
@component
The PokeFlux logo mark.
-->
<script lang="ts">
  interface Props {
    class?: string;
    label?: string | null;
  }

  let { class: className = "w-10 h-10", label = "PokeFlux" }: Props = $props();
</script>

<img
  class="{className} object-contain"
  src="/img/pokeflux.png"
  alt={label ?? ""}
  aria-hidden={label ? undefined : "true"}
  width="512"
  height="512"
  decoding="async"
/>
