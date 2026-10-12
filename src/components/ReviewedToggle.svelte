<script lang="ts">
  import { onMount } from 'svelte';
  import { readReviewedUnitIds, setUnitReviewed } from '../lib/progress';

  let { unitId }: { unitId: string } = $props();
  let reviewed = $state(false);

  onMount(() => {
    reviewed = readReviewedUnitIds().has(unitId);
  });

  function toggleReviewed() {
    reviewed = !reviewed;
    setUnitReviewed(unitId, reviewed);
  }
</script>

<button class="reviewed-toggle" class:reviewed aria-pressed={reviewed} onclick={toggleReviewed}>
  <span class="box" aria-hidden="true">{reviewed ? '✓' : ''}</span>
  {reviewed ? 'Reviewed' : 'Mark this unit as reviewed'}
</button>

<style>
  .reviewed-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    font-family: var(--sans);
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--ink);
    background: var(--paper-raised);
    border: 1px solid var(--rule);
    border-radius: 999px;
    padding: 0.6rem 1.3rem 0.6rem 0.7rem;
    cursor: pointer;
  }

  .box {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--ink-soft);
    border-radius: 50%;
    font-size: 0.9rem;
    transition:
      background 150ms ease-out,
      border-color 150ms ease-out;
  }

  .reviewed {
    border-color: var(--prey);
  }

  .reviewed .box {
    background: var(--prey);
    border-color: var(--prey);
    color: var(--paper-raised);
  }
</style>
