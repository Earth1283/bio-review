<script lang="ts">
  const species = [
    { name: 'Species A', color: 'var(--prey)' },
    { name: 'Species B', color: 'var(--predator)' },
    { name: 'Species C', color: 'var(--third)' },
    { name: 'Species D', color: 'var(--ink-soft)' },
  ];

  const presets: { name: string; counts: number[] }[] = [
    { name: 'Evenly spread', counts: [25, 25, 25, 25] },
    { name: 'One dominant species', counts: [85, 5, 5, 5] },
    { name: 'Two species lost', counts: [50, 50, 0, 0] },
  ];

  let counts = $state([25, 25, 25, 25]);

  const total = $derived(counts.reduce((sum, count) => sum + count, 0));
  const richness = $derived(counts.filter((count) => count > 0).length);
  const proportions = $derived(counts.map((count) => (total === 0 ? 0 : count / total)));
  const shannon = $derived(-proportions.reduce((sum, p) => (p > 0 ? sum + p * Math.log(p) : sum), 0));
  const evenness = $derived(richness > 1 ? shannon / Math.log(richness) : null);

  const evennessVerdict = $derived.by(() => {
    if (evenness === null) return '';
    if (evenness > 0.9) return 'Individuals are spread almost equally across the species.';
    if (evenness > 0.6) return 'A few species have more individuals than the rest.';
    return 'One or two species make up most of the community.';
  });
</script>

<figure class="widget diversity">
  <div class="btn-row" role="group" aria-label="Example communities">
    {#each presets as preset (preset.name)}
      <button class="btn" aria-pressed={counts.every((count, i) => count === preset.counts[i])} onclick={() => (counts = [...preset.counts])}>
        {preset.name}
      </button>
    {/each}
  </div>

  <div class="bar" role="img" aria-label="Relative abundance of each species">
    {#each species as sp, i (sp.name)}
      <span style="width: {proportions[i] * 100}%; background: {sp.color}"></span>
    {/each}
  </div>

  <div class="controls">
    {#each species as sp, i (sp.name)}
      <div class="control">
        <label for="abundance-{i}">
          <span><span class="swatch" style="background: {sp.color}"></span>{sp.name}</span>
          <output>{counts[i]}</output>
        </label>
        <input id="abundance-{i}" type="range" min="0" max="100" step="1" bind:value={counts[i]} />
      </div>
    {/each}
  </div>

  <dl class="stats" aria-live="polite">
    <div>
      <dt>Species richness</dt>
      <dd>{richness}</dd>
      <small>how many species are present</small>
    </div>
    <div>
      <dt>Shannon index, H′</dt>
      <dd>{total === 0 ? '–' : shannon.toFixed(2)}</dd>
      <small>combines richness and evenness</small>
    </div>
    <div>
      <dt>Evenness</dt>
      <dd>{evenness === null ? '–' : evenness.toFixed(2)}</dd>
      <small>1.00 means perfectly even</small>
    </div>
  </dl>

  <p class="readout">
    {#if total === 0}
      There are no individuals yet. Slide at least one species above zero.
    {:else if richness === 1}
      Only one species is left, so there is no diversity to measure. H′ is 0.
    {:else}
      {evennessVerdict} With {richness} species, the highest H′ possible is {Math.log(richness).toFixed(2)}, and that only happens when
      every species has the same number of individuals.
    {/if}
  </p>
</figure>

<style>
  .bar {
    display: flex;
    height: 2.2rem;
    margin-top: 1rem;
    border-radius: 6px;
    overflow: hidden;
    background: var(--grid);
  }

  .bar span {
    display: block;
    height: 100%;
    transition: width 200ms ease-out;
  }

  .swatch {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 3px;
    margin-right: 0.45rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.8rem 1.6rem;
    margin: 1.2rem 0 0;
  }

  .stats div {
    margin: 0;
  }

  dt {
    font-weight: 500;
  }

  dd {
    margin: 0;
    font-family: var(--serif);
    font-size: 1.9rem;
    font-weight: 500;
    line-height: 1.2;
    font-variant-numeric: lining-nums tabular-nums;
  }

  small {
    color: var(--ink-soft);
  }

  .readout {
    margin: 1rem 0 0;
  }
</style>
