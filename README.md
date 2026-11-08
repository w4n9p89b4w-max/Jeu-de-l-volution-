# L'Évolution — de la Préhistoire au monde moderne

Un petit jeu de gestion jouable dans le navigateur (pensé pour le téléphone, en format portrait).

> *Et si on créait un pays… ?* Une vallée immense entourée de montagnes. Pour l'instant, il n'y a **rien**.

## Déroulement

1. **Nom et drapeau** : donnez un nom à votre pays et dessinez son drapeau (motif, couleurs, symbole).
2. **Premier choix : où fonde-t-on le pays ?**
   - **A — au bord de la rivière** : de l'eau et des terres fertiles (+25 % de nourriture).
   - **B — au bord du lac** : la pêche et un port (+3 🍖 et +2 💰 par jour).
3. **Chaque jour dure 40 secondes** (⏸️ pause, vitesse ×1 / ×2 / ×4). Pendant la journée, vous faites **un seul choix** :
   - 🏠 **Constructions** : huttes, champs, temples, châteaux, usines, gratte-ciel…
   - 📜 **Lois** : partage du gibier, impôt, suffrage universel, transition écologique…
   - ⚔️ **Guerres** : recruter, attaquer les voisins, fortifier, signer la paix.
   - 🔬 **Recherche** (ne compte pas comme le choix du jour ; il faut d'abord construire le **Centre de recherche**) : une file de recherches nourrie chaque nuit par le savoir 💡. Elle débloque les découvertes (3 par ère pour passer à la suivante), les nouvelles constructions, les améliorations et les armes. La pratique rend une recherche 2 fois moins chère.
4. La nuit tombe, la production tombe, la population grandit… et des événements surviennent (récoltes, épidémies, manifs !).
5. **La guerre** : à chaque ère, un ennemi envoie une armée tous les 7 jours (pillages, bâtiments incendiés). La seule façon d’y mettre fin : recruter une armée et aller le vaincre (sa vie tombe à chaque attaque). Vaincu, il ne revient plus ; un nouvel ennemi arrive à l’ère suivante. Les soldats ont les armes de leur époque et chassent en temps de paix.
5. Parfois, un **dilemme** vous oblige à choisir entre **A** et **B** : accueillir des réfugiés ou fermer la frontière, couper la forêt ou la protéger, ouvrir une mine de charbon sous les champs…

**Les ressources** : 🍖 nourriture, 🪵 bois, 🪨 pierre, 🔩 fer (dès le Moyen Âge), ⚫ charbon (dès la Renaissance), 💰 or et 💡 savoir.
**La Maison commune** : la première construction (Grande hutte du clan). Sans elle, personne ne travaille ; son niveau fixe combien de villageois peuvent avoir une tâche. On l'agrandit à chaque ère : Palais, Beffroi, Hôtel de ville, Palais du gouvernement, Capitole.

**Les villageois** (bouton 👷) : chaque habitant a un nom, une **force** (×1,6 dans une tâche) et une **faiblesse** (×0,5 dans une autre), et gagne de l'expérience. Tâches : chasse, bûcheron, pierres, mineur de fer, mineur de charbon, savant, marchand, garde, ou rester au village. Comme dans *Oxygen Not Included* : on règle **combien de villageois envoyer** à chaque tâche (ou on laisse le jeu le faire) et les **préférences** de chacun (haute, normale, basse, jamais) ; le jeu envoie d'abord les plus motivés, puis les plus forts. Après les *Outils en pierre*, le jeu propose d'ouvrir une **carrière**. La chasse progresse de la même façon : chasseurs en forêt, puis **appâts et pièges** (+50 %), puis **camp de chasse**. Presque tout progresse ainsi **par la pratique** : haches en silex pour les bûcherons, leviers pour la pierre, conteurs pour les savants, tours de guet pour les gardes… l'**agriculture** (agriculteurs, puis champ, charrue, moulin, irrigation, fermes), les **maisons** (hutte → maison en pierre → colombages → hôtel → immeuble → gratte-ciel)… et surtout **les armes** : à chaque ère, 3 étapes (entraînement, bataille, atelier d’armes), chacune +25 % de force.
Carrières et mines s'installent au pied des montagnes ; hauts-fourneaux et usines consomment du charbon.

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
- `main.js` — interface : écrans de départ, HUD, choix du jour, modales, sauvegarde.
- `rules.js` — l'annexe « Règles du jeu » (☰ Menu → Règles), générée à partir des données du jeu.
- `style.css`, `index.html`.
