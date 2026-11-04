import { normalize } from './text.ts';

/**
 * Devine le genre d'une œuvre à partir de son titre et des sujets du musée.
 * Heuristique volontairement simple : la sélection reste relue à la main.
 * L'ordre compte : la première règle qui correspond l'emporte.
 */
const RULES: Array<{ genre: string; words: string[] }> = [
  { genre: 'nature-morte', words: ['still life', 'nature morte', 'flower', 'fruit', 'vase', 'bouquet'] },
  { genre: 'marine', words: ['sea', 'seascape', 'beach', 'boat', 'harbor', 'harbour', 'coast', 'regatta', 'sailboat'] },
  { genre: 'scene-urbaine', words: ['street', 'boulevard', 'rue', 'cityscape', 'city', 'paris', 'bridge', 'station', 'gare', 'place'] },
  { genre: 'portrait', words: ['portrait', 'woman', 'girl', 'child', 'mother', 'sister', 'lady', 'bather'] },
  { genre: 'paysage', words: ['landscape', 'river', 'field', 'poplar', 'stack', 'water lily', 'water lilies', 'pond', 'garden', 'hill', 'tree', 'meadow', 'poppy', 'snow'] }
];

function matches(tokens: string[], phrase: string): boolean {
  const words = normalize(phrase).split(' ');
  for (let i = 0; i + words.length <= tokens.length; i++) {
    const hit = words.every((w, j) => {
      const t = tokens[i + j]!;
      return t === w || t === `${w}s` || t === `${w}es`;
    });
    if (hit) return true;
  }
  return false;
}

export function guessGenre(title: string, subjects: string[] = []): string {
  const tokens = normalize([title, ...subjects].join(' ')).split(' ');
  for (const rule of RULES) {
    if (rule.words.some((w) => matches(tokens, w))) return rule.genre;
  }
  return 'scene-de-genre';
}
