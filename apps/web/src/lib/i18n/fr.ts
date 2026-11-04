/**
 * Messages en français — seule langue rédigée pour l'instant.
 * Pour ajouter une langue : créer un fichier de même forme (le type impose
 * les mêmes clés) et l'enregistrer dans index.ts.
 */
export const fr = {
  'app.tagline': 'Collectionnez les maîtres, composez votre musée.',
  'app.pageTitle': '{appName} — Vitrine des cartes',

  'gallery.heroTitle': 'Une carte légendaire',
  'gallery.heroHint': 'Touchez et glissez pour faire jouer la lumière.',
  'gallery.rareTitle': 'Cartes rares',
  'gallery.commonTitle': 'Cartes communes',
  'gallery.thumbsTitle': 'Vignettes',
  'gallery.thumbsHint': 'La taille utilisée dans le musée et les listes.',
  'gallery.demoNotice':
    'Données de démonstration : textes indicatifs et images provisoires. Les vraies œuvres (domaine public, licence CC0) arrivent avec le pipeline de contenu.',

  'rarity.common': 'Commune',
  'rarity.rare': 'Rare',
  'rarity.legendary': 'Légendaire',

  'trait.movement': 'Courant',
  'trait.genre': 'Genre',
  'trait.era': 'Époque',

  'card.edition': 'n° {number} sur {total}',
  'card.placeholder': 'Image provisoire',
  'card.imageAlt': 'Reproduction de « {title} »',
  'card.label': '{title}, {artist}, {rarity}',

  'theme.toggle': 'Changer de thème',
  'theme.musee': 'Clair',
  'theme.nuit': 'Nuit'
} as const;

export type MessageKey = keyof typeof fr;
export type Messages = Record<MessageKey, string>;
