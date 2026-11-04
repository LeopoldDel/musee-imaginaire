/**
 * Stock de lots gratuits.
 *
 * Règle : 1 lot toutes les 30 minutes, stockage plafonné à 4 lots (≈ 2 h).
 * Le minuteur s'arrête quand le stock est plein et repart dès qu'on en consomme un.
 *
 * Principe d'architecture : le serveur ne garde que (stock, date du dernier calcul).
 * Le stock réel se déduit des horodatages — aucune tâche de fond par joueur.
 * Toutes les dates sont des millisecondes Unix.
 */
export interface PackConfig {
  intervalMinutes: number;
  stockMax: number;
}

export const PACK: PackConfig = {
  intervalMinutes: 30,
  stockMax: 4
};

/** État stocké côté serveur. */
export interface PackState {
  stock: number;
  /** Date à laquelle `stock` était exact (début de la période en cours). */
  lastComputedAt: number;
}

/** État recalculé à l'instant `now`, avec la date du prochain lot. */
export interface PackSnapshot extends PackState {
  /** null quand le stock est plein (le minuteur est arrêté). */
  nextPackAt: number | null;
}

function assertState(state: PackState, cfg: PackConfig): void {
  if (!Number.isInteger(state.stock) || state.stock < 0 || state.stock > cfg.stockMax) {
    throw new RangeError(`Stock invalide : ${state.stock} (attendu 0..${cfg.stockMax})`);
  }
}

export function computePackStock(
  state: PackState,
  now: number,
  cfg: PackConfig = PACK
): PackSnapshot {
  assertState(state, cfg);
  const interval = cfg.intervalMinutes * 60_000;

  if (state.stock >= cfg.stockMax) {
    return { stock: state.stock, lastComputedAt: now, nextPackAt: null };
  }

  // Horloge en retard (décalage) : on ne remonte jamais le temps.
  const elapsed = Math.max(0, now - state.lastComputedAt);
  const periods = Math.floor(elapsed / interval);
  const stock = Math.min(cfg.stockMax, state.stock + periods);

  if (stock >= cfg.stockMax) {
    return { stock, lastComputedAt: now, nextPackAt: null };
  }

  const lastComputedAt = state.lastComputedAt + periods * interval;
  return { stock, lastComputedAt, nextPackAt: lastComputedAt + interval };
}

export type ConsumeResult =
  | { ok: true; state: PackSnapshot }
  | { ok: false; reason: 'empty'; state: PackSnapshot };

/**
 * Consomme un lot. Si le stock était plein, le minuteur repart à `now`
 * (computePackStock a déjà fixé lastComputedAt = now dans ce cas).
 */
export function consumePack(
  state: PackState,
  now: number,
  cfg: PackConfig = PACK
): ConsumeResult {
  const snap = computePackStock(state, now, cfg);
  if (snap.stock <= 0) {
    return { ok: false, reason: 'empty', state: snap };
  }
  const stock = snap.stock - 1;
  const interval = cfg.intervalMinutes * 60_000;
  return {
    ok: true,
    state: {
      stock,
      lastComputedAt: snap.lastComputedAt,
      nextPackAt: snap.lastComputedAt + interval
    }
  };
}
