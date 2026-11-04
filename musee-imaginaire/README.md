# Musée imaginaire *(nom provisoire)*

Jeu web de collection d'art : tirer des peintres et des œuvres célèbres dans des lots gratuits, les faire progresser par missions, composer des salles de musée avec synergies de traits, échanger des exemplaires numérotés. Mobile d'abord, installable.

> Étape 0 — Fondations. Voir `docs/decisions.md` pour les choix, `docs/pipeline.md` pour l'import des œuvres.

## Démarrer

Prérequis : Node ≥ 22.17 (`.nvmrc`), pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev            # http://localhost:5173 — vitrine des cartes
```

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | Application web |
| `pnpm check` | Types (Svelte + TypeScript) |
| `pnpm test` | Tests (règles, catalogue, pipeline, i18n, budget) |
| `pnpm validate` | Valide le catalogue (schéma + cohérence) |
| `pnpm budget` | Vérifie < 200 Ko de JS compressé au premier chargement (après `pnpm build`) |
| `pnpm verify` | Tout ce qui précède, comme la CI |
| `pnpm pipeline:candidates` / `pipeline:build` | Importer les œuvres (voir `docs/pipeline.md`) |

## Organisation

```
apps/web/            application SvelteKit (cartes, pages)
packages/rules/      règles du jeu pures (partagées client / serveur)
packages/catalog/    schéma, validation et données (styles, peintres, traits, œuvres)
scripts/pipeline/    import des œuvres (API du musée → images optimisées)
scripts/             garde-fou de poids
docs/                décisions et mode d'emploi
```

## Changer le nom du jeu

Une seule ligne : `APP_NAME` dans `apps/web/src/lib/config.ts`.

## Déploiement (plus tard)

Cible : Cloudflare Workers (`apps/web/wrangler.jsonc`). Pas encore de compte configuré : rien à déployer à l'étape 0.
