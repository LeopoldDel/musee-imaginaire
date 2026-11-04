import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalog, type RawCatalog, type ValidationResult } from './validate.ts';

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

async function readJson(name: string): Promise<unknown> {
  return JSON.parse(await readFile(join(DATA_DIR, name), 'utf8'));
}

export async function loadRawCatalog(): Promise<RawCatalog> {
  const [styles, painters, traits, works] = await Promise.all([
    readJson('styles.json'),
    readJson('painters.json'),
    readJson('traits.json'),
    readJson('works.json')
  ]);
  return { styles, painters, traits, works };
}

export async function loadCatalog(): Promise<ValidationResult> {
  return validateCatalog(await loadRawCatalog());
}
