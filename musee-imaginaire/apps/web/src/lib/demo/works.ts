import type { CardData } from '#lib/card/types.ts';

/**
 * DONNÉES DE DÉMONSTRATION — à ne pas confondre avec le catalogue.
 * Titres et dates : repères connus de l'histoire de l'art, utilisés comme texte
 * seulement. Les images sont des tableaux fictifs (dégradés) ; les numéros
 * d'exemplaire sont inventés pour montrer la mise en page.
 * Remplacé par le catalogue réel (@musee/catalog) dès que le pipeline a tourné.
 */
const impressionnisme = { kind: 'movement', label: 'Impressionnisme' } as const;
const genre = (label: string) => ({ kind: 'genre', label }) as const;
const era = (label: string) => ({ kind: 'era', label }) as const;

export const DEMO_LEGENDARY: CardData = {
  id: 'demo-soleil-levant',
  title: 'Impression, soleil levant',
  artist: 'Claude Monet',
  date: '1872',
  rarity: 'legendary',
  traits: [impressionnisme, genre('Marine'), era('Années 1870')],
  edition: { number: 7, total: 25 },
  placeholderAspect: 1.3
};

export const DEMO_RARE: CardData[] = [
  {
    id: 'demo-bal-moulin',
    title: 'Bal du moulin de la Galette',
    artist: 'Pierre-Auguste Renoir',
    date: '1876',
    rarity: 'rare',
    traits: [impressionnisme, genre('Scène de genre'), era('Années 1870')],
    edition: { number: 31, total: 120 },
    placeholderAspect: 1.35
  },
  {
    id: 'demo-classe-danse',
    title: 'La Classe de danse',
    artist: 'Edgar Degas',
    date: '1874',
    rarity: 'rare',
    traits: [impressionnisme, genre('Scène de genre'), era('Années 1870')],
    edition: { number: 58, total: 120 },
    placeholderAspect: 0.8
  },
  {
    id: 'demo-bain-enfant',
    title: "Le Bain de l'enfant",
    artist: 'Mary Cassatt',
    date: '1893',
    rarity: 'rare',
    traits: [impressionnisme, genre('Portrait'), era('Années 1890')],
    edition: { number: 12, total: 120 },
    placeholderAspect: 0.75
  }
];

export const DEMO_COMMON: CardData[] = [
  {
    id: 'demo-rue-pluie',
    title: 'Rue de Paris, temps de pluie',
    artist: 'Gustave Caillebotte',
    date: '1877',
    rarity: 'common',
    traits: [impressionnisme, genre('Scène urbaine'), era('Années 1870')],
    placeholderAspect: 1.5
  },
  {
    id: 'demo-neige-louveciennes',
    title: 'Neige à Louveciennes',
    artist: 'Alfred Sisley',
    date: '1878',
    rarity: 'common',
    traits: [impressionnisme, genre('Paysage'), era('Années 1870')],
    placeholderAspect: 1.25
  },
  {
    id: 'demo-berceau',
    title: 'Le Berceau',
    artist: 'Berthe Morisot',
    date: '1872',
    rarity: 'common',
    traits: [impressionnisme, genre('Portrait'), era('Années 1870')],
    placeholderAspect: 0.85
  },
  {
    id: 'demo-boulevard-nuit',
    title: 'Boulevard Montmartre, effet de nuit',
    artist: 'Camille Pissarro',
    date: '1897',
    rarity: 'common',
    traits: [impressionnisme, genre('Scène urbaine'), era('Années 1890')],
    placeholderAspect: 1.2
  }
];

export const DEMO_ALL: CardData[] = [DEMO_LEGENDARY, ...DEMO_RARE, ...DEMO_COMMON];
