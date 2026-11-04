import type { AicArtwork } from './aic.ts';
import { normalize } from './text.ts';

export interface PilotPainterConfig {
  /** Nombre d'œuvres à retenir pour ce peintre dans le lot pilote. */
  count: number;
  /** Fragments de titres à privilégier (indications souples : sans effet si rien ne correspond). */
  titleHints: string[];
}
export type PilotConfig = Record<string, PilotPainterConfig>;

export interface Candidate {
  objectId: string;
  title: string;
  dateDisplay: string;
  year: number;
  imageId: string;
  score: number;
  hinted: boolean;
}

export interface Range {
  from: number;
  to: number;
}

export const IMPRESSIONIST_RANGE: Range = { from: 1860, to: 1915 };

export function artistMatches(artistTitle: string | null | undefined, painterName: string): boolean {
  if (!artistTitle) return false;
  return normalize(artistTitle).includes(normalize(painterName));
}

/** Une œuvre utilisable : domaine public, image, tableau, bon artiste, bonne période. */
export function isUsable(a: AicArtwork, painterName: string, range: Range = IMPRESSIONIST_RANGE): boolean {
  if (a.is_public_domain !== true) return false;
  if (!a.image_id) return false;
  if (a.artwork_type_title !== 'Painting') return false;
  if (!artistMatches(a.artist_title, painterName)) return false;
  const year = a.date_start ?? a.date_end;
  return typeof year === 'number' && year >= range.from && year <= range.to;
}

export function toCandidate(a: AicArtwork, hints: string[]): Candidate | null {
  const year = a.date_start ?? a.date_end;
  if (!a.image_id || typeof year !== 'number') return null;
  const title = normalize(a.title);
  const hinted = hints.some((h) => title.includes(normalize(h)));
  // Aucun indicateur de notoriété fiable côté musée : on combine ce qu'il expose
  // (mise en avant, exposition en salle) et nos indications de titres.
  const score = (hinted ? 100 : 0) + (a.is_boosted ? 20 : 0) + (a.is_on_view ? 10 : 0);
  return {
    objectId: String(a.id),
    title: a.title,
    dateDisplay: a.date_display ?? String(year),
    year,
    imageId: a.image_id,
    score,
    hinted
  };
}

/** Candidats triés (meilleur score d'abord, ordre de pertinence du musée à égalité), titres uniques. */
export function rankCandidates(
  artworks: AicArtwork[],
  painterName: string,
  hints: string[],
  range: Range = IMPRESSIONIST_RANGE
): Candidate[] {
  const seenTitles = new Set<string>();
  const ranked: Array<Candidate & { order: number }> = [];
  artworks.forEach((a, order) => {
    if (!isUsable(a, painterName, range)) return;
    const key = normalize(a.title);
    if (seenTitles.has(key)) return;
    const c = toCandidate(a, hints);
    if (!c) return;
    seenTitles.add(key);
    ranked.push({ ...c, order });
  });
  ranked.sort((a, b) => b.score - a.score || a.order - b.order);
  return ranked.map(({ order: _order, ...c }) => c);
}
