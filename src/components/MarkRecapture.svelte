<script lang="ts">
  import { formatNumber, seededRandom } from '../lib/chart';

  type Stage = 'ready' | 'marked' | 'recaptured';
  type Fish = { x: number; y: number };

  const pondWidth = 640;
  const pondHeight = 300;
  const controlIdPrefix = $props.id();

  let pondNumber = $state(1);
  let fish = $state<Fish[]>(createPond(1));
  let stage = $state<Stage>('ready');
  let firstCatchSize = $state(50);
  let secondCatchSize = $state(50);
  let markedIds = $state(new Set<number>());
  let secondCatchIds = $state(new Set<number>());
  let earlierEstimates = $state<number[]>([]);
  let trueSizeRevealed = $state(false);

  const markedInSecondCatch = $derived([...secondCatchIds].filter((id) => markedIds.has(id)).length);
  const markedCount = $derived(markedIds.size);
  const secondCatchCount = $derived(secondCatchIds.size);
  const estimatedSize = $derived(markedInSecondCatch > 0 ? (markedCount * secondCatchCount) / markedInSecondCatch : null);

  function createPond(seed: number): Fish[] {
    const random = seededRandom(seed * 7919);
    const populationSize = 180 + Math.floor(random() * 320);
    const pondFish: Fish[] = [];
    while (pondFish.length < populationSize) {
      const x = random() * 2 - 1;
      const y = random() * 2 - 1;
      if (x * x + y * y < 0.92) {
        pondFish.push({ x: pondWidth / 2 + (x * pondWidth) / 2, y: pondHeight / 2 + (y * pondHeight) / 2 });
      }
    }
    return pondFish;
  }

  function randomSampleOfIds(count: number): Set<number> {
    const ids = fish.map((_, id) => id);
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (ids.length - i));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return new Set(ids.slice(0, count));
  }

  function catchAndMark() {
    markedIds = randomSampleOfIds(firstCatchSize);
    secondCatchIds = new Set();
    stage = 'marked';
  }

  function catchAgain() {
    if (stage === 'recaptured' && estimatedSize !== null) earlierEstimates = [...earlierEstimates, estimatedSize];
    secondCatchIds = randomSampleOfIds(secondCatchSize);
    stage = 'recaptured';
  }

  function startNewPond() {
    pondNumber += 1;
    fish = createPond(pondNumber);
    markedIds = new Set();
    secondCatchIds = new Set();
    earlierEstimates = [];
    trueSizeRevealed = false;
    stage = 'ready';
  }
</script>

<figure class="widget mark-recapture">
  <svg viewBox="0 0 {pondWidth} {pondHeight}" role="img" aria-label="A pond seen from above. Each dot is one fish.">
    <ellipse class="pond" cx={pondWidth / 2} cy={pondHeight / 2} rx={pondWidth / 2 - 2} ry={pondHeight / 2 - 2} />
    {#each fish as oneFish, id (id)}
      <circle
        cx={oneFish.x}
        cy={oneFish.y}
        r={secondCatchIds.has(id) ? 5 : 3.2}
        class:marked={markedIds.has(id)}
        class:caught={secondCatchIds.has(id)}
      />
    {/each}
  </svg>

  <div class="legend">
    <span><i class="swatch unmarked"></i>never caught</span>
    <span><i class="swatch marked"></i>marked in the first catch</span>
    <span><i class="swatch caught"></i>in the second catch</span>
  </div>

  <div class="controls">
    <div class="control">
      <label for="{controlIdPrefix}-first">first catch, s <output>{firstCatchSize}</output></label>
      <input id="{controlIdPrefix}-first" type="range" min="10" max="120" step="5" bind:value={firstCatchSize} disabled={stage !== 'ready'} />
    </div>
    <div class="control">
      <label for="{controlIdPrefix}-second">second catch, n <output>{secondCatchSize}</output></label>
      <input id="{controlIdPrefix}-second" type="range" min="10" max="120" step="5" bind:value={secondCatchSize} />
    </div>
  </div>

  <div class="btn-row steps">
    <button class="btn" onclick={catchAndMark} disabled={stage !== 'ready'}>1. Catch {firstCatchSize} and mark them</button>
    <button class="btn" onclick={catchAgain} disabled={stage === 'ready'}>
      2. {stage === 'recaptured' ? 'Catch again' : `Release them, then catch ${secondCatchSize}`}
    </button>
    <button class="btn" onclick={startNewPond}>New pond</button>
  </div>

  <div class="result" aria-live="polite">
    {#if stage === 'ready'}
      <p>This pond holds an unknown number of fish. Catch some and mark them to start.</p>
    {:else if stage === 'marked'}
      <p>{markedCount} fish are marked and back in the pond, mixing with the rest. Now take a second catch.</p>
    {:else}
      <p>
        <strong>{markedInSecondCatch}</strong> of the {secondCatchCount} fish in the second catch were already marked (x =
        {markedInSecondCatch}).
      </p>
      {#if estimatedSize !== null}
        <p class="estimate">
          N ≈ (s × n) ÷ x = ({markedCount} × {secondCatchCount}) ÷ {markedInSecondCatch} =
          <strong>{formatNumber(estimatedSize)}</strong>
        </p>
      {:else}
        <p>None of the second catch were marked, so the formula would divide by zero. Take a bigger second catch.</p>
      {/if}
      {#if earlierEstimates.length > 0}
        <p class="earlier">Earlier estimates for this pond: {earlierEstimates.map((estimate) => formatNumber(estimate)).join(', ')}</p>
      {/if}
      <button class="btn" aria-pressed={trueSizeRevealed} onclick={() => (trueSizeRevealed = !trueSizeRevealed)}>
        {trueSizeRevealed ? `The pond really has ${fish.length} fish` : 'Show the true number'}
      </button>
    {/if}
  </div>
</figure>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .pond {
    fill: color-mix(in srgb, var(--prey) 7%, var(--paper-raised));
    stroke: color-mix(in srgb, var(--prey) 35%, transparent);
    stroke-width: 2;
  }

  circle {
    fill: var(--ink-soft);
    opacity: 0.4;
    transition: r 200ms ease-out;
  }

  circle.marked {
    fill: var(--prey);
    opacity: 1;
  }

  circle.caught {
    stroke: var(--predator);
    stroke-width: 2.5;
    opacity: 1;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.4rem;
    margin-top: 0.6rem;
    color: var(--ink-soft);
  }

  .swatch {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    margin-right: 0.4rem;
    vertical-align: -0.05rem;
  }

  .swatch.unmarked {
    background: var(--ink-soft);
    opacity: 0.5;
  }

  .swatch.marked {
    background: var(--prey);
  }

  .swatch.caught {
    border: 2.5px solid var(--predator);
  }

  .steps {
    margin-top: 1.1rem;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .result {
    margin-top: 1rem;
    min-height: 5.5rem;
  }

  .result p {
    margin: 0 0 0.6rem;
  }

  .estimate {
    font-size: 1.1rem;
    font-variant-numeric: tabular-nums;
  }

  .earlier {
    color: var(--ink-soft);
  }
</style>
