import { describe, expect, it } from 'vitest';
import { PACK, computePackStock, consumePack } from './pack.ts';

const MIN = 60_000;
const T0 = 1_700_000_000_000;

describe('computePackStock', () => {
  it("n'ajoute rien avant la fin de la première période", () => {
    const s = computePackStock({ stock: 1, lastComputedAt: T0 }, T0 + 29 * MIN);
    expect(s.stock).toBe(1);
    expect(s.lastComputedAt).toBe(T0);
    expect(s.nextPackAt).toBe(T0 + 30 * MIN);
  });

  it('ajoute 1 lot par période de 30 min et conserve le reste du temps écoulé', () => {
    const s = computePackStock({ stock: 0, lastComputedAt: T0 }, T0 + 75 * MIN);
    expect(s.stock).toBe(2);
    expect(s.lastComputedAt).toBe(T0 + 60 * MIN);
    expect(s.nextPackAt).toBe(T0 + 90 * MIN);
  });

  it('plafonne à 4 lots et arrête le minuteur', () => {
    const s = computePackStock({ stock: 3, lastComputedAt: T0 }, T0 + 10 * 60 * MIN);
    expect(s.stock).toBe(PACK.stockMax);
    expect(s.nextPackAt).toBeNull();
    expect(s.lastComputedAt).toBe(T0 + 10 * 60 * MIN);
  });

  it('un stock déjà plein ne change pas', () => {
    const s = computePackStock({ stock: 4, lastComputedAt: T0 }, T0 + 5 * MIN);
    expect(s).toEqual({ stock: 4, lastComputedAt: T0 + 5 * MIN, nextPackAt: null });
  });

  it("ne remonte jamais le temps si l'horloge recule", () => {
    const s = computePackStock({ stock: 1, lastComputedAt: T0 }, T0 - 10 * MIN);
    expect(s.stock).toBe(1);
    expect(s.lastComputedAt).toBe(T0);
  });

  it('refuse un stock hors bornes', () => {
    expect(() => computePackStock({ stock: 5, lastComputedAt: T0 }, T0)).toThrow(RangeError);
    expect(() => computePackStock({ stock: -1, lastComputedAt: T0 }, T0)).toThrow(RangeError);
    expect(() => computePackStock({ stock: 1.5, lastComputedAt: T0 }, T0)).toThrow(RangeError);
  });
});

describe('consumePack', () => {
  it('refuse quand le stock est vide', () => {
    const r = consumePack({ stock: 0, lastComputedAt: T0 }, T0 + 10 * MIN);
    expect(r.ok).toBe(false);
    expect(r.state.nextPackAt).toBe(T0 + 30 * MIN);
  });

  it("consomme sans toucher au minuteur quand il tourne déjà", () => {
    const r = consumePack({ stock: 2, lastComputedAt: T0 }, T0 + 10 * MIN);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.stock).toBe(1);
      expect(r.state.lastComputedAt).toBe(T0);
      expect(r.state.nextPackAt).toBe(T0 + 30 * MIN);
    }
  });

  it("depuis un stock plein, le minuteur repart à l'instant de la consommation", () => {
    const now = T0 + 5 * 60 * MIN;
    const r = consumePack({ stock: 4, lastComputedAt: T0 }, now);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.stock).toBe(3);
      expect(r.state.lastComputedAt).toBe(now);
      expect(r.state.nextPackAt).toBe(now + 30 * MIN);
    }
  });

  it('enchaîne : 4 lots, puis vide, puis un lot 30 min plus tard', () => {
    let state: { stock: number; lastComputedAt: number } = { stock: 4, lastComputedAt: T0 };
    for (let i = 0; i < 4; i++) {
      const r = consumePack(state, T0);
      expect(r.ok).toBe(true);
      if (r.ok) state = r.state;
    }
    expect(state.stock).toBe(0);
    expect(consumePack(state, T0 + 29 * MIN).ok).toBe(false);
    expect(consumePack(state, T0 + 30 * MIN).ok).toBe(true);
  });
});
