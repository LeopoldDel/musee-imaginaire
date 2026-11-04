import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import { loadRawCatalog } from '@musee/catalog/node';
import { validateCatalog } from '@musee/catalog';
import { FIXTURE_ARTWORKS } from './fixtures/artworks.ts';
import {
  AicArtworkSchema,
  buildCredit,
  createAicClient,
  iiifImageUrl,
  searchUrl,
  type FetchFn
} from './lib/aic.ts';
import { buildWorks } from './lib/build-works.ts';
import { artistMatches, isUsable, rankCandidates } from './lib/candidates.ts';
import { assignCareerOrder, workId } from './lib/compose.ts';
import { guessGenre } from './lib/genre.ts';
import { processImage } from './lib/images.ts';
import { decadeId, slugify } from './lib/text.ts';
import * as v from 'valibot';

const monet = { id: 'claude-monet', name: 'Claude Monet' };

describe('texte', () => {
  it('slugify retire accents et ponctuation', () => {
    expect(slugify('Les Nymphéas : effet du matin !')).toBe('les-nympheas-effet-du-matin');
  });
  it('slugify coupe sur une frontière de mot', () => {
    expect(slugify('un deux trois quatre cinq six', 14)).toBe('un-deux-trois');
  });
  it('decadeId', () => {
    expect(decadeId(1872)).toBe('1870s');
    expect(decadeId(1900)).toBe('1900s');
  });
});

describe('client AIC', () => {
  it('construit des URL de recherche, filtrées sur le domaine public', () => {
    const url = decodeURIComponent(searchUrl('Claude Monet', 50));
    expect(url).toContain('/artworks/search?q=Claude+Monet');
    expect(url).toContain('query[term][is_public_domain]=true');
    expect(url).toContain('limit=50');
  });

  it("construit l'URL IIIF", () => {
    expect(iiifImageUrl('abc', 843)).toBe('https://www.artic.edu/iiif/2/abc/full/843,/0/default.jpg');
  });

  it('génère le crédit demandé par le musée', () => {
    expect(buildCredit({ artist_title: 'Claude Monet', title: 'Titre', date_display: '1891' })).toBe(
      'Claude Monet. Titre, 1891. The Art Institute of Chicago.'
    );
  });

  it('valide la forme des réponses (tolère les champs en plus et les valeurs nulles)', () => {
    const ok = v.safeParse(AicArtworkSchema, { id: 1, title: 'x', champ_inconnu: 1, image_id: null });
    expect(ok.success).toBe(true);
    const bad = v.safeParse(AicArtworkSchema, { id: 'pas-un-nombre', title: 'x' });
    expect(bad.success).toBe(false);
  });

  it('interroge via un fetch injecté, avec en-tête client générique', async () => {
    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    const fakeFetch: FetchFn = async (url, init) => {
      calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
      return new Response(JSON.stringify({ data: FIXTURE_ARTWORKS }), { status: 200 });
    };
    const client = createAicClient({ fetchFn: fakeFetch, delayMs: 0 });
    const result = await client.searchByArtist('Claude Monet');
    expect(result).toHaveLength(FIXTURE_ARTWORKS.length);
    expect(calls[0]?.headers['AIC-User-Agent']).toBe('musee-imaginaire-pipeline');
  });

  it("remonte une erreur claire si l'API répond mal", async () => {
    const fakeFetch: FetchFn = async () => new Response('nope', { status: 503 });
    const client = createAicClient({ fetchFn: fakeFetch, delayMs: 0 });
    await expect(client.getArtwork(1)).rejects.toThrow('HTTP 503');
  });

  it('essaie une largeur plus petite si la grande échoue', async () => {
    const urls: string[] = [];
    const fakeFetch: FetchFn = async (url) => {
      urls.push(url);
      return url.includes('/1686,/') ? new Response('x', { status: 403 }) : new Response(new Uint8Array([1, 2, 3]));
    };
    const client = createAicClient({ fetchFn: fakeFetch, delayMs: 0 });
    const buf = await client.downloadImage('img');
    expect(buf.length).toBe(3);
    expect(urls).toHaveLength(2);
  });
});

describe('candidats', () => {
  it('reconnaît un artiste malgré les accents et la casse', () => {
    expect(artistMatches('Claude Monet', 'claude monet')).toBe(true);
    expect(artistMatches('Pierre-Auguste Renoir', 'Pierre Auguste Renoir')).toBe(true);
    expect(artistMatches(null, 'Claude Monet')).toBe(false);
  });

  it('écarte ce qui est inutilisable (droits, image, type, artiste, période)', () => {
    const usable = FIXTURE_ARTWORKS.filter((a) => isUsable(a, 'Claude Monet')).map((a) => a.id);
    expect(usable).toEqual([900001, 900002, 900003, 900009]);
  });

  it('classe : indications de titre > mise en avant > exposition > ordre du musée, sans doublon de titre', () => {
    const ranked = rankCandidates(FIXTURE_ARTWORKS, 'Claude Monet', ['Étude de meules']);
    expect(ranked.map((c) => c.objectId)).toEqual(['900001', '900003', '900002']);
    expect(ranked[0]?.hinted).toBe(true);
    // 900009 a le même titre que 900002 : dédoublonné
    expect(ranked.find((c) => c.objectId === '900009')).toBeUndefined();
  });
});

describe('genre', () => {
  it.each([
    ['Water Lilies', [], 'paysage'],
    ['Stacks of Wheat (End of Summer)', [], 'paysage'],
    ['Paris Street; Rainy Day', [], 'scene-urbaine'],
    ['The Child’s Bath', [], 'portrait'],
    ['Still Life with Apples', [], 'nature-morte'],
    ['The Beach at Sainte-Adresse', [], 'marine'],
    ['Un titre sans indice', [], 'scene-de-genre']
  ])('%s → %s', (title, subjects, expected) => {
    expect(guessGenre(title, subjects)).toBe(expected);
  });

  it('ne confond pas « seated » avec « sea »', () => {
    expect(guessGenre('Seated Figure')).toBe('scene-de-genre');
  });
});

describe('composition', () => {
  it('rang de carrière = ordre chronologique', () => {
    const out = assignCareerOrder([{ year: 1900 }, { year: 1870 }, { year: 1885 }]);
    expect(out.map((o) => [o.year, o.careerOrder])).toEqual([[1870, 1], [1885, 2], [1900, 3]]);
  });

  it("l'identifiant d'œuvre combine nom de famille et titre", async () => {
    const raw = await loadRawCatalog();
    const painter = (raw.painters as Array<{ id: string }>)[0] as never;
    expect(workId(painter, 'Water Lilies')).toBe('monet-water-lilies');
  });
});

describe('buildWorks (avec faux musée et faux traitement d’image)', () => {
  const fakeImage = {
    width: 1000,
    height: 700,
    widths: [320, 640],
    dominantColor: '#778899',
    lqip: 'data:image/webp;base64,AAAA'
  };

  async function run(entries: Parameters<typeof buildWorks>[0]) {
    const raw = await loadRawCatalog();
    const catalog = {
      painters: raw.painters as never[],
      traits: raw.traits as never[]
    };
    return {
      raw,
      result: await buildWorks(entries, catalog, {
        getArtwork: async (id) => {
          const found = FIXTURE_ARTWORKS.find((a) => String(a.id) === id);
          if (!found) throw new Error('introuvable');
          return found;
        },
        processImage: async () => fakeImage
      })
    };
  }

  it('produit des œuvres valides pour le catalogue complet', async () => {
    const { raw, result } = await run([
      { painterId: 'claude-monet', museum: 'aic', objectId: '900002', genre: 'paysage' },
      { painterId: 'claude-monet', museum: 'aic', objectId: '900001', genre: 'paysage', titleFr: 'Étude de meules' }
    ]);
    expect(result.works.map((w) => w.careerOrder)).toEqual([1, 2]); // 1891 puis 1906
    expect(result.works[0]?.traits.map((t) => t.kind)).toEqual(['movement', 'genre', 'era']);
    expect(result.works[0]?.traits[2]?.id).toBe('1890s');
    expect(result.warnings.some((w) => w.includes('titre français'))).toBe(true);
    const check = validateCatalog({ ...raw, works: result.works });
    expect(check.ok, check.ok ? '' : check.errors.join('\n')).toBe(true);
  });

  it('refuse une œuvre hors domaine public', async () => {
    await expect(
      run([{ painterId: 'claude-monet', museum: 'aic', objectId: '900005', genre: 'paysage' }])
    ).rejects.toThrow('domaine public');
  });

  it("refuse une œuvre d'un autre artiste", async () => {
    await expect(
      run([{ painterId: 'claude-monet', museum: 'aic', objectId: '900007', genre: 'paysage' }])
    ).rejects.toThrow('ne correspond pas');
  });

  it('refuse un genre inconnu', async () => {
    await expect(
      run([{ painterId: 'claude-monet', museum: 'aic', objectId: '900001', genre: 'abstraction' }])
    ).rejects.toThrow('genre inconnu');
  });
});

describe('traitement des images (sharp, image synthétique)', () => {
  let dir: string | undefined;
  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('produit variantes WebP/AVIF, miniature et couleur dominante, sans agrandir', async () => {
    dir = await mkdtemp(join(tmpdir(), 'musee-img-'));
    const source = await sharp({
      create: { width: 700, height: 500, channels: 3, background: { r: 200, g: 40, b: 40 } }
    })
      .jpeg()
      .toBuffer();

    const out = await processImage(source, 'test-oeuvre', dir);
    expect(out.width).toBe(700);
    expect(out.height).toBe(500);
    expect(out.widths).toEqual([320, 640]); // 1280 > 700 : non produite
    expect(out.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
    // rouge dominant
    expect(parseInt(out.dominantColor.slice(1, 3), 16)).toBeGreaterThan(150);
    expect(out.lqip.startsWith('data:image/webp;base64,')).toBe(true);
    expect(out.lqip.length).toBeLessThan(1200);

    const files = (await readdir(dir)).sort();
    expect(files).toEqual([
      'test-oeuvre-320.avif',
      'test-oeuvre-320.webp',
      'test-oeuvre-640.avif',
      'test-oeuvre-640.webp'
    ]);
  });

  it("garde une variante à la taille d'origine si l'image est très petite", async () => {
    dir ??= await mkdtemp(join(tmpdir(), 'musee-img-'));
    const tiny = await sharp({ create: { width: 200, height: 100, channels: 3, background: '#336699' } })
      .png()
      .toBuffer();
    const out = await processImage(tiny, 'petite', dir);
    expect(out.widths).toEqual([200]);
  });
});
