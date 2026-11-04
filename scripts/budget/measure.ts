import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

export interface FileSize {
  file: string;
  raw: number;
  gzip: number;
  brotli: number;
}

export interface PageReport {
  page: string;
  js: FileSize[];
  css: FileSize[];
  html: FileSize;
  jsGzip: number;
  jsBrotli: number;
  cssGzip: number;
}

export function sizeOf(path: string, label: string): FileSize {
  const buf = readFileSync(path);
  return {
    file: label,
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
  };
}

/** Fichiers JS/CSS référencés par une page (préchargements, imports dynamiques de démarrage, feuilles de style). */
export function referencedAssets(html: string): { js: string[]; css: string[] } {
  const find = (ext: string) =>
    [...new Set(html.match(new RegExp(`_app/immutable/[\\w\\-./]+\\.${ext}`, 'g')) ?? [])].sort();
  return { js: find('js'), css: find('css') };
}

/**
 * Mesure le « premier chargement » d'une page pré-rendue : son HTML, son CSS et tout le
 * JavaScript qu'elle charge ou précharge au démarrage. Les modules chargés plus tard à la
 * demande (import dynamique après interaction, ex. PixiJS) n'y figurent volontairement pas.
 */
export function measurePage(htmlPath: string, clientDir: string, pageLabel: string): PageReport {
  const html = readFileSync(htmlPath, 'utf8');
  const { js, css } = referencedAssets(html);
  const toSize = (ref: string) => {
    const path = join(clientDir, ref);
    try {
      statSync(path);
    } catch {
      throw new Error(`${pageLabel} : fichier référencé introuvable (${ref})`);
    }
    return sizeOf(path, ref);
  };
  const jsSizes = js.map(toSize);
  const cssSizes = css.map(toSize);
  return {
    page: pageLabel,
    js: jsSizes,
    css: cssSizes,
    html: sizeOf(htmlPath, pageLabel),
    jsGzip: jsSizes.reduce((n, f) => n + f.gzip, 0),
    jsBrotli: jsSizes.reduce((n, f) => n + f.brotli, 0),
    cssGzip: cssSizes.reduce((n, f) => n + f.gzip, 0)
  };
}

export function findHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findHtmlFiles(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out.sort();
}

export function pageLabel(htmlPath: string, pagesDir: string): string {
  const rel = relative(pagesDir, htmlPath).replace(/\\/g, '/').replace(/\.html$/, '');
  return rel === 'index' ? '/' : `/${rel.replace(/\/index$/, '')}`;
}

export const kb = (bytes: number) => (bytes / 1024).toFixed(1);
