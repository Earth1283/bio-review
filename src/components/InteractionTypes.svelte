<script lang="ts">
  type Effect = '+' | '0' | '-';
  type Interaction = { name: string; summary: string; examples: string[]; note?: string };

  const effects: { value: Effect; label: string }[] = [
    { value: '+', label: 'Helped' },
    { value: '0', label: 'Unaffected' },
    { value: '-', label: 'Harmed' },
  ];

  // Keyed by the two effects sorted by character code, so (+, −) and (−, +) share an entry.
  const interactions: Record<string, Interaction> = {
    '++': {
      name: 'Mutualism',
      summary: 'Both species benefit.',
      examples: [
        'Flowering plants and their pollinators',
        'Mycorrhizal fungi and tree roots',
        'Nitrogen-fixing bacteria in legume root nodules',
        'Gut microbes and the animals that host them',
      ],
    },
    '+-': {
      name: 'Exploitation',
      summary: 'One species benefits at the expense of the other. This covers predation, herbivory, and parasitism.',
      examples: [
        'A lynx eating a snowshoe hare (predation)',
        'A caterpillar eating leaves (herbivory)',
        'A tapeworm living in a gut (parasitism)',
        'A wasp larva eating a caterpillar from the inside (parasitoid)',
      ],
    },
    '+0': {
      name: 'Commensalism',
      summary: 'One species benefits and the other is neither helped nor harmed.',
      examples: ['Epiphytic orchids growing on rainforest tree branches', 'A bird nesting in a tree'],
      note: 'True commensalism is hard to prove, because the "unaffected" species is often affected a little.',
    },
    '--': {
      name: 'Competition',
      summary: 'Both species are harmed because they use the same limited resource.',
      examples: [
        'Two plants shading each other from the same light',
        'Two Paramecium species fed the same bacteria in one test tube',
        'Lions and hyenas fighting over a carcass',
      ],
    },
    '-0': {
      name: 'Amensalism',
      summary: 'One species is harmed and the other is unaffected.',
      examples: ['A large animal trampling grass as it walks by'],
      note: 'Rare, and usually not listed as a main interaction type. Many apparent cases turn out to help the harmer a little.',
    },
    '00': {
      name: 'Neutral',
      summary: 'Neither species affects the other.',
      examples: ['A desert cactus and a deep-sea fish'],
      note: 'Almost impossible to show inside one connected community, because nearly everything affects everything else indirectly.',
    },
  };

  const symbolFor = (effect: Effect) => (effect === '-' ? '−' : effect);

  let effectOnA = $state<Effect>('-');
  let effectOnB = $state<Effect>('-');

  const interaction = $derived(interactions[[effectOnA, effectOnB].sort().join('')]);
</script>

<figure class="widget interaction-types">
  <div class="pickers">
    <div class="picker">
      <p class="picker-label" id="effect-a-label">Effect on species A</p>
      <div class="btn-row" role="group" aria-labelledby="effect-a-label">
        {#each effects as effect (effect.value)}
          <button class="btn" aria-pressed={effectOnA === effect.value} onclick={() => (effectOnA = effect.value)}>
            {effect.label}
          </button>
        {/each}
      </div>
    </div>
    <div class="picker">
      <p class="picker-label" id="effect-b-label">Effect on species B</p>
      <div class="btn-row" role="group" aria-labelledby="effect-b-label">
        {#each effects as effect (effect.value)}
          <button class="btn" aria-pressed={effectOnB === effect.value} onclick={() => (effectOnB = effect.value)}>
            {effect.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="result" aria-live="polite">
    <p class="signs" aria-label="Effect on A and B">
      <span class="sign" class:good={effectOnA === '+'} class:bad={effectOnA === '-'}>A {symbolFor(effectOnA)}</span>
      <span class="sign" class:good={effectOnB === '+'} class:bad={effectOnB === '-'}>B {symbolFor(effectOnB)}</span>
    </p>
    <div>
      <p class="name">{interaction.name}</p>
      <p class="summary">{interaction.summary}</p>
      <ul>
        {#each interaction.examples as example (example)}
          <li>{example}</li>
        {/each}
      </ul>
      {#if interaction.note}
        <p class="note">{interaction.note}</p>
      {/if}
    </div>
  </div>
</figure>

<style>
  .pickers {
    display: grid;
    gap: 1rem 2rem;
  }

  @media (min-width: 640px) {
    .pickers {
      grid-template-columns: 1fr 1fr;
    }
  }

  .picker-label {
    font-weight: 600;
    margin: 0 0 0.4rem;
  }

  .result {
    display: grid;
    gap: 1rem 1.6rem;
    align-items: start;
    margin-top: 1.4rem;
    padding-top: 1.2rem;
    border-top: 1px solid var(--rule);
  }

  @media (min-width: 640px) {
    .result {
      grid-template-columns: auto 1fr;
    }
  }

  .signs {
    display: flex;
    gap: 0.6rem;
    margin: 0;
  }

  .sign {
    min-width: 4.6rem;
    text-align: center;
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    border: 1px solid var(--rule);
    font-size: 1.5rem;
    font-weight: 600;
    font-variant-numeric: lining-nums;
    color: var(--ink-soft);
  }

  .sign.good {
    color: var(--prey);
    border-color: var(--prey);
  }

  .sign.bad {
    color: var(--predator);
    border-color: var(--predator);
  }

  .name {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 0.2rem;
  }

  .summary {
    margin: 0 0 0.7rem;
  }

  ul {
    margin: 0 0 0.7rem;
    padding-left: 1.2rem;
  }

  .note {
    color: var(--ink-soft);
    margin: 0;
  }
</style>
