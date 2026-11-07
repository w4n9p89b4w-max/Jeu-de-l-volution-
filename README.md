# L'Évolution — de la Préhistoire au monde moderne

Un petit jeu de gestion jouable dans le navigateur (pensé pour le téléphone, en format portrait).

> *Et si on créait un pays… ?* Une vallée immense entourée de montagnes. Pour l'instant, il n'y a **rien**.

## Déroulement

1. **Nom et drapeau** : donnez un nom à votre pays et dessinez son drapeau (motif, couleurs, symbole).
2. **Premier vote : où fonde-t-on le pays ?**
   - **A — au bord de la rivière** : de l'eau et des terres fertiles (+25 % de nourriture).
   - **B — au bord du lac** : la pêche et un port (+3 🍖 et +2 💰 par jour).
3. **Chaque jour, vous votez** une seule action :
   - 🏠 **Constructions** : huttes, champs, temples, châteaux, usines, gratte-ciel…
   - 📜 **Lois** : partage du gibier, impôt, suffrage universel, transition écologique…
   - ⚔️ **Guerres** : recruter, attaquer les voisins, fortifier, signer la paix.
   - 💡 **Découvertes** : les 3 découvertes d'une ère font passer à la suivante.
4. La nuit tombe, la production tombe, la population grandit… et des événements surviennent (récoltes, épidémies, invasions, manifs !).

**Les 6 ères** : Préhistoire → Antiquité → Moyen Âge → Renaissance → Révolution industrielle → Monde moderne.

**But** : découvrir la conquête spatiale et lancer la première fusée du pays 🚀.

La vallée évolue sous vos yeux : les bâtiments de chaque époque apparaissent, les chemins deviennent des routes, les habitants se promènent.
La partie est sauvegardée automatiquement dans le navigateur.

## Lancer le jeu

Aucune installation : ouvrez `index.html`, ou servez le dossier (GitHub Pages fonctionne aussi).

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Fichiers

- `engine.js` — règles, données (ères, constructions, lois, découvertes, événements) et simulation, sans DOM.
- `map.js` — rendu de la vallée sur canvas (montagnes, rivière, lac, arbres, bâtiments, habitants).
- `main.js` — interface : écrans de départ, HUD, vote du jour, modales, sauvegarde.
- `style.css`, `index.html`.
