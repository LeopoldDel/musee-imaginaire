/** Retire les accents et normalise pour comparer des noms et des titres. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugify(input: string, maxLength = 48): string {
  const slug = normalize(input).replace(/\s+/g, '-');
  if (slug.length <= maxLength) return slug;
  // coupe proprement sur une frontière de mot
  const cut = slug.slice(0, maxLength);
  return cut.slice(0, Math.max(cut.lastIndexOf('-'), 1));
}

/** « 1872 » → « 1870s » */
export function decadeId(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}
