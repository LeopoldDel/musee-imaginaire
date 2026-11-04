# Pipeline de contenu (œuvres pilotes)

Les œuvres viennent de l'API publique de l'Art Institute of Chicago (domaine public, CC0). Le pipeline s'exécute **sur votre machine** (accès internet requis) en deux commandes.

## 1. Proposer des œuvres

```bash
pnpm pipeline:candidates
```

- Interroge le musée pour chaque peintre listé dans `scripts/pipeline/pilot.json` (nombre d'œuvres visé, titres à privilégier).
- Écrit `packages/catalog/data/selection.json` : la **proposition**, à relire.
- Écrit `scripts/pipeline/.cache/candidates.json` : tous les candidats utilisables, pour choisir autrement.
- Ne réécrit jamais une sélection existante sans `--force`.

## 2. Relire `selection.json`

Pour chaque entrée :

- ouvrir `https://www.artic.edu/artworks/<objectId>` et vérifier que c'est bien l'œuvre voulue ;
- corriger `genre` (paysage, portrait, scene-de-genre, scene-urbaine, nature-morte, marine) — il est deviné à partir du titre ;
- ajouter `titleFr` (le titre du musée est en anglais) ;
- ajuster `rarity` si l'œuvre doit être plus rare que son peintre (sinon : celle du peintre).

## 3. Fabriquer

```bash
pnpm pipeline:build
pnpm validate
```

Pour chaque œuvre : métadonnées relues auprès du musée, refus si hors domaine public, téléchargement, variantes WebP + AVIF (320 / 640 / 1280 px, jamais agrandies) dans `apps/web/static/art/`, miniature floue, couleur dominante, rang de carrière (ordre chronologique) — puis `works.json` est écrit **seulement si le catalogue entier est valide**.

## Garanties et limites

- Les clients sont identifiés par un en-tête générique ; une pause est observée entre les requêtes.
- La forme des réponses de l'API a été écrite d'après la documentation sans pouvoir l'interroger depuis l'environnement de développement initial : elle est validée à chaque appel. Si l'API a changé, l'erreur indique le champ fautif — il suffit d'ajuster `scripts/pipeline/lib/aic.ts`.
- Les tests du pipeline utilisent des données **synthétiques** (identifiants fictifs `9000xx`) ; aucune de ces valeurs ne doit entrer dans le catalogue.
