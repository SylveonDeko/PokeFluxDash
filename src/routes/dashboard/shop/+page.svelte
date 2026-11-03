<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { navigating, page } from "$app/state";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { requestConfirmation } from "$lib/stores/confirmationStore";
  import type { ChestCurrency, Shop, ShopCategory, ShopChest, ShopItem } from "$lib/api";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import ApiState from "$lib/components/dashboard/ApiState.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import StatTile from "$lib/components/dashboard/StatTile.svelte";
  import AsyncState from "$lib/components/stats/AsyncState.svelte";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import { buttonStyle, controlStyle } from "$lib/components/dashboard/styles";
  import { toast } from "$lib/stores/toast.svelte";
  import { ConfirmDialog, EmptyState, humanize, TypeBadge } from "$lib/components/pokeflux";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const CATEGORY_LABELS: Record<ShopCategory, { label: () => string; icon: string }> = {
    general: { label: m.pokefluxMarket.shopGeneral, icon: "fa-bag-shopping" },
    radiant: { label: m.dashboard.radiant, icon: "fa-sun" },
    crystal: { label: m.pokefluxMarket.shopCrystal, icon: "fa-gem" },
  };

  const RARITY_COLORS: Record<string, string> = {
    common: "#9ca3af",
    uncommon: "#22c55e",
    rare: "#3b82f6",
    epic: "#a855f7",
    legendary: "#f59e0b",
    mythic: "#ec4899",
  };

  let search = $state("");
  let target = $state<ShopItem | null>(null);
  let buyOpen = $state(false);
  let amount = $state<number | null>(1);

  let loading = $derived(!!navigating.to && navigating.to.route.id === page.route.id);

  function balanceOf(shop: Shop, item: ShopItem): number {
    return item.currency === "crystal-slime" ? (shop.crystalSlime ?? 0) : shop.credits;
  }

  function currencyLabel(item: ShopItem, value: number): string {
    const amount = value.toLocaleString();
    return item.currency === "crystal-slime"
      ? m.pokefluxMarket.amountCrystalSlime({ amount })
      : m.pokefluxMarket.amountCredits({ amount });
  }

  /** The balances the open tab spends. */
  function balancesFor(shop: Shop): { label: string; value: number; tint: string }[] {
    const chests = data.category === "radiant" && shop.chests.length > 0;
    const crystal = shop.items.some((item) => item.currency === "crystal-slime");
    const credits = chests || shop.items.some((item) => item.currency !== "crystal-slime") || !crystal;
    return [
      credits && { label: m.dashboard.credits(), value: shop.credits, tint: $colorStore.primary },
      chests && { label: m.dashboard.redeems(), value: shop.redeems, tint: $colorStore.secondary },
      crystal && { label: m.pokefluxMarket.crystalSlime(), value: shop.crystalSlime ?? 0, tint: $colorStore.accent },
    ].filter((balance) => !!balance);
  }

  function itemName(item: ShopItem): string {
    return /[-_]/.test(item.name) || item.name === item.name.toLowerCase() ? humanize(item.name) : item.name;
  }

  function rarityColor(rarity: string): string {
    return RARITY_COLORS[rarity.toLowerCase()] ?? $colorStore.muted;
  }

  /** Most of the item the user can buy at once: limited by stock and by their balance. */
  function maxAmount(shop: Shop, item: ShopItem): number {
    const byBalance = item.price > 0 ? Math.floor(balanceOf(shop, item) / item.price) : 999;
    const byStock = item.stock >= 0 ? item.stock : 999;
    return Math.max(0, Math.min(byBalance, byStock, 999));
  }

  function askBuy(item: ShopItem) {
    target = item;
    amount = 1;
    buyOpen = true;
  }

  let shop = $derived(data.shop.ok ? data.shop.data : null);
  let total = $derived(target && amount ? target.price * amount : 0);
  let amountError = $derived.by(() => {
    if (!target || !shop) return null;
    if (!amount || !Number.isInteger(amount) || amount < 1) return m.pokefluxMarket.amountWhole();
    if (target.stock >= 0 && amount > target.stock) return m.pokefluxMarket.amountOverStock({ stock: target.stock });
    if (total > balanceOf(shop, target)) {
      return m.pokefluxMarket.cannotAffordItem({ amount: currencyLabel(target, total - balanceOf(shop, target)) });
    }
    return null;
  });

  async function buy() {
    if (!target || !amount) return;
    const result = await proxyRequest("POST", "shop/buy", { item: target.buyName, amount });
    toast.success(result.message);
    await invalidateAll();
  }


  function chestPrice(chest: ShopChest, currency: ChestCurrency): string {
    return currency === "credits"
      ? m.pokefluxMarket.amountCredits({ amount: chest.creditPrice.toLocaleString() })
      : m.pokefluxMarket.amountRedeems({ amount: chest.redeemPrice.toLocaleString() });
  }

  /** Why a chest cannot be bought with a currency, or null when it can. */
  function chestBlocker(shop: Shop, chest: ShopChest, currency: ChestCurrency): string | null {
    if (currency === "credits" && chest.boughtThisWeek >= chest.weeklyLimit) return m.pokefluxMarket.chestLimitReached();
    const balance = currency === "credits" ? shop.credits : shop.redeems;
    const price = currency === "credits" ? chest.creditPrice : chest.redeemPrice;
    return balance < price ? m.pokefluxMarket.notEnough() : null;
  }

  async function askChest(chest: ShopChest, currency: ChestCurrency) {
    const confirmed = await requestConfirmation({
      title: m.pokefluxMarket.shopBuyTitle(),
      message: m.pokefluxMarket.chestBuyMessage({ type: humanize(chest.type), price: chestPrice(chest, currency) }),
      confirmText: m.pokefluxMarket.buy(),
      variant: "warning",
    });
    if (!confirmed) return;
    try {
      const result = await proxyRequest("POST", "shop/chest", { type: chest.type, currency });
      toast.success(result.message);
      await invalidateAll();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const tabs = $derived(
    data.categories.map((category) => ({ id: category, label: CATEGORY_LABELS[category].label(), icon: CATEGORY_LABELS[category].icon })),
  );
</script>

<DashboardPageLayout
  title={m.features.shop()}
  subtitle={m.dashboard.shopSubtitle()}
  icon="fa-bag-shopping"
  {tabs}
  activeTab={data.category}
  ontabChange={({ tabId }) => goto(`?category=${tabId}`, { noScroll: true, keepFocus: true })}
>
  <ApiState response={data.shop} notStartedOn404>
    {#snippet children(shop)}
      {@const query = search.trim().toLowerCase()}
      {@const items = query
        ? shop.items.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(query))
        : shop.items}
      {@const balances = balancesFor(shop)}

      {#if !shop.meetsRequirement}
        <div class="rounded-xl px-4 py-3 flex items-center gap-3" style="background: {$colorStore.accent}10;" role="status">
          <i class="fa-solid fa-lock" style="color: {$colorStore.accent}; font-size: 16px;" aria-hidden="true"></i>
          <p class="text-sm" style="color: {$colorStore.accent}">
            {(data.category === "radiant" ? m.pokefluxMarket.shopRequirementChests : m.pokefluxMarket.shopRequirement)({
              min: shop.minimumPokemon.toLocaleString(),
              count: shop.pokemonCount.toLocaleString(),
            })}
          </p>
        </div>
      {/if}

      {#if data.category === "radiant" && shop.chests.length}
        <Panel
          icon="fa-solid fa-box-open"
          title={m.pokefluxMarket.chestsTitle()}
          subtitle={m.pokefluxMarket.chestsHint()}
          headingId="pf-chests"
          aria-labelledby="pf-chests"
        >
          <ul class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {#each shop.chests as chest (chest.type)}
              {@const color = rarityColor(chest.type === "legend" ? "legendary" : chest.type)}
              <li class="p-3 rounded-lg border flex flex-col gap-2.5" style="background: {$colorStore.primary}10; border-color: {$colorStore.primary}30;">
                <div class="flex items-center gap-3">
                  <span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: {color}20;">
                    <i class="fa-solid fa-box-open" style="color: {color}; font-size: 16px;" aria-hidden="true"></i>
                  </span>
                  <div class="min-w-0">
                    <h3 class="font-medium" style="color: {$colorStore.text};">{m.pokefluxMarket.chestName({ type: humanize(chest.type) })}</h3>
                    <p class="text-sm tabular-nums" style="color: {$colorStore.muted};">
                      {m.pokefluxMarket.chestBoughtWeek({ count: chest.boughtThisWeek, limit: chest.weeklyLimit })}
                    </p>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-2 mt-auto">
                  {#each ["credits", "redeems"] as const as currency (currency)}
                    {@const blocker = chestBlocker(shop, chest, currency)}
                    <button
                      type="button"
                      class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={buttonStyle($colorStore)}
                      disabled={!!blocker}
                      title={blocker ?? undefined}
                      onclick={() => askChest(chest, currency)}
                    >
                      <i class="fa-solid {currency === 'credits' ? 'fa-coins' : 'fa-ticket'}" style="font-size: 14px;" aria-hidden="true"></i>
                      {m.pokefluxMarket.chestBuyFor({ price: chestPrice(chest, currency) })}
                    </button>
                  {/each}
                </div>
              </li>
            {/each}
          </ul>
        </Panel>
      {/if}

      <Panel class="space-y-3" aria-label={CATEGORY_LABELS[data.category].label()}>
        <div class="flex flex-col md:flex-row md:items-center gap-2">
          <div class="grid grid-cols-2 md:flex gap-2 shrink-0">
            {#each balances as balance (balance.label)}
              <div class="md:w-40"><StatTile label={balance.label} value={balance.value} tint={balance.tint} /></div>
            {/each}
          </div>
          <SearchInput class="flex-1" bind:value={search} placeholder={m.pokefluxMarket.shopSearch()} />
        </div>

        <AsyncState {loading}>
        {#if items.length === 0}
          <EmptyState
            title={query ? m.pokeflux.noResults() : m.pokefluxMarket.shopEmpty()}
            message={query ? m.pokefluxMarket.shopNoMatchesHint() : undefined}
            icon={query ? "fa-solid fa-magnifying-glass" : "fa-solid fa-bag-shopping"}
          />
        {:else}
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {#each items as item (item.id)}
              {@const soldOut = item.stock === 0}
              {@const blocked = soldOut || !item.affordable || !shop.meetsRequirement}
              {@const rarity = rarityColor(item.rarity)}
              <li
                class="p-3 rounded-lg border flex flex-col gap-1.5 transition-all duration-200"
                class:opacity-60={blocked}
                style="background: {$colorStore.primary}10; border-color: {$colorStore.primary}30;"
              >
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-medium leading-snug" style="color: {$colorStore.text};">{itemName(item)}</h3>
                  <span
                    class="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style="background: {rarity}20; color: {rarity};"
                  >
                    {humanize(item.rarity)}
                  </span>
                </div>
                {#if item.description}
                  <p class="text-xs" style="color: {$colorStore.muted};">{item.description}</p>
                {/if}
                <div class="flex flex-wrap items-center gap-2 text-xs" style="color: {$colorStore.muted};">
                  {#if item.pokemonType}
                    <TypeBadge type={item.pokemonType} size="xs" />
                  {/if}
                  <span class="flex items-center gap-1">
                    <i class="fa-solid fa-boxes-stacked" style="color: {$colorStore.secondary};" aria-hidden="true"></i>
                    {item.stock < 0 ? m.pokefluxMarket.stockUnlimited() : soldOut ? m.pokefluxMarket.soldOut() : m.pokefluxMarket.stockLeft({ count: item.stock.toLocaleString() })}
                  </span>
                </div>
                <div class="mt-auto pt-1 flex items-center justify-between gap-2">
                  <p class="font-bold tabular-nums" style="color: {$colorStore.text};">
                    <i
                      class="fa-solid {item.currency === 'crystal-slime' ? 'fa-gem' : 'fa-coins'} mr-1"
                      style="color: {item.currency === 'crystal-slime' ? $colorStore.accent : $colorStore.primary};"
                      aria-hidden="true"
                    ></i>
                    <span class="sr-only">{currencyLabel(item, item.price)}</span>
                    <span aria-hidden="true">{item.price.toLocaleString()}</span>
                  </p>
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[36px] disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={buttonStyle($colorStore)}
                    disabled={blocked}
                    title={soldOut ? m.pokefluxMarket.soldOut() : !item.affordable ? m.pokefluxMarket.notEnough() : !shop.meetsRequirement ? m.pokefluxMarket.locked() : undefined}
                    aria-label={m.pokefluxMarket.buyNamed({ name: itemName(item) })}
                    onclick={() => askBuy(item)}
                  >
                    {soldOut ? m.pokefluxMarket.soldOut() : !item.affordable ? m.pokefluxMarket.notEnough() : !shop.meetsRequirement ? m.pokefluxMarket.locked() : m.pokefluxMarket.buy()}
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
        </AsyncState>
      </Panel>
    {/snippet}
  </ApiState>
</DashboardPageLayout>

<ConfirmDialog
  bind:open={buyOpen}
  variant="warning"
  title={m.pokefluxMarket.shopBuyTitle()}
  message={target ? m.pokefluxMarket.shopBuyMessage({ name: itemName(target) }) : undefined}
  confirmLabel={m.pokefluxMarket.buy()}
  confirmDisabled={!!amountError}
  onconfirm={buy}
>
  {#if target && shop}
    {@const max = maxAmount(shop, target)}
    <div class="space-y-3">
      <div>
        <label for="pf-shop-amount" class="block text-sm font-medium mb-2" style="color: {$colorStore.text};">{m.pokefluxMarket.amount()}</label>
        <input
          id="pf-shop-amount"
          type="number"
          inputmode="numeric"
          min="1"
          max={max || undefined}
          step="1"
          bind:value={amount}
          aria-invalid={!!amountError}
          class="w-full px-3 py-2 min-h-[40px] rounded-lg border text-sm focus:ring-2 tabular-nums"
          style={controlStyle($colorStore)}
        />
        {#if max > 1}
          <p class="text-xs mt-1" style="color: {$colorStore.muted};">{m.pokefluxMarket.amountMax({ max: max.toLocaleString() })}</p>
        {/if}
      </div>
      <dl class="text-sm space-y-1.5 tabular-nums">
        <div class="flex justify-between gap-3">
          <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.unitPrice()}</dt>
          <dd style="color: {$colorStore.text};">{currencyLabel(target, target.price)}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt style="color: {$colorStore.muted};">{m.pokefluxMarket.balance()}</dt>
          <dd style="color: {$colorStore.text};">{currencyLabel(target, balanceOf(shop, target))}</dd>
        </div>
        <div class="flex justify-between gap-3 pt-1.5 border-t" style="border-color: {$colorStore.primary}20;">
          <dt class="font-semibold" style="color: {$colorStore.text};">{m.dashboard.total()}</dt>
          <dd class="font-semibold" style="color: {$colorStore.text};">{currencyLabel(target, total)}</dd>
        </div>
      </dl>
      {#if amountError}
        <p class="text-sm p-3 rounded-lg" style="background: {$colorStore.accent}10; color: {$colorStore.accent}; border: 1px solid {$colorStore.accent}40;" role="alert">{amountError}</p>
      {/if}
    </div>
  {/if}
</ConfirmDialog>
