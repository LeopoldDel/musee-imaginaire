/**
 * Convention de nommage des variantes produites par le pipeline.
 * Les fichiers vivent dans apps/web/static/art/ et sont servis sous /art/.
 */
export type ImageFormat = 'avif' | 'webp';

export function imagePath(workId: string, width: number, format: ImageFormat): string {
  return `/art/${workId}-${width}.${format}`;
}

export function imageSrcset(workId: string, widths: readonly number[], format: ImageFormat): string {
  return [...widths]
    .sort((a, b) => a - b)
    .map((w) => `${imagePath(workId, w, format)} ${w}w`)
    .join(', ');
}
