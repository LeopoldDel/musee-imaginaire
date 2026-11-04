/**
 * Raretés — classement par notoriété (décision de conception :
 * « commune / rare / légendaire en fonction de la notoriété »).
 */
export const RARITIES = ['common', 'rare', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

/** 0 = commune, 1 = rare, 2 = légendaire. Sert aux tris et aux comparaisons. */
export function rarityRank(rarity: Rarity): number {
  return RARITIES.indexOf(rarity);
}

export function isRarity(value: unknown): value is Rarity {
  return typeof value === 'string' && (RARITIES as readonly string[]).includes(value);
}

/**
 * Longueur de la carrière d'un peintre (nombre de niveaux de mission)
 * selon sa rareté. Valeurs de départ, à équilibrer au prototype.
 */
export const LEVELS_BY_RARITY: Record<Rarity, number> = {
  common: 3,
  rare: 5,
  legendary: 8
};
