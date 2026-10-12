<script lang="ts">
  let {
    question,
    choices,
    answer,
    explanation,
  }: { question: string; choices: string[]; answer: number; explanation: string } = $props();

  const choiceGroupId = $props.id();
  let chosenIndex = $state<number | null>(null);
  const answeredCorrectly = $derived(chosenIndex === answer);
</script>

<fieldset class="widget quiz">
  <legend class="question">{question}</legend>
  <div class="choices">
    {#each choices as choice, index (index)}
      <label
        class="choice"
        class:correct={chosenIndex !== null && index === answer}
        class:wrong={chosenIndex === index && index !== answer}
      >
        <input type="radio" name={choiceGroupId} value={index} bind:group={chosenIndex} />
        <span>{choice}</span>
      </label>
    {/each}
  </div>
  {#if chosenIndex !== null}
    <p class="feedback" class:correct={answeredCorrectly} aria-live="polite">
      <strong>{answeredCorrectly ? 'Correct.' : `Not quite. The answer is: ${choices[answer]}`}</strong>
      {explanation}
    </p>
  {/if}
</fieldset>

<style>
  .quiz {
    margin: 1.6rem 0;
    min-width: 0;
  }

  .question {
    float: left;
    width: 100%;
    padding: 0;
    margin-bottom: 0.9rem;
    font-family: var(--serif);
    font-size: 1.12rem;
    font-weight: 600;
    line-height: 1.4;
  }

  .choices {
    clear: both;
    display: grid;
    gap: 0.45rem;
  }

  .choice {
    display: flex;
    gap: 0.7rem;
    align-items: baseline;
    padding: 0.55rem 0.8rem;
    border: 1px solid var(--rule);
    border-radius: 8px;
    cursor: pointer;
  }

  .choice:hover {
    border-color: var(--ink-soft);
  }

  .choice:has(input:focus-visible) {
    outline: 3px solid var(--prey);
    outline-offset: 2px;
  }

  input {
    accent-color: var(--prey);
  }

  .choice.correct {
    border-color: var(--prey);
    box-shadow: inset 4px 0 0 var(--prey);
  }

  .choice.wrong {
    border-color: var(--alarm);
    box-shadow: inset 4px 0 0 var(--alarm);
  }

  .feedback {
    margin: 0.9rem 0 0;
    padding-left: 0.9rem;
    border-left: 2px solid var(--alarm);
  }

  .feedback.correct {
    border-left-color: var(--prey);
  }
</style>
