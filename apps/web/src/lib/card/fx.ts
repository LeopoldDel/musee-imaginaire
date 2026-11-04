/**
 * Effets de lumière de la carte, pilotés par des variables CSS.
 * On n'utilise PAS l'état réactif : à chaque mouvement on écrit directement
 * les variables, une seule fois par image (requestAnimationFrame).
 *
 *   --px / --py   position du pointeur, de 0 à 1
 *   --mx / --my   la même, en pourcentage (pour les dégradés)
 *   --rx / --ry   inclinaison en degrés
 */
export interface LightFxOptions {
  /** Inclinaison maximale en degrés ; 0 désactive l'inclinaison. */
  tilt: number;
  enabled: boolean;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function lightFx(node: HTMLElement, options: LightFxOptions) {
  let opts = options;
  let frame = 0;
  let px = 0.5;
  let py = 0.5;

  const reducedMotion = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint() {
    frame = 0;
    const tilt = reducedMotion() ? 0 : opts.tilt;
    node.style.setProperty('--px', px.toFixed(3));
    node.style.setProperty('--py', py.toFixed(3));
    node.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    node.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    node.style.setProperty('--rx', `${((0.5 - py) * 2 * tilt).toFixed(2)}deg`);
    node.style.setProperty('--ry', `${((px - 0.5) * 2 * tilt).toFixed(2)}deg`);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function onMove(event: PointerEvent) {
    if (!opts.enabled) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    px = clamp01((event.clientX - rect.left) / rect.width);
    py = clamp01((event.clientY - rect.top) / rect.height);
    node.dataset.active = '';
    schedule();
  }

  function reset() {
    delete node.dataset.active;
    px = 0.5;
    py = 0.5;
    schedule();
  }

  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerleave', reset);
  node.addEventListener('pointercancel', reset);

  return {
    update(next: LightFxOptions) {
      opts = next;
      if (!opts.enabled) reset();
    },
    destroy() {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', reset);
      node.removeEventListener('pointercancel', reset);
      if (frame) cancelAnimationFrame(frame);
    }
  };
}
