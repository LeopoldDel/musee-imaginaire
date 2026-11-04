import { describe, expect, it } from 'vitest';
import { LEVELS_BY_RARITY, RARITIES, isRarity, rarityRank } from './rarity.ts';

describe('rarity', () => {
  it('classe de la plus commune à la plus rare', () => {
    expect(rarityRank('common')).toBeLessThan(rarityRank('rare'));
    expect(rarityRank('rare')).toBeLessThan(rarityRank('legendary'));
  });

  it('reconnaît les valeurs valides uniquement', () => {
    expect(isRarity('rare')).toBe(true);
    expect(isRarity('epic')).toBe(false);
    expect(isRarity(3)).toBe(false);
  });

  it('une carrière est plus longue pour un peintre plus rare', () => {
    const lengths = RARITIES.map((r) => LEVELS_BY_RARITY[r]);
    expect([...lengths].sort((a, b) => a - b)).toEqual(lengths);
  });
});
