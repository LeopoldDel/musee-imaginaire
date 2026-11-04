import * as v from 'valibot';
import { TRAIT_KINDS } from '@musee/rules';
import {
  PaintersFileSchema,
  StylesFileSchema,
  TraitsFileSchema,
  WorksFileSchema,
  type Catalog
} from './schema.ts';

export interface RawCatalog {
  styles: unknown;
  painters: unknown;
  traits: unknown;
  works: unknown;
}

export type ValidationResult =
  { ok: true; catalog: Catalog; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

function schemaIssues(label: string, issues: readonly v.BaseIssue<unknown>[]): string[] {
  return issues.map((issue) => {
    const path = issue.path?.map((p) => String(p.key)).join('.') ?? '';
    return `${label}${path ? `.${path}` : ''} : ${issue.message}`;
  });
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

/**
 * Valide la forme de chaque fichier, puis la cohérence entre fichiers :
 * identifiants uniques, références existantes, 3 traits de natures distinctes,
 * licence CC0, œuvres « ready » avec images…
 */
export function validateCatalog(raw: RawCatalog): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const styles = v.safeParse(StylesFileSchema, raw.styles);
  const painters = v.safeParse(PaintersFileSchema, raw.painters);
  const traits = v.safeParse(TraitsFileSchema, raw.traits);
  const works = v.safeParse(WorksFileSchema, raw.works);

  if (!styles.success) errors.push(...schemaIssues('styles', styles.issues));
  if (!painters.success) errors.push(...schemaIssues('painters', painters.issues));
  if (!traits.success) errors.push(...schemaIssues('traits', traits.issues));
  if (!works.success) errors.push(...schemaIssues('works', works.issues));
  if (!styles.success || !painters.success || !traits.success || !works.success) {
    return { ok: false, errors, warnings };
  }

  const catalog: Catalog = {
    styles: styles.output,
    painters: painters.output,
    traits: traits.output,
    works: works.output
  };

  for (const [label, ids] of [
    ['styles', catalog.styles.map((s) => s.id)],
    ['painters', catalog.painters.map((p) => p.id)],
    ['works', catalog.works.map((w) => w.id)]
  ] as const) {
    for (const id of findDuplicates([...ids])) errors.push(`${label} : identifiant en double « ${id} »`);
  }
  const traitKeys = catalog.traits.map((t) => `${t.kind}:${t.id}`);
  for (const key of findDuplicates(traitKeys)) errors.push(`traits : en double « ${key} »`);

  const styleIds = new Set(catalog.styles.map((s) => s.id));
  const painterIds = new Set(catalog.painters.map((p) => p.id));
  const traitSet = new Set(traitKeys);

  for (const p of catalog.painters) {
    if (!styleIds.has(p.styleId)) errors.push(`peintre « ${p.id} » : style inconnu « ${p.styleId} »`);
  }

  const orderByPainter = new Map<string, number[]>();
  const sourceKeys: string[] = [];

  for (const w of catalog.works) {
    const where = `œuvre « ${w.id} »`;
    if (!painterIds.has(w.painterId)) errors.push(`${where} : peintre inconnu « ${w.painterId} »`);

    const kinds = w.traits.map((t) => t.kind);
    for (const kind of TRAIT_KINDS) {
      const count = kinds.filter((k) => k === kind).length;
      if (count !== 1) errors.push(`${where} : exactement 1 trait « ${kind} » attendu (trouvé ${count})`);
    }
    for (const t of w.traits) {
      if (!traitSet.has(`${t.kind}:${t.id}`)) errors.push(`${where} : trait inconnu « ${t.kind}:${t.id} »`);
    }

    if (w.status === 'ready' && !w.image) errors.push(`${where} : « ready » exige une image traitée`);
    if (w.status === 'draft' && w.image) warnings.push(`${where} : image présente mais statut « draft »`);

    const list = orderByPainter.get(w.painterId) ?? [];
    list.push(w.careerOrder);
    orderByPainter.set(w.painterId, list);
    sourceKeys.push(`${w.source.museum}:${w.source.objectId}`);
  }

  for (const [painterId, orders] of orderByPainter) {
    for (const o of findDuplicates(orders.map(String))) {
      errors.push(`peintre « ${painterId} » : rang de carrière en double (${o})`);
    }
  }
  for (const key of findDuplicates(sourceKeys)) errors.push(`works : même objet de musée utilisé deux fois (${key})`);

  // Les styles et peintres sans œuvre sont normaux au début ; on le signale seulement.
  const painterWithWork = new Set(catalog.works.map((w) => w.painterId));
  const orphan = catalog.painters.filter((p) => !painterWithWork.has(p.id));
  if (orphan.length > 0) {
    warnings.push(`${orphan.length} peintre(s) sans œuvre : ${orphan.map((p) => p.id).join(', ')}`);
  }

  return errors.length > 0 ? { ok: false, errors, warnings } : { ok: true, catalog, warnings };
}
