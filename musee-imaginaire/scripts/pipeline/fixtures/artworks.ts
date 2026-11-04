import type { AicArtwork } from '../lib/aic.ts';

/**
 * DONNÉES SYNTHÉTIQUES pour les tests.
 * Les identifiants (9000xx) et les titres sont fictifs : ils ne correspondent
 * à aucune œuvre réelle du musée. Ne jamais les copier dans le catalogue.
 */
function art(partial: Partial<AicArtwork> & Pick<AicArtwork, 'id' | 'title'>): AicArtwork {
  return {
    artist_title: 'Claude Monet',
    date_display: '1880',
    date_start: 1880,
    date_end: 1880,
    is_public_domain: true,
    image_id: `fixture-image-${partial.id}`,
    artwork_type_title: 'Painting',
    subject_titles: [],
    classification_titles: [],
    is_boosted: false,
    is_on_view: false,
    ...partial
  };
}

export const FIXTURE_ARTWORKS: AicArtwork[] = [
  art({ id: 900001, title: 'FIXTURE Étude de meules', date_display: '1891', date_start: 1891, date_end: 1891 }),
  art({ id: 900002, title: 'FIXTURE Bassin aux nénuphars', is_on_view: true, date_display: '1906', date_start: 1906, date_end: 1906 }),
  art({ id: 900003, title: 'FIXTURE Plage au lever du jour', is_boosted: true, subject_titles: ['seascape'] }),
  art({ id: 900004, title: 'FIXTURE Dessin préparatoire', artwork_type_title: 'Drawing and Watercolor' }),
  art({ id: 900005, title: 'FIXTURE Œuvre sous droits', is_public_domain: false }),
  art({ id: 900006, title: 'FIXTURE Sans image', image_id: null }),
  art({ id: 900007, title: 'FIXTURE Autre artiste', artist_title: 'Artiste Fictif' }),
  art({ id: 900008, title: 'FIXTURE Trop ancienne', date_display: '1650', date_start: 1650, date_end: 1650 }),
  art({ id: 900009, title: 'FIXTURE Bassin aux nénuphars', date_display: '1907', date_start: 1907, date_end: 1907 })
];
