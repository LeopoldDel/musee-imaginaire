import { describe, expect, it } from 'vitest';
import { loadCatalog, loadRawCatalog } from './load.ts';
import { validateCatalog, type RawCatalog } from './validate.ts';
import { imagePath, imageSrcset } from './images.ts';

const baseWork = {
  id: 'test-oeuvre-1',
  painterId: 'claude-monet',
  title: { fr: 'Œuvre de test' },
  dateDisplay: '1872',
  year: 1872,
  rarity: 'legendary',
  careerOrder: 1,
  traits: [
    { kind: 'movement', id: 'impressionnisme' },
    { kind: 'genre', id: 'marine' },
    { kind: 'era', id: '1870s' }
  ],
  source: { museum: 'aic', objectId: '1', url: 'https://example.org/1' },
  license: { kind: 'CC0', credit: 'Crédit de test' },
  status: 'draft'
};

async function withWorks(works: unknown[]): Promise<RawCatalog> {
  return { ...(await loadRawCatalog()), works };
}

describe('catalogue réel', () => {
  it('est valide', async () => {
    const result = await loadCatalog();
    expect(result.ok, result.ok ? '' : result.errors.join('\n')).toBe(true);
  });

  it('contient un style, des peintres de chaque rareté', async () => {
    const result = await loadCatalog();
    if (!result.ok) throw new Error('catalogue invalide');
    const rarities = new Set(result.catalog.painters.map((p) => p.rarity));
    expect(rarities).toEqual(new Set(['common', 'rare', 'legendary']));
  });
});

describe('validateCatalog', () => {
  it('accepte une œuvre brouillon cohérente', async () => {
    const r = validateCatalog(await withWorks([baseWork]));
    expect(r.ok).toBe(true);
  });

  it("refuse un peintre inconnu", async () => {
    const r = validateCatalog(await withWorks([{ ...baseWork, painterId: 'inconnu' }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain('peintre inconnu');
  });

  it('refuse deux traits de la même nature', async () => {
    const traits = [
      { kind: 'movement', id: 'impressionnisme' },
      { kind: 'genre', id: 'marine' },
      { kind: 'genre', id: 'paysage' }
    ];
    const r = validateCatalog(await withWorks([{ ...baseWork, traits }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain('exactement 1 trait');
  });

  it('refuse un trait absent du référentiel', async () => {
    const traits = [
      { kind: 'movement', id: 'impressionnisme' },
      { kind: 'genre', id: 'marine' },
      { kind: 'era', id: '1500s' }
    ];
    const r = validateCatalog(await withWorks([{ ...baseWork, traits }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain('trait inconnu');
  });

  it('refuse une licence autre que CC0', async () => {
    const r = validateCatalog(
      await withWorks([{ ...baseWork, license: { kind: 'CC-BY', credit: 'Crédit de test' } }])
    );
    expect(r.ok).toBe(false);
  });

  it('refuse « ready » sans image', async () => {
    const r = validateCatalog(await withWorks([{ ...baseWork, status: 'ready' }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain('exige une image');
  });

  it('refuse les doublons (id, rang de carrière, objet de musée)', async () => {
    const r = validateCatalog(await withWorks([baseWork, { ...baseWork }]));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const all = r.errors.join('\n');
      expect(all).toContain('identifiant en double');
      expect(all).toContain('rang de carrière en double');
      expect(all).toContain('même objet de musée');
    }
  });

  it('signale les erreurs de forme avec leur chemin', async () => {
    const r = validateCatalog(await withWorks([{ ...baseWork, year: 'x' }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/^works\.0\.year/);
  });
});

describe('images', () => {
  it('nomme les variantes par identifiant et largeur', () => {
    expect(imagePath('abc', 640, 'webp')).toBe('/art/abc-640.webp');
    expect(imageSrcset('abc', [640, 320], 'avif')).toBe('/art/abc-320.avif 320w, /art/abc-640.avif 640w');
  });
});
