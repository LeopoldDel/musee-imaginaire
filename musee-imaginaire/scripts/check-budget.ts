/**
 * Garde-fou de poids : échoue si le JavaScript du premier chargement d'une page
 * dépasse le budget (200 Ko compressés par défaut). À lancer après « pnpm build ».
 *
 *   pnpm budget                 # budget par défaut
 *   BUDGET_JS_KB=150 pnpm budget
 *
 * On mesure en gzip (le plus lourd des deux formats servis par Cloudflare : gzip et brotli),
 * donc le chiffre est volontairement pessimiste.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findHtmlFiles, kb, measurePage, pageLabel } from './budget/measure.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'apps', 'web', '.svelte-kit', 'output');
const pagesDir = join(output, 'prerendered', 'pages');
const clientDir = join(output, 'client');
const budgetKb = Number(process.env.BUDGET_JS_KB ?? 200);

if (!existsSync(pagesDir)) {
  console.error('Pages pré-rendues introuvables : lancez d\'abord « pnpm build ».');
  process.exit(2);
}

let failed = false;
console.log(`Budget JavaScript du premier chargement : ${budgetKb} Ko (gzip)\n`);

for (const htmlPath of findHtmlFiles(pagesDir)) {
  const report = measurePage(htmlPath, clientDir, pageLabel(htmlPath, pagesDir));
  const ratio = report.jsGzip / 1024 / budgetKb;
  const ok = report.jsGzip / 1024 <= budgetKb;
  if (!ok) failed = true;

  console.log(`${ok ? '✔' : '✗'} ${report.page}`);
  console.log(
    `    JS   ${kb(report.jsGzip)} Ko gzip (${kb(report.jsBrotli)} Ko brotli) — ${(ratio * 100).toFixed(0)} % du budget, ${report.js.length} fichier(s)`
  );
  console.log(`    CSS  ${kb(report.cssGzip)} Ko gzip`);
  console.log(`    HTML ${kb(report.html.gzip)} Ko gzip`);
  for (const f of [...report.js].sort((a, b) => b.gzip - a.gzip).slice(0, 5)) {
    console.log(`      · ${f.file.replace('_app/immutable/', '')}  ${kb(f.gzip)} Ko`);
  }
}

if (failed) {
  console.error(`\nBudget dépassé (> ${budgetKb} Ko). Voir docs/decisions.md pour la marche à suivre.`);
  process.exit(1);
}
console.log('\nBudget respecté.');
