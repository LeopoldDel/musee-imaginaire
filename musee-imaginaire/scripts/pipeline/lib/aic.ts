import * as v from 'valibot';

/**
 * Client minimal de l'API publique de l'Art Institute of Chicago.
 * Les œuvres du domaine public y sont diffusées en CC0.
 *
 * ⚠ La forme des réponses a été écrite d'après la documentation, sans pouvoir
 * interroger l'API depuis l'environnement de développement initial : tout est
 * validé avec Valibot pour que le moindre écart produise une erreur claire.
 */
export const AIC_API = 'https://api.artic.edu/api/v1';
export const AIC_IIIF = 'https://www.artic.edu/iiif/2';

export const AIC_FIELDS = [
  'id',
  'title',
  'artist_title',
  'date_display',
  'date_start',
  'date_end',
  'is_public_domain',
  'image_id',
  'artwork_type_title',
  'subject_titles',
  'classification_titles',
  'is_boosted',
  'is_on_view'
] as const;

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const NullishString = v.nullish(v.string());
const StringList = v.nullish(v.array(v.string()));

export const AicArtworkSchema = v.looseObject({
  id: v.number(),
  title: v.string(),
  artist_title: NullishString,
  date_display: NullishString,
  date_start: v.nullish(v.number()),
  date_end: v.nullish(v.number()),
  is_public_domain: v.nullish(v.boolean()),
  image_id: NullishString,
  artwork_type_title: NullishString,
  subject_titles: StringList,
  classification_titles: StringList,
  is_boosted: v.nullish(v.boolean()),
  is_on_view: v.nullish(v.boolean())
});
export type AicArtwork = v.InferOutput<typeof AicArtworkSchema>;

const SearchResponseSchema = v.object({ data: v.array(AicArtworkSchema) });
const ObjectResponseSchema = v.object({ data: AicArtworkSchema });

export function searchUrl(query: string, limit = 100, page = 1): string {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('query[term][is_public_domain]', 'true');
  params.set('fields', AIC_FIELDS.join(','));
  params.set('limit', String(limit));
  params.set('page', String(page));
  return `${AIC_API}/artworks/search?${params.toString()}`;
}

export function artworkUrl(id: number | string): string {
  return `${AIC_API}/artworks/${id}?fields=${AIC_FIELDS.join(',')}`;
}

export function iiifImageUrl(imageId: string, width: number): string {
  return `${AIC_IIIF}/${imageId}/full/${width},/0/default.jpg`;
}

export function artworkPageUrl(id: number | string): string {
  return `https://www.artic.edu/artworks/${id}`;
}

/** Crédit demandé par le musée : « Artiste. Titre, Date. The Art Institute of Chicago. » */
export function buildCredit(a: Pick<AicArtwork, 'artist_title' | 'title' | 'date_display'>): string {
  const parts = [a.artist_title, a.date_display ? `${a.title}, ${a.date_display}` : a.title];
  return `${parts.filter(Boolean).join('. ')}. The Art Institute of Chicago.`;
}

export interface AicClientOptions {
  fetchFn?: FetchFn;
  /** Pause entre deux requêtes, par politesse envers l'API (ms). */
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export function createAicClient(options: AicClientOptions = {}) {
  const fetchFn: FetchFn = options.fetchFn ?? ((url, init) => fetch(url, init));
  const delayMs = options.delayMs ?? 300;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const headers = {
    accept: 'application/json',
    // Le musée demande d'identifier les clients de l'API ; nom générique, sans coordonnées personnelles.
    'AIC-User-Agent': 'musee-imaginaire-pipeline'
  };

  async function get(url: string, accept?: string): Promise<Response> {
    if (delayMs > 0) await sleep(delayMs);
    const res = await fetchFn(url, { headers: accept ? { ...headers, accept } : headers });
    if (!res.ok) throw new Error(`AIC : HTTP ${res.status} pour ${url}`);
    return res;
  }

  return {
    async searchByArtist(name: string, limit = 100): Promise<AicArtwork[]> {
      const res = await get(searchUrl(name, limit));
      return v.parse(SearchResponseSchema, await res.json()).data;
    },

    async getArtwork(id: number | string): Promise<AicArtwork> {
      const res = await get(artworkUrl(id));
      return v.parse(ObjectResponseSchema, await res.json()).data;
    },

    /** Télécharge la plus grande version disponible parmi les largeurs demandées. */
    async downloadImage(imageId: string, widths: readonly number[] = [1686, 843]): Promise<Buffer> {
      let lastError: unknown;
      for (const w of widths) {
        try {
          const res = await get(iiifImageUrl(imageId, w), 'image/jpeg');
          return Buffer.from(await res.arrayBuffer());
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError instanceof Error ? lastError : new Error('AIC : téléchargement impossible');
    }
  };
}
