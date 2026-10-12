<script lang="ts">
  import { formatNumber, linearScale, svgLinePath } from '../lib/chart';

  let birthRateDependsOnDensity = $state(true);
  let deathRateDependsOnDensity = $state(true);

  const DENSITY_MAX = 100;
  const RATE_MAX = 0.8;

  const birthRateAt = (density: number) => (birthRateDependsOnDensity ? 0.6 - 0.005 * density : 0.42);
  const deathRateAt = (density: number) => (deathRateDependsOnDensity ? 0.1 + 0.004 * density : 0.3);

  const chartWidth = 640;
  const chartHeight = 340;
  const margin = { top: 16, right: 24, bottom: 46, left: 60 };
  const densityToX = linearScale(0, DENSITY_MAX, margin.left, chartWidth - margin.right);
  const rateToY = linearScale(0, RATE_MAX, chartHeight - margin.bottom, margin.top);
  const sampleDensities = [0, DENSITY_MAX];

  const birthLine = $derived(svgLinePath(sampleDensities.map((d) => [densityToX(d), rateToY(birthRateAt(d))])));
  const deathLine = $derived(svgLinePath(sampleDensities.map((d) => [densityToX(d), rateToY(deathRateAt(d))])));

  const equilibriumDensity = $derived.by(() => {
    const birthSlope = birthRateAt(1) - birthRateAt(0);
    const deathSlope = deathRateAt(1) - deathRateAt(0);
    if (Math.abs(birthSlope - deathSlope) < 1e-9) return null;
    const crossing = (deathRateAt(0) - birthRateAt(0)) / (birthSlope - deathSlope);
    return crossing > 0 && crossing < DENSITY_MAX ? crossing : null;
  });
</script>

<figure class="widget density-dependence">
  <div class="btn-row" role="group" aria-label="Which rates depend on density">
    <button class="btn" aria-pressed={birthRateDependsOnDensity} onclick={() => (birthRateDependsOnDensity = !birthRateDependsOnDensity)}>
      Birth rate depends on density
    </button>
    <button class="btn" aria-pressed={deathRateDependsOnDensity} onclick={() => (deathRateDependsOnDensity = !deathRateDependsOnDensity)}>
      Death rate depends on density
    </button>
  </div>

  <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="Per capita birth and death rates plotted against population density">
    {#each [0, 0.2, 0.4, 0.6, 0.8] as tick (tick)}
      <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={rateToY(tick)} y2={rateToY(tick)} />
      <text x={margin.left - 8} y={rateToY(tick) + 4} text-anchor="end">{tick.toFixed(1)}</text>
    {/each}
    <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
    <text x={densityToX(0)} y={chartHeight - margin.bottom + 20} text-anchor="start">low</text>
    <text x={densityToX(DENSITY_MAX)} y={chartHeight - margin.bottom + 20} text-anchor="end">high</text>
    <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 6} text-anchor="middle">population density</text>
    <text transform="translate(16 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">per capita rate</text>

    {#if equilibriumDensity !== null}
      <line class="equilibrium" x1={densityToX(equilibriumDensity)} x2={densityToX(equilibriumDensity)} y1={margin.top} y2={chartHeight - margin.bottom} />
      <text class="equilibrium-label" x={densityToX(equilibriumDensity) + 8} y={margin.top + 14}>equilibrium density</text>
      <text class="direction" x={densityToX(equilibriumDensity / 2)} y={chartHeight - margin.bottom - 12} text-anchor="middle">grows →</text>
      <text class="direction" x={densityToX((equilibriumDensity + DENSITY_MAX) / 2)} y={chartHeight - margin.bottom - 12} text-anchor="middle">← shrinks</text>
    {/if}

    <path class="line birth" d={birthLine} />
    <path class="line death" d={deathLine} />
    <text class="series-label birth-label" x={densityToX(4)} y={rateToY(birthRateAt(4)) - 10}>births</text>
    <text class="series-label death-label" x={densityToX(4)} y={rateToY(deathRateAt(4)) + 22}>deaths</text>
  </svg>

  <p class="readout" aria-live="polite">
    {#if equilibriumDensity !== null}
      Below a density of about {formatNumber(equilibriumDensity)}, births outnumber deaths and the population grows. Above it, deaths win
      and it shrinks. Either way it's pushed back toward the same density.
    {:else}
      Neither rate changes with density, so nothing pulls the population toward a stable size. Births always beat deaths here, so it
      grows without limit, like the exponential model.
    {/if}
  </p>
</figure>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    margin-top: 0.8rem;
  }

  .line {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
  }

  .birth {
    stroke: var(--prey);
  }

  .death {
    stroke: var(--predator);
  }

  .chart .series-label {
    font-size: 15px;
    font-weight: 600;
  }

  .chart .birth-label {
    fill: var(--prey);
  }

  .chart .death-label {
    fill: var(--predator);
  }

  .equilibrium {
    stroke: var(--ink);
    stroke-dasharray: 3 4;
  }

  .chart .equilibrium-label,
  .chart .direction {
    fill: var(--ink);
  }

  .readout {
    margin: 0.9rem 0 0;
  }
</style>
