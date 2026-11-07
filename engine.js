/* ==========================================================================
   L'Évolution — moteur du jeu (règles, données, simulation)
   Aucun accès au DOM ici : ce fichier peut aussi tourner sous Node pour
   tester l'équilibrage.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---------- Les ères ---------- */
  const ERAS = [
    { name: 'Préhistoire', year: '-10 000', enemy: 'la tribu voisine',
      intro: 'Une poignée de chasseurs-cueilleurs s\'installe dans la vallée.' },
    { name: 'Antiquité', year: '-800', enemy: 'la cité rivale',
      intro: 'L\'agriculture a tout changé : les villages deviennent des cités de pierre.' },
    { name: 'Moyen Âge', year: '1000', enemy: 'le seigneur voisin',
      intro: 'On creuse les premières mines de fer. Châteaux, moulins et cathédrales sortent de terre.' },
    { name: 'Renaissance', year: '1500', enemy: 'le royaume voisin',
      intro: 'Les arts et les sciences renaissent. Sous la montagne, on trouve du charbon…' },
    { name: 'Révolution industrielle', year: '1850', enemy: 'l\'empire voisin',
      intro: 'Le charbon et le fer font tourner les usines et les trains.' },
    { name: 'Monde moderne', year: '2000', enemy: 'la puissance rivale',
      intro: 'Électricité, informatique, internet… et bientôt les étoiles ?' },
  ];

  /* ---------- Ressources ---------- */
  const RES = ['food', 'wood', 'stone', 'iron', 'coal', 'gold', 'sci'];
  const RES_ICONS = { food: '🍖', wood: '🪵', stone: '🪨', iron: '🔩', coal: '⚫', gold: '💰', sci: '💡', happy: '😊', cap: '🏠', def: '🛡️' };
  const RES_NAMES = { food: 'Nourriture', wood: 'Bois', stone: 'Pierre', iron: 'Fer', coal: 'Charbon', gold: 'Or', sci: 'Savoir', happy: 'Bonheur', cap: 'Logements', def: 'Défense' };

  /* ---------- Constructions ----------
     eff : food, wood, stone, iron, coal, gold, sci, happy, cap, def     */
  const BUILDINGS = [
    // Préhistoire
    { id: 'hutte', era: 0, name: 'Hutte', icon: '🛖', arch: 'hut', cost: { wood: 6 }, eff: { cap: 6 }, desc: 'Un abri de branches et de peaux.' },
    { id: 'chasse', era: 0, name: 'Camp de chasse', icon: '🏹', arch: 'camp', cost: { wood: 5 }, eff: { food: 4 }, desc: 'Les chasseurs ramènent du gibier.' },
    { id: 'carriere', era: 0, name: 'Carrière', icon: '🪨', arch: 'quarry', cost: { wood: 8 }, eff: { stone: 4 }, req: 'outils', desc: 'Une vraie carrière : bien plus efficace que ramasser des cailloux.' },
    { id: 'feu', era: 0, name: 'Cercle du feu', icon: '🔥', arch: 'fire', cost: { wood: 5, stone: 3 }, eff: { happy: 5, sci: 1 }, desc: 'On s\'y réunit pour raconter des histoires.' },
    { id: 'menhir', era: 0, name: 'Menhir', icon: '🗿', arch: 'menhir', cost: { stone: 12 }, eff: { happy: 4, sci: 1 }, desc: 'Une pierre dressée vers le ciel.' },
    // Antiquité
    { id: 'champ', era: 1, name: 'Champ de blé', icon: '🌾', arch: 'field', cost: { wood: 8 }, eff: { food: 8 }, desc: 'Les premières récoltes.' },
    { id: 'maison', era: 1, name: 'Maison en pierre', icon: '🏠', arch: 'house', cost: { wood: 5, stone: 12 }, eff: { cap: 14 }, desc: 'Solide et durable.' },
    { id: 'marche', era: 1, name: 'Marché', icon: '🏺', arch: 'market', cost: { wood: 10, stone: 5 }, eff: { gold: 4 }, desc: 'On y échange poteries et épices.' },
    { id: 'temple', era: 1, name: 'Temple', icon: '🏛️', arch: 'temple', cost: { stone: 25, gold: 10 }, eff: { happy: 8, sci: 2 }, desc: 'Colonnes de marbre et offrandes.' },
    { id: 'biblio', era: 1, name: 'Bibliothèque', icon: '📜', arch: 'library', cost: { wood: 10, stone: 12, gold: 15 }, eff: { sci: 4 }, desc: 'Des rouleaux de papyrus par milliers.' },
    // Moyen Âge
    { id: 'minefer', era: 2, name: 'Mine de fer', icon: '⛏️', arch: 'mine', cost: { wood: 20, stone: 15 }, eff: { iron: 4 }, req: 'metal', desc: 'Creuser la montagne pour trouver du minerai.' },
    { id: 'moulin', era: 2, name: 'Moulin', icon: '🌬️', arch: 'mill', cost: { wood: 20, stone: 8, gold: 10 }, eff: { food: 14 }, desc: 'Le vent moud le grain.' },
    { id: 'colombage', era: 2, name: 'Maison à colombages', icon: '🏘️', arch: 'timber', cost: { wood: 25, stone: 8, gold: 10 }, eff: { cap: 22 }, desc: 'Des maisons serrées le long des ruelles.' },
    { id: 'scierie', era: 2, name: 'Scierie', icon: '🪚', arch: 'sawmill', cost: { wood: 15, stone: 10, iron: 5 }, eff: { wood: 10 }, desc: 'Des lames de fer pour couper plus vite.' },
    { id: 'monastere', era: 2, name: 'Monastère', icon: '📖', arch: 'monastery', cost: { stone: 40, gold: 20 }, eff: { sci: 7 }, desc: 'Les moines recopient les savoirs anciens.' },
    { id: 'chateau', era: 2, name: 'Château fort', icon: '🏰', arch: 'castle', cost: { stone: 60, iron: 10, gold: 30 }, eff: { def: 20, happy: 3 }, desc: 'Remparts, tours et pont-levis.' },
    { id: 'cathedrale', era: 2, name: 'Cathédrale', icon: '⛪', arch: 'church', cost: { stone: 70, gold: 40 }, eff: { happy: 12 }, desc: 'Un chantier de plusieurs générations.' },
    // Renaissance
    { id: 'minecharbon', era: 3, name: 'Mine de charbon', icon: '⚫', arch: 'coalmine', cost: { wood: 30, stone: 20, iron: 10 }, eff: { coal: 5 }, desc: 'Le « charbon de terre » brûle mieux que le bois.' },
    { id: 'tailleurs', era: 3, name: 'Atelier de tailleurs de pierre', icon: '🧱', arch: 'stoneyard', cost: { wood: 20, iron: 10 }, eff: { stone: 14 }, desc: 'Des blocs taillés au millimètre.' },
    { id: 'ferme', era: 3, name: 'Grande ferme', icon: '🐄', arch: 'barn', cost: { wood: 30, iron: 5, gold: 20 }, eff: { food: 22 }, desc: 'Élevage et cultures variées.' },
    { id: 'hotel', era: 3, name: 'Hôtel particulier', icon: '🏡', arch: 'mansion', cost: { wood: 10, stone: 45, gold: 30 }, eff: { cap: 35 }, desc: 'De belles demeures en pierre de taille.' },
    { id: 'banque', era: 3, name: 'Banque', icon: '🏦', arch: 'bank', cost: { stone: 50, gold: 30 }, eff: { gold: 15 }, desc: 'Prêts, crédits et lettres de change.' },
    { id: 'universite', era: 3, name: 'Université', icon: '🎓', arch: 'university', cost: { wood: 20, stone: 50, gold: 50 }, eff: { sci: 12 }, desc: 'Savants et étudiants débattent.' },
    { id: 'theatre', era: 3, name: 'Théâtre', icon: '🎭', arch: 'theatre', cost: { wood: 30, stone: 30, gold: 40 }, eff: { happy: 12 }, desc: 'Comédies et tragédies.' },
    // Révolution industrielle
    { id: 'hautfourneau', era: 4, name: 'Haut-fourneau', icon: '🔥', arch: 'furnace', cost: { stone: 50, coal: 30 }, eff: { iron: 15, coal: -4, happy: -3 }, desc: 'Transforme le charbon en fer… à grand feu.' },
    { id: 'usine', era: 4, name: 'Usine', icon: '🏭', arch: 'factory', cost: { stone: 40, iron: 40, coal: 20 }, eff: { gold: 25, wood: 10, coal: -3, happy: -4 }, desc: 'Production de masse… et fumée noire.' },
    { id: 'immeuble', era: 4, name: 'Immeuble ouvrier', icon: '🏢', arch: 'tenement', cost: { stone: 60, iron: 30, gold: 40 }, eff: { cap: 70 }, desc: 'Loger les ouvriers près des usines.' },
    { id: 'meca', era: 4, name: 'Ferme mécanisée', icon: '🚜', arch: 'tractor', cost: { iron: 40, coal: 20, gold: 50 }, eff: { food: 40 }, desc: 'Les machines remplacent les bras.' },
    { id: 'gare', era: 4, name: 'Gare', icon: '🚂', arch: 'station', cost: { iron: 60, coal: 40, gold: 60 }, eff: { gold: 25, stone: 10 }, desc: 'Le chemin de fer relie le pays au monde.' },
    { id: 'ecole', era: 4, name: 'École publique', icon: '🏫', arch: 'school', cost: { wood: 20, stone: 50, gold: 60 }, eff: { sci: 20, happy: 4 }, desc: 'Apprendre à lire, écrire, compter.' },
    // Monde moderne
    { id: 'eolien', era: 5, name: 'Parc éolien', icon: '🌀', arch: 'wind', cost: { iron: 60, gold: 80 }, eff: { gold: 20, coal: 10, happy: 5 }, desc: 'Une énergie propre : plus besoin de brûler autant de charbon.' },
    { id: 'gratteciel', era: 5, name: 'Gratte-ciel', icon: '🏙️', arch: 'tower', cost: { stone: 80, iron: 120, gold: 120 }, eff: { cap: 160 }, desc: 'La ville grandit vers le ciel.' },
    { id: 'vertical', era: 5, name: 'Ferme verticale', icon: '🥬', arch: 'greentower', cost: { stone: 40, iron: 80, gold: 100 }, eff: { food: 80 }, desc: 'Des cultures sur 30 étages.' },
    { id: 'hopital', era: 5, name: 'Hôpital', icon: '🏥', arch: 'hospital', cost: { stone: 80, iron: 40, gold: 100 }, eff: { happy: 10, cap: 20 }, desc: 'Soigner tout le monde.' },
    { id: 'recyclage', era: 5, name: 'Centre de recyclage', icon: '♻️', arch: 'recycle', cost: { stone: 60, gold: 80 }, eff: { iron: 20, stone: 10, happy: 2 }, desc: 'Rien ne se perd : le vieux métal redevient neuf.' },
    { id: 'labo', era: 5, name: 'Centre de recherche', icon: '🔬', arch: 'lab', cost: { stone: 60, iron: 80, gold: 120 }, eff: { sci: 40 }, desc: 'Physique, biologie, intelligence artificielle…' },
    { id: 'fusee', era: 5, name: 'Base spatiale', icon: '🚀', arch: 'rocket', cost: { stone: 150, iron: 250, coal: 100, gold: 300 }, eff: {}, req: 'espace', unique: true, desc: 'Lancer la première fusée du pays. VICTOIRE !' },
  ];

  /* ---------- Découvertes (3 par ère : les 3 = ère suivante) ---------- */
  const DISCOVERIES = [
    { id: 'feu', era: 0, name: 'Maîtrise du feu', icon: '🔥', cost: 8, eff: { happy: 5, food: 1 }, desc: 'Cuire, se chauffer, éloigner les bêtes.' },
    { id: 'outils', era: 0, name: 'Outils en pierre', icon: '🪓', cost: 13, eff: { wood: 1, stone: 1 }, desc: 'Silex taillé. Débloque la Carrière.' },
    { id: 'agriculture', era: 0, name: 'Agriculture', icon: '🌱', cost: 19, eff: { food: 3 }, desc: 'Planter des graines plutôt que les chercher.' },

    { id: 'ecriture', era: 1, name: 'Écriture', icon: '✍️', cost: 32, eff: { sci: 2 }, desc: 'Garder la mémoire des choses.' },
    { id: 'roue', era: 1, name: 'La roue', icon: '☸️', cost: 41, eff: { wood: 2, stone: 2 }, desc: 'Transporter plus, plus loin.' },
    { id: 'monnaie', era: 1, name: 'Monnaie', icon: '🪙', cost: 48, eff: { gold: 3 }, desc: 'Des pièces pour commercer.' },

    { id: 'metal', era: 2, name: 'Métallurgie du fer', icon: '⚒️', cost: 65, eff: { iron: 1, def: 10 }, desc: 'Fondre le minerai. Débloque la Mine de fer.' },
    { id: 'assolement', era: 2, name: 'Assolement triennal', icon: '🌾', cost: 82, eff: { food: 8 }, desc: 'Faire tourner les cultures.' },
    { id: 'boussole', era: 2, name: 'Boussole', icon: '🧭', cost: 89, eff: { gold: 5 }, desc: 'Naviguer et commercer au loin.' },

    { id: 'imprimerie', era: 3, name: 'Imprimerie', icon: '📰', cost: 113, eff: { sci: 6 }, desc: 'Des livres pour tout le monde.' },
    { id: 'astronomie', era: 3, name: 'Astronomie', icon: '🔭', cost: 138, eff: { sci: 4, happy: 3 }, desc: 'La Terre tourne autour du Soleil !' },
    { id: 'change', era: 3, name: 'Lettre de change', icon: '📜', cost: 154, eff: { gold: 8 }, desc: 'L\'ancêtre du chèque.' },

    { id: 'vapeur', era: 4, name: 'Machine à vapeur', icon: '⚙️', cost: 194, eff: { coal: 6, iron: 6 }, desc: 'La force du charbon pompe l\'eau des mines.' },
    { id: 'electricite', era: 4, name: 'Électricité', icon: '💡', cost: 227, eff: { gold: 10, happy: 5 }, desc: 'La lumière dans chaque maison.' },
    { id: 'vaccins', era: 4, name: 'Vaccins', icon: '💉', cost: 259, eff: { happy: 8 }, desc: 'Fini les grandes épidémies.' },

    { id: 'informatique', era: 5, name: 'Informatique', icon: '💻', cost: 292, eff: { sci: 20 }, desc: 'Des machines qui calculent.' },
    { id: 'internet', era: 5, name: 'Internet', icon: '🌐', cost: 341, eff: { gold: 20, happy: 5 }, desc: 'Le monde entier connecté.' },
    { id: 'espace', era: 5, name: 'Conquête spatiale', icon: '🛰️', cost: 406, eff: {}, desc: 'Débloque la Base spatiale.' },
  ];

  /* ---------- Lois (adoptées une fois, effet permanent) ---------- */
  const LAWS = [
    { id: 'partage', era: 0, name: 'Partage du gibier', icon: '🍖', cost: {}, eff: { happy: 6, food: -1 }, desc: 'Chacun reçoit sa part de la chasse.' },
    { id: 'anciens', era: 0, name: 'Conseil des anciens', icon: '👴', cost: {}, eff: { sci: 1, happy: 2 }, desc: 'Les plus sages décident.' },
    { id: 'chef', era: 0, name: 'Chef de guerre', icon: '🪖', cost: {}, eff: { def: 5 }, desc: 'Un meneur pour défendre la tribu.' },

    { id: 'code', era: 1, name: 'Code de lois', icon: '⚖️', cost: { gold: 5 }, eff: { happy: 5 }, desc: 'Les mêmes règles pour tous.' },
    { id: 'impot', era: 1, name: 'Impôt', icon: '💰', cost: {}, eff: { gold: 6, happy: -4 }, desc: 'Chacun paie sa part au trésor.' },
    { id: 'service', era: 1, name: 'Service militaire', icon: '🛡️', cost: {}, eff: { def: 10, happy: -2 }, desc: 'Tous les jeunes s\'entraînent.' },

    { id: 'corvee', era: 2, name: 'Corvée', icon: '⛏️', cost: {}, eff: { stone: 8, wood: 4, happy: -6 }, desc: 'Travail obligatoire pour le seigneur.' },
    { id: 'charte', era: 2, name: 'Charte des villes', icon: '📃', cost: { gold: 15 }, eff: { gold: 5, happy: 3 }, desc: 'Les villes s\'administrent elles-mêmes.' },
    { id: 'fetes', era: 2, name: 'Fêtes de village', icon: '🎉', cost: {}, eff: { happy: 8, gold: -2 }, desc: 'Banquets, danses et tournois.' },

    { id: 'mecenat', era: 3, name: 'Mécénat', icon: '🎨', cost: { gold: 30 }, eff: { sci: 5, happy: 5, gold: -3 }, desc: 'Financer peintres et inventeurs.' },
    { id: 'expression', era: 3, name: 'Liberté d\'expression', icon: '🗣️', cost: {}, eff: { sci: 4, happy: 4 }, desc: 'Chacun peut dire ce qu\'il pense.' },
    { id: 'libreechange', era: 3, name: 'Libre-échange', icon: '⚓', cost: { gold: 20 }, eff: { gold: 10 }, desc: 'Ouvrir les ports au commerce.' },

    { id: 'obligatoire', era: 4, name: 'École obligatoire', icon: '📚', cost: { gold: 40 }, eff: { sci: 10, gold: -5 }, desc: 'Tous les enfants à l\'école.' },
    { id: 'huitheures', era: 4, name: 'Journée de 8 heures', icon: '⏰', cost: {}, eff: { happy: 10, iron: -3, coal: -2 }, desc: 'Travailler moins, vivre mieux.' },
    { id: 'suffrage', era: 4, name: 'Suffrage universel', icon: '🗳️', cost: {}, eff: { happy: 12 }, desc: 'Tout le monde peut voter.' },

    { id: 'ecologie', era: 5, name: 'Transition écologique', icon: '🌍', cost: { gold: 80 }, eff: { happy: 10, coal: -5 }, desc: 'Fermer les vieilles mines, protéger la vallée.' },
    { id: 'secu', era: 5, name: 'Sécurité sociale', icon: '🩺', cost: { gold: 60 }, eff: { happy: 10, gold: -10 }, desc: 'Se soigner sans se ruiner.' },
    { id: 'science', era: 5, name: 'Recherche ouverte', icon: '🧪', cost: { gold: 50 }, eff: { sci: 25, gold: -5 }, desc: 'Partager les découvertes.' },
  ];

  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const B = byId(BUILDINGS), D = byId(DISCOVERIES), L = byId(LAWS);

  /* ---------- État ---------- */
  function newState(name, flag) {
    return {
      v: 2, name: name || 'Pays sans nom', flag: flag || null, site: null,
      day: 1, era: 0, pop: 5, villagers: [], nextId: 1, happy: 60, army: 0, fort: 0, peaceUntil: 0,
      res: { food: 15, wood: 12, stone: 4, iron: 0, coal: 0, gold: 0, sci: 0 },
      buildings: [], disc: [], laws: [], log: [], pending: null,
      won: false, lost: false, stats: { battles: 0, victories: 0, built: 0 },
    };
  }

  // Mettre à jour une ancienne sauvegarde (version « matériaux »)
  function migrate(s) {
    if (!s) return s;
    s.buildings = s.buildings.filter((b) => b.id !== 'bucheron');   // le camp de bûcherons n'existe plus
    if (!s.villagers) {
      // ancienne sauvegarde : on crée les villageois et on les répartit
      s.villagers = []; s.nextId = 1;
      syncVillagers(s);
      autoAssign(s);
    }
    delete s.forest; delete s.quarry;
    if (s.v === 2) return s;
    const mat = s.res.mat || 0;
    s.res = { food: s.res.food || 0, wood: Math.round(mat * 0.6), stone: Math.round(mat * 0.4), iron: s.era >= 2 ? 10 : 0, coal: s.era >= 3 ? 10 : 0, gold: s.res.gold || 0, sci: s.res.sci || 0 };
    s.buildings = s.buildings.filter((b) => B[b.id]);
    s.disc = s.disc.filter((d) => D[d]);
    s.won = false; s.pending = null; s.v = 2;
    return s;
  }

  function addEff(t, eff, k) {
    for (const key in eff) t[key] = (t[key] || 0) + eff[key] * (k == null ? 1 : k);
  }

  function totals(s) {
    const t = { food: 0, wood: 0, stone: 0, iron: 0, coal: 0, gold: 0, sci: 0, happy: 0, cap: 0, def: 0 };
    for (const b of s.buildings) addEff(t, B[b.id].eff);
    for (const d of s.disc) addEff(t, D[d].eff);
    for (const l of s.laws) addEff(t, L[l].eff);
    t.def += s.fort;
    return t;
  }

  const count = (s, id) => s.buildings.filter((b) => b.id === id).length;
  const capacity = (s) => 5 + totals(s).cap;
  const power = (s) => Math.round(s.army * (1 + s.era * 0.5) + totals(s).def + jobOutput(s).def);
  const enemyStrength = (s) => Math.round(4 + s.day * 0.6 * (1 + s.era * 0.6));

  // Les ressources visibles dans l'interface
  function known(s) {
    return RES.filter((r) => r !== 'iron' && r !== 'coal'
      || (r === 'iron' && (s.era >= 2 || s.res.iron > 0))
      || (r === 'coal' && (s.era >= 3 || s.res.coal > 0)));
  }

  function buildCost(s, b) {
    const k = 1 + 0.25 * count(s, b.id);
    const c = {};
    for (const r in b.cost) c[r] = Math.ceil(b.cost[r] * k);
    return c;
  }

  function canPay(s, cost) {
    for (const r in cost) if ((s.res[r] || 0) < cost[r]) return false;
    return true;
  }
  function pay(s, cost) { for (const r in cost) s.res[r] -= cost[r]; }
  function missing(s, cost) {
    return Object.keys(cost).filter((r) => (s.res[r] || 0) < cost[r]).map((r) => RES_NAMES[r].toLowerCase());
  }

  /* ==========================================================================
     LES VILLAGEOIS : chacun a un nom, une force, une faiblesse et une tâche
     ========================================================================== */
  const JOBS = [
    { id: 'idle', name: 'Au village', icon: '🏡', res: null, desc: 'Sans tâche : rapporte un peu d\'or et de savoir.' },
    { id: 'hunt', name: 'Chasse et cueillette', icon: '🏹', res: 'food', base: 2, desc: 'Gibier, baies et racines.' },
    { id: 'wood', name: 'Bûcheron', icon: '🌲', res: 'wood', base: 1.5, desc: 'Couper du bois dans la forêt.' },
    { id: 'stone', name: 'Pierres', icon: '🪨', res: 'stone', base: 0.75, desc: 'Ramasser et tailler la pierre au pied de la montagne.' },
    { id: 'iron', name: 'Mineur de fer', icon: '⛏️', res: 'iron', base: 0.3, req: (s) => s.disc.includes('metal'), lock: 'Après la Métallurgie du fer', desc: 'Extraire le minerai de la montagne.' },
    { id: 'coal', name: 'Mineur de charbon', icon: '⚫', res: 'coal', base: 0.3, req: (s) => s.era >= 3, lock: 'À partir de la Renaissance', desc: 'Descendre dans les galeries de charbon.' },
    { id: 'sage', name: 'Savant', icon: '💡', res: 'sci', base: 0.2, desc: 'Observer, réfléchir, inventer.' },
    { id: 'trade', name: 'Marchand', icon: '💰', res: 'gold', base: 0.3, req: (s) => s.era >= 1, lock: 'À partir de l\'Antiquité', desc: 'Vendre et acheter avec les voisins.' },
    { id: 'guard', name: 'Garde', icon: '🛡️', res: 'def', base: 1.5, desc: 'Surveiller la vallée (défense).' },
  ];
  const JB = byId(JOBS);
  const WORK = JOBS.filter((j) => j.id !== 'idle').map((j) => j.id);
  // Forces et faiblesses, selon la tâche
  const STRONG = { hunt: 'Œil de lynx', wood: 'Bras solides', stone: 'Dos solide', iron: 'Endurance', coal: 'Pas peur du noir', sage: 'Esprit vif', trade: 'Beau parleur', guard: 'Courage' };
  const WEAK = { hunt: 'Pas discret', wood: 'Mains fragiles', stone: 'Dos fragile', iron: 'Souffle court', coal: 'Peur du noir', sage: 'Tête en l\'air', trade: 'Timidité', guard: 'Peur des combats' };
  const STRONG_X = 1.6, WEAK_X = 0.5, XP_MAX = 0.3, XP_DAY = 0.02;
  const NAMES = ['Ako', 'Bria', 'Doran', 'Elka', 'Fenn', 'Gorm', 'Hala', 'Iko', 'Jora', 'Kali', 'Loa', 'Mako', 'Nura', 'Oki', 'Pia', 'Rok', 'Sila', 'Tao', 'Uma', 'Vik', 'Wenn', 'Yara', 'Zek', 'Arn', 'Bela', 'Cian', 'Dara', 'Eno', 'Fala', 'Gaïa', 'Hugo', 'Ilia', 'Jade', 'Kem', 'Lina', 'Milo', 'Nael', 'Opale', 'Paz', 'Quinn', 'Rena', 'Sacha', 'Timo', 'Ulla', 'Vala', 'Willa', 'Xan', 'Yanis', 'Zoé', 'Alix', 'Basile', 'Céleste', 'Dany', 'Eden', 'Flo', 'Gabin', 'Hélie', 'Isis', 'Jules', 'Kenzo', 'Léo', 'Maé', 'Nino', 'Olia', 'Pablo', 'Rosa', 'Sven', 'Tessa', 'Ugo', 'Vera', 'Wendy', 'Yuna', 'Zia', 'Anouk', 'Brune', 'Cyan', 'Dimi', 'Enzo', 'Fanny', 'Gwen', 'Hiro', 'Inès', 'Joss', 'Kaïs', 'Lou', 'Mila', 'Noa', 'Oscar', 'Pépin', 'Rémi', 'Suzon', 'Tilio', 'Vadim', 'Yaël'];

  function makeVillager(s, rng) {
    const used = new Set(s.villagers.map((v) => v.name));
    let name = NAMES[Math.floor(rng() * NAMES.length)];
    for (let i = 0; used.has(name) && i < 30; i++) name = NAMES[Math.floor(rng() * NAMES.length)];
    if (used.has(name)) { let n = 2; while (used.has(`${name} ${toRoman(n)}`)) n++; name = `${name} ${toRoman(n)}`; }
    const strong = WORK[Math.floor(rng() * WORK.length)];
    let weak = strong;
    while (weak === strong) weak = WORK[Math.floor(rng() * WORK.length)];
    return { id: s.nextId++, name, strong, weak, job: 'idle', xp: {}, hue: Math.floor(rng() * 360) };
  }
  function toRoman(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n); }

  const jobOpen = (s, j) => !JB[j].req || JB[j].req(s);
  // Rendement de base d'une tâche (avant force/faiblesse et expérience)
  function jobBase(s, j) {
    const d = (x) => s.disc.includes(x);
    const b = JB[j].base || 0;
    if (j === 'hunt') return b + (d('feu') ? 0.5 : 0);
    if (j === 'wood') return b + (d('outils') ? 0.5 : 0) + (d('metal') ? 0.5 : 0) + (d('vapeur') ? 1 : 0);
    if (j === 'stone') return b + (d('outils') ? 0.25 : 0) + (d('metal') ? 0.25 : 0) + (d('vapeur') ? 0.5 : 0);
    if (j === 'iron' || j === 'coal') return b + (d('vapeur') ? 0.6 : 0) + (d('electricite') ? 0.4 : 0);
    if (j === 'sage') return b + (d('ecriture') ? 0.25 : 0) + (d('imprimerie') ? 0.5 : 0) + (d('informatique') ? 1 : 0);
    if (j === 'trade') return b + (d('monnaie') ? 0.4 : 0) + (d('change') ? 0.6 : 0);
    if (j === 'guard') return b * (1 + s.era * 0.5);
    return b;
  }
  const traitMult = (v, j) => (v.strong === j ? STRONG_X : v.weak === j ? WEAK_X : 1);
  const xpBonus = (v, j) => Math.min(XP_MAX, ((v.xp && v.xp[j]) || 0) * XP_DAY);
  // Ce qu'un villageois rapporterait par jour dans une tâche (sans le bonheur)
  function yieldOf(s, v, j) {
    if (j === 'idle' || !jobOpen(s, j)) return 0;
    return jobBase(s, j) * traitMult(v, j) * (1 + xpBonus(v, j));
  }
  // Total produit par les villageois, par ressource
  function jobOutput(s) {
    const out = { food: 0, wood: 0, stone: 0, iron: 0, coal: 0, sci: 0, gold: 0, def: 0, idle: 0, count: {} };
    for (const j of JOBS) out.count[j.id] = 0;
    for (const v of s.villagers || []) {
      const j = jobOpen(s, v.job) ? v.job : 'idle';
      out.count[j]++;
      if (j === 'idle') out.idle++;
      else out[JB[j].res] += yieldOf(s, v, j);
    }
    return out;
  }

  /* ---------- Préférences (comme des priorités) ----------
     0 = interdit, 1 = basse, 2 = normale, 3 = haute.
     Par défaut : haute pour sa force, basse pour sa faiblesse. */
  const PREF = [
    { lvl: 0, sym: '✕', name: 'Interdit' },
    { lvl: 1, sym: '−', name: 'Basse' },
    { lvl: 2, sym: '○', name: 'Normale' },
    { lvl: 3, sym: '+', name: 'Haute' },
  ];
  function prefOf(v, j) {
    if (v.pref && v.pref[j] != null) return v.pref[j];
    return v.strong === j ? 3 : v.weak === j ? 1 : 2;
  }
  function setPref(s, id, j, lvl) {
    const v = s.villagers.find((x) => x.id === id);
    if (!v || !JB[j] || j === 'idle') return false;
    v.pref = v.pref || {};
    v.pref[j] = Math.max(0, Math.min(3, lvl));
    applyQuotas(s);
    return true;
  }
  function setQuota(s, j, n) {
    s.quota = s.quota || {};
    s.quota[j] = Math.max(0, Math.min(s.pop, Math.round(n)));
    applyQuotas(s);
    return s.quota[j];
  }

  // Placer les villageois : pour chaque tâche, on envoie le nombre demandé,
  // en prenant d'abord ceux qui la préfèrent, puis les plus forts.
  function applyQuotas(s) {
    const q = s.quota || {};
    for (const v of s.villagers) v.job = 'idle';
    const left = {};
    for (const j of WORK) left[j] = jobOpen(s, j) ? (q[j] || 0) : 0;
    const pairs = [];
    for (const v of s.villagers) for (const j of WORK) {
      if (left[j] <= 0) continue;
      const pr = prefOf(v, j);
      if (pr === 0) continue;
      pairs.push({ v, j, k: pr * 100 + traitMult(v, j) * (1 + xpBonus(v, j)) * 10 });
    }
    pairs.sort((a, b) => b.k - a.k);
    const done = new Set();
    for (const p of pairs) {
      if (done.has(p.v.id) || left[p.j] <= 0) continue;
      p.v.job = p.j; left[p.j]--; done.add(p.v.id);
    }
  }

  // Quotas conseillés selon les besoins du pays
  function recommendQuotas(s) {
    const n = s.villagers.length;
    const t = totals(s);
    const mult = 0.75 + s.happy / 200;
    const lake = s.site === 'lac', river = s.site === 'riviere';
    const foodFixed = (3 + t.food + (lake ? 3 : 0)) * (river ? 1.25 : 1) * mult;
    const foodNeed = Math.ceil(s.pop / 3) + Math.ceil(s.army / 4) + 2 - foodFixed;
    const want = {};
    for (const j of WORK) want[j] = 0;
    want.hunt = Math.min(n, Math.max(0, Math.ceil(foodNeed / (jobBase(s, 'hunt') * mult))));
    const share = s.era < 2
      ? { wood: 0.35, stone: 0.25, sage: 0.15, trade: 0.1, guard: 0.05 }
      : s.era < 4
        ? { wood: 0.2, stone: 0.2, iron: 0.15, coal: 0.1, sage: 0.15, trade: 0.1, guard: 0.05 }
        : { wood: 0.12, stone: 0.18, iron: 0.2, coal: 0.12, sage: 0.18, trade: 0.12, guard: 0.05 };
    if (power(s) < enemyStrength(s) * 0.7) share.guard = (share.guard || 0) + 0.08;
    const rest = Math.max(0, n - want.hunt);
    const open = Object.keys(share).filter((j) => jobOpen(s, j));
    const tot = open.reduce((a, j) => a + share[j], 0) || 1;
    for (const j of open) want[j] = Math.floor(rest * share[j] / tot);
    let left = n - Object.values(want).reduce((a, b) => a + b, 0);
    for (let i = 0; left > 0 && open.length; i++, left--) want[open[i % open.length]]++;
    s.quota = want;
    return want;
  }

  // Garder autant de villageois que d'habitants, puis replacer tout le monde
  function syncVillagers(s, rng) {
    rng = rng || Math.random;
    if (!s.villagers) s.villagers = [];
    if (!s.nextId) s.nextId = 1;
    if (!s.quota) { s.quota = {}; for (const v of s.villagers) if (v.job !== 'idle') s.quota[v.job] = (s.quota[v.job] || 0) + 1; }
    if (s.autoQuota == null) s.autoQuota = true;
    const born = [];
    while (s.villagers.length < s.pop) {
      const v = makeVillager(s, rng);
      s.villagers.push(v); born.push(v);
    }
    while (s.villagers.length > s.pop) s.villagers.splice(Math.floor(rng() * s.villagers.length), 1);
    if (s.autoQuota) recommendQuotas(s);
    applyQuotas(s);
    return born;
  }
  function assign(s, id, job) {
    const v = s.villagers.find((x) => x.id === id);
    if (!v || !JB[job] || !jobOpen(s, job)) return false;
    v.job = job;
    return true;
  }
  // Ancien bouton « répartir automatiquement » : quotas conseillés
  function autoAssign(s) {
    if (!s.villagers) s.villagers = [];
    recommendQuotas(s);
    applyQuotas(s);
  }

  /* ---------- Prévisions de la journée ---------- */
  function forecast(s) {
    const t = totals(s);
    const mult = 0.75 + s.happy / 200;
    const lake = s.site === 'lac', river = s.site === 'riviere';
    const prod = (base, v) => Math.round((base + v) * (base + v > 0 ? mult : 1));
    const foodProd = Math.round((3 + t.food + jobOutput(s).food + (lake ? 3 : 0)) * (river ? 1.25 : 1) * mult);
    const foodCons = Math.ceil(s.pop / 3) + Math.ceil(s.army / 4);
    const jo = jobOutput(s), free = jo.idle;
    const f = {
      food: foodProd - foodCons, foodProd, foodCons,
      wood: prod(jo.wood, t.wood),
      stone: prod(jo.stone, t.stone),
      iron: prod(jo.iron, t.iron),
      coal: prod(jo.coal, t.coal),
      gold: prod(Math.floor(free / 12) + jo.gold + (lake ? 2 : 0), t.gold),
      sci: prod(1 + Math.floor(free / 20) + jo.sci, t.sci),
    };
    f.jobs = jo; f.free = free; f.mult = mult;
    f.cap = 5 + t.cap;
    let target = 50 + t.happy;
    if (s.pop >= f.cap) target -= 5;
    if (f.food < 0 && s.res.food <= 0) target -= 10;
    f.happyTarget = Math.max(0, Math.min(100, target));
    f.t = t;
    return f;
  }

  /* ---------- Les choix possibles du jour ---------- */
  function fmtCost(c) {
    return Object.keys(c).filter((r) => c[r]).map((r) => `${c[r]} ${RES_ICONS[r]}`).join(' ');
  }
  function fmtEff(e) {
    return Object.keys(e).filter((r) => e[r]).map((r) => {
      const v = e[r];
      const unit = r === 'cap' || r === 'def' || r === 'happy' ? '' : '/j';
      return `${v > 0 ? '+' : ''}${v}${unit} ${RES_ICONS[r]}`;
    }).join(' ');
  }
  const whyNot = (s, cost) => (canPay(s, cost) ? '' : `Manque : ${missing(s, cost).join(', ')}`);

  function options(s, cat) {
    const out = [];
    if (cat === 'build') {
      for (const b of BUILDINGS) {
        if (b.era > s.era) continue;
        if (b.unique && count(s, b.id)) continue;
        if (b.req && !s.disc.includes(b.req)) {
          if (b.era === s.era || b.id === 'carriere') out.push({ id: b.id, icon: b.icon, name: b.name, desc: b.desc, cost: fmtCost(b.cost), eff: fmtEff(b.eff), can: false, why: `Nécessite : ${D[b.req].name}`, era: b.era });
          continue;
        }
        const c = buildCost(s, b);
        const n = count(s, b.id);
        out.push({ id: b.id, icon: b.icon, name: b.name + (n ? ` (${n})` : ''), desc: b.desc, cost: fmtCost(c), eff: fmtEff(b.eff), can: canPay(s, c), why: whyNot(s, c), era: b.era });
      }
      out.sort((a, b) => (b.id === 'fusee') - (a.id === 'fusee') || b.era - a.era);
    } else if (cat === 'law') {
      for (const l of LAWS) {
        if (l.era > s.era || s.laws.includes(l.id)) continue;
        out.push({ id: l.id, icon: l.icon, name: l.name, desc: l.desc, cost: fmtCost(l.cost) || 'Gratuit', eff: fmtEff(l.eff), can: canPay(s, l.cost), why: whyNot(s, l.cost), era: l.era });
      }
      out.sort((a, b) => b.era - a.era);
    } else if (cat === 'tech') {
      for (const d of DISCOVERIES) {
        if (d.era !== s.era || s.disc.includes(d.id)) continue;
        const ok = s.res.sci >= d.cost;
        out.push({ id: d.id, icon: d.icon, name: d.name, desc: d.desc, cost: `${d.cost} 💡`, eff: fmtEff(d.eff), can: ok, why: ok ? '' : 'Manque : savoir', era: d.era });
      }
    } else if (cat === 'war') {
      const w = warCosts(s);
      const p = power(s), e = enemyStrength(s);
      const chance = Math.round(100 * attackChance(s));
      out.push({ id: 'recruter', icon: '🪖', name: s.era === 0 ? 'Former des guerriers' : 'Recruter des soldats', desc: `Votre puissance : ${p} ⚔️${s.era >= 2 ? ' — les armes demandent du fer' : ''}`, cost: fmtCost(w.recruit), eff: `+${w.recruitN} soldats`, can: canPay(s, w.recruit), why: whyNot(s, w.recruit) });
      out.push({ id: 'attaquer', icon: '⚔️', name: `Attaquer ${ERAS[s.era].enemy}`, desc: `Force ennemie ≈ ${e}. Butin et nouveaux habitants si victoire.`, cost: '—', eff: `${chance}% de chances`, can: s.army > 0, why: 'Il vous faut des soldats' });
      out.push({ id: 'fortifier', icon: '🧱', name: s.era < 2 ? 'Palissade en bois' : s.era < 4 ? 'Remparts de pierre' : 'Défenses en acier', desc: 'Protège contre les invasions.', cost: fmtCost(w.fort), eff: `+${w.fortN} 🛡️`, can: canPay(s, w.fort), why: whyNot(s, w.fort) });
      const peace = s.peaceUntil > s.day;
      out.push({ id: 'paix', icon: '🕊️', name: 'Traité de paix', desc: peace ? `En paix jusqu'au jour ${s.peaceUntil}.` : 'Aucune invasion pendant 12 jours.', cost: fmtCost(w.peace), eff: '+3 😊', can: !peace && canPay(s, w.peace), why: peace ? 'Déjà en paix' : whyNot(s, w.peace) });
    }
    for (const o of out) Object.assign(o, bonusMalus(s, cat, o.id));
    return out;
  }

  // Bonus (vert) et malus (rouge) de chaque choix
  const ico = (r) => RES_ICONS[r] || '';
  const sgn = (v) => (v > 0 ? '+' : '−') + Math.abs(v);
  const unit = (r) => (r === 'cap' || r === 'def' || r === 'happy' ? '' : '/j');
  const posEff = (e) => Object.keys(e).filter((r) => e[r] > 0).map((r) => `${sgn(e[r])} ${ico(r)}${unit(r)}`);
  const negEff = (e) => Object.keys(e).filter((r) => e[r] < 0).map((r) => `${sgn(e[r])} ${ico(r)}${unit(r)}`);
  const costL = (c) => Object.keys(c).filter((r) => c[r]).map((r) => `−${c[r]} ${ico(r)}`);
  function bonusMalus(s, cat, id) {
    if (cat === 'build') { const b = B[id]; return { plus: id === 'fusee' ? ['🏆 VICTOIRE'] : posEff(b.eff), minus: costL(buildCost(s, b)).concat(negEff(b.eff)) }; }
    if (cat === 'law') { const l = L[id]; return { plus: posEff(l.eff), minus: costL(l.cost).concat(negEff(l.eff)) }; }
    if (cat === 'tech') {
      const d = D[id];
      const plus = posEff(d.eff);
      const left = DISCOVERIES.filter((x) => x.era === s.era && !s.disc.includes(x.id)).length;
      if (left === 1 && s.era < ERAS.length - 1) plus.push(`⏳ ${ERAS[s.era + 1].name}`);
      if (d.id === 'outils') plus.push('débloque 🪨 Carrière');
      if (d.id === 'metal') plus.push('débloque ⛏️ Mine de fer');
      if (d.id === 'espace') plus.push('débloque 🚀 Base spatiale');
      return { plus, minus: [`−${d.cost} 💡`] };
    }
    if (cat === 'war') {
      const w = warCosts(s);
      if (id === 'recruter') return { plus: [`+${w.recruitN} 🪖`], minus: costL(w.recruit) };
      if (id === 'fortifier') return { plus: [`+${w.fortN} 🛡️`], minus: costL(w.fort) };
      if (id === 'paix') return { plus: ['🕊️ 12 jours sans invasion', '+3 😊'], minus: costL(w.peace) };
      if (id === 'attaquer') { const ch = Math.round(attackChance(s) * 100); return { plus: [`${ch}% : butin et nouveaux habitants`], minus: [`${100 - ch}% : −40% 🪖, −${1 + s.era} 👤`] }; }
    }
    return { plus: [], minus: [] };
  }

  function warCosts(s) {
    const e = s.era;
    return {
      recruit: e === 0 ? { food: 8 } : e === 1 ? { food: 5, gold: 14, wood: 5 } : { food: 5, gold: 8 + e * 6, iron: 2 + e * 2 },
      recruitN: 3 + e * 2,
      fort: e < 2 ? { wood: 10 + e * 12 } : e < 4 ? { stone: 15 + e * 12 } : { stone: 40, iron: 20 + e * 8 },
      fortN: 4 + e * 3,
      peace: e === 0 ? { food: 10 } : { gold: 10 + e * 15 },
    };
  }
  function attackChance(s) {
    const p = power(s), e = enemyStrength(s);
    return Math.max(0.05, Math.min(0.95, p / (p + e * 0.9)));
  }

  /* ---------- Appliquer le choix du jour ---------- */
  // Renvoie { ok, title, text, icon, good, built?, newEra? }
  function act(s, cat, id, rng) {
    rng = rng || Math.random;
    if (cat === 'build') {
      const b = B[id];
      if (!b) return { ok: false };
      const c = buildCost(s, b);
      if (b.era > s.era || !canPay(s, c) || (b.req && !s.disc.includes(b.req)) || (b.unique && count(s, b.id))) return { ok: false };
      pay(s, c);
      const inst = { id: b.id, day: s.day };
      s.buildings.push(inst);
      s.stats.built++;
      log(s, `${b.icon} Construction : ${b.name}`);
      if (b.id === 'fusee') {
        s.won = true;
        return { ok: true, built: inst, title: 'Décollage !', text: `${s.name} envoie sa première fusée dans l'espace. De la Préhistoire aux étoiles en ${s.day} jours !`, icon: '🚀', good: true };
      }
      return { ok: true, built: inst, title: b.name, text: b.desc, icon: b.icon, good: true };
    }
    if (cat === 'law') {
      const l = L[id];
      if (!l || l.era > s.era || s.laws.includes(id) || !canPay(s, l.cost)) return { ok: false };
      pay(s, l.cost);
      s.laws.push(id);
      log(s, `${l.icon} Loi adoptée : ${l.name}`);
      return { ok: true, title: 'Loi adoptée', text: `${l.name} — ${l.desc}`, icon: l.icon, good: true };
    }
    if (cat === 'tech') {
      const d = D[id];
      if (!d || d.era !== s.era || s.disc.includes(id) || s.res.sci < d.cost) return { ok: false };
      s.res.sci -= d.cost;
      s.disc.push(id);
      log(s, `${d.icon} Découverte : ${d.name}`);
      const r = { ok: true, title: 'Découverte !', text: `${d.name} — ${d.desc}`, icon: d.icon, good: true };
      if (id === 'outils' && !count(s, 'carriere')) r.proposeQuarry = true;
      const eraDone = DISCOVERIES.filter((x) => x.era === s.era).every((x) => s.disc.includes(x.id));
      if (eraDone && s.era < ERAS.length - 1) {
        s.era++;
        r.newEra = s.era;
        log(s, `⏳ Nouvelle ère : ${ERAS[s.era].name}`);
      }
      return r;
    }
    if (cat === 'war') {
      const w = warCosts(s);
      if (id === 'recruter') {
        if (!canPay(s, w.recruit)) return { ok: false };
        pay(s, w.recruit);
        s.army += w.recruitN;
        log(s, `🪖 +${w.recruitN} soldats`);
        return { ok: true, title: 'Recrutement', text: `${w.recruitN} nouveaux soldats rejoignent l'armée (${s.army} au total).`, icon: '🪖', good: true };
      }
      if (id === 'fortifier') {
        if (!canPay(s, w.fort)) return { ok: false };
        pay(s, w.fort);
        s.fort += w.fortN;
        log(s, `🧱 Défenses renforcées (+${w.fortN})`);
        return { ok: true, title: 'Fortifications', text: `La défense du pays augmente de ${w.fortN}.`, icon: '🧱', good: true };
      }
      if (id === 'paix') {
        if (s.peaceUntil > s.day || !canPay(s, w.peace)) return { ok: false };
        pay(s, w.peace);
        s.peaceUntil = s.day + 12;
        s.happy = Math.min(100, s.happy + 3);
        log(s, `🕊️ Traité de paix jusqu'au jour ${s.peaceUntil}`);
        return { ok: true, title: 'Traité de paix', text: `Aucune invasion jusqu'au jour ${s.peaceUntil}.`, icon: '🕊️', good: true };
      }
      if (id === 'attaquer') {
        if (s.army <= 0) return { ok: false };
        s.stats.battles++;
        const enemy = ERAS[s.era].enemy;
        if (rng() < attackChance(s)) {
          s.stats.victories++;
          const e = s.era;
          const loot = { food: 10 + e * 15, wood: 10 + e * 10, stone: 5 + e * 10, iron: e >= 2 ? e * 8 : 0, gold: e * 20 };
          gain(s, loot);
          const newcomers = 2 + e;
          s.pop += newcomers;
          s.happy = Math.min(100, s.happy + 4);
          s.army = Math.max(0, s.army - Math.ceil(s.army * 0.1));
          log(s, `⚔️ Victoire contre ${enemy}`);
          return { ok: true, title: 'Victoire !', text: `Vous l'emportez sur ${enemy}. Butin : ${fmtCost(loot)} et ${newcomers} habitants rejoignent votre pays.`, icon: '🏆', good: true };
        }
        const lostArmy = Math.ceil(s.army * 0.4);
        s.army -= lostArmy;
        const lostPop = Math.min(s.pop - 1, 1 + s.era);
        s.pop -= lostPop;
        s.happy = Math.max(0, s.happy - 8);
        log(s, `⚔️ Défaite contre ${enemy}`);
        return { ok: true, title: 'Défaite…', text: `${cap1(enemy)} vous repousse. Vous perdez ${lostArmy} soldats et ${lostPop} habitants.`, icon: '💀', good: false };
      }
    }
    if (cat === 'rest') {
      s.happy = Math.min(100, s.happy + 4);
      log(s, '😴 Journée de repos');
      return { ok: true, title: 'Journée de repos', text: 'Le peuple se repose et fait la fête (+4 😊).', icon: '😴', good: true };
    }
    return { ok: false };
  }

  function gain(s, g) { for (const r in g) if (g[r]) s.res[r] = (s.res[r] || 0) + g[r]; }

  /* ---------- Événements aléatoires ---------- */
  const EVENTS = [
    { id: 'recolte', w: 3, ok: () => true, run: (s) => { const n = 8 + s.era * 12; s.res.food += n; return ['Récolte abondante', `Une saison généreuse : +${n} 🍖`, '🌽', true]; } },
    { id: 'migrants', w: 3, ok: (s) => s.pop < capacity(s), run: (s) => { const n = Math.min(capacity(s) - s.pop, 2 + s.era * 2); s.pop += n; return ['Des nomades arrivent', `${n} personnes découvrent la vallée et décident de vivre ici.`, '🧳', true]; } },
    { id: 'comete', w: 2, ok: () => true, run: (s) => { const n = 4 + s.era * 8; s.res.sci += n; return ['Une comète !', `Les savants l'observent pendant des nuits : +${n} 💡`, '☄️', true]; } },
    { id: 'tresor', w: 2, ok: (s) => s.era >= 1, run: (s) => { const n = 10 + s.era * 15; s.res.gold += n; return ['Trésor enfoui', `Des paysans déterrent un coffre : +${n} 💰`, '💎', true]; } },
    { id: 'eboulement', w: 2, ok: () => true, run: (s) => { const n = 6 + s.era * 8; s.res.stone += n; return ['Éboulement', `Des rochers dévalent la montagne… de la pierre gratuite ! +${n} 🪨`, '⛰️', true]; } },
    { id: 'filon', w: 2, ok: (s) => count(s, 'minefer') > 0, run: (s) => { const n = 10 + s.era * 6; s.res.iron += n; return ['Filon de fer', `Les mineurs tombent sur une veine très riche : +${n} 🔩`, '⛏️', true]; } },
    { id: 'coup_grisou', w: 2, ok: (s) => count(s, 'minecharbon') > 0 && s.era < 5, run: (s) => { const n = Math.ceil(s.res.coal * 0.3); s.res.coal -= n; s.pop = Math.max(1, s.pop - 2); s.happy = Math.max(0, s.happy - 5); return ['Coup de grisou', `Une explosion dans la mine de charbon : -${n} ⚫ et 2 mineurs perdus.`, '💥', false]; } },
    { id: 'tempete', w: 2, ok: () => true, run: (s) => { const n = Math.ceil(s.res.wood * 0.25); s.res.wood -= n; return ['Tempête', `Le vent arrache toits et réserves : -${n} 🪵`, '🌪️', false]; } },
    { id: 'loups', w: 2, ok: (s) => s.era <= 1, run: (s) => { const n = Math.ceil(s.res.food * 0.3); s.res.food -= n; return ['Attaque de loups', `Une meute pille les réserves : -${n} 🍖`, '🐺', false]; } },
    { id: 'crue', w: 2, ok: (s) => s.site === 'riviere', run: (s) => { const n = Math.ceil(s.res.food * 0.2); s.res.food -= n; s.res.sci += 3; return ['Crue de la rivière', `Les champs sont inondés (-${n} 🍖) mais le limon rendra la terre fertile.`, '🌊', false]; } },
    { id: 'peche', w: 2, ok: (s) => s.site === 'lac', run: (s) => { const n = 10 + s.era * 10; s.res.food += n; return ['Pêche miraculeuse', `Les filets débordent de poissons : +${n} 🍖`, '🐟', true]; } },
    { id: 'epidemie', w: 2, ok: (s) => s.pop > 12 && !s.disc.includes('vaccins'), run: (s) => { const n = Math.ceil(s.pop * 0.1); s.pop -= n; s.happy = Math.max(0, s.happy - 6); return ['Épidémie', `Une maladie frappe le pays : ${n} habitants disparaissent.`, '🦠', false]; } },
    { id: 'incendie', w: 1, ok: (s) => s.buildings.length > 3 && s.era < 5, run: (s) => { const n = Math.ceil(s.res.wood * 0.3); s.res.wood -= n; return ['Incendie', `Un feu ravage un quartier : -${n} 🪵`, '🔥', false]; } },
    { id: 'genie', w: 2, ok: (s) => s.era >= 2, run: (s) => { const n = 10 + s.era * 10; s.res.sci += n; return ['Un génie est né', `Un(e) inventeur(rice) révolutionne son domaine : +${n} 💡`, '🧠', true]; } },
    { id: 'festival', w: 2, ok: () => true, run: (s) => { s.happy = Math.min(100, s.happy + 8); return ['Grande fête', 'Musique et danses toute la nuit : +8 😊', '🎶', true]; } },
    { id: 'marchands', w: 2, ok: (s) => s.era >= 1, run: (s) => { const n = 8 + s.era * 12; s.res.gold += n; return ['Caravane de marchands', `Des marchands étrangers commercent avec vous : +${n} 💰`, '🐫', true]; } },
  ];

  /* ---------- Dilemmes : un choix A ou B ---------- */
  // Chaque choix : label, hint (aperçu), run(s) -> texte du résultat, good
  const DILEMMAS = [
    { id: 'asile', w: 3, ok: (s) => s.pop >= 5, icon: '🧳', title: 'Des réfugiés à la frontière',
      text: (s) => `Une famille de ${3 + s.era * 2} personnes fuit la guerre et demande à vivre à ${s.name}.`,
      choices: [
        { label: 'Les accueillir', hint: (s) => `+${3 + s.era * 2} 👤, -${10 + s.era * 5} 🍖`, run: (s) => { const n = 3 + s.era * 2; s.pop += n; s.res.food -= 10 + s.era * 5; s.happy = Math.min(100, s.happy + 2); return [`${n} nouveaux habitants s'installent dans la vallée.`, true]; } },
        { label: 'Fermer la frontière', hint: () => '-4 😊', run: (s) => { s.happy = Math.max(0, s.happy - 4); return ['Ils repartent. Certains habitants trouvent ça injuste.', false]; } },
      ] },
    { id: 'foret', w: 3, ok: () => true, icon: '🌲', title: 'La grande forêt',
      text: () => 'Les bûcherons veulent abattre la vieille forêt sacrée au pied de la montagne.',
      choices: [
        { label: 'Tout couper', hint: (s) => `+${25 + s.era * 20} 🪵, -6 😊`, run: (s) => { const n = 25 + s.era * 20; s.res.wood += n; s.happy = Math.max(0, s.happy - 6); return [`+${n} 🪵 mais les anciens sont furieux.`, true]; } },
        { label: 'La protéger', hint: () => '+6 😊', run: (s) => { s.happy = Math.min(100, s.happy + 6); return ['La forêt reste debout. Le peuple est fier de sa vallée.', true]; } },
      ] },
    { id: 'gisement', w: 3, ok: (s) => s.era >= 1, icon: '⛰️', title: 'Une grotte dans la montagne',
      text: () => 'Des enfants ont trouvé une grotte qui s\'enfonce loin sous la montagne.',
      choices: [
        { label: 'Creuser pour la pierre et le fer', hint: (s) => `+${20 + s.era * 10} 🪨${s.era >= 2 ? `, +${s.era * 6} 🔩` : ''}, risque`, run: (s, rng) => { const st = 20 + s.era * 10, fe = s.era >= 2 ? s.era * 6 : 0; s.res.stone += st; s.res.iron += fe; if (rng() < 0.25) { s.pop = Math.max(1, s.pop - 1); return [`+${st} 🪨${fe ? ` +${fe} 🔩` : ''}… mais un éboulement coûte la vie à un mineur.`, false]; } return [`+${st} 🪨${fe ? ` +${fe} 🔩` : ''} : la montagne est généreuse !`, true]; } },
        { label: 'L\'explorer avec des savants', hint: (s) => `+${8 + s.era * 8} 💡`, run: (s) => { const n = 8 + s.era * 8; s.res.sci += n; return [`Peintures anciennes et fossiles : +${n} 💡`, true]; } },
      ] },
    { id: 'echange', w: 3, ok: (s) => s.era >= 1, icon: '🐫', title: 'Un marchand étranger',
      text: () => 'Un marchand propose d\'échanger ses marchandises contre vos réserves.',
      choices: [
        { label: 'Vendre de la nourriture', hint: (s) => `-${15 + s.era * 10} 🍖, +${15 + s.era * 12} 💰`, run: (s) => { s.res.food -= 15 + s.era * 10; const n = 15 + s.era * 12; s.res.gold += n; return [`Marché conclu : +${n} 💰`, true]; } },
        { label: 'Acheter des matériaux', hint: (s) => `-${10 + s.era * 10} 💰, +${8 + s.era * 6} ${s.era >= 3 ? '⚫' : s.era >= 2 ? '🔩' : '🪨'}`, run: (s) => { const cost = 10 + s.era * 10; if (s.res.gold < cost) return ['Vous n\'avez pas assez d\'or. Le marchand s\'en va.', false]; s.res.gold -= cost; const n = 8 + s.era * 6; const r = s.era >= 3 ? 'coal' : s.era >= 2 ? 'iron' : 'stone'; s.res[r] += n; return [`+${n} ${RES_ICONS[r]} livrés par charrette.`, true]; } },
      ] },
    { id: 'savant', w: 2, ok: (s) => s.era >= 1, icon: '🧪', title: 'Un savant demande de l\'aide',
      text: () => 'Un(e) savant(e) affirme pouvoir faire une grande découverte… avec un peu d\'or.',
      choices: [
        { label: 'Financer ses recherches', hint: (s) => `-${10 + s.era * 10} 💰, +${15 + s.era * 15} 💡`, run: (s) => { const c = 10 + s.era * 10; if (s.res.gold < c) return ['Le trésor est vide… le savant part travailler ailleurs.', false]; s.res.gold -= c; const n = 15 + s.era * 15; s.res.sci += n; return [`Eurêka ! +${n} 💡`, true]; } },
        { label: 'Refuser', hint: () => 'Rien ne change', run: () => ['Le savant part chez vos voisins.', false] },
      ] },
    { id: 'festin', w: 3, ok: (s) => s.res.food > 20, icon: '🍗', title: 'Fêter la récolte ?',
      text: () => 'Les greniers sont pleins. Le peuple réclame un grand festin.',
      choices: [
        { label: 'Grand festin !', hint: (s) => `-${Math.ceil(s.res.food * 0.25)} 🍖, +10 😊`, run: (s) => { s.res.food -= Math.ceil(s.res.food * 0.25); s.happy = Math.min(100, s.happy + 10); return ['On mange, on chante, on danse jusqu\'à l\'aube.', true]; } },
        { label: 'Garder les réserves', hint: () => '-3 😊', run: (s) => { s.happy = Math.max(0, s.happy - 3); return ['Les réserves sont à l\'abri. Quelques grincheux.', false]; } },
      ] },
    { id: 'charbon', w: 3, ok: (s) => s.era >= 3, icon: '⚫', title: 'Du charbon sous les champs',
      text: () => 'Des prospecteurs ont trouvé du charbon… juste sous les meilleures terres.',
      choices: [
        { label: 'Ouvrir une mine à ciel ouvert', hint: (s) => `+${30 + s.era * 10} ⚫, -15% 🍖, -5 😊`, run: (s) => { const n = 30 + s.era * 10; s.res.coal += n; s.res.food = Math.round(s.res.food * 0.85); s.happy = Math.max(0, s.happy - 5); return [`+${n} ⚫ mais les champs sont défigurés.`, true]; } },
        { label: 'Garder les champs', hint: () => '+3 😊', run: (s) => { s.happy = Math.min(100, s.happy + 3); return ['Les paysans vous remercient.', true]; } },
      ] },
    { id: 'greve', w: 3, ok: (s) => s.era >= 4, icon: '📢', title: 'Grève dans les usines',
      text: () => 'Les ouvriers réclament de meilleurs salaires et moins de fumée.',
      choices: [
        { label: 'Augmenter les salaires', hint: (s) => `-${20 + s.era * 10} 💰, +8 😊`, run: (s) => { s.res.gold -= 20 + s.era * 10; s.happy = Math.min(100, s.happy + 8); return ['Les ouvriers reprennent le travail en chantant.', true]; } },
        { label: 'Refuser', hint: () => '-10 😊, -20% 🔩', run: (s) => { s.happy = Math.max(0, s.happy - 10); s.res.iron = Math.round(s.res.iron * 0.8); return ['La grève dure des semaines.', false]; } },
      ] },
    { id: 'alliance', w: 2, ok: (s) => s.day > 8, icon: '🤝', title: 'Une proposition d\'alliance',
      text: (s) => `${cap1(ERAS[s.era].enemy)} propose une alliance… contre un tribut.`,
      choices: [
        { label: 'Payer le tribut', hint: (s) => `-${8 + s.era * 12} 💰/🍖, paix 10 jours`, run: (s) => { const n = 8 + s.era * 12; if (s.era === 0) s.res.food -= n; else s.res.gold -= n; s.peaceUntil = Math.max(s.peaceUntil, s.day + 10); return ['Les voisins vous laisseront tranquilles pendant 10 jours.', true]; } },
        { label: 'Refuser fièrement', hint: () => '+3 😊, risque de guerre', run: (s) => { s.happy = Math.min(100, s.happy + 3); s.peaceUntil = 0; return ['Le peuple apprécie votre courage… les voisins beaucoup moins.', true]; } },
      ] },
  ];
  const DL = byId(DILEMMAS);

  function dilemmaView(s, id) {
    const d = DL[id];
    return {
      id, icon: d.icon, title: d.title, text: d.text(s),
      choices: d.choices.map((c) => ({ label: typeof c.label === 'function' ? c.label(s) : c.label, hint: c.hint(s) })),
    };
  }
  function choose(s, id, i, rng) {
    const d = DL[id];
    if (!d || !d.choices[i]) return null;
    const [text, good] = d.choices[i].run(s, rng || Math.random);
    for (const r of RES) s.res[r] = Math.max(0, Math.round(s.res[r] || 0));
    s.pending = null;
    log(s, `${d.icon} ${d.title} : ${typeof d.choices[i].label === 'function' ? d.choices[i].label(s) : d.choices[i].label}`);
    return { icon: d.icon, title: d.title, text, good };
  }

  function pickWeighted(list, rng) {
    const tot = list.reduce((a, e) => a + e.w, 0);
    let r = rng() * tot;
    for (const e of list) { if ((r -= e.w) <= 0) return e; }
    return list[list.length - 1];
  }

  /* ---------- Fin de la journée ---------- */
  function endDay(s, rng) {
    rng = rng || Math.random;
    const f = forecast(s);
    const report = { delta: {}, pop0: s.pop, events: [] };
    for (const r of RES) { report.delta[r] = f[r]; s.res[r] = (s.res[r] || 0) + f[r]; }
    if (s.res.gold < 0) { s.res.gold = 0; s.happy = Math.max(0, s.happy - 3); }

    // Famine
    if (s.res.food < 0) {
      const n = Math.ceil(s.pop * 0.1) + 1;
      s.pop = Math.max(0, s.pop - n);
      s.res.food = 0;
      s.happy = Math.max(0, s.happy - 8);
      report.events.push({ title: 'Famine !', text: `Il n'y a plus rien à manger : ${n} habitants quittent la vallée. Construisez de quoi nourrir le peuple !`, icon: '🍂', good: false });
      log(s, `🍂 Famine (-${n} habitants)`);
    } else if (s.pop < f.cap && s.happy >= 25) {
      const g = Math.max(1, Math.round(s.pop * 0.07 * (s.happy / 60)));
      s.pop = Math.min(f.cap, s.pop + g);
    }

    // Bonheur
    s.happy += (f.happyTarget - s.happy) * 0.25;
    s.happy = Math.max(0, Math.min(100, Math.round(s.happy)));

    // Événements
    if (s.pop > 0) {
      const invasionChance = s.day > 10 && s.day >= s.peaceUntil ? 0.07 + s.era * 0.01 : 0;
      if (rng() < invasionChance) {
        report.events.push(invasion(s, rng));
      } else if (s.happy < 30 && rng() < 0.5) {
        const g = Math.ceil(s.res.gold * 0.3), m = Math.ceil(s.res.wood * 0.2);
        s.res.gold -= g; s.res.wood -= m;
        report.events.push({ title: 'Manif !', text: `Le peuple est mécontent et descend dans la rue. Le travail s'arrête : -${g} 💰 -${m} 🪵. Rendez-les plus heureux !`, icon: '📢', good: false });
        log(s, '📢 Manifestation');
      } else {
        const roll = rng();
        if (roll < 0.22) {
          const pool = DILEMMAS.filter((d) => d.ok(s));
          const d = pickWeighted(pool, rng);
          s.pending = d.id;
          report.events.push({ dilemma: dilemmaView(s, d.id) });
        } else if (roll < 0.45) {
          const pool = EVENTS.filter((e) => e.ok(s));
          const e = pickWeighted(pool, rng);
          const [title, text, icon, good] = e.run(s);
          report.events.push({ title, text, icon, good });
          log(s, `${icon} ${title}`);
        }
      }
    }
    for (const r of RES) s.res[r] = Math.max(0, Math.round(s.res[r]));

    if (s.pop <= 0) { s.pop = 0; s.lost = true; }
    s.day++;
    report.popDelta = s.pop - report.pop0;
    return report;
  }

  function invasion(s, rng) {
    const enemy = ERAS[s.era].enemy;
    const strength = Math.round(enemyStrength(s) * (0.6 + rng() * 0.6));
    const p = power(s);
    s.stats.battles++;
    if (p >= strength) {
      s.stats.victories++;
      s.happy = Math.min(100, s.happy + 5);
      log(s, `🛡️ Invasion repoussée (${enemy})`);
      return { title: 'Invasion repoussée !', text: `${cap1(enemy)} attaque avec une force de ${strength}, mais votre défense (${p}) tient bon.`, icon: '🛡️', good: true };
    }
    const lostPop = Math.ceil(s.pop * 0.12);
    s.pop -= lostPop;
    for (const r of ['food', 'wood', 'stone', 'iron', 'coal', 'gold']) s.res[r] = Math.round(s.res[r] * 0.7);
    s.army = Math.floor(s.army * 0.5);
    s.happy = Math.max(0, s.happy - 10);
    log(s, `🔥 Invasion : pillage par ${enemy}`);
    return { title: 'Invasion !', text: `${cap1(enemy)} (force ${strength}) déborde votre défense (${p}). Pillage : ${lostPop} habitants perdus et 30% des réserves. Pensez à l'armée ou aux remparts !`, icon: '🔥', good: false };
  }

  const cap1 = (t) => t[0].toUpperCase() + t.slice(1);
  function log(s, text) {
    s.log.unshift({ day: s.day, text });
    if (s.log.length > 150) s.log.length = 150;
  }

  const api = {
    ERAS, RES, BUILDINGS, DISCOVERIES, LAWS, DILEMMAS, RES_ICONS, RES_NAMES, B, D, L,
    newState, migrate, totals, forecast, options, act, endDay, capacity, power, enemyStrength, log,
    known, dilemmaView, choose, buildCost, canPay,
    JOBS, JB, WORK, STRONG, WEAK, STRONG_X, WEAK_X, PREF, jobOpen, jobBase, yieldOf, xpBonus, traitMult, jobOutput, syncVillagers, assign, autoAssign,
    prefOf, setPref, setQuota, applyQuotas, recommendQuotas,
  };
  // Après chaque action, les villageois suivent la population
  api.act = (s, ...rest) => { syncVillagers(s); const r = act(s, ...rest); syncVillagers(s); return r; };
  api.choose = (s, ...rest) => { const r = choose(s, ...rest); syncVillagers(s); return r; };
  api.endDay = (s, rng) => {
    syncVillagers(s, rng);
    for (const v of s.villagers) if (v.job !== 'idle') { v.xp[v.job] = Math.min(XP_MAX / XP_DAY, (v.xp[v.job] || 0) + 1); }
    const rep = endDay(s, rng);
    rep.born = syncVillagers(s, rng).map((v) => ({ name: v.name, job: v.job }));
    return rep;
  };
  api.newState = (...a) => { const st = newState(...a); syncVillagers(st); autoAssign(st); return st; };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
