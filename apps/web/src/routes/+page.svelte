<script lang="ts">
  import Card from '#lib/card/Card.svelte';
  import ThemeToggle from '#lib/components/ThemeToggle.svelte';
  import { APP_NAME } from '#lib/config.ts';
  import { DEMO_ALL, DEMO_COMMON, DEMO_LEGENDARY, DEMO_RARE } from '#lib/demo/works.ts';
  import { t } from '#lib/i18n/index.ts';
</script>

<svelte:head>
  <title>{t('app.pageTitle', { appName: APP_NAME })}</title>
  <meta name="description" content={t('app.tagline')} />
</svelte:head>

<header class="top">
  <div>
    <h1>{APP_NAME}</h1>
    <p class="tagline">{t('app.tagline')}</p>
  </div>
  <ThemeToggle />
</header>

<main>
  <section class="hero" aria-labelledby="hero-title">
    <h2 id="hero-title">{t('gallery.heroTitle')}</h2>
    <p class="hint">{t('gallery.heroHint')}</p>
    <div class="hero-card">
      <Card data={DEMO_LEGENDARY} size="detail" credit="Image provisoire — crédit du musée affiché ici." />
    </div>
  </section>

  <section aria-labelledby="rare-title">
    <h2 id="rare-title">{t('gallery.rareTitle')}</h2>
    <ul class="rail">
      {#each DEMO_RARE as card (card.id)}
        <li><Card data={card} /></li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="common-title">
    <h2 id="common-title">{t('gallery.commonTitle')}</h2>
    <ul class="rail">
      {#each DEMO_COMMON as card (card.id)}
        <li><Card data={card} /></li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="thumbs-title">
    <h2 id="thumbs-title">{t('gallery.thumbsTitle')}</h2>
    <p class="hint">{t('gallery.thumbsHint')}</p>
    <ul class="thumbs">
      {#each DEMO_ALL as card (card.id)}
        <li><Card data={card} size="thumb" /></li>
      {/each}
    </ul>
  </section>

  <p class="notice">{t('gallery.demoNotice')}</p>
</main>

<style>
  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-5) var(--gutter) var(--space-3);
    max-width: 64rem;
    margin-inline: auto;
  }
  h1 {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.75rem, 8vw, 2.75rem);
    line-height: 1.05;
    letter-spacing: -0.01em;
  }
  .tagline {
    margin-top: var(--space-2);
    color: var(--ink-soft);
    font-size: 0.9375rem;
    max-width: 28ch;
  }

  main {
    display: grid;
    /* minmax(0, …) : sans cela les rangées défilantes élargissent la colonne au-delà de l'écran */
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-7);
    padding: var(--space-5) 0 var(--space-7);
    max-width: 64rem;
    margin-inline: auto;
  }
  section > h2,
  .hint {
    padding-inline: var(--gutter);
  }
  h2 {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.5rem;
    line-height: 1.15;
  }
  .hint {
    margin-top: var(--space-1);
    color: var(--ink-soft);
    font-size: 0.875rem;
  }

  .hero-card {
    width: min(100% - 2 * var(--gutter), 22rem);
    margin: var(--space-5) auto 0;
  }

  /* rangée défilante à accroche : on voit toujours le début de la carte suivante */
  .rail {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-4);
    padding: var(--space-2) var(--gutter) var(--space-5);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--gutter);
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }
  .rail::-webkit-scrollbar {
    display: none;
  }
  .rail li {
    flex: 0 0 clamp(14rem, 64vw, 17.5rem);
    scroll-snap-align: start;
  }

  .thumbs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
    margin-top: var(--space-4);
    padding-inline: var(--gutter);
  }
  @media (min-width: 40rem) {
    .thumbs {
      grid-template-columns: repeat(5, 1fr);
    }
    .rail {
      flex-wrap: wrap;
      overflow: visible;
    }
  }

  .notice {
    margin-inline: var(--gutter);
    padding: var(--space-3) var(--space-4);
    border: 1px dashed var(--line);
    border-radius: var(--radius-m);
    color: var(--ink-soft);
    font-size: 0.8125rem;
  }
</style>
