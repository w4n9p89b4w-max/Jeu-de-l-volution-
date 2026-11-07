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
      intro: 'L\'agriculture a tout changé : les villages deviennent des cités.' },
    { name: 'Moyen Âge', year: '1000', enemy: 'le seigneur voisin',
      intro: 'Châteaux, moulins et cathédrales sortent de terre.' },
    { name: 'Renaissance', year: '1500', enemy: 'le royaume voisin',
      intro: 'Les arts et les sciences renaissent : place aux idées !' },
    { name: 'Révolution industrielle', year: '1850', enemy: 'l\'empire voisin',
      intro: 'La vapeur et le charbon font tourner les usines.' },
    { name: 'Monde moderne', year: '2000', enemy: 'la puissance rivale',
      intro: 'Électricité, informatique, internet… et bientôt les étoiles ?' },
  ];

  /* ---------- Constructions ----------
     eff : food, mat, gold, sci, happy, cap, def                       */
  const BUILDINGS = [
    // Préhistoire
    { id: 'hutte', era: 0, name: 'Hutte', icon: '🛖', arch: 'hut', cost: { mat: 6 }, eff: { cap: 6 }, desc: 'Un abri de branches et de peaux.' },
    { id: 'chasse', era: 0, name: 'Camp de chasse', icon: '🏹', arch: 'camp', cost: { mat: 5 }, eff: { food: 4 }, desc: 'Les chasseurs ramènent du gibier.' },
    { id: 'feu', era: 0, name: 'Cercle du feu', icon: '🔥', arch: 'fire', cost: { mat: 8 }, eff: { happy: 5, sci: 1 }, desc: 'On s\'y réunit pour raconter des histoires.' },
    { id: 'menhir', era: 0, name: 'Menhir', icon: '🗿', arch: 'menhir', cost: { mat: 14 }, eff: { happy: 4, sci: 1 }, desc: 'Une pierre dressée vers le ciel.' },
    // Antiquité
    { id: 'champ', era: 1, name: 'Champ de blé', icon: '🌾', arch: 'field', cost: { mat: 8 }, eff: { food: 8 }, desc: 'Les premières récoltes.' },
    { id: 'maison', era: 1, name: 'Maison en pierre', icon: '🏠', arch: 'house', cost: { mat: 15 }, eff: { cap: 14 }, desc: 'Solide et durable.' },
    { id: 'marche', era: 1, name: 'Marché', icon: '🏺', arch: 'market', cost: { mat: 15 }, eff: { gold: 4 }, desc: 'On y échange poteries et épices.' },
    { id: 'temple', era: 1, name: 'Temple', icon: '🏛️', arch: 'temple', cost: { mat: 25, gold: 10 }, eff: { happy: 8, sci: 2 }, desc: 'Colonnes de marbre et offrandes.' },
    { id: 'biblio', era: 1, name: 'Bibliothèque', icon: '📜', arch: 'library', cost: { mat: 20, gold: 15 }, eff: { sci: 4 }, desc: 'Des rouleaux de papyrus par milliers.' },
    // Moyen Âge
    { id: 'moulin', era: 2, name: 'Moulin', icon: '🌬️', arch: 'mill', cost: { mat: 25, gold: 10 }, eff: { food: 14 }, desc: 'Le vent moud le grain.' },
    { id: 'colombage', era: 2, name: 'Maison à colombages', icon: '🏘️', arch: 'timber', cost: { mat: 30, gold: 10 }, eff: { cap: 22 }, desc: 'Des maisons serrées le long des ruelles.' },
    { id: 'monastere', era: 2, name: 'Monastère', icon: '📖', arch: 'monastery', cost: { mat: 40, gold: 20 }, eff: { sci: 7 }, desc: 'Les moines recopient les savoirs anciens.' },
    { id: 'chateau', era: 2, name: 'Château fort', icon: '🏰', arch: 'castle', cost: { mat: 60, gold: 30 }, eff: { def: 20, happy: 3 }, desc: 'Remparts, tours et pont-levis.' },
    { id: 'cathedrale', era: 2, name: 'Cathédrale', icon: '⛪', arch: 'church', cost: { mat: 70, gold: 40 }, eff: { happy: 12 }, desc: 'Un chantier de plusieurs générations.' },
    // Renaissance
    { id: 'ferme', era: 3, name: 'Grande ferme', icon: '🐄', arch: 'barn', cost: { mat: 40, gold: 20 }, eff: { food: 22 }, desc: 'Élevage et cultures variées.' },
    { id: 'hotel', era: 3, name: 'Hôtel particulier', icon: '🏡', arch: 'mansion', cost: { mat: 50, gold: 30 }, eff: { cap: 35 }, desc: 'De belles demeures en pierre de taille.' },
    { id: 'banque', era: 3, name: 'Banque', icon: '🏦', arch: 'bank', cost: { mat: 50, gold: 30 }, eff: { gold: 15 }, desc: 'Prêts, crédits et lettres de change.' },
    { id: 'universite', era: 3, name: 'Université', icon: '🎓', arch: 'university', cost: { mat: 60, gold: 50 }, eff: { sci: 12 }, desc: 'Savants et étudiants débattent.' },
    { id: 'theatre', era: 3, name: 'Théâtre', icon: '🎭', arch: 'theatre', cost: { mat: 50, gold: 40 }, eff: { happy: 12 }, desc: 'Comédies et tragédies.' },
    // Révolution industrielle
    { id: 'usine', era: 4, name: 'Usine', icon: '🏭', arch: 'factory', cost: { mat: 80, gold: 60 }, eff: { mat: 25, gold: 15, happy: -4 }, desc: 'Production de masse… et fumée noire.' },
    { id: 'immeuble', era: 4, name: 'Immeuble ouvrier', icon: '🏢', arch: 'tenement', cost: { mat: 90, gold: 50 }, eff: { cap: 70 }, desc: 'Loger les ouvriers près des usines.' },
    { id: 'meca', era: 4, name: 'Ferme mécanisée', icon: '🚜', arch: 'tractor', cost: { mat: 80, gold: 60 }, eff: { food: 40 }, desc: 'Les machines remplacent les bras.' },
    { id: 'gare', era: 4, name: 'Gare', icon: '🚂', arch: 'station', cost: { mat: 100, gold: 80 }, eff: { gold: 25 }, desc: 'Le chemin de fer relie le pays au monde.' },
    { id: 'ecole', era: 4, name: 'École publique', icon: '🏫', arch: 'school', cost: { mat: 80, gold: 70 }, eff: { sci: 20, happy: 4 }, desc: 'Apprendre à lire, écrire, compter.' },
    // Monde moderne
    { id: 'eolien', era: 5, name: 'Parc éolien', icon: '🌀', arch: 'wind', cost: { mat: 120, gold: 80 }, eff: { mat: 30, gold: 20, happy: 5 }, desc: 'Une énergie propre.' },
    { id: 'gratteciel', era: 5, name: 'Gratte-ciel', icon: '🏙️', arch: 'tower', cost: { mat: 200, gold: 150 }, eff: { cap: 160 }, desc: 'La ville grandit vers le ciel.' },
    { id: 'vertical', era: 5, name: 'Ferme verticale', icon: '🥬', arch: 'greentower', cost: { mat: 150, gold: 120 }, eff: { food: 80 }, desc: 'Des cultures sur 30 étages.' },
    { id: 'hopital', era: 5, name: 'Hôpital', icon: '🏥', arch: 'hospital', cost: { mat: 120, gold: 100 }, eff: { happy: 10, cap: 20 }, desc: 'Soigner tout le monde.' },
    { id: 'labo', era: 5, name: 'Centre de recherche', icon: '🔬', arch: 'lab', cost: { mat: 150, gold: 150 }, eff: { sci: 40 }, desc: 'Physique, biologie, intelligence artificielle…' },
    { id: 'fusee', era: 5, name: 'Base spatiale', icon: '🚀', arch: 'rocket', cost: { mat: 300, gold: 300 }, eff: {}, req: 'espace', unique: true, desc: 'Lancer la première fusée du pays. VICTOIRE !' },
  ];

  /* ---------- Découvertes (3 par ère : les 3 = ère suivante) ---------- */
  const DISCOVERIES = [
    { id: 'feu', era: 0, name: 'Maîtrise du feu', icon: '🔥', cost: 5, eff: { happy: 5, food: 1 }, desc: 'Cuire, se chauffer, éloigner les bêtes.' },
    { id: 'outils', era: 0, name: 'Outils en pierre', icon: '🪓', cost: 8, eff: { mat: 2 }, desc: 'Silex taillé : couper, gratter, construire.' },
    { id: 'agriculture', era: 0, name: 'Agriculture', icon: '🌱', cost: 12, eff: { food: 3 }, desc: 'Planter des graines plutôt que les chercher.' },

    { id: 'ecriture', era: 1, name: 'Écriture', icon: '✍️', cost: 20, eff: { sci: 2 }, desc: 'Garder la mémoire des choses.' },
    { id: 'roue', era: 1, name: 'La roue', icon: '☸️', cost: 25, eff: { mat: 3 }, desc: 'Transporter plus, plus loin.' },
    { id: 'monnaie', era: 1, name: 'Monnaie', icon: '🪙', cost: 30, eff: { gold: 3 }, desc: 'Des pièces pour commercer.' },

    { id: 'metal', era: 2, name: 'Métallurgie', icon: '⚒️', cost: 40, eff: { mat: 4, def: 10 }, desc: 'Le fer pour les charrues et les épées.' },
    { id: 'assolement', era: 2, name: 'Assolement triennal', icon: '🌾', cost: 50, eff: { food: 8 }, desc: 'Faire tourner les cultures.' },
    { id: 'boussole', era: 2, name: 'Boussole', icon: '🧭', cost: 55, eff: { gold: 5 }, desc: 'Naviguer et commercer au loin.' },

    { id: 'imprimerie', era: 3, name: 'Imprimerie', icon: '📰', cost: 70, eff: { sci: 6 }, desc: 'Des livres pour tout le monde.' },
    { id: 'astronomie', era: 3, name: 'Astronomie', icon: '🔭', cost: 85, eff: { sci: 4, happy: 3 }, desc: 'La Terre tourne autour du Soleil !' },
    { id: 'change', era: 3, name: 'Lettre de change', icon: '📜', cost: 95, eff: { gold: 8 }, desc: 'L\'ancêtre du chèque.' },

    { id: 'vapeur', era: 4, name: 'Machine à vapeur', icon: '⚙️', cost: 120, eff: { mat: 15 }, desc: 'La force du charbon.' },
    { id: 'electricite', era: 4, name: 'Électricité', icon: '💡', cost: 140, eff: { gold: 10, happy: 5 }, desc: 'La lumière dans chaque maison.' },
    { id: 'vaccins', era: 4, name: 'Vaccins', icon: '💉', cost: 160, eff: { happy: 8 }, desc: 'Fini les grandes épidémies.' },

    { id: 'informatique', era: 5, name: 'Informatique', icon: '💻', cost: 180, eff: { sci: 20 }, desc: 'Des machines qui calculent.' },
    { id: 'internet', era: 5, name: 'Internet', icon: '🌐', cost: 210, eff: { gold: 20, happy: 5 }, desc: 'Le monde entier connecté.' },
    { id: 'espace', era: 5, name: 'Conquête spatiale', icon: '🛰️', cost: 250, eff: {}, desc: 'Débloque la Base spatiale.' },
  ];

  /* ---------- Lois (adoptées une fois, effet permanent) ---------- */
  const LAWS = [
    { id: 'partage', era: 0, name: 'Partage du gibier', icon: '🍖', cost: {}, eff: { happy: 6, food: -1 }, desc: 'Chacun reçoit sa part de la chasse.' },
    { id: 'anciens', era: 0, name: 'Conseil des anciens', icon: '👴', cost: {}, eff: { sci: 1, happy: 2 }, desc: 'Les plus sages décident.' },
    { id: 'chef', era: 0, name: 'Chef de guerre', icon: '🪖', cost: {}, eff: { def: 5 }, desc: 'Un meneur pour défendre la tribu.' },

    { id: 'code', era: 1, name: 'Code de lois', icon: '⚖️', cost: { gold: 5 }, eff: { happy: 5 }, desc: 'Les mêmes règles pour tous.' },
    { id: 'impot', era: 1, name: 'Impôt', icon: '💰', cost: {}, eff: { gold: 6, happy: -4 }, desc: 'Chacun paie sa part au trésor.' },
    { id: 'service', era: 1, name: 'Service militaire', icon: '🛡️', cost: {}, eff: { def: 10, happy: -2 }, desc: 'Tous les jeunes s\'entraînent.' },

    { id: 'corvee', era: 2, name: 'Corvée', icon: '⛏️', cost: {}, eff: { mat: 8, happy: -6 }, desc: 'Travail obligatoire pour le seigneur.' },
    { id: 'charte', era: 2, name: 'Charte des villes', icon: '📃', cost: { gold: 15 }, eff: { gold: 5, happy: 3 }, desc: 'Les villes s\'administrent elles-mêmes.' },
    { id: 'fetes', era: 2, name: 'Fêtes de village', icon: '🎉', cost: {}, eff: { happy: 8, gold: -2 }, desc: 'Banquets, danses et tournois.' },

    { id: 'mecenat', era: 3, name: 'Mécénat', icon: '🎨', cost: { gold: 30 }, eff: { sci: 5, happy: 5, gold: -3 }, desc: 'Financer peintres et inventeurs.' },
    { id: 'expression', era: 3, name: 'Liberté d\'expression', icon: '🗣️', cost: {}, eff: { sci: 4, happy: 4 }, desc: 'Chacun peut dire ce qu\'il pense.' },
    { id: 'libreechange', era: 3, name: 'Libre-échange', icon: '⚓', cost: { gold: 20 }, eff: { gold: 10 }, desc: 'Ouvrir les ports au commerce.' },

    { id: 'obligatoire', era: 4, name: 'École obligatoire', icon: '📚', cost: { gold: 40 }, eff: { sci: 10, gold: -5 }, desc: 'Tous les enfants à l\'école.' },
    { id: 'huitheures', era: 4, name: 'Journée de 8 heures', icon: '⏰', cost: {}, eff: { happy: 10, mat: -5 }, desc: 'Travailler moins, vivre mieux.' },
    { id: 'suffrage', era: 4, name: 'Suffrage universel', icon: '🗳️', cost: {}, eff: { happy: 12 }, desc: 'Tout le monde vote… comme vous !' },

    { id: 'ecologie', era: 5, name: 'Transition écologique', icon: '🌍', cost: { gold: 80 }, eff: { happy: 10, mat: -10 }, desc: 'Protéger la vallée.' },
    { id: 'secu', era: 5, name: 'Sécurité sociale', icon: '🩺', cost: { gold: 60 }, eff: { happy: 10, gold: -10 }, desc: 'Se soigner sans se ruiner.' },
    { id: 'science', era: 5, name: 'Recherche ouverte', icon: '🧪', cost: { gold: 50 }, eff: { sci: 25, gold: -5 }, desc: 'Partager les découvertes.' },
  ];

  const RES_ICONS = { food: '🍖', mat: '🪵', gold: '💰', sci: '💡', happy: '😊', cap: '🏠', def: '🛡️' };
  const RES_NAMES = { food: 'nourriture', mat: 'matériaux', gold: 'or', sci: 'savoir', happy: 'bonheur', cap: 'logements', def: 'défense' };

  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const B = byId(BUILDINGS), D = byId(DISCOVERIES), L = byId(LAWS);

  /* ---------- État ---------- */
  function newState(name, flag) {
    return {
      v: 1, name: name || 'Pays sans nom', flag: flag || null, site: null,
      day: 1, era: 0, pop: 5, happy: 60, army: 0, fort: 0, peaceUntil: 0,
      res: { food: 15, mat: 10, gold: 0, sci: 0 },
      buildings: [], disc: [], laws: [], log: [],
      won: false, lost: false, stats: { battles: 0, victories: 0, built: 0 },
    };
  }

  function addEff(t, eff, k) {
    for (const key in eff) t[key] = (t[key] || 0) + eff[key] * (k == null ? 1 : k);
  }

  function totals(s) {
    const t = { food: 0, mat: 0, gold: 0, sci: 0, happy: 0, cap: 0, def: 0 };
    for (const b of s.buildings) addEff(t, B[b.id].eff);
    for (const d of s.disc) addEff(t, D[d].eff);
    for (const l of s.laws) addEff(t, L[l].eff);
    t.def += s.fort;
    return t;
  }

  const count = (s, id) => s.buildings.filter((b) => b.id === id).length;
  const capacity = (s) => 5 + totals(s).cap;
  const power = (s) => Math.round(s.army * (1 + s.era * 0.5) + totals(s).def);
  const enemyStrength = (s) => Math.round(4 + s.day * 0.6 * (1 + s.era * 0.6));

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

  /* ---------- Prévisions de la journée ---------- */
  function forecast(s) {
    const t = totals(s);
    const mult = 0.75 + s.happy / 200;
    const lake = s.site === 'lac', river = s.site === 'riviere';
    const foodProd = Math.round((3 + t.food + (lake ? 3 : 0)) * (river ? 1.25 : 1) * mult);
    const foodCons = Math.ceil(s.pop / 3) + Math.ceil(s.army / 4);
    const mat = Math.round((2 + Math.floor(s.pop / 8) + t.mat) * mult);
    const gold = Math.round((Math.floor(s.pop / 12) + t.gold + (lake ? 2 : 0)) * mult);
    const sci = Math.round((1 + Math.floor(s.pop / 20) + t.sci) * mult);
    const cap = 5 + t.cap;
    let target = 50 + t.happy;
    if (s.pop >= cap) target -= 5;
    if (foodProd - foodCons < 0 && s.res.food <= 0) target -= 10;
    target = Math.max(0, Math.min(100, target));
    return { food: foodProd - foodCons, foodProd, foodCons, mat, gold, sci, cap, happyTarget: target, t };
  }

  /* ---------- Choix possibles (le vote du jour) ---------- */
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

  function options(s, cat) {
    const out = [];
    if (cat === 'build') {
      for (const b of BUILDINGS) {
        if (b.era > s.era) continue;
        if (b.unique && count(s, b.id)) continue;
        if (b.req && !s.disc.includes(b.req)) {
          if (b.era === s.era) out.push({ id: b.id, icon: b.icon, name: b.name, desc: b.desc, cost: fmtCost(b.cost), eff: '', can: false, why: `Nécessite : ${D[b.req].name}`, era: b.era });
          continue;
        }
        const c = buildCost(s, b);
        const n = count(s, b.id);
        out.push({ id: b.id, icon: b.icon, name: b.name + (n ? ` (${n})` : ''), desc: b.desc, cost: fmtCost(c), eff: fmtEff(b.eff), can: canPay(s, c), why: canPay(s, c) ? '' : 'Pas assez de ressources', era: b.era });
      }
      out.sort((a, b) => (b.id === 'fusee') - (a.id === 'fusee') || b.era - a.era);
    } else if (cat === 'law') {
      for (const l of LAWS) {
        if (l.era > s.era || s.laws.includes(l.id)) continue;
        out.push({ id: l.id, icon: l.icon, name: l.name, desc: l.desc, cost: fmtCost(l.cost) || 'Gratuit', eff: fmtEff(l.eff), can: canPay(s, l.cost), why: canPay(s, l.cost) ? '' : 'Pas assez d\'or', era: l.era });
      }
      out.sort((a, b) => b.era - a.era);
    } else if (cat === 'tech') {
      for (const d of DISCOVERIES) {
        if (d.era !== s.era || s.disc.includes(d.id)) continue;
        const ok = s.res.sci >= d.cost;
        out.push({ id: d.id, icon: d.icon, name: d.name, desc: d.desc, cost: `${d.cost} 💡`, eff: fmtEff(d.eff), can: ok, why: ok ? '' : 'Pas assez de savoir', era: d.era });
      }
    } else if (cat === 'war') {
      const w = warCosts(s);
      const p = power(s), e = enemyStrength(s);
      const chance = Math.round(100 * attackChance(s));
      out.push({ id: 'recruter', icon: '🪖', name: s.era === 0 ? 'Former des guerriers' : 'Recruter des soldats', desc: `Votre puissance : ${p} ⚔️`, cost: fmtCost(w.recruit), eff: `+${w.recruitN} soldats`, can: canPay(s, w.recruit), why: 'Pas assez de ressources' });
      out.push({ id: 'attaquer', icon: '⚔️', name: `Attaquer ${ERAS[s.era].enemy}`, desc: `Force ennemie ≈ ${e}. Butin et nouveaux habitants si victoire.`, cost: '—', eff: `${chance}% de chances`, can: s.army > 0, why: 'Il vous faut des soldats' });
      out.push({ id: 'fortifier', icon: '🧱', name: s.era < 2 ? 'Palissade' : s.era < 4 ? 'Remparts' : 'Défenses modernes', desc: 'Protège contre les invasions.', cost: fmtCost(w.fort), eff: `+${w.fortN} 🛡️`, can: canPay(s, w.fort), why: 'Pas assez de ressources' });
      const peace = s.peaceUntil > s.day;
      out.push({ id: 'paix', icon: '🕊️', name: 'Traité de paix', desc: peace ? `En paix jusqu'au jour ${s.peaceUntil}.` : 'Aucune invasion pendant 12 jours.', cost: fmtCost(w.peace), eff: '+3 😊', can: !peace && canPay(s, w.peace), why: peace ? 'Déjà en paix' : 'Pas assez de ressources' });
    }
    return out;
  }

  function warCosts(s) {
    const e = s.era;
    return {
      recruit: e === 0 ? { food: 8 } : { food: 5, gold: 8 + e * 6 },
      recruitN: 3 + e * 2,
      fort: { mat: 10 + e * 15 },
      fortN: 4 + e * 3,
      peace: e === 0 ? { food: 10 } : { gold: 10 + e * 15 },
    };
  }
  function attackChance(s) {
    const p = power(s), e = enemyStrength(s);
    return Math.max(0.05, Math.min(0.95, p / (p + e * 0.9)));
  }

  /* ---------- Appliquer le vote ---------- */
  // Renvoie { ok, title, text, icon, good, built? }
  function act(s, cat, id, rng) {
    rng = rng || Math.random;
    if (cat === 'build') {
      const b = B[id];
      const c = buildCost(s, b);
      if (!b || b.era > s.era || !canPay(s, c) || (b.req && !s.disc.includes(b.req))) return { ok: false };
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
      if (!l || s.laws.includes(id) || !canPay(s, l.cost)) return { ok: false };
      pay(s, l.cost);
      s.laws.push(id);
      log(s, `${l.icon} Loi votée : ${l.name}`);
      return { ok: true, title: 'Loi adoptée', text: `${l.name} — ${l.desc}`, icon: l.icon, good: true };
    }
    if (cat === 'tech') {
      const d = D[id];
      if (!d || d.era !== s.era || s.disc.includes(id) || s.res.sci < d.cost) return { ok: false };
      s.res.sci -= d.cost;
      s.disc.push(id);
      log(s, `${d.icon} Découverte : ${d.name}`);
      const r = { ok: true, title: 'Découverte !', text: `${d.name} — ${d.desc}`, icon: d.icon, good: true };
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
          const loot = { food: 10 + e * 15, mat: 10 + e * 15, gold: e * 20 };
          for (const r in loot) s.res[r] += loot[r];
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
        return { ok: true, title: 'Défaite…', text: `${enemy[0].toUpperCase() + enemy.slice(1)} vous repousse. Vous perdez ${lostArmy} soldats et ${lostPop} habitants.`, icon: '💀', good: false };
      }
    }
    if (cat === 'rest') {
      s.happy = Math.min(100, s.happy + 4);
      log(s, '😴 Journée de repos');
      return { ok: true, title: 'Journée de repos', text: 'Le peuple se repose et fait la fête (+4 😊).', icon: '😴', good: true };
    }
    return { ok: false };
  }

  /* ---------- Événements aléatoires ---------- */
  const EVENTS = [
    { id: 'recolte', w: 3, ok: () => true, run: (s) => { const n = 8 + s.era * 12; s.res.food += n; return ['Récolte abondante', `Une saison généreuse : +${n} 🍖`, '🌽', true]; } },
    { id: 'migrants', w: 3, ok: (s) => s.pop < capacity(s), run: (s) => { const n = Math.min(capacity(s) - s.pop, 2 + s.era * 2); s.pop += n; return ['Des nomades arrivent', `${n} personnes découvrent la vallée et décident de vivre ici.`, '🧳', true]; } },
    { id: 'comete', w: 2, ok: () => true, run: (s) => { const n = 4 + s.era * 8; s.res.sci += n; return ['Une comète !', `Les savants l'observent pendant des nuits : +${n} 💡`, '☄️', true]; } },
    { id: 'tresor', w: 2, ok: (s) => s.era >= 1, run: (s) => { const n = 10 + s.era * 15; s.res.gold += n; return ['Trésor enfoui', `Des paysans déterrent un coffre : +${n} 💰`, '💎', true]; } },
    { id: 'tempete', w: 2, ok: () => true, run: (s) => { const n = Math.ceil(s.res.mat * 0.25); s.res.mat -= n; return ['Tempête', `Le vent arrache toits et réserves : -${n} 🪵`, '🌪️', false]; } },
    { id: 'loups', w: 2, ok: (s) => s.era <= 1, run: (s) => { const n = Math.ceil(s.res.food * 0.3); s.res.food -= n; return ['Attaque de loups', `Une meute pille les réserves : -${n} 🍖`, '🐺', false]; } },
    { id: 'crue', w: 2, ok: (s) => s.site === 'riviere', run: (s) => { const n = Math.ceil(s.res.food * 0.2); s.res.food -= n; s.res.sci += 3; return ['Crue de la rivière', `Les champs sont inondés (-${n} 🍖) mais le limon rendra la terre fertile.`, '🌊', false]; } },
    { id: 'peche', w: 2, ok: (s) => s.site === 'lac', run: (s) => { const n = 10 + s.era * 10; s.res.food += n; return ['Pêche miraculeuse', `Les filets débordent de poissons : +${n} 🍖`, '🐟', true]; } },
    { id: 'epidemie', w: 2, ok: (s) => s.pop > 12 && !s.disc.includes('vaccins'), run: (s) => { const n = Math.ceil(s.pop * 0.1); s.pop -= n; s.happy = Math.max(0, s.happy - 6); return ['Épidémie', `Une maladie frappe le pays : ${n} habitants disparaissent.`, '🦠', false]; } },
    { id: 'incendie', w: 1, ok: (s) => s.buildings.length > 3 && s.era < 5, run: (s) => { const n = Math.ceil(s.res.mat * 0.3); s.res.mat -= n; return ['Incendie', `Un feu ravage un quartier : -${n} 🪵`, '🔥', false]; } },
    { id: 'genie', w: 2, ok: (s) => s.era >= 2, run: (s) => { const n = 10 + s.era * 10; s.res.sci += n; return ['Un génie est né', `Un(e) inventeur(rice) révolutionne son domaine : +${n} 💡`, '🧠', true]; } },
    { id: 'festival', w: 2, ok: () => true, run: (s) => { s.happy = Math.min(100, s.happy + 8); return ['Grande fête', 'Musique et danses toute la nuit : +8 😊', '🎶', true]; } },
    { id: 'marchands', w: 2, ok: (s) => s.era >= 1, run: (s) => { const n = 8 + s.era * 12; s.res.gold += n; return ['Caravane de marchands', `Des marchands étrangers commercent avec vous : +${n} 💰`, '🐫', true]; } },
  ];

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
    const report = { delta: { food: f.food, mat: f.mat, gold: f.gold, sci: f.sci }, pop0: s.pop, events: [] };
    s.res.food += f.food; s.res.mat += f.mat; s.res.gold += f.gold; s.res.sci += f.sci;
    if (s.res.gold < 0) { s.res.gold = 0; s.happy = Math.max(0, s.happy - 3); }
    if (s.res.mat < 0) s.res.mat = 0;

    // Famine
    if (s.res.food < 0) {
      const n = Math.ceil(s.pop * 0.1) + 1;
      s.pop = Math.max(0, s.pop - n);
      s.res.food = 0;
      s.happy = Math.max(0, s.happy - 8);
      report.events.push({ title: 'Famine !', text: `Il n'y a plus rien à manger : ${n} habitants quittent la vallée. Construisez de quoi nourrir le peuple !`, icon: '🍂', good: false });
      log(s, `🍂 Famine (-${n} habitants)`);
    } else if (s.pop < f.cap && s.happy >= 25) {
      // Croissance
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
        const g = Math.ceil(s.res.gold * 0.3), m = Math.ceil(s.res.mat * 0.2);
        s.res.gold -= g; s.res.mat -= m;
        report.events.push({ title: 'Manif !', text: `Le peuple est mécontent et descend dans la rue. Le travail s'arrête : -${g} 💰 -${m} 🪵. Rendez-les plus heureux !`, icon: '📢', good: false });
        log(s, '📢 Manifestation');
      } else if (rng() < 0.3) {
        const pool = EVENTS.filter((e) => e.ok(s));
        const e = pickWeighted(pool, rng);
        const [title, text, icon, good] = e.run(s);
        report.events.push({ title, text, icon, good });
        log(s, `${icon} ${title}`);
      }
    }
    for (const r in s.res) s.res[r] = Math.max(0, Math.round(s.res[r]));

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
    s.res.food = Math.round(s.res.food * 0.7);
    s.res.mat = Math.round(s.res.mat * 0.7);
    s.res.gold = Math.round(s.res.gold * 0.7);
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
    ERAS, BUILDINGS, DISCOVERIES, LAWS, RES_ICONS, RES_NAMES, B, D, L,
    newState, totals, forecast, options, act, endDay, capacity, power, enemyStrength, log,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
