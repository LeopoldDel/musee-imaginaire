import * as v from 'valibot';
import { RARITIES, TRAIT_KINDS } from '@musee/rules';

/** Langues prévues. Seul le français est rédigé pour l'instant. */
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

const Slug = v.pipe(
  v.string(),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'identifiant en kebab-case attendu (a-z, 0-9, tirets)')
);

const HexColor = v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, 'couleur #rrggbb attendue'));

/** Texte traduisible : le français est obligatoire, les autres langues viendront après. */
export const LocalizedSchema = v.object({
  fr: v.pipe(v.string(), v.minLength(1)),
  en: v.optional(v.pipe(v.string(), v.minLength(1)))
});
export type Localized = v.InferOutput<typeof LocalizedSchema>;

export const RaritySchema = v.picklist(RARITIES);
export const TraitKindSchema = v.picklist(TRAIT_KINDS);

export const TraitRefSchema = v.object({
  kind: TraitKindSchema,
  id: Slug
});

export const TraitSchema = v.object({
  id: Slug,
  kind: TraitKindSchema,
  name: LocalizedSchema
});
export type Trait = v.InferOutput<typeof TraitSchema>;

export const StyleSchema = v.object({
  id: Slug,
  name: LocalizedSchema,
  /** Couleur d'accent du style (interface, marque-page de la carte…). */
  accent: HexColor
});
export type Style = v.InferOutput<typeof StyleSchema>;

const Year = v.pipe(v.number(), v.integer(), v.minValue(1000), v.maxValue(2100));

export const PainterSchema = v.object({
  id: Slug,
  /** Nom propre : non traduit. */
  name: v.pipe(v.string(), v.minLength(1)),
  styleId: Slug,
  rarity: RaritySchema,
  born: Year,
  died: v.optional(Year)
});
export type Painter = v.InferOutput<typeof PainterSchema>;

export const LicenseSchema = v.object({
  kind: v.literal('CC0'),
  /** Mention de crédit demandée par le musée, affichée dans la fiche détail. */
  credit: v.pipe(v.string(), v.minLength(5))
});

export const SourceSchema = v.object({
  museum: v.picklist(['aic', 'met']),
  objectId: v.pipe(v.string(), v.regex(/^\d+$/, "identifiant d'objet numérique attendu")),
  url: v.pipe(v.string(), v.url())
});

/**
 * Variantes d'image produites par le pipeline. Les fichiers sont déduits
 * de l'identifiant (voir imageUrl) : on ne stocke ni chemin ni URL.
 */
export const ImageSchema = v.object({
  width: v.pipe(v.number(), v.integer(), v.minValue(1)),
  height: v.pipe(v.number(), v.integer(), v.minValue(1)),
  widths: v.pipe(v.array(v.pipe(v.number(), v.integer(), v.minValue(1))), v.minLength(1)),
  dominantColor: HexColor,
  /** Miniature floue en data URI (≈ 300 octets), affichée avant le chargement. */
  lqip: v.pipe(v.string(), v.startsWith('data:image/'))
});
export type WorkImage = v.InferOutput<typeof ImageSchema>;

export const WorkSchema = v.object({
  id: Slug,
  painterId: Slug,
  title: LocalizedSchema,
  /** Date telle qu'affichée (« 1872 », « vers 1890 »). */
  dateDisplay: v.pipe(v.string(), v.minLength(1)),
  /** Année de référence pour l'époque et le tri. */
  year: Year,
  rarity: RaritySchema,
  /** Rang dans la carrière du peintre : 1 = première œuvre débloquée. */
  careerOrder: v.pipe(v.number(), v.integer(), v.minValue(1)),
  traits: v.pipe(v.array(TraitRefSchema), v.length(TRAIT_KINDS.length)),
  source: SourceSchema,
  license: LicenseSchema,
  /** Absent tant que le pipeline n'a pas traité l'image : l'œuvre reste en brouillon. */
  image: v.optional(ImageSchema),
  status: v.picklist(['draft', 'ready'])
});
export type Work = v.InferOutput<typeof WorkSchema>;

export const StylesFileSchema = v.array(StyleSchema);
export const PaintersFileSchema = v.array(PainterSchema);
export const TraitsFileSchema = v.array(TraitSchema);
export const WorksFileSchema = v.array(WorkSchema);

export interface Catalog {
  styles: Style[];
  painters: Painter[];
  traits: Trait[];
  works: Work[];
}
