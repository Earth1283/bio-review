<script lang="ts">
  import { linearScale, svgLinePath } from '../lib/chart';

  const POOL = 100;

  const presets = [
    { name: 'Near and large', distance: 10, size: 90 },
    { name: 'Near and small', distance: 10, size: 10 },
    { name: 'Far and large', distance: 90, size: 90 },
    { name: 'Far and small', distance: 90, size: 10 },
  ];

  let distance = $state(10);
  let size = $state(90);

  // Immigration starts high and falls as the island fills; extinction starts at zero and rises.
  const maxImmigration = $derived(1 - 0.8 * (distance / 100));
  const maxExtinction = $derived(0.9 - 0.7 * (size / 100));
  const equilibrium = $derived((POOL * maxImmigration) / (maxImmigration + maxExtinction));
  const equilibriumRate = $derived(maxImmigration * (1 - equilibrium / POOL));

  const chartWidth = 640;
  const chartHeight = 320;
  const margin = { top: 16, right: 24, bottom: 46, left: 56 };
  const speciesToX = linearScale(0, POOL, margin.left, chartWidth - margin.right);
  const rateToY = linearScale(0, 1, chartHeight - margin.bottom, margin.top);
  const sampleSpecies = [0, POOL];

  const immigrationLine = $derived(svgLinePath(sampleSpecies.map((s) => [speciesToX(s), rateToY(maxImmigration * (1 - s / POOL))])));
  const extinctionLine = $derived(svgLinePath(sampleSpecies.map((s) => [speciesToX(s), rateToY((maxExtinction * s) / POOL)])));

  const distanceWord = $derived(distance < 34 ? 'close to' : distance > 66 ? 'far from' : 'a medium distance from');
  const sizeWord = $derived(size < 34 ? 'small' : size > 66 ? 'large' : 'medium-sized');
</script>

<figure class="widget island">
  <div class="btn-row" role="group" aria-label="Example islands">
    {#each presets as preset (preset.name)}
      <button
        class="btn"
        aria-pressed={distance === preset.distance && size === preset.size}
        onclick={() => {
          distance = preset.distance;
          size = preset.size;
        }}
      >
        {preset.name}
      </button>
    {/each}
  </div>

  <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="Immigration and extinction rates plotted against the number of species on an island">
    {#each [0, 0.25, 0.5, 0.75, 1] as tick (tick)}
      <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={rateToY(tick)} y2={rateToY(tick)} />
      <text x={margin.left - 8} y={rateToY(tick) + 4} text-anchor="end">{tick.toFixed(2)}</text>
    {/each}
    <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
    <text x={speciesToX(0)} y={chartHeight - margin.bottom + 20} text-anchor="start">0</text>
    <text x={speciesToX(POOL)} y={chartHeight - margin.bottom + 20} text-anchor="end">{POOL} (all mainland species)</text>
    <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 6} text-anchor="middle">number of species on the island</text>
    <text transform="translate(14 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">rate</text>

    <line class="equilibrium" x1={speciesToX(equilibrium)} x2={speciesToX(equilibrium)} y1={margin.top} y2={chartHeight - margin.bottom} />
    <text class="equilibrium-label" x={speciesToX(equilibrium) + (equilibrium > 70 ? -8 : 8)} y={margin.top + 14} text-anchor={equilibrium > 70 ? 'end' : 'start'}>
      equilibrium: about {Math.round(equilibrium)} species
    </text>

    <path class="line immigration" d={immigrationLine} />
    <path class="line extinction" d={extinctionLine} />
    <circle class="equilibrium-dot" cx={speciesToX(equilibrium)} cy={rateToY(equilibriumRate)} r="6" />
    <text class="series-label immigration-label" x={speciesToX(3)} y={rateToY(maxImmigration) - 8}>immigration</text>
    <text class="series-label extinction-label" x={speciesToX(POOL) - 4} y={rateToY(maxExtinction) - 8} text-anchor="end">extinction</text>
  </svg>

  <div class="controls">
    <div class="control">
      <label for="island-distance">distance from the mainland <output>{distance < 34 ? 'near' : distance > 66 ? 'far' : 'middle'}</output></label>
      <input id="island-distance" type="range" min="0" max="100" step="1" bind:value={distance} />
      <small>far islands receive fewer arriving species</small>
    </div>
    <div class="control">
      <label for="island-size">island size <output>{size < 34 ? 'small' : size > 66 ? 'large' : 'medium'}</output></label>
      <input id="island-size" type="range" min="0" max="100" step="1" bind:value={size} />
      <small>small islands have smaller populations, which go extinct more easily</small>
    </div>
  </div>

  <p class="readout" aria-live="polite">
    An island that is {sizeWord} and {distanceWord} the mainland settles at about <strong>{Math.round(equilibrium)} species</strong>. Species
    keep arriving and keep going extinct, but the two rates balance there, so the number stays steady while the particular species
    change.
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

  .immigration {
    stroke: var(--prey);
  }

  .extinction {
    stroke: var(--predator);
  }

  .chart .series-label {
    font-size: 15px;
    font-weight: 600;
  }

  .chart .immigration-label {
    fill: var(--prey);
  }

  .chart .extinction-label {
    fill: var(--predator);
  }

  .equilibrium {
    stroke: var(--ink);
    stroke-dasharray: 3 4;
  }

  .chart .equilibrium-label {
    fill: var(--ink);
  }

  .equilibrium-dot {
    fill: var(--ink);
    stroke: var(--paper-raised);
    stroke-width: 2;
  }

  .readout {
    margin: 1rem 0 0;
  }
</style>
