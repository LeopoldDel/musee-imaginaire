import { describe, expect, it } from 'vitest';
import { imageSources } from './image.ts';

describe('imageSources', () => {
  const image = { id: 'monet-test', width: 1400, height: 1000, widths: [1280, 320, 640], dominantColor: '#223344' };

  it('déclare les variantes triées, AVIF et WebP', () => {
    const s = imageSources(image);
    expect(s.avifSrcset).toBe(
      '/art/monet-test-320.avif 320w, /art/monet-test-640.avif 640w, /art/monet-test-1280.avif 1280w'
    );
    expect(s.webpSrcset).toContain('/art/monet-test-640.webp 640w');
  });

  it('repli sur la variante médiane et conserve le rapport', () => {
    const s = imageSources(image);
    expect(s.src).toBe('/art/monet-test-640.webp');
    expect(s.aspect).toBeCloseTo(1.4);
  });

  it('fonctionne avec une seule variante', () => {
    const s = imageSources({ ...image, widths: [200] });
    expect(s.src).toBe('/art/monet-test-200.webp');
  });
});
