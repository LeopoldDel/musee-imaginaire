import { imagePath, imageSrcset } from '@musee/catalog/images';
import type { CardImage } from './types.ts';

export interface ImageSources {
  avifSrcset: string;
  webpSrcset: string;
  src: string;
  aspect: number;
}

/** Choisit les variantes à déclarer ; `src` de repli = la variante WebP médiane. */
export function imageSources(image: CardImage): ImageSources {
  const widths = [...image.widths].sort((a, b) => a - b);
  const fallbackWidth = widths[Math.floor((widths.length - 1) / 2)] ?? widths[0] ?? image.width;
  return {
    avifSrcset: imageSrcset(image.id, widths, 'avif'),
    webpSrcset: imageSrcset(image.id, widths, 'webp'),
    src: imagePath(image.id, fallbackWidth, 'webp'),
    aspect: image.width / image.height
  };
}

export const IMAGE_SIZES: Record<'thumb' | 'card' | 'detail', string> = {
  thumb: '(max-width: 480px) 30vw, 140px',
  card: '(max-width: 480px) 64vw, 280px',
  detail: '(max-width: 480px) 90vw, 380px'
};
