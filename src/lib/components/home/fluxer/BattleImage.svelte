<script lang="ts" module>
  /** One side of the battle as the renderer reads it from the active Pokémon. */
  export interface BattleSide {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    sprite: string;
  }

  export interface BattleImageProps extends Record<string, unknown> {
    background: string;
    challenger: BattleSide;
    opponent: BattleSide;
  }
</script>

<script lang="ts">
  let { background, challenger, opponent }: BattleImageProps = $props();

  const WIDTH = 800;
  const HEIGHT = 450;
  const BOX = 300;

  const hpColor = (pct: number) => (pct > 0.5 ? "rgb(96,192,64)" : pct > 0.2 ? "rgb(248,208,48)" : "rgb(240,80,48)");

  const boxes = $derived([
    { side: challenger, x: 40, y: 40, numbers: true },
    { side: opponent, x: WIDTH - 340, y: HEIGHT - 110, numbers: false },
  ]);
</script>

<svg
  class="battle"
  viewBox="0 0 {WIDTH} {HEIGHT}"
  role="img"
  aria-label="{challenger.name} on the left facing {opponent.name} on the right"
>
  <image href={background} x="0" y="0" width={WIDTH} height={HEIGHT} preserveAspectRatio="none" />
  <image href={challenger.sprite} x="70" y={HEIGHT - 270} width="230" height="230" />
  <image href={opponent.sprite} x={WIDTH - 300} y="40" width="230" height="230" />

  {#each boxes as { side, x, y, numbers } (x)}
    {@const pct = side.hp / side.maxHp}
    <rect {x} {y} width={BOX} height="70" fill="rgb(220,220,220)" stroke="rgb(60,60,60)" stroke-width="2" />
    <text x={x + 15} y={y + 25} font-size="22" font-weight="700">{side.name}</text>
    <text x={x + BOX - 70} y={y + 25} font-size="18">Lv.{side.level}</text>
    <text x={x + 15} y={y + 50} font-size="18" font-weight="700">HP</text>
    <rect x={x + 55} y={y + 42} width={BOX - 70} height="12" fill="rgb(180,180,180)" />
    <rect x={x + 55} y={y + 42} width={(BOX - 70) * pct} height="12" fill={hpColor(pct)} />
    {#if numbers}
      <text x={x + BOX - 15} y={y + 67} font-size="16" text-anchor="end">{side.hp}/{side.maxHp}</text>
    {/if}
  {/each}
</svg>

<style>
  .battle {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    font-family: Arial, Helvetica, sans-serif;
  }

  .battle text {
    fill: #000;
  }
</style>
