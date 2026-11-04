import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

export const TARGET_WIDTHS = [320, 640, 1280] as const;

export interface ProcessedImage {
  width: number;
  height: number;
  widths: number[];
  dominantColor: string;
  lqip: string;
}

function hex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

/**
 * Produit pour une œuvre : variantes WebP + AVIF (jamais agrandies),
 * miniature floue en data URI et couleur dominante.
 * Fichiers : <outDir>/<id>-<largeur>.<webp|avif>
 */
export async function processImage(
  input: Buffer,
  id: string,
  outDir: string,
  targetWidths: readonly number[] = TARGET_WIDTHS
): Promise<ProcessedImage> {
  await mkdir(outDir, { recursive: true });

  // .rotate() applique l'orientation EXIF avant toute mesure.
  const base = sharp(input).rotate();
  const { data: oriented, info } = await base.toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const widths = targetWidths.filter((w) => w <= width);
  if (widths.length === 0) widths.push(width);

  for (const w of widths) {
    const resized = () => sharp(oriented).resize({ width: w, withoutEnlargement: true });
    await resized().webp({ quality: 80 }).toFile(join(outDir, `${id}-${w}.webp`));
    await resized().avif({ quality: 55, effort: 4 }).toFile(join(outDir, `${id}-${w}.avif`));
  }

  const lqipBuffer = await sharp(oriented).resize({ width: 16 }).blur(0.6).webp({ quality: 30 }).toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

  const { dominant } = await sharp(oriented).resize({ width: 64 }).stats();
  const dominantColor = `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`;

  return { width, height, widths, dominantColor, lqip };
}
