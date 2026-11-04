/**
 * Étape 2 du pipeline : fabriquer les œuvres.
 *
 *   pnpm pipeline:build
 *
 * Pour chaque entrée de selection.json : relit les métadonnées officielles,
 * refuse tout ce qui n'est pas du domaine public, télécharge l'image, produit
 * les variantes (WebP/AVIF), la miniature floue et la couleur dominante, puis
 * écrit works.json après validation complète du catalogue.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as v from 'valibot';
import { DATA_DIR, loadCatalog, loadRawCatalog } from '@musee/catalog/node';
import { validateCatalog } from '@musee/catalog';
import { createAicClient } from './lib/aic.ts';
import { buildWorks } from './lib/build-works.ts';
import { processImage } from './lib/images.ts';
import { SelectionSchema } from './lib/selection.ts';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(here, '.cache', 'originals');
const OUT_DIR = join(here, '..', '..', 'apps', 'web', 'static', 'art');
const SELECTION_PATH = join(DATA_DIR, 'selection.json');

if (!existsSync(SELECTION_PATH)) {
  console.error('selection.json introuvable : lancez d\'abord « pnpm pipeline:candidates ».');
  process.exit(1);
}

const base = await loadCatalog();
if (!base.ok) {
  console.error('Catalogue invalide :\n' + base.errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}

const parsed = v.safeParse(SelectionSchema, JSON.parse(await readFile(SELECTION_PATH, 'utf8')));
if (!parsed.success) {
  console.error('selection.json invalide :\n' + parsed.issues.map((i) => `  ✗ ${i.message}`).join('\n'));
  process.exit(1);
}

await mkdir(CACHE_DIR, { recursive: true });
const client = createAicClient();

try {
  const { works, warnings } = await buildWorks(parsed.output, base.catalog, {
    getArtwork: (id) => client.getArtwork(id),
    async processImage(artwork, workId) {
      const cached = join(CACHE_DIR, `${artwork.id}.jpg`);
      let original: Buffer;
      if (existsSync(cached)) {
        original = await readFile(cached);
      } else {
        console.log(`  ↓ ${artwork.title}`);
        original = await client.downloadImage(artwork.image_id!);
        await writeFile(cached, original);
      }
      return processImage(original, workId, OUT_DIR);
    }
  });

  const raw = await loadRawCatalog();
  const check = validateCatalog({ ...raw, works });
  if (!check.ok) {
    console.error('Le catalogue produit est invalide :\n' + check.errors.map((e) => `  ✗ ${e}`).join('\n'));
    process.exit(1);
  }

  await writeFile(join(DATA_DIR, 'works.json'), JSON.stringify(works, null, 2) + '\n');
  console.log(`\n${works.length} œuvre(s) écrite(s) dans works.json, images dans apps/web/static/art/.`);
  for (const w of [...warnings, ...check.warnings]) console.warn(`  ⚠ ${w}`);
  console.log('\nÉtape suivante : pnpm validate && pnpm dev');
} catch (error) {
  console.error(`\nÉchec : ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
