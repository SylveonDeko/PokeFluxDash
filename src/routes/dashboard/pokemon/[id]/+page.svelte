<script lang="ts">
  import { onDestroy } from "svelte";
  import { afterNavigate, goto, invalidateAll, onNavigate, preloadData } from "$app/navigation";
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import DashboardPageLayout from "$lib/components/layout/DashboardPageLayout.svelte";
  import Panel from "$lib/components/dashboard/Panel.svelte";
  import Meter from "$lib/components/collection/Meter.svelte";
  import { buttonStyle, controlStyle, dangerStyle, sectionStyle, tintedStyle } from "$lib/components/dashboard/styles";
  import {
    Badges,
    ConfirmDialog,
    EmptyState,
    EvolutionTree,
    formatDate,
    GENDERS,
    Modal,
    MoveCard,
    PokemonCard,
    PokemonSprite,
    SpeciesBreeding,
    SpeciesFacts,
    SpeciesForms,
    StatBars,
    TypeBadge,
    collectionHref,
    displayName,
    humanize,
    ivColor,
    speciesHref,
    type StatView,
  } from "$lib/components/pokeflux";
  import type { ApiMessage, MoveSlot, PokemonCard as Card, PokemonDetail, PokemonNeighbours, SpeciesDetail } from "$lib/api";
  import { errorMessage, proxyRequest } from "$lib/api/proxy";
  import { toast } from "$lib/stores/toast.svelte";
  import { paletteFor, spritePalettes } from "$lib/components/pokeflux/spritePalette";
  import { detailHref, listHref } from "../query";
  import LearnMoveModal from "./LearnMoveModal.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let statView = $state<StatView>("ivs");
  let busy = $state<"select" | "favorite" | "nickname" | null>(null);
  let favoriteOverride = $state<boolean | null>(null);
  let nicknameOpen = $state(false);
  let nicknameValue = $state("");
  let nicknameError = $state<string | null>(null);
  let learnOpen = $state(false);
  let learnSlot = $state<MoveSlot>(1);
  let releaseOpen = $state(false);
  let neighbours = $state<PokemonNeighbours | null>(null);
  let neighboursFor = $state<string | number | null>(null);

  let backHref = $derived(listHref(data.state, neighbours?.index ?? null));

  $effect(() => {
    const pending = data.neighbours;
    const id = data.detail.ok ? data.detail.data.id : null;
    let live = true;
    pending.then((value) => {
      if (!live) return;
      neighbours = value;
      neighboursFor = id;
      settle();
      for (const card of [value?.previous, value?.next]) {
        if (!card) continue;
        preloadData(stepHref(card)).catch(() => {});
        warm(card);
      }
    });
    return () => {
      live = false;
    };
  });

  $effect(() => {
    void data.detail;
    favoriteOverride = null;
  });

  let species = $state<SpeciesDetail | null>(null);

  $effect(() => {
    const pending = data.species;
    let live = true;
    pending.then((value) => {
      if (live) species = value;
    });
    return () => {
      live = false;
    };
  });

  $effect(() => {
    const sprite = data.detail.ok ? data.detail.data.spriteUrl : null;
    if (sprite) colorStore.setOverride(sprite);
    else colorStore.clearOverride();
  });

  onDestroy(() => colorStore.clearOverride());

  function stepHref(pokemon: Card): string {
    return detailHref(pokemon.id, data.state);
  }

  /** The bot sends naive UTC timestamps for old catches. */
  function parseDate(value: string | null): Date | null {
    if (!value) return null;
    const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  async function run(kind: NonNullable<typeof busy>, action: () => Promise<ApiMessage>): Promise<boolean> {
    busy = kind;
    try {
      const result = await action();
      toast.success(result.message);
      await invalidateAll();
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      busy = null;
    }
  }

  const path = (pokemon: PokemonDetail, action: string) => `pokemon/${encodeURIComponent(pokemon.id)}/${action}`;

  function select(pokemon: PokemonDetail) {
    run("select", () => proxyRequest("POST", path(pokemon, "select")));
  }

  async function toggleFavorite(pokemon: PokemonDetail) {
    const next = !(favoriteOverride ?? pokemon.favorite);
    favoriteOverride = next;
    const ok = await run("favorite", () => proxyRequest("POST", path(pokemon, "favorite"), { favorite: next }));
    if (!ok) favoriteOverride = null;
  }

  function openNickname(pokemon: PokemonDetail) {
    nicknameValue = pokemon.nickname ?? "";
    nicknameError = null;
    nicknameOpen = true;
  }

  async function saveNickname(pokemon: PokemonDetail, nickname: string | null) {
    busy = "nickname";
    nicknameError = null;
    try {
      const result = await proxyRequest("POST", path(pokemon, "nickname"), { nickname });
      nicknameOpen = false;
      toast.success(result.message);
      await invalidateAll();
    } catch (err) {
      nicknameError = errorMessage(err);
    } finally {
      busy = null;
    }
  }

  function openLearn(slot: MoveSlot) {
    learnSlot = slot;
    learnOpen = true;
  }

  async function release(pokemon: PokemonDetail) {
    const result = await proxyRequest("POST", path(pokemon, "release"));
    toast.success(result.message);
    const next = neighbours?.next ?? neighbours?.previous;
    await goto(next ? detailHref(next.id, data.state) : backHref, {
      replaceState: true,
      invalidateAll: true,
    });
  }

  function releaseBlockers(pokemon: PokemonDetail): string[] {
    const reasons: string[] = [];
    if (pokemon.number === 1) reasons.push(m.pokefluxPokemon.blockFirst());
    if (favoriteOverride ?? pokemon.favorite) reasons.push(m.pokefluxPokemon.blockFavorite());
    if (pokemon.marketListed) reasons.push(m.pokefluxPokemon.blockMarket());
    if (pokemon.inParty) reasons.push(m.pokefluxPokemon.blockParty());
    return reasons;
  }

  function onwindowkeydown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable=true], [role=radiogroup], dialog")) return;
    if (document.querySelector("dialog[open]")) return;
    const step = event.key === "ArrowLeft" ? neighbours?.previous : neighbours?.next;
    if (!step) return;
    event.preventDefault();
    goto(stepHref(step));
  }

  const SWIPE_GAP = 16;
  const RISE = 14;
  let dragX = $state(0);
  let cardWidth = $state(0);
  let stripCurrent = $state<Card | null>(null);
  let stripPrevious = $state<Card | null>(null);
  let stripNext = $state<Card | null>(null);
  let swipe: { x: number; y: number; id: number; t: number; base: number; horizontal: boolean | null } | null = null;
  let slideFrame = 0;
  let pendingDirection: 1 | -1 | 0 = 0;

  let shownId = $derived(data.detail.ok ? data.detail.data.id : null);
  let stale = $derived(!!stripCurrent && stripCurrent.id !== shownId);
  let previousCard = $derived(stripCurrent ? stripPrevious : (neighbours?.previous ?? null));
  let nextCard = $derived(stripCurrent ? stripNext : (neighbours?.next ?? null));
  let slot = $derived(cardWidth + SWIPE_GAP);

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function slideTo(target: number, ms: number, done?: () => void) {
    cancelAnimationFrame(slideFrame);
    slideFrame = 0;
    const from = dragX;
    if (ms <= 0 || reduceMotion() || from === target) {
      dragX = target;
      done?.();
      return;
    }
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      dragX = from + (target - from) * (1 - (1 - t) ** 3);
      if (t < 1) slideFrame = requestAnimationFrame(frame);
      else {
        slideFrame = 0;
        done?.();
      }
    };
    slideFrame = requestAnimationFrame(frame);
  }

  function warm(card: Card | null | undefined) {
    if (card?.spriteUrl) new Image().src = card.spriteUrl;
  }

  function commit(direction: 1 | -1) {
    const target = direction === -1 ? nextCard : previousCard;
    const current = stripCurrent ?? (data.detail.ok ? data.detail.data : null);
    if (!target || !current) return;
    pendingDirection = 0;
    stripCurrent = target;
    stripPrevious = direction === -1 ? current : null;
    stripNext = direction === -1 ? null : current;
    dragX -= direction * slot;
    if (target.spriteUrl) colorStore.setOverride(target.spriteUrl);
    preloadData(stepHref(target))
      .then((result) => (result.type === "loaded" ? (result.data as PageData).neighbours : null))
      .then((found) => {
        if (!found || stripCurrent?.id !== target.id) return;
        stripPrevious = found.previous;
        stripNext = found.next;
        warm(found.previous);
        warm(found.next);
        flushPending();
      })
      .catch(() => {});
    slideTo(0, 240, settle);
  }

  function flushPending() {
    if (!pendingDirection || swipe) return;
    const direction = pendingDirection;
    if (direction === -1 ? nextCard : previousCard) commit(direction);
  }

  function settle() {
    if (swipe || slideFrame || !stripCurrent) return;
    if (stale) goto(stepHref(stripCurrent), { noScroll: true }).catch(() => {});
    else if (neighboursFor === shownId) stripCurrent = null;
  }

  function onswipestart(event: PointerEvent) {
    if (event.pointerType !== "touch") return;
    cancelAnimationFrame(slideFrame);
    slideFrame = 0;
    swipe = { x: event.clientX, y: event.clientY, id: event.pointerId, t: performance.now(), base: dragX, horizontal: null };
  }

  function onswipemove(event: PointerEvent) {
    if (!swipe || event.pointerId !== swipe.id) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    if (swipe.horizontal === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      swipe.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!swipe.horizontal) {
        swipe = null;
        slideTo(0, 200, settle);
        return;
      }
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    const x = swipe.base + dx;
    dragX = (x < 0 && !nextCard) || (x > 0 && !previousCard) ? x * 0.25 : x;
  }

  function onswipeend(event: PointerEvent) {
    if (!swipe || event.pointerId !== swipe.id) return;
    const start = swipe;
    swipe = null;
    if (event.type === "pointerup" && start.horizontal) {
      const velocity = (event.clientX - start.x) / (performance.now() - start.t);
      const direction = dragX < -cardWidth * 0.25 || velocity < -0.4 ? -1 : dragX > cardWidth * 0.25 || velocity > 0.4 ? 1 : 0;
      if (direction) {
        if (direction === -1 ? nextCard : previousCard) return commit(direction);
        if (stripCurrent) pendingDirection = direction;
      }
    }
    slideTo(0, 220, settle);
  }

  let risen = $state(true);
  let riseFrame = 0;

  function rise() {
    cancelAnimationFrame(riseFrame);
    riseFrame = requestAnimationFrame(() => (riseFrame = requestAnimationFrame(() => (risen = true))));
  }

  onNavigate(({ from, to }) => {
    if (from?.route.id !== to?.route.id || reduceMotion()) return;
    cancelAnimationFrame(riseFrame);
    risen = false;
  });

  afterNavigate(() => {
    if (!swipe && !slideFrame) rise();
  });

  let riseTransition = $derived(risen ? "transform 280ms cubic-bezier(0.33, 1, 0.68, 1), opacity 280ms ease-out" : "none");

  function swipeable(node: HTMLElement) {
    const end = (event: PointerEvent) => void onswipeend(event);
    node.addEventListener("pointerdown", onswipestart);
    node.addEventListener("pointermove", onswipemove);
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", end);
    return {
      destroy() {
        node.removeEventListener("pointerdown", onswipestart);
        node.removeEventListener("pointermove", onswipemove);
        node.removeEventListener("pointerup", end);
        node.removeEventListener("pointercancel", end);
      },
    };
  }

  const actionClass =
    "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] min-h-[38px] outline-none focus-visible:ring-2 disabled:opacity-50 disabled:hover:scale-100";
</script>

<svelte:window onkeydown={onwindowkeydown} />

{#snippet stripCard(card: Card, x: number)}
  {@const palette = paletteFor($spritePalettes, card.spriteUrl)}
  <div
    class="absolute inset-y-0 left-0 w-full rounded-2xl border overflow-hidden pointer-events-none"
    style="{palette
      ? `background: linear-gradient(135deg, ${palette.primary}14, ${palette.secondary}0a); border-color: ${palette.primary}30;`
      : sectionStyle($colorStore)} transform: translateX({x}px);"
    aria-hidden="true"
  >
    <div class="grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] h-full">
      <div class="flex flex-col items-center justify-center gap-2 p-4 lg:p-5">
        <div class="flex flex-col items-center gap-2" style="transform: translateY({RISE}px);">
          <PokemonSprite src={card.spriteUrl} size={160} eager />
          <div class="flex flex-wrap justify-center gap-1.5">
            {#each card.types as type (type)}
              <TypeBadge {type} size="md" />
            {/each}
          </div>
          <Badges pokemon={card} size="md" class="justify-center" />
        </div>
      </div>
      <div class="p-4 md:p-5 space-y-1">
        <p class="text-xl font-bold truncate" style="color: {$colorStore.text};">{displayName(card)}</p>
        <p class="text-sm" style="color: {$colorStore.muted};">{m.pokeflux.levelShort({ level: card.level })}</p>
        <p class="text-sm font-semibold tabular-nums" style="color: {ivColor(card.ivPercent)};">{m.pokeflux.ivPercent({ iv: card.ivPercent.toFixed(2) })}</p>
      </div>
    </div>
  </div>
{/snippet}

{#snippet stepLink(pokemon: Card | null | undefined, offset: -1 | 1)}
  {@const label = offset < 0 ? m.pokefluxPokemon.previousPokemon() : m.pokefluxPokemon.nextPokemon()}
  {#if pokemon}
    <a
      href={stepHref(pokemon)}
      class="group min-h-[38px] rounded-xl inline-flex items-center gap-2 px-3 transition-all hover:scale-[1.02] outline-none focus-visible:ring-2 min-w-0 {offset > 0 ? 'flex-row-reverse' : ''}"
      style={buttonStyle($colorStore)}
      data-sveltekit-preload-data="hover"
      aria-label="{label}: {displayName(pokemon)}"
      aria-keyshortcuts={offset < 0 ? "ArrowLeft" : "ArrowRight"}
    >
      <i class="fa-solid {offset < 0 ? 'fa-chevron-left' : 'fa-chevron-right'} text-xs w-4 text-center" aria-hidden="true"></i>
      <PokemonSprite src={pokemon.spriteUrl} size={28} class="hidden sm:flex" />
      <span class="hidden md:block text-sm font-medium truncate max-w-[9rem]">{displayName(pokemon)}</span>
    </a>
  {:else}
    <span class="min-h-[38px] w-10 rounded-xl inline-flex items-center justify-center opacity-40" style={buttonStyle($colorStore)} aria-hidden="true">
      <i class="fa-solid {offset < 0 ? 'fa-chevron-left' : 'fa-chevron-right'} text-xs"></i>
    </span>
  {/if}
{/snippet}

{#snippet stepper()}
  <div class="flex items-center gap-2 w-full sm:w-auto justify-between">
    <a
      href={backHref}
      class="min-h-[38px] px-3 rounded-xl inline-flex items-center gap-2 text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
      style={buttonStyle($colorStore)}
    >
      <i class="fa-solid fa-grid-2" aria-hidden="true"></i><span>{m.pokefluxPokemon.backToList()}</span>
    </a>
    {#if data.detail.ok}
      <div class="flex items-center gap-2">
        {@render stepLink(neighbours?.previous, -1)}
        {#if neighbours && neighbours.total}
          <span class="text-xs tabular-nums whitespace-nowrap" style="color: {$colorStore.muted};">
            {m.pokefluxPokemon.position({ position: (neighbours.index + 1).toLocaleString(), total: neighbours.total.toLocaleString() })}
          </span>
        {/if}
        {@render stepLink(neighbours?.next, 1)}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet fact(icon: string, label: string, value: string, color?: string)}
  <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg min-w-0" style="background: {$colorStore.primary}10;">
    <i class="fa-solid {icon} shrink-0 w-4 text-center" style="color: {color ?? $colorStore.secondary}; font-size: 14px;" aria-hidden="true"></i>
    <div class="min-w-0">
      <dt class="text-xs" style="color: {$colorStore.muted};">{label}</dt>
      <dd class="text-sm font-medium truncate" style="color: {$colorStore.text};" title={value}>{value}</dd>
    </div>
  </div>
{/snippet}

{#if data.detail.ok}
  {@const pokemon = data.detail.data}
  {@const name = displayName(pokemon)}
  {@const favorite = favoriteOverride ?? pokemon.favorite}
  {@const iv = Number.isFinite(pokemon.ivPercent) ? pokemon.ivPercent : 0}
  {@const caught = parseDate(pokemon.caughtAt)}
  {@const gender = GENDERS[pokemon.gender] ?? GENDERS.genderless}
  {@const blockers = releaseBlockers(pokemon)}
  {@const level = m.pokeflux.levelShort({ level: pokemon.level })}
  {@const named = pokemon.nickname ? m.pokefluxPokemon.subtitleSpecies({ name: pokemon.name, rest: level }) : level}

  <DashboardPageLayout
    title={name}
    subtitle={pokemon.number !== null ? m.pokefluxPokemon.subtitleNumber({ number: pokemon.number, rest: named }) : named}
    icon="fa-paw"
  >
    {#snippet actions()}
      {@render stepper()}
    {/snippet}

    <div class="relative" style="overflow-x: clip; touch-action: pan-y;" bind:clientWidth={cardWidth} use:swipeable>
    {#if dragX !== 0 || stale}
      {#if previousCard}{@render stripCard(previousCard, dragX - slot)}{/if}
      {#if stale && stripCurrent}{@render stripCard(stripCurrent, dragX)}{/if}
      {#if nextCard}{@render stripCard(nextCard, dragX + slot)}{/if}
    {/if}
    <section
      class="relative rounded-2xl border overflow-hidden shadow-2xl"
      style="{sectionStyle($colorStore)} transform: translateX({dragX}px); visibility: {stale ? 'hidden' : 'visible'};"
    >
      <div class="grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div
          class="relative flex flex-col items-center justify-center gap-2 p-4 lg:p-5"
          style="background: linear-gradient(135deg, {$colorStore.gradientStart}05, {$colorStore.gradientMid}08);"
        >
          <div
            class="relative flex flex-col items-center gap-2"
            style="transform: translateY({risen ? 0 : RISE}px); transition: {riseTransition};"
          >
            <PokemonSprite src={pokemon.spriteUrl} alt={name} size={160} eager />
            <div class="flex flex-wrap justify-center gap-1.5">
              {#each pokemon.types as type (type)}
                <TypeBadge {type} size="md" />
              {/each}
            </div>
            <Badges pokemon={{ ...pokemon, favorite }} size="md" focusable class="justify-center" />
          </div>
        </div>

        <div
          class="p-4 md:p-5 space-y-4"
          style="transform: translateY({risen ? 0 : RISE}px); opacity: {risen ? 1 : 0}; transition: {riseTransition};"
        >
          <div class="flex flex-wrap items-center gap-4">
            <div
              class="relative w-20 h-20 shrink-0"
              role="meter"
              aria-label={m.pokefluxPokemon.ivTotal()}
              aria-valuenow={iv}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={m.pokeflux.ivPercent({ iv: iv.toFixed(2) })}
            >
              <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="{$colorStore.primary}20" stroke-width="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke={ivColor(iv)}
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-dasharray="{iv} 100"
                  pathLength="100"
                  class="pf-ring"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-base font-bold tabular-nums leading-none" style="color: {ivColor(iv)};">{iv.toFixed(1)}%</span>
                <span class="text-xs mt-0.5" style="color: {$colorStore.muted};">{m.pokefluxPokemon.iv()}</span>
              </div>
            </div>

            <div class="flex-1 min-w-[12rem] space-y-2">
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-2xl font-bold tabular-nums" style="color: {$colorStore.text};">
                  <span class="text-sm font-normal mr-1" style="color: {$colorStore.muted};">{m.pokefluxPokemon.levelWord()}</span>{pokemon.level}
                </p>
                <p class="text-sm tabular-nums" style="color: {$colorStore.muted};">
                  {m.pokefluxPokemon.experience({ current: pokemon.experience.toLocaleString(), cap: pokemon.experienceCap.toLocaleString() })}
                </p>
              </div>
              <Meter value={pokemon.experience} max={pokemon.experienceCap} label={m.pokefluxPokemon.experienceLabel()} hideLabel />
            </div>
          </div>

          <dl class="grid grid-cols-2 xl:grid-cols-3 gap-2">
            {@render fact("fa-leaf", m.pokefluxPokemon.nature(), pokemon.nature || m.common.none())}
            {@render fact("fa-bolt", m.pokefluxPokemon.ability(), pokemon.ability ? humanize(pokemon.ability) : m.common.none())}
            {@render fact("fa-hand-holding", m.pokefluxPokemon.heldItemLabel(), pokemon.heldItem ? humanize(pokemon.heldItem) : m.common.none())}
            {@render fact("fa-face-smile", m.pokefluxPokemon.happiness(), pokemon.happiness.toLocaleString(), "#f59e0b")}
            {@render fact(gender.icon, m.pokefluxPokemon.gender(), gender.label(), gender.color)}
            {@render fact("fa-calendar", m.pokefluxPokemon.caught(), caught ? formatDate(caught.toISOString()) : m.pokefluxPokemon.unknown())}
            {@render fact("fa-id-card", m.pokefluxPokemon.trainer(), pokemon.caughtBy ?? m.pokefluxPokemon.unknown())}
            {@render fact(pokemon.tradable ? "fa-right-left" : "fa-lock", m.pokefluxPokemon.tradable(), pokemon.tradable ? m.common.yes() : m.common.no(), pokemon.tradable ? "#22c55e" : "#ef4444")}
            {@render fact(pokemon.breedable ? "fa-egg" : "fa-lock", m.pokefluxPokemon.breedable(), pokemon.breedable ? m.common.yes() : m.common.no(), pokemon.breedable ? "#22c55e" : "#ef4444")}
          </dl>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class={actionClass}
              style={pokemon.selected ? tintedStyle("#10B981") : buttonStyle($colorStore)}
              disabled={pokemon.selected || busy !== null}
              aria-busy={busy === "select"}
              onclick={() => select(pokemon)}
            >
              <i class="fa-solid {busy === 'select' ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}" style="font-size: 16px;" aria-hidden="true"></i>
              {pokemon.selected ? m.pokefluxPokemon.isSelected() : m.pokefluxPokemon.select()}
            </button>
            <button
              type="button"
              class={actionClass}
              style={favorite ? tintedStyle("#f43f5e") : buttonStyle($colorStore)}
              aria-pressed={favorite}
              disabled={busy !== null && busy !== "favorite"}
              onclick={() => toggleFavorite(pokemon)}
            >
              <i class="{favorite ? 'fa-solid' : 'fa-utility-duo fa-regular'} fa-heart" style="font-size: 16px;" aria-hidden="true"></i>
              {m.pokefluxPokemon.favorite()}
            </button>
            <button
              type="button"
              class={actionClass}
              style={buttonStyle($colorStore)}
              disabled={busy !== null}
              onclick={() => openNickname(pokemon)}
            >
              <i class="fa-solid fa-pen-to-square" style="font-size: 16px;" aria-hidden="true"></i>{m.pokefluxPokemon.nickname()}
            </button>
            <button
              type="button"
              class="{actionClass} sm:ml-auto"
              style={dangerStyle($colorStore)}
              disabled={busy !== null}
              onclick={() => (releaseOpen = true)}
            >
              <i class="fa-solid fa-trash-can" style="font-size: 16px;" aria-hidden="true"></i>{m.pokefluxPokemon.release()}
            </button>
          </div>
        </div>
      </div>
    </section>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <Panel icon="fa-solid fa-chart-simple" title={m.pokefluxPokemon.statsTitle()}>
        <StatBars ivs={pokemon.ivs} evs={pokemon.evs} baseStats={pokemon.baseStats} stats={pokemon.stats} bind:view={statView} />
      </Panel>

      <Panel icon="fa-solid fa-wand-sparkles" title={m.pokefluxPokemon.movesTitle()}>
        <ul class="grid sm:grid-cols-2 gap-3">
          {#each { length: 4 }, i (i)}
            {@const slot = (i + 1) as MoveSlot}
            <li class="flex flex-col gap-1.5">
              <MoveCard move={pokemon.moves[i] ?? null} {slot} compact class="flex-1" />
              <button
                type="button"
                class="flex items-center justify-center gap-2 px-3 py-1.5 min-h-[34px] rounded-lg text-sm font-medium transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
                style={buttonStyle($colorStore)}
                onclick={() => openLearn(slot)}
              >
                <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>{m.pokefluxPokemon.changeMove({ slot })}
              </button>
            </li>
          {/each}
        </ul>
      </Panel>
    </div>

    {#if species}
      <Panel icon="fa-solid fa-book-open" title={m.pokefluxPokemon.speciesInfo()}>
        {#snippet actions()}
          {#if species && species.owned > 1}
            <a href={collectionHref(species.name)} class={actionClass} style={buttonStyle($colorStore)} data-sveltekit-preload-data="hover">
              <i class="fa-solid fa-grid-2" aria-hidden="true"></i>{m.pokefluxPokemon.dexOpenCollection({ name: humanize(species.identifier) })}
              <span class="tabular-nums" style="color: {$colorStore.muted};">{species.owned.toLocaleString()}</span>
            </a>
          {/if}
        {/snippet}
        <div class="grid md:grid-cols-2 gap-x-6 gap-y-4">
          <SpeciesFacts {species} />
          <SpeciesBreeding {species} />
        </div>
      </Panel>
    {/if}

    <Panel class="grid md:grid-cols-2 gap-x-6 gap-y-6">
      <div class="md:col-span-2 min-w-0">
          <h2 class="text-lg font-semibold flex items-center gap-2 mb-3" style="color: {$colorStore.text};">
            <i class="fa-solid fa-dna" style="color: {$colorStore.primary}; font-size: 18px;" aria-hidden="true"></i>{m.pokefluxPokemon.evolutionTitle()}
          </h2>
          {#if species?.evolution.length}
            <EvolutionTree stages={species.evolution} identifier={species.identifier} speciesId={species.speciesId} />
          {:else if pokemon.evolutionLine.length}
            <ol class="flex flex-wrap items-center gap-2" data-sveltekit-preload-data="hover">
              {#each pokemon.evolutionLine as species, i (species.speciesId + "-" + i)}
                {@const current = species.name.toLowerCase() === pokemon.name.toLowerCase()}
                <li class="flex items-center gap-2">
                  {#if i > 0}<i class="fa-solid fa-chevron-right text-xs" style="color: {$colorStore.muted};" aria-hidden="true"></i>{/if}
                  <a
                    href={speciesHref(species.speciesId)}
                    class="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
                    style="background: {current ? `${$colorStore.primary}20` : `${$colorStore.primary}05`}; border-color: {current ? `${$colorStore.primary}30` : `${$colorStore.primary}20`}; color: {current ? $colorStore.primary : $colorStore.text}; --tw-ring-color: {$colorStore.primary};"
                    aria-current={current ? "true" : undefined}
                    title={m.pokefluxPokemon.openInPokedex({ name: species.name })}
                  >
                    <PokemonSprite src={species.spriteUrl} size={48} />
                    <span>{humanize(species.name)}</span>
                  </a>
                </li>
              {/each}
            </ol>
          {:else}
            <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxPokemon.noEvolution()}</p>
          {/if}
      </div>

      <div class="min-w-0">
          <h2 class="text-lg font-semibold flex items-center gap-2 mb-3" style="color: {$colorStore.text};">
            <i class="fa-solid fa-shapes" style="color: {$colorStore.primary}; font-size: 18px;" aria-hidden="true"></i>{m.pokefluxPokemon.formsTitle()}
          </h2>
          {#if species}
            <SpeciesForms forms={species.forms} />
          {:else if pokemon.forms.length}
            <ul class="flex flex-wrap gap-2">
              {#each pokemon.forms as form (form)}
                <li class="px-3 py-1 rounded-full text-xs font-semibold" style="background: {$colorStore.secondary}15; border: 1px solid {$colorStore.secondary}30; color: {$colorStore.secondary};">
                  {humanize(form)}
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxPokemon.noForms()}</p>
          {/if}
      </div>

      <div>
        <h2 class="text-lg font-semibold flex items-center gap-2 mb-3" style="color: {$colorStore.text};">
          <i class="fa-solid fa-tags" style="color: {$colorStore.primary}; font-size: 18px;" aria-hidden="true"></i>{m.pokefluxPokemon.tagsTitle()}
        </h2>
        {#if pokemon.tags.length}
          <ul class="flex flex-wrap gap-2" data-sveltekit-preload-data="hover">
            {#each pokemon.tags as tag (tag)}
              <li>
                <a
                  href="/dashboard/pokemon?q={encodeURIComponent(tag)}"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] outline-none focus-visible:ring-2"
                  style="background: {$colorStore.primary}15; border: 1px solid {$colorStore.primary}30; color: {$colorStore.primary}; --tw-ring-color: {$colorStore.primary};"
                  title={m.pokefluxPokemon.searchTag({ tag })}
                >
                  <i class="fa-solid fa-tag text-[10px]" aria-hidden="true"></i>{tag}
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxPokemon.noTags()}</p>
        {/if}
      </div>
    </Panel>

    <p class="hidden md:block text-xs text-center" style="color: {$colorStore.muted};">
      <i class="fa-solid fa-keyboard mr-1" aria-hidden="true"></i>{m.pokefluxPokemon.keyboardHint()}
    </p>
  </DashboardPageLayout>

  <LearnMoveModal bind:open={learnOpen} bind:slot={learnSlot} pokemonId={pokemon.id} moves={pokemon.moves} onlearned={(message) => {
    toast.success(message);
    invalidateAll();
  }} />

  <Modal bind:open={nicknameOpen} title={m.pokefluxPokemon.nicknameTitle()} icon="fa-solid fa-pen-to-square" size="sm" locked={busy === "nickname"}>
    <form
      id="pf-nickname-form"
      class="space-y-2"
      onsubmit={(event) => {
        event.preventDefault();
        saveNickname(pokemon, nicknameValue.trim() || null);
      }}
    >
      <label class="block">
        <span class="text-sm font-medium" style="color: {$colorStore.text};">{m.pokefluxPokemon.nicknameLabel()}</span>
        <input
          type="text"
          bind:value={nicknameValue}
          maxlength={150}
          placeholder={pokemon.name}
          class="mt-1.5 w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 outline-none min-h-[40px]"
          style={controlStyle($colorStore)}
          data-autofocus
        />
      </label>
      <p class="text-xs" style="color: {$colorStore.muted};">{m.pokefluxPokemon.nicknameHint()}</p>
      {#if nicknameError}
        <p class="text-sm p-3 rounded-xl" style="background: {$colorStore.accent}10; border: 1px solid {$colorStore.accent}40; color: {$colorStore.accent};" role="alert">{nicknameError}</p>
      {/if}
    </form>
    {#snippet footer()}
      <div class="flex flex-col-reverse sm:flex-row gap-3">
        {#if pokemon.nickname}
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[40px] outline-none focus-visible:ring-2 disabled:opacity-50 sm:mr-auto"
            style={dangerStyle($colorStore)}
            disabled={busy === "nickname"}
            onclick={() => saveNickname(pokemon, null)}
          >
            {m.pokefluxPokemon.nicknameClear()}
          </button>
        {/if}
        <button
          type="submit"
          form="pf-nickname-form"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 min-h-[40px] outline-none focus-visible:ring-2 disabled:opacity-50 inline-flex items-center justify-center gap-2 sm:ml-auto"
          style={buttonStyle($colorStore)}
          disabled={busy === "nickname" || (nicknameValue.trim() || null) === (pokemon.nickname ?? null)}
        >
          {#if busy === "nickname"}<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>{m.pokeflux.working()}{:else}{m.common.save()}{/if}
        </button>
      </div>
    {/snippet}
  </Modal>

  <ConfirmDialog
    bind:open={releaseOpen}
    title={m.pokefluxPokemon.releaseTitle({ name })}
    message={m.pokefluxPokemon.releaseMessage()}
    confirmLabel={m.pokefluxPokemon.release()}
    onconfirm={() => release(pokemon)}
  >
    <PokemonCard {pokemon} size="compact" />
    {#if blockers.length}
      <div class="mt-3 p-3 rounded-xl text-sm" style="background: {$colorStore.accent}10; border: 1px solid {$colorStore.accent}40;">
        <p class="font-semibold mb-1" style="color: {$colorStore.accent};"><i class="fa-solid fa-triangle-exclamation mr-1" aria-hidden="true"></i>{m.pokefluxPokemon.releaseBlocked()}</p>
        <ul class="list-disc pl-5 space-y-0.5" style="color: {$colorStore.accent}90;">
          {#each blockers as reason (reason)}<li>{reason}</li>{/each}
        </ul>
      </div>
    {/if}
  </ConfirmDialog>
{:else}
  <DashboardPageLayout title={m.features.pokemon()} subtitle={m.dashboard.pokemonSubtitle()} icon="fa-paw">
    {#snippet actions()}
      {@render stepper()}
    {/snippet}
    <EmptyState
      title={data.detail.status === 404 ? m.pokefluxPokemon.notFoundTitle() : m.dashboard.loadFailed({ status: data.detail.status })}
      message={data.detail.error}
      icon={data.detail.status === 404 ? "fa-solid fa-ghost" : "fa-solid fa-circle-exclamation"}
    >
      {#if data.detail.status !== 404}
        <button type="button" class={actionClass} style={buttonStyle($colorStore)} onclick={() => invalidateAll()}>
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>{m.common.retry()}
        </button>
      {/if}
      <a href={backHref} class={actionClass} style={buttonStyle($colorStore)}>
        {m.pokefluxPokemon.backToList()}
      </a>
    </EmptyState>
  </DashboardPageLayout>
{/if}

<style>
  .pf-ring {
    transition: stroke-dasharray 500ms ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .pf-ring {
      transition: none;
    }
  }
</style>
