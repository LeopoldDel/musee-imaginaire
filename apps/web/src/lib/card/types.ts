import type { Rarity, TraitKind } from '@musee/rules';

export type CardSize = 'thumb' | 'card' | 'detail';

/** Image réelle produite par le pipeline (voir @musee/catalog). */
export interface CardImage {
  id: string;
  width: number;
  height: number;
  widths: number[];
  dominantColor: string;
  lqip?: string;
}

/** Tout ce que la carte a besoin d'afficher, déjà traduit : aucune logique métier ici. */
export interface CardData {
  id: string;
  title: string;
  artist: string;
  date: string;
  rarity: Rarity;
  traits: Array<{ kind: TraitKind; label: string }>;
  edition?: { number: number; total: number };
  image?: CardImage;
  /** Sans image réelle : rapport largeur/hauteur du tableau fictif. */
  placeholderAspect?: number;
}
