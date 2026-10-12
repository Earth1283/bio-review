<script lang="ts">
  type Shape = 'rapid' | 'slow' | 'decline';

  const ageBandLabels = Array.from({ length: 17 }, (_, i) => (i === 16 ? '80+' : `${i * 5}–${i * 5 + 4}`));

  const relativeBandSizes: Record<Shape, (band: number) => number> = {
    rapid: (band) => Math.exp(-0.16 * band),
    slow: (band) => (band < 11 ? 1 - band * 0.015 : (1 - band * 0.015) * Math.exp(-0.3 * (band - 10))),
    decline: (band) =>
      band < 4 ? 0.62 + band * 0.06 : band < 13 ? 0.85 + Math.min(band - 4, 8) * 0.05 : 1.25 * Math.exp(-0.35 * (band - 12)),
  };

  const shapeDetails: Record<Shape, { name: string; description: string; examples: string }> = {
    rapid: {
      name: 'Rapid growth',
      description:
        'A wide base. Each group of children is bigger than the one before, and all of them have yet to have children of their own, so the population will keep growing fast for decades.',
      examples: 'Afghanistan and Niger have shapes like this.',
    },
    slow: {
      name: 'Slow growth',
      description:
        'Close to straight sides until old age. Each generation is about the same size as the last, so the population grows slowly.',
      examples: 'The United States has a shape close to this.',
    },
    decline: {
      name: 'Decline',
      description:
        'A narrow base. There are fewer children than adults in their child-bearing years, so without immigration the population will shrink.',
      examples: 'Italy and Japan have shapes like this.',
    },
  };
  const shapes: Shape[] = ['rapid', 'slow', 'decline'];

  function percentOfPopulationPerSex(shape: Shape): number[] {
    const sizes = ageBandLabels.map((_, band) => relativeBandSizes[shape](band));
    const total = sizes.reduce((sum, size) => sum + size, 0);
    return sizes.map((size) => (size / total) * 50);
  }

  const percentagesByShape = Object.fromEntries(shapes.map((shape) => [shape, percentOfPopulationPerSex(shape)])) as Record<
    Shape,
    number[]
  >;

  const chartWidth = 560;
  const barHeight = 16;
  const barGap = 3;
  const labelColumnWidth = 64;
  const top = 26;
  const chartHeight = top + ageBandLabels.length * (barHeight + barGap) + 4;
  const center = labelColumnWidth + (chartWidth - labelColumnWidth) / 2;
  const pixelsPerPercent = (chartWidth - labelColumnWidth) / 2 / 10;

  let selectedShape = $state<Shape>('rapid');
  const percentages = $derived(percentagesByShape[selectedShape]);
</script>

<figure class="widget age-pyramid">
  <div class="btn-row" role="group" aria-label="Age structure">
    {#each shapes as shape (shape)}
      <button class="btn" aria-pressed={selectedShape === shape} onclick={() => (selectedShape = shape)}>
        {shapeDetails[shape].name}
      </button>
    {/each}
  </div>

  <div class="layout">
    <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="{shapeDetails[selectedShape].name} age structure diagram">
      <text x={center - 10} y="14" text-anchor="end">male</text>
      <text x={center + 10} y="14">female</text>
      {#each ageBandLabels as label, band (label)}
        {@const y = top + (ageBandLabels.length - 1 - band) * (barHeight + barGap)}
        {@const barWidth = percentages[band] * pixelsPerPercent}
        <text x={labelColumnWidth - 8} y={y + barHeight - 4} text-anchor="end">{label}</text>
        <rect class="bar male" x={center - barWidth - 1} {y} width={barWidth} height={barHeight} rx="2" />
        <rect class="bar female" x={center + 1} {y} width={barWidth} height={barHeight} rx="2" />
      {/each}
    </svg>

    <div class="explanation" aria-live="polite">
      <p>{shapeDetails[selectedShape].description}</p>
      <p class="examples">{shapeDetails[selectedShape].examples}</p>
      <p class="note">Bar lengths are illustrative, not real census data.</p>
    </div>
  </div>
</figure>

<style>
  .layout {
    display: grid;
    gap: 1.2rem;
    margin-top: 1rem;
  }

  @media (min-width: 760px) {
    .layout {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      align-items: center;
    }
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .chart text {
    font-size: 12px;
  }

  .bar {
    transition:
      x 450ms cubic-bezier(0.4, 0, 0.2, 1),
      width 450ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .male {
    fill: var(--prey);
  }

  .female {
    fill: color-mix(in srgb, var(--prey) 55%, var(--paper-raised));
  }

  .explanation p {
    margin: 0 0 0.7rem;
  }

  .examples,
  .note {
    color: var(--ink-soft);
  }

  .note {
    font-size: 0.85rem;
  }
</style>
