import type { Catalog, Work } from '@musee/catalog';
import { artistMatches } from './candidates.ts';
import type { AicArtwork } from './aic.ts';
import { assignCareerOrder, composeWork, workId, type SelectionEntry } from './compose.ts';
import type { ProcessedImage } from './images.ts';

export interface BuildDeps {
  /** Récupère les métadonnées officielles d'une œuvre. */
  getArtwork(id: string): Promise<AicArtwork>;
  /** Télécharge puis traite l'image (téléchargement, redimensionnement, miniature). */
  processImage(artwork: AicArtwork, workIdHint: string): Promise<ProcessedImage>;
}

export interface BuildResult {
  works: Work[];
  warnings: string[];
}

/**
 * Transforme une sélection relue à la main en œuvres complètes.
 * Toutes les vérifications de fond (licence, artiste, image) sont ici.
 */
export async function buildWorks(
  entries: SelectionEntry[],
  catalog: Pick<Catalog, 'painters' | 'traits'>,
  deps: BuildDeps
): Promise<BuildResult> {
  const warnings: string[] = [];
  const fetched: Array<{ entry: SelectionEntry; artwork: AicArtwork; year: number }> = [];

  for (const entry of entries) {
    const painter = catalog.painters.find((p) => p.id === entry.painterId);
    if (!painter) throw new Error(`Sélection : peintre inconnu « ${entry.painterId} »`);

    const artwork = await deps.getArtwork(entry.objectId);
    if (artwork.is_public_domain !== true) {
      throw new Error(`Objet ${artwork.id} (« ${artwork.title} ») : pas dans le domaine public — refusé.`);
    }
    if (!artwork.image_id) throw new Error(`Objet ${artwork.id} (« ${artwork.title} ») : aucune image.`);
    if (!artistMatches(artwork.artist_title, painter.name)) {
      throw new Error(
        `Objet ${artwork.id} : l'artiste du musée (« ${artwork.artist_title ?? '?'} ») ne correspond pas à « ${painter.name} ».`
      );
    }
    const year = artwork.date_start ?? artwork.date_end;
    if (typeof year !== 'number') throw new Error(`Objet ${artwork.id} : date inconnue.`);
    fetched.push({ entry, artwork, year });
  }

  // Rang de carrière : ordre chronologique, calculé peintre par peintre.
  const byPainter = new Map<string, typeof fetched>();
  for (const f of fetched) byPainter.set(f.entry.painterId, [...(byPainter.get(f.entry.painterId) ?? []), f]);

  const works: Work[] = [];
  for (const [painterId, items] of byPainter) {
    const painter = catalog.painters.find((p) => p.id === painterId)!;
    for (const item of assignCareerOrder(items)) {
      const image = await deps.processImage(item.artwork, workId(painter, item.artwork.title));
      const { work, warnings: w } = composeWork({
        entry: item.entry,
        painter,
        artwork: item.artwork,
        careerOrder: item.careerOrder,
        traits: catalog.traits,
        image
      });
      works.push(work);
      warnings.push(...w);
    }
  }

  works.sort((a, b) => a.painterId.localeCompare(b.painterId) || a.careerOrder - b.careerOrder);
  return { works, warnings };
}
