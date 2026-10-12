<script lang="ts">
  import { formatNumber, linearScale, roundUpToNiceNumber, svgLinePath, tickValues } from '../lib/chart';

  type View = 'time' | 'phase';
  type Populations = { prey: number; predators: number };

  const controlIdPrefix = $props.id();

  let preyGrowthRate = $state(0.6);
  let attackRate = $state(0.025);
  let conversionEfficiency = $state(0.4);
  let predatorDeathRate = $state(0.4);
  let preyLimitedByCarryingCapacity = $state(false);
  let view = $state<View>('time');

  const PREY_CARRYING_CAPACITY = 200;
  const STARTING_POPULATIONS: Populations = { prey: 60, predators: 15 };
  const SIMULATED_TIME = 80;
  const STEP = 0.02;
  const STEPS_PER_PLOTTED_POINT = 5;

  function ratesOfChange({ prey, predators }: Populations): Populations {
    const preyLimitation = preyLimitedByCarryingCapacity ? 1 - prey / PREY_CARRYING_CAPACITY : 1;
    const preyEaten = attackRate * prey * predators;
    return {
      prey: preyGrowthRate * prey * preyLimitation - preyEaten,
      predators: conversionEfficiency * preyEaten - predatorDeathRate * predators,
    };
  }

  function rungeKuttaStep(current: Populations): Populations {
    const shift = (base: Populations, slope: Populations, fraction: number): Populations => ({
      prey: base.prey + slope.prey * STEP * fraction,
      predators: base.predators + slope.predators * STEP * fraction,
    });
    const k1 = ratesOfChange(current);
    const k2 = ratesOfChange(shift(current, k1, 0.5));
    const k3 = ratesOfChange(shift(current, k2, 0.5));
    const k4 = ratesOfChange(shift(current, k3, 1));
    return {
      prey: Math.max(0, current.prey + (STEP / 6) * (k1.prey + 2 * k2.prey + 2 * k3.prey + k4.prey)),
      predators: Math.max(0, current.predators + (STEP / 6) * (k1.predators + 2 * k2.predators + 2 * k3.predators + k4.predators)),
    };
  }

  const history = $derived.by(() => {
    const points: (Populations & { time: number })[] = [{ time: 0, ...STARTING_POPULATIONS }];
    let current = STARTING_POPULATIONS;
    const stepCount = SIMULATED_TIME / STEP;
    for (let step = 1; step <= stepCount; step++) {
      current = rungeKuttaStep(current);
      if (step % STEPS_PER_PLOTTED_POINT === 0) points.push({ time: step * STEP, ...current });
    }
    return points;
  });

  const equilibriumPrey = $derived(predatorDeathRate / (conversionEfficiency * attackRate));
  const equilibriumPredators = $derived(
    (preyGrowthRate / attackRate) * (preyLimitedByCarryingCapacity ? Math.max(0, 1 - equilibriumPrey / PREY_CARRYING_CAPACITY) : 1),
  );

  const chartWidth = 720;
  const chartHeight = 360;
  const margin = { top: 16, right: 24, bottom: 46, left: 60 };

  const preyAxisMax = $derived(roundUpToNiceNumber(Math.max(...history.map((p) => p.prey)) * 1.05));
  const predatorAxisMax = $derived(roundUpToNiceNumber(Math.max(...history.map((p) => p.predators)) * 1.05));
  const sharedAxisMax = $derived(Math.max(preyAxisMax, predatorAxisMax));

  const timeToX = linearScale(0, SIMULATED_TIME, margin.left, chartWidth - margin.right);
  const populationToY = $derived(linearScale(0, sharedAxisMax, chartHeight - margin.bottom, margin.top));
  const preyToPhaseX = $derived(linearScale(0, preyAxisMax, margin.left, chartWidth - margin.right));
  const predatorsToPhaseY = $derived(linearScale(0, predatorAxisMax, chartHeight - margin.bottom, margin.top));

  const preyOverTime = $derived(svgLinePath(history.map((p) => [timeToX(p.time), populationToY(p.prey)])));
  const predatorsOverTime = $derived(svgLinePath(history.map((p) => [timeToX(p.time), populationToY(p.predators)])));
  const phaseOrbit = $derived(svgLinePath(history.map((p) => [preyToPhaseX(p.prey), predatorsToPhaseY(p.predators)])));
  const lastPoint = $derived(history[history.length - 1]);
</script>

<figure class="widget predator-prey">
  <div class="btn-row" role="group" aria-label="Chart view">
    <button class="btn" aria-pressed={view === 'time'} onclick={() => (view = 'time')}>Over time</button>
    <button class="btn" aria-pressed={view === 'phase'} onclick={() => (view = 'phase')}>Prey against predators</button>
  </div>

  <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="Simulated prey and predator populations">
    {#if view === 'time'}
      {#each tickValues(sharedAxisMax) as tick (tick)}
        <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={populationToY(tick)} y2={populationToY(tick)} />
        <text x={margin.left - 8} y={populationToY(tick) + 4} text-anchor="end">{formatNumber(tick)}</text>
      {/each}
      {#each tickValues(SIMULATED_TIME, 8) as tick (tick)}
        <text x={timeToX(tick)} y={chartHeight - margin.bottom + 20} text-anchor="middle">{tick}</text>
      {/each}
      <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
      <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 6} text-anchor="middle">time</text>
      <text transform="translate(16 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">population size</text>
      <path class="line prey" d={preyOverTime} />
      <path class="line predators" d={predatorsOverTime} />
      <text class="series-label prey-label" x={margin.left + 8} y={populationToY(STARTING_POPULATIONS.prey) - 10}>prey</text>
      <text class="series-label predator-label" x={margin.left + 8} y={populationToY(STARTING_POPULATIONS.predators) + 22}>predators</text>
    {:else}
      {#each tickValues(predatorAxisMax) as tick (tick)}
        <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={predatorsToPhaseY(tick)} y2={predatorsToPhaseY(tick)} />
        <text x={margin.left - 8} y={predatorsToPhaseY(tick) + 4} text-anchor="end">{formatNumber(tick)}</text>
      {/each}
      {#each tickValues(preyAxisMax) as tick (tick)}
        <text x={preyToPhaseX(tick)} y={chartHeight - margin.bottom + 20} text-anchor="middle">{formatNumber(tick)}</text>
      {/each}
      <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
      <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 6} text-anchor="middle">prey</text>
      <text transform="translate(16 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">predators</text>
      <path class="line orbit" d={phaseOrbit} />
      <circle class="start" cx={preyToPhaseX(STARTING_POPULATIONS.prey)} cy={predatorsToPhaseY(STARTING_POPULATIONS.predators)} r="5" />
      <text x={preyToPhaseX(STARTING_POPULATIONS.prey) + 10} y={predatorsToPhaseY(STARTING_POPULATIONS.predators) + 18}>start</text>
      <circle class="end" cx={preyToPhaseX(lastPoint.prey)} cy={predatorsToPhaseY(lastPoint.predators)} r="5" />
      {#if equilibriumPrey < preyAxisMax && equilibriumPredators > 0}
        <g class="equilibrium" transform="translate({preyToPhaseX(equilibriumPrey)} {predatorsToPhaseY(equilibriumPredators)})">
          <line x1="-7" x2="7" y1="0" y2="0" />
          <line x1="0" x2="0" y1="-7" y2="7" />
        </g>
        <text x={preyToPhaseX(equilibriumPrey) + 12} y={predatorsToPhaseY(equilibriumPredators) - 8}>balance point</text>
      {/if}
    {/if}
  </svg>

  <div class="controls">
    <div class="control">
      <label for="{controlIdPrefix}-r">prey birth rate, r <output>{preyGrowthRate.toFixed(2)}</output></label>
      <input id="{controlIdPrefix}-r" type="range" min="0.2" max="1.2" step="0.05" bind:value={preyGrowthRate} />
    </div>
    <div class="control">
      <label for="{controlIdPrefix}-a">hunting success, a <output>{attackRate.toFixed(3)}</output></label>
      <input id="{controlIdPrefix}-a" type="range" min="0.01" max="0.05" step="0.0025" bind:value={attackRate} />
    </div>
    <div class="control">
      <label for="{controlIdPrefix}-b">prey eaten turned into predator births, b <output>{conversionEfficiency.toFixed(2)}</output></label>
      <input id="{controlIdPrefix}-b" type="range" min="0.1" max="0.8" step="0.05" bind:value={conversionEfficiency} />
    </div>
    <div class="control">
      <label for="{controlIdPrefix}-m">predator death rate, m <output>{predatorDeathRate.toFixed(2)}</output></label>
      <input id="{controlIdPrefix}-m" type="range" min="0.1" max="0.8" step="0.05" bind:value={predatorDeathRate} />
    </div>
  </div>

  <div class="btn-row options">
    <button class="btn" aria-pressed={preyLimitedByCarryingCapacity} onclick={() => (preyLimitedByCarryingCapacity = !preyLimitedByCarryingCapacity)}>
      Prey also limited by food (K = {PREY_CARRYING_CAPACITY})
    </button>
  </div>

  <p class="readout" aria-live="polite">
    {#if equilibriumPredators > 0}
      The populations cycle around <strong>{formatNumber(equilibriumPrey)}</strong> prey and
      <strong>{formatNumber(equilibriumPredators)}</strong> predators.
      {preyLimitedByCarryingCapacity ? 'With food limiting the prey, the swings shrink each cycle.' : ''}
    {:else}
      Predators need more prey than the environment can hold, so they die out.
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
    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .prey {
    stroke: var(--prey);
  }

  .predators {
    stroke: var(--predator);
  }

  .orbit {
    stroke: var(--third);
  }

  .chart .series-label {
    font-size: 15px;
    font-weight: 600;
  }

  .chart .prey-label {
    fill: var(--prey);
  }

  .chart .predator-label {
    fill: var(--predator);
  }

  .start {
    fill: var(--paper-raised);
    stroke: var(--ink);
    stroke-width: 2;
  }

  .end {
    fill: var(--third);
  }

  .equilibrium line {
    stroke: var(--ink);
    stroke-width: 2;
  }

  .options {
    margin-top: 1rem;
  }

  .readout {
    margin: 0.9rem 0 0;
  }
</style>
