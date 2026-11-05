<script lang="ts">
  import { linearScale, svgLinePath } from '../lib/chart';

  const SPECIES_MAX = 20;

  // An illustrative curve, not data: diversity peaks at intermediate disturbance.
  const speciesAt = (disturbance: number) => 3 + 15 * Math.exp(-(((disturbance - 0.5) / 0.27) ** 2));

  const groups = [
    { name: 'Strong competitors', color: 'var(--prey)' },
    { name: 'In-between species', color: 'var(--third)' },
    { name: 'Fast colonizers', color: 'var(--predator)' },
  ];

  const compositionAt = (disturbance: number) => {
    const weights = [1 - disturbance, 1 - Math.abs(2 * disturbance - 1), disturbance];
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => w / sum);
  };

  const chartWidth = 640;
  const chartHeight = 320;
  const margin = { top: 16, right: 24, bottom: 62, left: 56 };
  const disturbanceToX = linearScale(0, 1, margin.left, chartWidth - margin.right);
  const speciesToY = linearScale(0, SPECIES_MAX, chartHeight - margin.bottom, margin.top);
  const curvePath = svgLinePath(Array.from({ length: 101 }, (_, i) => [disturbanceToX(i / 100), speciesToY(speciesAt(i / 100))]));

  let disturbancePercent = $state(50);
  const disturbance = $derived(disturbancePercent / 100);
  const speciesCount = $derived(speciesAt(disturbance));
  const composition = $derived(compositionAt(disturbance));

  const zone = $derived(disturbance < 0.25 ? 'low' : disturbance > 0.75 ? 'high' : 'intermediate');
  const zoneText = {
    low: 'Almost nothing is disturbed, so the best competitors take over and crowd out everything else. This is competitive exclusion.',
    intermediate:
      'Disturbance keeps knocking back the best competitors, which opens space for fast colonizers. Both kinds can live here, so diversity is highest.',
    high: 'Disturbance comes so often or so hard that only fast colonizers and tough survivors can persist. Slower species never get established.',
  };
</script>

<figure class="widget disturbance">
  <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="Species diversity plotted against disturbance, peaking at intermediate disturbance">
    <rect class="zone" x={disturbanceToX(0.25)} y={margin.top} width={disturbanceToX(0.75) - disturbanceToX(0.25)} height={chartHeight - margin.top - margin.bottom} />
    {#each [0, 5, 10, 15, 20] as tick (tick)}
      <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={speciesToY(tick)} y2={speciesToY(tick)} />
      <text x={margin.left - 8} y={speciesToY(tick) + 4} text-anchor="end">{tick}</text>
    {/each}
    <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
    <text x={disturbanceToX(0)} y={chartHeight - margin.bottom + 20} text-anchor="start">rare or mild</text>
    <text x={disturbanceToX(1)} y={chartHeight - margin.bottom + 20} text-anchor="end">frequent or severe</text>
    <text x={disturbanceToX(0.5)} y={chartHeight - margin.bottom + 20} text-anchor="middle">intermediate</text>
    <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 4} text-anchor="middle">disturbance</text>
    <text transform="translate(14 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">number of species</text>

    <path class="curve" d={curvePath} />
    <line class="cursor" x1={disturbanceToX(disturbance)} x2={disturbanceToX(disturbance)} y1={speciesToY(speciesCount)} y2={chartHeight - margin.bottom} />
    <circle class="cursor-dot" cx={disturbanceToX(disturbance)} cy={speciesToY(speciesCount)} r="6" />
  </svg>

  <div class="control">
    <label for="disturbance">How often or how severely the community is disturbed <output>{disturbancePercent}%</output></label>
    <input id="disturbance" type="range" min="0" max="100" step="1" bind:value={disturbancePercent} />
  </div>

  <p class="who-heading">Who is living there</p>
  <div class="bar" role="img" aria-label="Share of the community made up by each kind of species">
    {#each groups as group, i (group.name)}
      <span style="width: {composition[i] * 100}%; background: {group.color}"></span>
    {/each}
  </div>
  <ul class="legend">
    {#each groups as group, i (group.name)}
      <li><span class="swatch" style="background: {group.color}"></span>{group.name} {Math.round(composition[i] * 100)}%</li>
    {/each}
  </ul>

  <p class="readout" aria-live="polite">
    About <strong>{Math.round(speciesCount)} species</strong>. {zoneText[zone]}
  </p>
  <p class="widget-caption">The curve is a sketch of the pattern, not measured data.</p>
</figure>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .zone {
    fill: color-mix(in srgb, var(--prey) 9%, var(--paper-raised));
  }

  .curve {
    fill: none;
    stroke: var(--prey);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .cursor {
    stroke: var(--ink-soft);
    stroke-dasharray: 3 4;
  }

  .cursor-dot {
    fill: var(--ink);
    stroke: var(--paper-raised);
    stroke-width: 2;
  }

  .who-heading {
    font-weight: 600;
    margin: 1.2rem 0 0.4rem;
  }

  .bar {
    display: flex;
    height: 1.6rem;
    border-radius: 6px;
    overflow: hidden;
    background: var(--grid);
  }

  .bar span {
    display: block;
    height: 100%;
  }

  .legend {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1.4rem;
    padding: 0;
    margin: 0.5rem 0 0;
  }

  .legend li {
    margin: 0;
  }

  .swatch {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 3px;
    margin-right: 0.4rem;
  }

  .readout {
    margin: 1rem 0 0;
  }
</style>
