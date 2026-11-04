import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { measurePage, pageLabel, referencedAssets } from './measure.ts';

const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

function fixture(html: string, files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  dirs.push(dir);
  const client = join(dir, 'client');
  for (const [name, content] of Object.entries(files)) {
    const full = join(client, name);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  const htmlPath = join(dir, 'index.html');
  writeFileSync(htmlPath, html);
  return { client, htmlPath };
}

describe('referencedAssets', () => {
  it('trouve les JS et CSS sans doublon', () => {
    const html = `
      <link rel="modulepreload" href="./_app/immutable/chunks/a.js">
      <link rel="stylesheet" href="./_app/immutable/assets/0.x.css">
      <script>import("./_app/immutable/entry/start.b.js"); import("./_app/immutable/chunks/a.js")</script>`;
    expect(referencedAssets(html)).toEqual({
      js: ['_app/immutable/chunks/a.js', '_app/immutable/entry/start.b.js'],
      css: ['_app/immutable/assets/0.x.css']
    });
  });
});

describe('measurePage', () => {
  it('additionne le poids compressé des fichiers référencés', () => {
    const big = 'const x = "' + 'abcdefghij'.repeat(2000) + '";';
    const { client, htmlPath } = fixture('<script>import("./_app/immutable/entry/a.js")</script>', {
      '_app/immutable/entry/a.js': big,
      '_app/immutable/entry/non-reference.js': big
    });
    const report = measurePage(htmlPath, client, '/');
    expect(report.js).toHaveLength(1);
    expect(report.jsGzip).toBeGreaterThan(0);
    expect(report.jsGzip).toBeLessThan(big.length); // la compression agit
  });

  it('échoue clairement si un fichier référencé est absent', () => {
    const { client, htmlPath } = fixture('<script>import("./_app/immutable/entry/manquant.js")</script>', {});
    expect(() => measurePage(htmlPath, client, '/')).toThrow('introuvable');
  });
});

describe('pageLabel', () => {
  it("nomme les pages d'après leur chemin", () => {
    expect(pageLabel('/p/index.html', '/p')).toBe('/');
    expect(pageLabel('/p/musee.html', '/p')).toBe('/musee');
    expect(pageLabel('/p/musee/index.html', '/p')).toBe('/musee');
  });
});
