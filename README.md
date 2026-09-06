# Jeu de l'Évolution — Civilisation

Un jeu de gestion de civilisation jouable directement dans le navigateur, sans installation. Incarnez une civilisation naissante : récoltez des matières premières, construisez des bâtiments, faites grandir votre population et débloquez des technologies pour explorer une carte composée de plusieurs biomes.

## Principe

- **Récolte** : envoyez vos villageois récolter du **bois** (forêts), de la **pierre** (carrières / montagnes) et de la **nourriture** (gibier, poisson) directement sur la carte.
- **Construction** : bâtissez des **maisons** (capacité de population), des **entrepôts** (capacité de stockage), des **champs** et des **enclos à animaux** (production passive de nourriture). Chaque bâtiment doit être placé sur un biome compatible.
- **Population** : si vous avez assez de nourriture en réserve et de la place dans vos maisons, la population se reproduit automatiquement.
- **Expérience et niveaux** : chaque récolte et chaque construction rapporte de l'expérience. Monter de niveau octroie des **points de technologie**.
- **Technologies** : dépensez vos points dans l'arbre technologique pour améliorer vos rendements, réduire les coûts de construction, débloquer l'élevage… et surtout **débloquer de nouvelles zones de récolte** sur la carte.
- **Carte et biomes** : la carte est générée aléatoirement à chaque nouvelle partie et contient 7 biomes (**forêt, carrière, plaine, rivière, plage, océan, montagne**). Elle est bien plus grande que l'écran : un système de navigation (glisser-déposer, flèches/ZQSD, mini-carte cliquable) permet de s'y déplacer.

## Contrôles

- **Glisser la souris** sur la carte, ou **flèches / ZQSD** : déplace la caméra.
- **Mini-carte** (coin supérieur droit de la carte) : cliquer dessus recentre la caméra à cet endroit.
- **Mode Explorer** : cliquez sur une case pour l'inspecter (biome, ressource, bâtiment) et assigner/retirer des travailleurs sur les gisements de ressources.
- **Mode Construire** : choisissez un bâtiment dans la palette puis cliquez sur une case valide de la carte pour le construire.
- **Technologies** : ouvre l'arbre technologique pour dépenser vos points.
- **Pause / Nouvelle carte** : met la simulation en pause, ou régénère une toute nouvelle carte et recommence la partie.

## Lancer le jeu

Aucune installation n'est nécessaire : ouvrez simplement `index.html` dans un navigateur, ou servez le dossier avec un serveur statique (par exemple GitHub Pages).

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```
