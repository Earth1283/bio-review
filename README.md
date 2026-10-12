# Carrying Capacity

An interactive population ecology review, published at https://earth1283.github.io/bio-review/.

Six units, following the usual intro-biology sequence:

1. Density, dispersion, and demographics
2. Exponential growth
3. Logistic growth
4. Life history traits
5. Density-dependent regulation
6. The human population

## Running it locally

```sh
npm install
npm run dev
```

Then open http://localhost:4321/bio-review/.

## Writing a unit

Units are MDX files in `src/content/units/`. Each needs this frontmatter:

```yaml
---
title: Logistic growth
order: 3
summary: One sentence saying what the unit lets you explain.
---
```

Math uses KaTeX: `$inline$` and `$$display$$`.

Components you can drop into a unit:

| Component | Use |
| --- | --- |
| `<Aside>` | Margin note beside the next paragraph (inline on phones) |
| `<NoCalculus>` | The big red "I did not learn calculus" button. Put it after any equation with `dN/dt` and write the arithmetic version inside. |
| `<Flashcards deck="unique-id" cards={[{ front, back }]} />` | Flip cards; known cards are remembered per browser |
| `<Quiz question choices answer explanation />` | One multiple-choice question; `answer` is the zero-based index |
| `<GrowthModel model="exponential" \| "logistic" />` | Growth curve with sliders |
| `<MarkRecapture />`, `<Dispersion />`, `<Survivorship />`, `<DensityDependence />`, `<PredatorPrey />`, `<AgePyramid />` | The unit-specific simulations |

Svelte components need a `client:visible` directive to be interactive. Wrap figures in `<div class="wide">` to let them extend into the margin on wide screens.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. In the repository settings, under **Pages**, set **Source** to **GitHub Actions** once.
