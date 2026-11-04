# Décisions d'architecture — Étape 0

Journal court : une décision, la raison, ce qui la remettrait en cause. Les versions sont celles vérifiées le 3 novembre 2026.

## Outils

| Sujet | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript partout (client, serveur, règles, scripts) | Les règles du jeu sont écrites une fois et partagées. |
| Dépôt | Monorepo pnpm 10 (`apps/`, `packages/`, `scripts/`) | Un seul endroit, une seule CI. |
| Interface | SvelteKit 3.1 + Svelte 5.57 (runes), Vite 8 | Très léger à l'exécution : l'essentiel du budget reste pour le jeu. |
| TypeScript | **~6.0**, pas 7 | SvelteKit 3 exige `^6`. |
| Tests | Vitest 5 | Même moteur que Vite. |
| Schéma du catalogue | Valibot | Quelques Ko, types déduits, messages d'erreur exploitables. |
| Images | `sharp` (dans le pipeline, jamais dans l'app) | WebP + AVIF, miniature floue, couleur dominante. |
| Hébergement | Cloudflare Workers + assets statiques (adaptateur officiel) | Prévu pour D1 / Durable Objects / R2 aux étapes suivantes. |
| Polices | Cormorant Garamond (titres) + Inter variable (interface), auto-hébergées via Fontsource | Pas de requête vers un tiers ; sous-ensemble latin chargé seulement quand nécessaire. |
| Connexion | **À confirmer à l'étape 4** : Better Auth + Drizzle (D1) | L'intégration SvelteKit + Cloudflare n'est pas encore éprouvée → petite expérience avant de s'engager. |
| Comptes | GitHub seulement pour l'instant | Pas encore de compte Cloudflare ni Google. |

## Produit

- **Nom** : « Musée imaginaire », *provisoire*. Il n'existe qu'à un seul endroit : `apps/web/src/lib/config.ts` (`APP_NAME`). Les textes l'interpolent (`{appName}`). Changer de nom = changer une ligne.
- **Langue** : français rédigé, structure prête pour d'autres langues (`apps/web/src/lib/i18n/`, clés typées) ; côté catalogue, chaque texte est `{ fr, en? }`.
- **Premier style** : Impressionnisme. Huit peintres proposés (Monet légendaire ; Renoir, Degas, Cassatt rares ; Pissarro, Sisley, Morisot, Caillebotte communs) — **proposition à valider** : la rareté d'un peintre découle de sa notoriété, c'est un jugement éditorial.
- **3ᵉ trait** (provisoire) : l'**époque**, par décennie (« Années 1870 »). Les deux premiers (courant, genre) sont arrêtés. Alternatives : pays, technique.
- **Rareté d'une œuvre** : par défaut celle de son peintre, modifiable œuvre par œuvre dans `selection.json`.

## Poids

- Budget : **200 Ko de JavaScript compressé (gzip) au premier chargement**, vérifié par `pnpm budget` à chaque push (la CI échoue sinon).
- Mesure actuelle : voir `pnpm budget` (autour de 40 Ko pour la page de démonstration).
- Ce qui est chargé *après* interaction (PixiJS et GSAP pour l'ouverture des lots) n'est pas compté, mais doit rester en import dynamique.
- Si le budget est dépassé : (1) chercher le module responsable avec le détail affiché par le script, (2) le passer en import dynamique, (3) n'élargir le budget qu'en dernier recours, par une décision écrite ici.

## Cartes

- Un seul composant `Card.svelte`, trois tailles (`thumb`, `card`, `detail`) pilotées par la largeur du parent (unités de conteneur).
- Le tableau n'est jamais recadré : il est posé entier sur un passe-partout.
- Raretés : commune = cadre sobre ; rare = filet doré + reflet qui suit le doigt ; légendaire = feuille holographique sur le cadre + reflet + un balayage de lumière à l'apparition.
- Effets écrits maison (le dépôt « pokemon-cards-css » est en GPL-3.0 : on s'en inspire pour le principe, on ne copie pas le code).
- `prefers-reduced-motion` : plus d'inclinaison ni de balayage.
- Thèmes : tout passe par des variables CSS (`styles/tokens.css`). Le thème « nuit » existe pour prouver que l'habillage est interchangeable.

## Contenu

- Sources : Art Institute of Chicago (API publique, œuvres du domaine public en CC0) en premier ; Met Open Access ensuite.
- La licence CC0 est vérifiée à deux endroits : le pipeline refuse toute œuvre non publique, et le schéma n'accepte que `CC0`.
- Chaque œuvre garde son crédit tel que le musée le demande (« Artiste. Titre, Date. The Art Institute of Chicago. »).
- Les images d'origine ne sont pas versionnées (`.gitignore`) : elles se régénèrent avec `pnpm pipeline:build`.

## Questions ouvertes (non bloquantes pour l'étape 0)

- Liste définitive des 8 styles et des ~80 peintres.
- Plafond de revenus hors-ligne dans le musée.
- Mécanique exacte des « ateliers » (œuvre commune livrée par les missions).
- Nombre d'exemplaires par rareté (ex. légendaire 25, rare 120 : valeurs de démonstration, non arrêtées).
- Sons, palettes définitives des thèmes.
