import { loadCatalog } from './load.ts';

const result = await loadCatalog();

for (const w of result.warnings) console.warn(`  ⚠ ${w}`);

if (!result.ok) {
  console.error(`\nCatalogue invalide (${result.errors.length} erreur(s)) :`);
  for (const e of result.errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const { styles, painters, traits, works } = result.catalog;
const ready = works.filter((w) => w.status === 'ready').length;
console.log(
  `Catalogue valide : ${styles.length} style(s), ${painters.length} peintre(s), ${traits.length} trait(s), ` +
    `${works.length} œuvre(s) (${ready} prête(s), ${works.length - ready} brouillon(s)).`
);
