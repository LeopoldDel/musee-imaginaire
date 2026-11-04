<script lang="ts">
  /**
   * Carte d'œuvre — un seul composant, trois tailles (thumb / card / detail).
   * La taille réelle vient du parent (largeur) ; tout le reste s'adapte via
   * des unités de conteneur. Aucun recadrage : le tableau est toujours entier,
   * posé sur un passe-partout.
   */
  import { t } from '#lib/i18n/index.ts';
  import { imageSources, IMAGE_SIZES } from './image.ts';
  import { lightFx } from './fx.ts';
  import PlaceholderArt from './PlaceholderArt.svelte';
  import type { CardData, CardSize } from './types.ts';

  let {
    data,
    size = 'card',
    interactive = size !== 'thumb',
    credit
  }: {
    data: CardData;
    size?: CardSize;
    /** Active la lumière qui suit le doigt et l'inclinaison (inutile sur les vignettes). */
    interactive?: boolean;
    /** Mention de crédit du musée, affichée en taille « detail ». */
    credit?: string;
  } = $props();

  const tiltMax = $derived(size === 'detail' ? 9 : 7);
  const sources = $derived(data.image ? imageSources(data.image) : undefined);
  const aspect = $derived(sources?.aspect ?? data.placeholderAspect ?? 1.33);
  const rarityLabel = $derived(t(`rarity.${data.rarity}`));
  const label = $derived(
    t('card.label', { title: data.title, artist: data.artist, rarity: rarityLabel })
  );
</script>

<article
  class="card"
  data-rarity={data.rarity}
  data-size={size}
  aria-label={label}
  use:lightFx={{ tilt: interactive ? tiltMax : 0, enabled: interactive }}
>
  <div class="tilt">
    <div class="face">
      <div class="mat">
        <figure class="art" style:--ar={aspect}>
          {#if data.image && sources}
            <picture>
              <source type="image/avif" srcset={sources.avifSrcset} sizes={IMAGE_SIZES[size]} />
              <source type="image/webp" srcset={sources.webpSrcset} sizes={IMAGE_SIZES[size]} />
              <img
                src={sources.src}
                width={data.image.width}
                height={data.image.height}
                alt={t('card.imageAlt', { title: data.title })}
                loading="lazy"
                decoding="async"
                style:background-color={data.image.dominantColor}
                style:background-image={data.image.lqip ? `url(${data.image.lqip})` : undefined}
              />
            </picture>
          {:else}
            <PlaceholderArt id={data.id} {aspect} />
          {/if}
        </figure>
      </div>

      <div class="meta">
        <h3 class="title">{data.title}</h3>
        {#if size !== 'thumb'}
          <p class="byline">{data.artist} · {data.date}</p>
          <ul class="traits">
            {#each data.traits as trait (trait.kind)}
              <li data-kind={trait.kind} title={t(`trait.${trait.kind}`)}>{trait.label}</li>
            {/each}
          </ul>
        {/if}
      </div>

      <footer class="foot">
        <span class="rarity"><i class="gem" aria-hidden="true"></i>{rarityLabel}</span>
        {#if data.edition && size !== 'thumb'}
          <span class="edition">{t('card.edition', data.edition)}</span>
        {/if}
      </footer>

      {#if size === 'detail' && credit}
        <p class="credit">{credit}</p>
      {/if}

      {#if data.rarity !== 'common'}
        <div class="sheen" aria-hidden="true"></div>
      {/if}
      {#if data.rarity === 'legendary'}
        <div class="foil" aria-hidden="true"></div>
        <div class="sweep" aria-hidden="true"></div>
      {/if}
    </div>
  </div>
</article>

<style>
  .card {
    --pad: 5cqw;
    container-type: inline-size;
    width: 100%;
    aspect-ratio: 5 / 7.5;
    perspective: 900px;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
  }
  .card[data-size='thumb'] {
    aspect-ratio: 4 / 5.4;
  }

  .tilt {
    width: 100%;
    height: 100%;
    transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
    transition: transform 0.6s var(--ease-out);
    transform-style: preserve-3d;
  }
  .card:global([data-active]) .tilt {
    transition: transform 0.08s linear;
  }

  /* ——— face de la carte ——— */
  .face {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3cqw;
    width: 100%;
    height: 100%;
    padding: var(--pad);
    border-radius: 6cqw;
    background: var(--card-bg);
    border: 1px solid var(--card-edge);
    box-shadow: var(--card-shadow);
    overflow: hidden;
    isolation: isolate;
  }
  .card[data-size='thumb'] .face {
    --pad: 6cqw;
    gap: 4cqw;
    border-radius: 8cqw;
  }

  /* ——— passe-partout et tableau ——— */
  .mat {
    flex: 1 1 0;
    min-height: 0;
    padding: 4cqw;
    background: var(--card-mat);
    border-radius: 3cqw;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 8%, transparent);
  }
  .card[data-size='thumb'] .mat {
    padding: 5cqw;
  }
  .art {
    container-type: size;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }
  .art :global(picture) {
    display: contents;
  }
  .art img {
    width: min(100cqw, calc(100cqh * var(--ar)));
    height: auto;
    aspect-ratio: var(--ar);
    background-size: cover;
    background-position: center;
  }
  /* le tableau « posé » sur le passe-partout */
  .art :global(.ph),
  .art img {
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 0.18),
      0 2px 8px rgb(0 0 0 / 0.22);
  }

  /* ——— textes ——— */
  .meta {
    display: grid;
    gap: 1.2cqw;
  }
  .title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(0.95rem, 7.4cqw, 1.75rem);
    line-height: 1.08;
    letter-spacing: -0.005em;
    text-wrap: balance;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card[data-size='thumb'] .title {
    font-size: clamp(0.78rem, 9cqw, 1rem);
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .byline {
    font-size: clamp(0.72rem, 4.4cqw, 0.95rem);
    color: var(--ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .traits {
    display: flex;
    flex-wrap: wrap;
    gap: 1.6cqw;
    margin-top: 1cqw;
  }
  .traits li {
    padding: 0.5cqw 2.6cqw;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: clamp(0.66rem, 3.7cqw, 0.82rem);
    line-height: 1.5;
    color: var(--ink-soft);
    background: color-mix(in srgb, var(--surface-sunken) 55%, transparent);
    white-space: nowrap;
  }

  /* ——— pied : rareté et exemplaire ——— */
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2cqw;
    padding-top: 2.2cqw;
    border-top: 1px solid var(--line);
    font-size: clamp(0.64rem, 3.5cqw, 0.8rem);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .card[data-size='thumb'] .foot {
    border-top: 0;
    padding-top: 0;
    font-size: clamp(0.58rem, 8cqw, 0.7rem);
  }
  .rarity {
    display: inline-flex;
    align-items: center;
    gap: 1.8cqw;
    font-weight: 600;
  }
  .edition {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    text-transform: none;
  }
  .credit {
    font-size: clamp(0.62rem, 3.1cqw, 0.74rem);
    line-height: 1.35;
    color: var(--ink-soft);
  }

  .gem {
    display: inline-block;
    width: 0.62em;
    height: 0.62em;
    background: var(--rarity-common);
    border-radius: 50%;
  }
  [data-rarity='rare'] .gem {
    background: var(--rarity-rare);
    border-radius: 0;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  }
  [data-rarity='legendary'] .gem {
    border-radius: 0;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    background: conic-gradient(#ff8ad8, #ffd36b, #7dffd0, #7db8ff, #c58bff, #ff8ad8);
  }

  /* ——— raretés ——— */
  /* commune : cadre sobre (aucun effet) */

  [data-rarity='rare'] .face {
    border-color: color-mix(in srgb, var(--rarity-rare) 70%, var(--card-edge));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--rarity-rare) 28%, transparent),
      var(--card-shadow);
  }
  [data-rarity='rare'] .foot {
    color: color-mix(in srgb, var(--rarity-rare) 70%, var(--ink));
  }

  [data-rarity='legendary'] .face {
    border-color: transparent;
    box-shadow: var(--card-shadow-lift);
  }
  [data-rarity='legendary'] .foot {
    color: var(--ink);
  }

  /* reflet qui suit le doigt (rare et légendaire) */
  .sheen {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.35s ease;
    background: radial-gradient(
      circle at var(--mx, 50%) var(--my, 30%),
      rgb(255 255 255 / 0.7) 0%,
      rgb(255 255 255 / 0.18) 30%,
      transparent 58%
    );
    mix-blend-mode: soft-light;
  }
  [data-rarity='rare'] .sheen {
    background: radial-gradient(
      circle at var(--mx, 50%) var(--my, 30%),
      color-mix(in srgb, var(--rarity-rare) 55%, white) 0%,
      transparent 52%
    );
    mix-blend-mode: soft-light;
  }
  .card:global([data-active]) .sheen {
    opacity: 1;
  }

  /* légendaire : feuille holographique sur le cadre uniquement */
  .foil {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    border-radius: inherit;
    padding: clamp(2px, 1.5cqw, 4px);
    background: linear-gradient(
      115deg,
      #ff8ad8,
      #ffd36b,
      #7dffd0,
      #7db8ff,
      #c58bff,
      #ff8ad8,
      #ffd36b
    );
    background-size: 320% 320%;
    background-position: calc(var(--px, 0.5) * 100%) calc(var(--py, 0.5) * 100%);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
    mask-composite: exclude;
    opacity: 0.92;
  }

  /* balayage unique à l'apparition, pour signaler la rareté sans tapage */
  .sweep {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(
      105deg,
      transparent 38%,
      rgb(255 255 255 / 0.55) 50%,
      transparent 62%
    );
    transform: translateX(-130%);
    mix-blend-mode: soft-light;
    animation: sweep 1.5s var(--ease-out) 0.5s 1 both;
  }
  @keyframes sweep {
    to {
      transform: translateX(130%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tilt {
      transition: none;
      transform: none;
    }
    .sweep {
      display: none;
    }
  }
</style>
