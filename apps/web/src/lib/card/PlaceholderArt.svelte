<script lang="ts">
  /**
   * Tableau fictif en dégradés « peints », déterministe selon l'identifiant.
   * Sert uniquement tant que les vraies images (domaine public) ne sont pas
   * produites par le pipeline ; la mention « Image provisoire » est toujours visible.
   */
  import { t } from '#lib/i18n/index.ts';

  let { id, aspect = 1.33 }: { id: string; aspect?: number } = $props();

  // Palettes douces inspirées de l'impressionnisme : ciel, eau, feuillage, lumière.
  const PALETTES = [
    ['#bcd6e6', '#7fa7c4', '#e8d9a8', '#9fc1a0', '#f0c9c0'],
    ['#d7e3c9', '#8fb58a', '#f3e1a4', '#8aa9c9', '#e7b8b0'],
    ['#e9d3d6', '#b49bc8', '#f4e3b2', '#86b3c4', '#a6c7a0'],
    ['#f1dfb8', '#d99a73', '#9ab9cf', '#b7cfa4', '#c9a6c4'],
    ['#c9dbe6', '#9bb8a9', '#e6c7a0', '#8c9fc7', '#f0dcdc']
  ] as const;

  function hash(text: string): number {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const style = $derived.by(() => {
    const h = hash(id);
    const p = PALETTES[h % PALETTES.length]!;
    const pos = (shift: number, mod: number) => (((h >>> shift) % mod) + 10) % 100;
    return [
      `--ar:${aspect}`,
      `--c1:${p[0]}`,
      `--c2:${p[1]}`,
      `--c3:${p[2]}`,
      `--c4:${p[3]}`,
      `--c5:${p[4]}`,
      `--x1:${pos(0, 40)}%`,
      `--y1:${pos(5, 35)}%`,
      `--x2:${60 + pos(9, 30)}%`,
      `--y2:${pos(13, 45)}%`,
      `--x3:${pos(17, 60)}%`,
      `--y3:${70 + (pos(21, 25) % 25)}%`
    ].join(';');
  });
</script>

<div class="ph" {style} role="img" aria-label={t('card.placeholder')}>
  <span class="label">{t('card.placeholder')}</span>
</div>

<style>
  .ph {
    position: relative;
    width: min(100cqw, calc(100cqh * var(--ar)));
    aspect-ratio: var(--ar);
    background:
      radial-gradient(ellipse 60% 50% at var(--x1) var(--y1), var(--c3) 0%, transparent 70%),
      radial-gradient(ellipse 55% 45% at var(--x2) var(--y2), var(--c1) 0%, transparent 70%),
      radial-gradient(ellipse 70% 40% at var(--x3) var(--y3), var(--c4) 0%, transparent 72%),
      radial-gradient(ellipse 40% 30% at 50% 55%, var(--c5) 0%, transparent 75%),
      linear-gradient(170deg, var(--c1), var(--c2) 70%);
    overflow: hidden;
  }

  /* touches de pinceau : fines hachures obliques très légères */
  .ph::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(112deg, rgb(255 255 255 / 0.07) 0 2px, transparent 2px 9px),
      repeating-linear-gradient(68deg, rgb(0 0 0 / 0.035) 0 1px, transparent 1px 11px);
    mix-blend-mode: soft-light;
  }

  .label {
    position: absolute;
    left: 0.4rem;
    bottom: 0.35rem;
    z-index: 1;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.72);
    color: #4a443a;
    font: 500 0.625rem / 1.3 var(--font-ui);
    letter-spacing: 0.02em;
  }

  @container (max-width: 140px) {
    .label {
      display: none;
    }
  }
</style>
