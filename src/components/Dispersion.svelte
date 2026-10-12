<script lang="ts">
  import { seededRandom } from '../lib/chart';

  type Pattern = 'clumped' | 'uniform' | 'random';
  type Cause = { factor: 'biotic' | 'abiotic'; text: string };

  const fieldSize = 300;
  const individualCount = 64;

  const patternDetails: Record<Pattern, { name: string; summary: string; causes: Cause[]; examples: string }> = {
    clumped: {
      name: 'Clumped',
      summary: 'Individuals gather in patches. This is the most common pattern in nature.',
      causes: [
        { factor: 'abiotic', text: 'Resources or good conditions are patchy: moist soil, shade, a rotting log.' },
        { factor: 'biotic', text: 'Animals gather where prey or food plants are.' },
        { factor: 'biotic', text: 'Living in groups helps with mating, hunting, or defense against predators.' },
        { factor: 'biotic', text: 'Seeds or offspring stay close to the parent.' },
      ],
      examples: 'Mushrooms on a log, sea stars in tide pools where food is plentiful, wolf packs, fish schools.',
    },
    uniform: {
      name: 'Uniform',
      summary: 'Individuals are evenly spaced, each keeping its distance from its neighbors.',
      causes: [
        { factor: 'biotic', text: 'Territoriality: animals defend a space around themselves.' },
        { factor: 'biotic', text: 'Some plants release chemicals that stop others from growing nearby.' },
        { factor: 'biotic', text: 'Competition for a scarce resource, such as water, spaces plants out.' },
      ],
      examples: 'Nesting king penguins, creosote bushes in the desert.',
    },
    random: {
      name: 'Random',
      summary: 'Each individual’s position has nothing to do with the others. This pattern is uncommon.',
      causes: [
        { factor: 'abiotic', text: 'Key resources are spread evenly, so no spot is better than another.' },
        { factor: 'biotic', text: 'Individuals neither attract nor repel each other.' },
      ],
      examples: 'Dandelions growing from wind-blown seeds, some trees in a forest.',
    },
  };

  const positionsByPattern: Record<Pattern, [number, number][]> = {
    clumped: clumpedPositions(),
    uniform: uniformPositions(),
    random: randomPositions(),
  };

  const patterns: Pattern[] = ['clumped', 'uniform', 'random'];
  let selectedPattern = $state<Pattern>('clumped');
  const positions = $derived(positionsByPattern[selectedPattern]);
  const details = $derived(patternDetails[selectedPattern]);

  function keepInsideField(value: number) {
    return Math.min(fieldSize - 10, Math.max(10, value));
  }

  function clumpedPositions(): [number, number][] {
    const random = seededRandom(11);
    const patchCenters = [
      [70, 80],
      [215, 65],
      [120, 200],
      [240, 220],
      [55, 255],
    ];
    return Array.from({ length: individualCount }, (_, i) => {
      const [cx, cy] = patchCenters[i % patchCenters.length];
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * 30;
      return [keepInsideField(cx + Math.cos(angle) * distance), keepInsideField(cy + Math.sin(angle) * distance)];
    });
  }

  function uniformPositions(): [number, number][] {
    const random = seededRandom(23);
    const perRow = Math.sqrt(individualCount);
    const spacing = fieldSize / perRow;
    return Array.from({ length: individualCount }, (_, i) => {
      const column = i % perRow;
      const row = Math.floor(i / perRow);
      const rowOffset = row % 2 ? spacing / 4 : -spacing / 4;
      return [
        keepInsideField(spacing * (column + 0.5) + rowOffset + (random() - 0.5) * 5),
        keepInsideField(spacing * (row + 0.5) + (random() - 0.5) * 5),
      ];
    });
  }

  function randomPositions(): [number, number][] {
    const random = seededRandom(37);
    return Array.from({ length: individualCount }, () => [10 + random() * (fieldSize - 20), 10 + random() * (fieldSize - 20)]);
  }
</script>

<figure class="widget dispersion">
  <div class="btn-row" role="group" aria-label="Dispersion pattern">
    {#each patterns as pattern (pattern)}
      <button class="btn" aria-pressed={selectedPattern === pattern} onclick={() => (selectedPattern = pattern)}>
        {patternDetails[pattern].name}
      </button>
    {/each}
  </div>

  <div class="layout">
    <svg viewBox="0 0 {fieldSize} {fieldSize}" role="img" aria-label="{details.name} dispersion: {details.summary}">
      <rect class="field" x="1" y="1" width={fieldSize - 2} height={fieldSize - 2} rx="6" />
      {#each positions as [x, y], index (index)}
        <circle cx={x} cy={y} r="5" />
      {/each}
    </svg>

    <div class="explanation" aria-live="polite">
      <p class="summary">{details.summary}</p>
      <p class="causes-heading">Why it happens</p>
      <ul>
        {#each details.causes as cause (cause.text)}
          <li><span class="factor {cause.factor}">{cause.factor}</span> {cause.text}</li>
        {/each}
      </ul>
      <p class="examples"><strong>Examples:</strong> {details.examples}</p>
    </div>
  </div>
</figure>

<style>
  .layout {
    display: grid;
    gap: 1.4rem;
    margin-top: 1rem;
  }

  @media (min-width: 760px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
      align-items: start;
    }
  }

  svg {
    display: block;
    width: 100%;
    max-width: 360px;
    height: auto;
  }

  .field {
    fill: color-mix(in srgb, var(--prey) 6%, var(--paper-raised));
    stroke: var(--rule);
  }

  circle {
    fill: var(--prey);
    transition:
      cx 600ms cubic-bezier(0.4, 0, 0.2, 1),
      cy 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .summary {
    font-family: var(--serif);
    font-size: 1.1rem;
    margin: 0 0 1rem;
  }

  .causes-heading {
    font-weight: 600;
    margin: 0 0 0.4rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
  }

  li {
    display: grid;
    grid-template-columns: 4.6rem 1fr;
    gap: 0.6rem;
    align-items: baseline;
  }

  .factor {
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
    border-radius: 999px;
    padding: 0.05rem 0;
  }

  .biotic {
    color: var(--prey);
    border: 1px solid var(--prey);
  }

  .abiotic {
    color: var(--predator);
    border: 1px solid var(--predator);
  }

  .examples {
    color: var(--ink-soft);
    margin: 0;
  }
</style>
