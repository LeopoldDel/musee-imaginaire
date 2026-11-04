import { describe, expect, it } from 'vitest';
import { interpolate, t } from './index.ts';
import { fr } from './fr.ts';

describe('i18n', () => {
  it('interpole les paramètres', () => {
    expect(interpolate('n° {number} sur {total}', { number: 3, total: 50 })).toBe('n° 3 sur 50');
  });

  it('laisse intact un paramètre manquant', () => {
    expect(interpolate('Bonjour {nom}')).toBe('Bonjour {nom}');
  });

  it('traduit une clé', () => {
    expect(t('rarity.legendary')).toBe('Légendaire');
    expect(t('card.edition', { number: 12, total: 50 })).toBe('n° 12 sur 50');
  });

  it("n'a aucun message vide et n'écrit pas le nom du jeu en dur", () => {
    for (const [key, value] of Object.entries(fr)) {
      expect(value.length, key).toBeGreaterThan(0);
      expect(value, key).not.toMatch(/Musée imaginaire/);
    }
  });
});
