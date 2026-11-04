import type { Painter, Work, Trait } from '@musee/catalog';
import { buildCredit, artworkPageUrl, type AicArtwork } from './aic.ts';
import type { ProcessedImage } from './images.ts';
import { decadeId, slugify } from './text.ts';

/** Une ligne de sélection : ce que l'humain relit et corrige. */
export interface SelectionEntry {
  painterId: string;
  museum: 'aic';
  objectId: string;
  /** Indicatif, pour la relecture (le build relit les métadonnées auprès du musée). */
  title?: string;
  date?: string;
  /** Traduction française du titre ; sinon le titre du musée est repris et signalé. */
  titleFr?: string;
  genre: string;
  /** Rareté de l'œuvre ; par défaut celle du peintre. */
  rarity?: Work['rarity'];
}

export function workId(painter: Painter, title: string): string {
  const surname = painter.id.split('-').pop() ?? painter.id;
  return `${surname}-${slugify(title, 40)}`;
}

export interface ComposeInput {
  entry: SelectionEntry;
  painter: Painter;
  artwork: AicArtwork;
  image: ProcessedImage;
  careerOrder: number;
  traits: Trait[];
}

export function composeWork(input: ComposeInput): { work: Work; warnings: string[] } {
  const { entry, painter, artwork, image, careerOrder, traits } = input;
  const warnings: string[] = [];

  const year = artwork.date_start ?? artwork.date_end;
  if (typeof year !== 'number') throw new Error(`Œuvre ${artwork.id} : année inconnue`);

  const hasTrait = (kind: Trait['kind'], id: string) => traits.some((t) => t.kind === kind && t.id === id);
  const era = decadeId(year);
  if (!hasTrait('genre', entry.genre)) throw new Error(`Œuvre ${artwork.id} : genre inconnu « ${entry.genre} »`);
  if (!hasTrait('era', era)) throw new Error(`Œuvre ${artwork.id} : époque « ${era} » absente de traits.json`);

  if (!entry.titleFr) warnings.push(`« ${artwork.title} » : titre français à fournir (titre du musée repris).`);

  const work: Work = {
    id: workId(painter, artwork.title),
    painterId: painter.id,
    title: { fr: entry.titleFr ?? artwork.title, en: artwork.title },
    dateDisplay: artwork.date_display ?? String(year),
    year,
    rarity: entry.rarity ?? painter.rarity,
    careerOrder,
    traits: [
      { kind: 'movement', id: painter.styleId },
      { kind: 'genre', id: entry.genre },
      { kind: 'era', id: era }
    ],
    source: { museum: 'aic', objectId: String(artwork.id), url: artworkPageUrl(artwork.id) },
    license: { kind: 'CC0', credit: buildCredit(artwork) },
    image: {
      width: image.width,
      height: image.height,
      widths: image.widths,
      dominantColor: image.dominantColor,
      lqip: image.lqip
    },
    status: 'ready'
  };
  return { work, warnings };
}

/** Rang de carrière = ordre chronologique des œuvres retenues pour un peintre. */
export function assignCareerOrder<T extends { year: number }>(items: T[]): Array<T & { careerOrder: number }> {
  return [...items]
    .sort((a, b) => a.year - b.year)
    .map((item, index) => ({ ...item, careerOrder: index + 1 }));
}
