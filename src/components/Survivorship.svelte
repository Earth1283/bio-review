<script lang="ts">
  import { linearScale, svgLinePath } from '../lib/chart';

  type CurveType = 'I' | 'II' | 'III';

  const curveDetails: Record<CurveType, { log10Survivors: (u: number) => number; description: string; examples: string }> = {
    I: {
      log10Survivors: (u) => 3 * (1 - u ** 6),
      description:
        'Few deaths early and in middle life, then a steep rise in deaths among the old. Parents have few offspring and take good care of them.',
      examples: 'Humans, elephants, and many other large mammals.',
    },
    II: {
      log10Survivors: (u) => 3 * (1 - u),
      description: 'A constant death rate across the whole life span: the same fraction dies at every age.',
      examples: 'Some rodents, lizards, invertebrates, and annual plants.',
    },
    III: {
      log10Survivors: (u) => 3 * (1 - u) ** 6,
      description:
        'Huge losses among the very young, then a low death rate for the few that make it. Parents produce enormous numbers of offspring and give them little or no care.',
      examples: 'Oysters, which release millions of eggs, most fish, and many long-lived plants.',
    },
  };
  const curveTypes: CurveType[] = ['I', 'II', 'III'];

  const chartWidth = 640;
  const chartHeight = 360;
  const margin = { top: 16, right: 40, bottom: 48, left: 64 };
  const lifeSpanToX = linearScale(0, 100, margin.left, chartWidth - margin.right);
  const log10SurvivorsToY = linearScale(0, 3, chartHeight - margin.bottom, margin.top);
  const sampleFractions = Array.from({ length: 101 }, (_, i) => i / 100);

  const curvePaths = Object.fromEntries(
    curveTypes.map((type) => [
      type,
      svgLinePath(sampleFractions.map((u) => [lifeSpanToX(u * 100), log10SurvivorsToY(curveDetails[type].log10Survivors(u))])),
    ]),
  ) as Record<CurveType, string>;

  const labelFractions: Record<CurveType, number> = { I: 0.78, II: 0.5, III: 0.12 };

  let selectedType = $state<CurveType>('I');
</script>

<figure class="widget survivorship">
  <div class="btn-row" role="group" aria-label="Survivorship curve type">
    {#each curveTypes as type (type)}
      <button class="btn" aria-pressed={selectedType === type} onclick={() => (selectedType = type)}>Type {type}</button>
    {/each}
  </div>

  <svg
    class="chart"
    viewBox="0 0 {chartWidth} {chartHeight}"
    role="img"
    aria-label="Survivorship curves: number of survivors out of 1,000 on a log scale, against percentage of maximum life span"
  >
    {#each [0, 1, 2, 3] as exponent (exponent)}
      <line class="gridline" x1={margin.left} x2={chartWidth - margin.right} y1={log10SurvivorsToY(exponent)} y2={log10SurvivorsToY(exponent)} />
      <text x={margin.left - 8} y={log10SurvivorsToY(exponent) + 4} text-anchor="end">{(10 ** exponent).toLocaleString('en-US')}</text>
    {/each}
    {#each [0, 25, 50, 75, 100] as percent (percent)}
      <text x={lifeSpanToX(percent)} y={chartHeight - margin.bottom + 20} text-anchor="middle">{percent}</text>
    {/each}
    <line class="axis" x1={margin.left} x2={chartWidth - margin.right} y1={chartHeight - margin.bottom} y2={chartHeight - margin.bottom} />
    <text x={(margin.left + chartWidth - margin.right) / 2} y={chartHeight - 6} text-anchor="middle">percentage of maximum life span</text>
    <text transform="translate(16 {(margin.top + chartHeight - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">
      survivors per 1,000 (log scale)
    </text>

    {#each curveTypes as type (type)}
      {@const labelFraction = labelFractions[type]}
      <g class="curve-group" class:selected={selectedType === type}>
        <path d={curvePaths[type]} />
        <text
          class="curve-label"
          x={lifeSpanToX(labelFraction * 100) + 8}
          y={log10SurvivorsToY(curveDetails[type].log10Survivors(labelFraction)) - 8}>{type}</text
        >
      </g>
    {/each}
  </svg>

  <div class="explanation" aria-live="polite">
    <p>{curveDetails[selectedType].description}</p>
    <p class="examples"><strong>Examples:</strong> {curveDetails[selectedType].examples}</p>
  </div>
</figure>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    margin-top: 0.8rem;
  }

  .curve-group path {
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 2;
    opacity: 0.35;
    transition:
      opacity 200ms ease-out,
      stroke-width 200ms ease-out;
  }

  .curve-group.selected path {
    stroke: var(--prey);
    stroke-width: 3.5;
    opacity: 1;
  }

  .chart .curve-label {
    font-size: 16px;
    font-weight: 600;
    opacity: 0.6;
  }

  .chart .selected .curve-label {
    fill: var(--prey);
    opacity: 1;
  }

  .explanation {
    min-height: 5rem;
  }

  .explanation p {
    margin: 0.6rem 0 0;
  }

  .examples {
    color: var(--ink-soft);
  }
</style>
