/**
 * Chaque œuvre porte exactement 3 traits, un de chaque nature.
 * Les deux premières natures sont arrêtées (courant, genre) ;
 * la troisième (« era », l'époque) est PROVISOIRE — voir docs/decisions.md.
 */
export const TRAIT_KINDS = ['movement', 'genre', 'era'] as const;
export type TraitKind = (typeof TRAIT_KINDS)[number];

export const TRAITS_PER_WORK = TRAIT_KINDS.length;

export interface TraitRef {
  kind: TraitKind;
  id: string;
}

export function isTraitKind(value: unknown): value is TraitKind {
  return typeof value === 'string' && (TRAIT_KINDS as readonly string[]).includes(value);
}
