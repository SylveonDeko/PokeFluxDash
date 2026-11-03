<!--
@component
Lists one of the user's Pokémon for sale. Set `open` to start with the picker.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { proxyRequest } from "$lib/api/proxy";
  import { buttonStyle, controlStyle, quietStyle } from "$lib/components/dashboard/styles";
  import type { CreateListingResponse, MarketRules, PokemonCard as Pokemon } from "$lib/api";
  import { ConfirmDialog, displayName, Modal, PokemonCard, PokemonPicker } from "$lib/components/pokeflux";
  import { MAX_PRICE } from "./market";

  interface Props {
    open?: boolean;
    onlisted: (message: string) => void;
  }

  let { open = $bindable(false), onlisted }: Props = $props();

  let pokemon = $state<Pokemon | null>(null);
  let priceOpen = $state(false);
  let confirmOpen = $state(false);
  let priceValue = $state<number | null>(null);
  let touched = $state(false);
  let rules = $state<MarketRules | null>(null);

  let minPrice = $derived(rules?.minPrice ?? 0);
  let maxPrice = $derived(rules?.maxPrice ?? MAX_PRICE);
  let atLimit = $derived(!!rules && rules.listingCount >= rules.listingLimit);
  let price = $derived(priceValue ?? 0);
  let priceError = $derived.by(() => {
    if (priceValue === null || priceValue === undefined) return m.pokefluxMarket.priceRequired();
    if (!Number.isInteger(price) || price < minPrice)
      return m.pokefluxMarket.priceTooLow({ min: minPrice.toLocaleString() });
    if (price > maxPrice) return m.pokefluxMarket.priceTooHigh({ max: maxPrice.toLocaleString() });
    return null;
  });

  $effect(() => {
    if (!open) return;
    const controller = new AbortController();
    proxyRequest<MarketRules>("GET", "market/rules", undefined, controller.signal)
      .then((result) => (rules = result))
      .catch(() => {});
    return () => controller.abort();
  });

  function unlistable(p: Pokemon): string | false {
    if (p.marketListed) return m.pokefluxMarket.alreadyListed();
    if (p.favorite) return m.pokefluxMarket.favoriteCannotList();
    if (p.number === 1) return m.pokefluxMarket.firstCannotList();
    return false;
  }

  function picked([choice]: Pokemon[]) {
    if (!choice) return;
    pokemon = choice;
    priceValue = null;
    touched = false;
    priceOpen = true;
  }

  function submitPrice(event: SubmitEvent) {
    event.preventDefault();
    touched = true;
    if (priceError || atLimit) return;
    confirmOpen = true;
  }

  async function list() {
    if (!pokemon) return;
    const result = await proxyRequest<CreateListingResponse>("POST", "market", { pokemonId: pokemon.id, price });
    priceOpen = false;
    onlisted(result.message);
  }

</script>

<PokemonPicker bind:open title={m.pokefluxMarket.sellPickTitle()} isDisabled={unlistable} onpick={picked} />

<Modal bind:open={priceOpen} title={m.pokefluxMarket.sellTitle()} icon="fa-solid fa-tag" size="md">
  {#if pokemon}
    <form id="pf-sell-form" class="space-y-4" onsubmit={submitPrice} novalidate>
      <PokemonCard {pokemon} size="compact" />
      {#if rules}
        <p
          class="text-sm p-3 rounded-lg flex items-center gap-2"
          style="background: {atLimit ? `${$colorStore.accent}10` : `${$colorStore.primary}08`}; color: {atLimit ? $colorStore.accent : $colorStore.text}; border: 1px solid {atLimit ? `${$colorStore.accent}40` : 'transparent'};"
          role={atLimit ? "alert" : undefined}
        >
          <i class="fa-solid {atLimit ? 'fa-triangle-exclamation' : 'fa-tags'}" aria-hidden="true"></i>
          {atLimit
            ? m.pokefluxMarket.listingLimitReached({ limit: rules.listingLimit.toLocaleString() })
            : m.pokefluxMarket.listingCount({ count: rules.listingCount.toLocaleString(), limit: rules.listingLimit.toLocaleString() })}
        </p>
      {/if}
      <div>
        <label for="pf-sell-price" class="block text-sm font-medium mb-2" style="color: {$colorStore.text};">
          {m.pokefluxMarket.priceLabel()}
        </label>
        <div class="relative">
          <i class="fa-solid fa-coins absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style="color: {$colorStore.primary};" aria-hidden="true"></i>
          <input
            id="pf-sell-price"
            type="number"
            inputmode="numeric"
            min={minPrice}
            max={maxPrice}
            step="1"
            data-autofocus
            bind:value={priceValue}
            onblur={() => (touched = true)}
            aria-invalid={touched && !!priceError}
            aria-describedby="pf-sell-price-hint"
            class="w-full pl-10 p-3 rounded-lg border focus:ring-2 tabular-nums"
            style={controlStyle($colorStore)}
          />
        </div>
        <p id="pf-sell-price-hint" class="text-xs mt-1" style="color: {touched && priceError ? $colorStore.accent : $colorStore.muted};" role={touched && priceError ? "alert" : undefined}>
          {touched && priceError ? priceError : m.pokefluxMarket.priceHint()}
        </p>
        <p class="text-xs mt-1 tabular-nums" style="color: {$colorStore.muted};">
          {m.pokefluxMarket.priceRange({ min: minPrice.toLocaleString(), max: maxPrice.toLocaleString() })}
        </p>
      </div>
    </form>
  {/if}

  {#snippet footer()}
    <div class="flex flex-col-reverse sm:flex-row gap-3">
      <button
        type="button"
        class="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[40px]"
        style={quietStyle($colorStore)}
        onclick={() => {
          priceOpen = false;
          open = true;
        }}
      >
        {m.pokefluxMarket.pickAnother()}
      </button>
      <button
        type="submit"
        form="pf-sell-form"
        disabled={atLimit}
        class="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 min-h-[40px]"
        style={buttonStyle($colorStore)}
      >
        {m.pokefluxMarket.continue()}
      </button>
    </div>
  {/snippet}
</Modal>

<ConfirmDialog
  bind:open={confirmOpen}
  variant="warning"
  title={m.pokefluxMarket.sellConfirmTitle()}
  message={pokemon ? m.pokefluxMarket.sellConfirmMessage({ name: displayName(pokemon), price: price.toLocaleString() }) : undefined}
  confirmLabel={m.pokefluxMarket.listForSale()}
  onconfirm={list}
/>
