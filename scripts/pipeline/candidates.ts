/**
 * Étape 1 du pipeline : proposer des œuvres.
 *
 *   pnpm pipeline:candidates            # écrit selection.json s'il n'existe pas
 *   pnpm pipeline:candidates --force    # le réécrit
 *
 * Interroge l'API publique de l'Art Institute of Chicago (accès internet requis),
 * ne garde que des tableaux du domaine public avec image, puis propose les
 * meilleurs candidats par peintre. La liste complète est écrite dans
 * scripts/pipeline/.cache/candidates.json pour pouvoir choisir autrement.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DIR, loadCatalog } from '@musee/catalog/node';
import { artworkPageUrl, createAicClient } from './lib/aic.ts';
import { rankCandidates, type PilotConfig } from './lib/candidates.ts';
import type { SelectionEntry } from './lib/compose.ts';
import { guessGenre } from './lib/genre.ts';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(here, '.cache');
const SELECTION_PATH = join(DATA_DIR, 'selection.json');
const force = process.argv.includes('--force');

if (existsSync(SELECTION_PATH) && !force) {
  console.error(
    `selection.json existe déjà (${SELECTION_PATH}).\n` +
      `Relancez avec --force pour le régénérer, ou passez directement à « pnpm pipeline:build ».`
  );
  process.exit(1);
}

const catalog = await loadCatalog();
if (!catalog.ok) {
  console.error('Catalogue invalide :\n' + catalog.errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
const pilot = JSON.parse(await readFile(join(here, 'pilot.json'), 'utf8')) as PilotConfig & { _comment?: string };

const client = createAicClient();
const selection: SelectionEntry[] = [];
const allCandidates: Record<string, unknown[]> = {};

try {
  for (const painter of catalog.catalog.painters) {
    const config = pilot[painter.id];
    if (!config) continue;

    process.stdout.write(`${painter.name} … `);
    const artworks = await client.searchByArtist(painter.name, 100);
    const ranked = rankCandidates(artworks, painter.name, config.titleHints);
    allCandidates[painter.id] = ranked.slice(0, 40).map((c) => ({ ...c, url: artworkPageUrl(c.objectId) }));
    console.log(`${ranked.length} candidat(s) utilisable(s)`);

    if (ranked.length < config.count) {
      console.warn(`  ⚠ seulement ${ranked.length} sur ${config.count} demandés pour ${painter.name}`);
    }
    for (const c of ranked.slice(0, config.count)) {
      const source = artworks.find((a) => String(a.id) === c.objectId);
      selection.push({
        painterId: painter.id,
        museum: 'aic',
        objectId: c.objectId,
        title: c.title,
        date: c.dateDisplay,
        genre: guessGenre(c.title, source?.subject_titles ?? [])
      });
    }
  }
} catch (error) {
  console.error(
    `\nÉchec de l'interrogation du musée : ${error instanceof Error ? error.message : String(error)}\n` +
      `Ce script doit tourner sur une machine avec accès internet (api.artic.edu).`
  );
  process.exit(1);
}

await mkdir(CACHE_DIR, { recursive: true });
await writeFile(join(CACHE_DIR, 'candidates.json'), JSON.stringify(allCandidates, null, 2) + '\n');
await writeFile(SELECTION_PATH, JSON.stringify(selection, null, 2) + '\n');

console.log(`
${selection.length} œuvre(s) proposée(s) → packages/catalog/data/selection.json
À faire maintenant :
  1. Ouvrir selection.json et, pour chaque entrée, vérifier l'œuvre (lien : artic.edu/artworks/<objectId>),
     corriger « genre » si besoin, ajouter « titleFr » (titre français), ajuster « rarity » (sinon : celle du peintre).
  2. Pour changer d'œuvre, piocher dans scripts/pipeline/.cache/candidates.json.
  3. Lancer : pnpm pipeline:build
`);
