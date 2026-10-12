<script lang="ts">
  import { formatNumber, linearScale, svgLinePath, tickValues } from '../lib/chart';

  type GrowthModelKind = 'exponential' | 'logistic';

  let {
    model = 'logistic',
    hero = false,
    initialGrowthRate = 0.5,
    initialCarryingCapacity = 500,
    initialPopulation = 10,
  }: {
    model?: GrowthModelKind;
    hero?: boolean;
    initialGrowthRate?: number;
    initialCarryingCapacity?: number;
    initialPopulation?: number;
  } = $props();

  const plotClipId = $props.id();

  let r = $state(initialGrowthRate);
  let K = $state(initialCarryingCapacity);
  let N0 = $state(initialPopulation);
  let compareWithExponential = $state(hero);
  let cursorTime = $state(8);

  const isLogistic = model === 'logistic';
  const showsExponential = $derived(!isLogistic || compareWithExponential);

  const TIME_SPAN = 30;
  const POPULATION_CEILING = 1000;
  const GROWTH_RATE_CEILING = 250;

  const chartWidth = 720;
  const chartHeight = hero ? 380 : 340;
  const margin = { top: 16, right: 24, bottom: 46, left: 60 };
  const timeToX = linearScale(0, TIME_SPAN, margin.left, chartWidth - margin.right);
  const populationToY = linearScale(0, POPULATION_CEILING, chartHeight - margin.bottom, margin.top);

  const rateChartWidth = 300;
  const rateMargin = { top: 16, right: 16, bottom: 46, left: 52 };
  const populationToRateX = linearScale(0, POPULATION_CEILING, rateMargin.left, rateChartWidth - rateMargin.right);
  const growthRateToY = linearScale(0, GROWTH_RATE_CEILING, chartHeight - rateMargin.bottom, rateMargin.top);

  const sampleTimes = Array.from({ length: 241 }, (_, i) => (i * TIME_SPAN) / 240);
  const samplePopulations = Array.from({ length: 101 }, (_, i) => (i * POPULATION_CEILING) / 100);
  const offChartValue = POPULATION_CEILING * 1.5;

  const exponentialPopulationAt = (t: number) => Math.min(N0 * Math.exp(r * t), offChartValue);
  const logisticPopulationAt = (t: number) => K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
  const populationAt = (t: number) => (isLogistic ? logisticPopulationAt(t) : exponentialPopulationAt(t));
  const growthRateAt = (N: number) => (isLogistic ? r * N * (1 - N / K) : r * N);

  const logisticCurve = $derived(
    svgLinePath(sampleTimes.map((t) => [timeToX(t), populationToY(logisticPopulationAt(t))])),
  );
  const exponentialCurve = $derived(
    svgLinePath(sampleTimes.map((t) => [timeToX(t), populationToY(exponentialPopulationAt(t))])),
  );
  const growthRateCurve = $derived(
    svgLinePath(
      samplePopulations.map((N) => [populationToRateX(N), growthRateToY(Math.min(growthRateAt(N), GROWTH_RATE_CEILING * 1.5))]),
    ),
  );

  const doublingTime = $derived(Math.LN2 / r);
  const timeExponentialLeavesChart = $derived(Math.log(POPULATION_CEILING / N0) / r);
  const timeOfFastestGrowth = $derived(N0 < K / 2 ? Math.log((K - N0) / N0) / r : null);

  const cursorPopulation = $derived(populationAt(cursorTime));
  const cursorGrowthRate = $derived(growthRateAt(cursorPopulation));
  const cursorIsOffChart = $derived(cursorPopulation > POPULATION_CEILING);

  const chartDescription = $derived(
    isLogistic
      ? `Logistic growth from ${N0} individuals with r = ${r} levels off at carrying capacity K = ${K}.`
      : `Exponential growth from ${N0} individuals with r = ${r} doubles every ${formatNumber(doublingTime, 1)} time units.`,
  );
</script>

<figure class="widget growth" class:hero>
  <div class="charts" class:with-rate-chart={!hero}>
    <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label={chartDescription}>
      <defs>
        <clipPath id={plotClipId}>
          <rect
            x={margin.left}
            y={margin.top - 4}
            width={chartWidth - margin.left - margin.right}
            height={chartHeight - margin.top - margin.bottom + 4}
          />
        </clipPath>
      </defs>

      {#each tickValues(POPULATION_CEILING) as tick (tick)}
        <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={populationToY(tick)} y2={populationToY(tick)} />
        <text x={margin.left - 8} y={populationToY(tick) + 4} text-anchor="end">{formatNumber(tick)}</text>
      {/each}
      {#each tickValues(TIME_SPAN, 6) as tick (tick)}
        <text x={timeToX(tick)} y={chartHeight - margin.bottom + 20} text-anchor="middle">{tick}</text>
      {/each}
      <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
      <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 6} text-anchor="middle">time</text>
      <text transform="translate(16 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">
        population size, N
      </text>

      <g clip-path="url(#{plotClipId})">
        {#if isLogistic}
          <line class="capacity" x1={margin.left} x2={chartWidth - margin.right} y1={populationToY(K)} y2={populationToY(K)} />
          <text class="capacity-label" x={margin.left + 8} y={populationToY(K) - 8}>carrying capacity, K = {K}</text>
        {/if}

        {#if showsExponential}
          <path class="curve exponential" class:dashed={isLogistic} d={exponentialCurve} />
          <text
            class="curve-label exponential-label"
            x={timeToX(Math.min(timeExponentialLeavesChart, TIME_SPAN)) + (timeExponentialLeavesChart < TIME_SPAN ? 8 : -4)}
            y={timeExponentialLeavesChart < TIME_SPAN ? margin.top + 14 : populationToY(exponentialPopulationAt(TIME_SPAN)) - 8}
            text-anchor={timeExponentialLeavesChart < TIME_SPAN ? 'start' : 'end'}>exponential</text
          >
        {/if}

        {#if isLogistic}
          <path class="curve logistic" class:draw-on-load={hero} d={logisticCurve} pathLength="1" />
          <text class="curve-label logistic-label" x={chartWidth - margin.right - 4} y={populationToY(logisticPopulationAt(TIME_SPAN)) + 20} text-anchor="end"
            >logistic</text
          >
          {#if !hero && timeOfFastestGrowth !== null && timeOfFastestGrowth < TIME_SPAN}
            <circle class="fastest-growth" cx={timeToX(timeOfFastestGrowth)} cy={populationToY(K / 2)} r="5" />
            <text x={timeToX(timeOfFastestGrowth) + 10} y={populationToY(K / 2) + 18}>fastest growth, N = K/2</text>
          {/if}
        {/if}

        {#if !hero && !cursorIsOffChart}
          <line class="cursor" x1={timeToX(cursorTime)} x2={timeToX(cursorTime)} y1={margin.top} y2={chartHeight - margin.bottom} />
          <circle class="cursor-dot" cx={timeToX(cursorTime)} cy={populationToY(cursorPopulation)} r="6" />
        {/if}
      </g>
    </svg>

    {#if !hero}
      <svg class="chart" viewBox="0 0 {rateChartWidth} {chartHeight}" role="img" aria-label="Growth rate dN/dt plotted against population size N">
        {#each tickValues(GROWTH_RATE_CEILING) as tick (tick)}
          <line class="gridline" x1={rateMargin.left} x2={rateChartWidth - rateMargin.right} y1={growthRateToY(tick)} y2={growthRateToY(tick)} />
          <text x={rateMargin.left - 8} y={growthRateToY(tick) + 4} text-anchor="end">{tick}</text>
        {/each}
        {#each [0, 500, 1000] as tick (tick)}
          <text x={populationToRateX(tick)} y={chartHeight - rateMargin.bottom + 20} text-anchor="middle">{tick}</text>
        {/each}
        <line class="axis" x1={rateMargin.left} x2={rateChartWidth - rateMargin.right} y1={chartHeight - rateMargin.bottom} y2={chartHeight - rateMargin.bottom} />
        <text x={(rateMargin.left + rateChartWidth - rateMargin.right) / 2} y={chartHeight - 6} text-anchor="middle">population size, N</text>
        <text transform="translate(14 {(rateMargin.top + chartHeight - rateMargin.bottom) / 2}) rotate(-90)" text-anchor="middle">
          new individuals per unit time
        </text>
        <defs>
          <clipPath id="{plotClipId}-rate">
            <rect
              x={rateMargin.left}
              y={rateMargin.top - 4}
              width={rateChartWidth - rateMargin.left - rateMargin.right}
              height={chartHeight - rateMargin.top - rateMargin.bottom + 4}
            />
          </clipPath>
        </defs>
        <g clip-path="url(#{plotClipId}-rate)">
          <path class="curve" class:logistic={isLogistic} class:exponential={!isLogistic} d={growthRateCurve} />
          {#if !cursorIsOffChart}
            <circle class="cursor-dot" cx={populationToRateX(cursorPopulation)} cy={growthRateToY(cursorGrowthRate)} r="6" />
          {/if}
        </g>
      </svg>
    {/if}
  </div>

  <div class="controls">
    <div class="control">
      <label for="{plotClipId}-r">growth rate, r <output>{r.toFixed(2)}</output></label>
      <input id="{plotClipId}-r" type="range" min="0.1" max="1" step="0.05" bind:value={r} />
      <small>per-capita births minus deaths, per unit time</small>
    </div>
    {#if isLogistic}
      <div class="control">
        <label for="{plotClipId}-k">carrying capacity, K <output>{K}</output></label>
        <input id="{plotClipId}-k" type="range" min="100" max="900" step="50" bind:value={K} />
        <small>the largest population the environment can sustain</small>
      </div>
    {/if}
    {#if !hero}
      <div class="control">
        <label for="{plotClipId}-n0">starting population, N₀ <output>{N0}</output></label>
        <input id="{plotClipId}-n0" type="range" min="2" max="100" step="1" bind:value={N0} />
      </div>
      <div class="control">
        <label for="{plotClipId}-t">time <output>{cursorTime.toFixed(1)}</output></label>
        <input id="{plotClipId}-t" type="range" min="0" max={TIME_SPAN} step="0.1" bind:value={cursorTime} />
      </div>
    {/if}
  </div>

  {#if !hero}
    <p class="readout" aria-live="polite">
      {#if cursorIsOffChart}
        At time {cursorTime.toFixed(1)}, the population is {formatNumber(cursorPopulation)}+ and off the chart.
      {:else}
        At time {cursorTime.toFixed(1)}: <strong>N = {formatNumber(cursorPopulation)}</strong>, adding
        <strong>{formatNumber(cursorGrowthRate, 1)}</strong> individuals per unit time.
      {/if}
      {#if isLogistic}
        Growth is fastest when N is half of K.
      {:else}
        It doubles every {formatNumber(doublingTime, 1)} time units, no matter how big it already is.
      {/if}
    </p>
    {#if isLogistic}
      <div class="btn-row">
        <button class="btn" aria-pressed={compareWithExponential} onclick={() => (compareWithExponential = !compareWithExponential)}>
          Compare with exponential growth
        </button>
      </div>
    {/if}
  {/if}
</figure>

<style>
  .growth {
    margin: 0;
  }

  .hero {
    background: transparent;
    border: none;
    padding: 0;
  }

  .charts {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 900px) {
    .charts.with-rate-chart {
      grid-template-columns: 2.4fr 1fr;
      align-items: start;
    }
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .curve {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .logistic {
    stroke: var(--prey);
  }

  .exponential {
    stroke: var(--predator);
  }

  .dashed {
    stroke-dasharray: 7 6;
    stroke-width: 2.5;
  }

  .curve-label {
    font-weight: 600;
    font-size: 15px;
  }

  .chart .logistic-label {
    fill: var(--prey);
  }

  .chart .exponential-label {
    fill: var(--predator);
  }

  .capacity {
    stroke: var(--ink-soft);
    stroke-width: 1.5;
    stroke-dasharray: 2 5;
    stroke-linecap: round;
  }

  .chart .capacity-label {
    fill: var(--ink);
  }

  .fastest-growth {
    fill: var(--paper-raised);
    stroke: var(--prey);
    stroke-width: 2.5;
  }

  .cursor {
    stroke: var(--ink-soft);
    stroke-width: 1;
  }

  .cursor-dot {
    fill: var(--ink);
    stroke: var(--paper-raised);
    stroke-width: 2;
  }

  .readout {
    margin: 1rem 0 0.8rem;
  }

  .draw-on-load {
    stroke-dasharray: 1;
    animation: draw 1.8s cubic-bezier(0.3, 0.7, 0.2, 1) 0.2s both;
  }

  .hero .exponential,
  .hero .exponential-label,
  .hero .capacity,
  .hero .capacity-label {
    animation: fade-in 0.8s ease-out 1.4s both;
  }

  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
</style>
