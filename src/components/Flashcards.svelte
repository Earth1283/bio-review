<script lang="ts">
  import { onMount } from 'svelte';
  import { readSavedJson, saveJson } from '../lib/progress';

  type Card = { front: string; back: string };

  let { deck, cards }: { deck: string; cards: Card[] } = $props();

  const knownCardsKey = `carrying-capacity:flashcards:${deck}`;

  let knownFronts = $state<string[]>([]);
  let onlyUnknownCards = $state(false);
  let position = $state(0);
  let answerShown = $state(false);

  onMount(() => {
    knownFronts = readSavedJson<string[]>(knownCardsKey, []);
  });

  const visibleCards = $derived(onlyUnknownCards ? cards.filter((card) => !knownFronts.includes(card.front)) : cards);
  const currentCard = $derived(visibleCards[Math.min(position, visibleCards.length - 1)]);
  const knownCount = $derived(cards.filter((card) => knownFronts.includes(card.front)).length);

  function goTo(newPosition: number) {
    position = (newPosition + visibleCards.length) % visibleCards.length;
    answerShown = false;
  }

  function recordAnswer(knewIt: boolean) {
    const front = currentCard.front;
    knownFronts = knewIt ? [...new Set([...knownFronts, front])] : knownFronts.filter((f) => f !== front);
    saveJson(knownCardsKey, knownFronts);
    if (onlyUnknownCards && knewIt) {
      answerShown = false;
      position = Math.min(position, Math.max(visibleCards.length - 1, 0));
    } else {
      goTo(position + 1);
    }
  }

  function toggleOnlyUnknownCards() {
    onlyUnknownCards = !onlyUnknownCards;
    position = 0;
    answerShown = false;
  }
</script>

<section class="widget flashcards" aria-label="Flashcards">
  <div class="topline">
    <span>{knownCount} of {cards.length} known</span>
    <button class="btn" aria-pressed={onlyUnknownCards} onclick={toggleOnlyUnknownCards}>Only cards I don't know yet</button>
  </div>

  {#if currentCard}
    <button class="card" class:flipped={answerShown} onclick={() => (answerShown = !answerShown)} aria-live="polite">
      <span class="face">
        {#if answerShown}
          <span class="answer">{currentCard.back}</span>
        {:else}
          <span class="question">{currentCard.front}</span>
        {/if}
      </span>
      <span class="hint">{answerShown ? 'Tap to see the question' : 'Tap to see the answer'}</span>
    </button>

    <div class="actions">
      <button class="btn" onclick={() => goTo(position - 1)} aria-label="Previous card">Back</button>
      <span class="count">Card {Math.min(position, visibleCards.length - 1) + 1} of {visibleCards.length}</span>
      <div class="btn-row">
        <button class="btn" onclick={() => recordAnswer(false)}>Still learning</button>
        <button class="btn knew-it" onclick={() => recordAnswer(true)}>I knew it</button>
      </div>
    </div>
  {:else}
    <p class="all-known">You know every card in this deck. Turn off the filter to go through them again.</p>
  {/if}
</section>

<style>
  .flashcards {
    margin: 1.6rem 0 2.4rem;
  }

  .topline {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    color: var(--ink-soft);
    margin-bottom: 0.9rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    min-height: 12rem;
    padding: 1.4rem 1.5rem 1rem;
    text-align: left;
    font: inherit;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 150ms ease-out;
  }

  .card:hover {
    border-color: var(--ink-soft);
  }

  .flipped {
    border-color: var(--prey);
    box-shadow: inset 4px 0 0 var(--prey);
  }

  .question {
    font-family: var(--serif);
    font-size: 1.3rem;
    font-weight: 600;
    line-height: 1.35;
  }

  .answer {
    font-family: var(--serif);
    font-size: 1.1rem;
    line-height: 1.55;
  }

  .face {
    display: block;
    animation: settle 220ms ease-out;
  }

  .flipped .face {
    animation-name: settle-again;
  }

  .hint {
    color: var(--ink-soft);
    font-size: 0.85rem;
    margin-top: 1rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-top: 0.9rem;
  }

  .count {
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  .knew-it {
    border-color: var(--prey);
    color: var(--prey);
  }

  .all-known {
    margin: 1rem 0;
  }

  @keyframes settle {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }

  @keyframes settle-again {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }
</style>
