(() => {
  'use strict';

  // ============================================================
  // Constantes
  // ============================================================

  const TAILLE_TUILE = 28;
  const COLONNES = 132;
  const LIGNES = 84;
  const LARGEUR_MONDE = TAILLE_TUILE * COLONNES;
  const HAUTEUR_MONDE = TAILLE_TUILE * LIGNES;
  const NB_ZONES_COTE = 3; // grille de zones 3x3
  const TICK_MS = 2000;
  const VITESSE_PAN = 520; // px/s au clavier

  const BIOMES = {
    ocean:    { nom: 'Océan',    couleur: '#1c4f7c' },
    plage:    { nom: 'Plage',    couleur: '#d9c789' },
    plaine:   { nom: 'Plaine',   couleur: '#7fae4e' },
    foret:    { nom: 'Forêt',    couleur: '#2f6b3a' },
    riviere:  { nom: 'Rivière',  couleur: '#3d7fc4' },
    montagne: { nom: 'Montagne', couleur: '#8b8680' },
    carriere: { nom: 'Carrière', couleur: '#6f6459' },
    neige:    { nom: 'Neige',    couleur: '#eef3f5' },
  };

  const TYPES_RESSOURCE_NOEUD = {
    arbre:   { ressource: 'bois',       emoji: '🌲', max: 3, taux: 1.2, nom: 'Arbres' },
    roche:   { ressource: 'pierre',     emoji: '🪨', max: 3, taux: 1.1, nom: 'Gisement de pierre' },
    gibier:  { ressource: 'nourriture', emoji: '🦌', max: 2, taux: 0.9, nom: 'Gibier' },
    poisson: { ressource: 'nourriture', emoji: '🐟', max: 2, taux: 1.0, nom: 'Zone de pêche' },
  };

  const BATIMENTS = {
    maison:  { nom: 'Maison',           emoji: '🏠', cout: { bois: 20, pierre: 5 },  biomes: ['plaine', 'foret', 'plage'], desc: '+4 capacité de population' },
    entrepot:{ nom: 'Entrepôt',         emoji: '📦', cout: { bois: 35, pierre: 20 }, biomes: ['plaine', 'foret', 'plage', 'carriere', 'montagne'], desc: '+60 capacité de stockage' },
    champ:   { nom: 'Champ',            emoji: '🌾', cout: { bois: 10, pierre: 0 },  biomes: ['plaine'], desc: '+2 nourriture / tick' },
    enclos:  { nom: 'Enclos à animaux', emoji: '🐖', cout: { bois: 20, pierre: 10 }, biomes: ['plaine', 'foret'], desc: '+3 nourriture / tick', requiert: 'elevage' },
  };


  function emojiArbre(col, row) {
    const b = etat.tuiles[row][col];
    if (b === 'plage') return '🌴';
    if (b === 'foret') return '🌲';
    return '🌳';
  }

  function emojiEnclos(col, row) {
    return (col + row) % 2 === 0 ? '🐖' : '🐓';
  }

  const TECHS = [
    { id: 'outils_bois',   nom: 'Outils en pierre',      desc: '+50% de récolte de bois.', cout: 1, prerequis: [], effet: m => m.bois *= 1.5 },
    { id: 'outils_pierre', nom: 'Pics miniers',          desc: '+50% de récolte de pierre.', cout: 1, prerequis: [], effet: m => m.pierre *= 1.5 },
    { id: 'chasse',        nom: 'Techniques de chasse',  desc: '+50% de récolte de gibier et poisson.', cout: 1, prerequis: [], effet: m => m.nourriture *= 1.5 },
    { id: 'agriculture',   nom: 'Agriculture',           desc: 'Les champs produisent deux fois plus.', cout: 2, prerequis: ['outils_bois'], effet: m => m.champ *= 2 },
    { id: 'elevage',       nom: 'Élevage',                desc: 'Débloque la construction des enclos à animaux.', cout: 2, prerequis: ['chasse'], effet: () => {} },
    { id: 'urbanisme',     nom: 'Urbanisme',              desc: '-25% de coût de construction.', cout: 2, prerequis: [], effet: m => m.coutConstruction *= 0.75 },
    { id: 'entreposage',   nom: 'Grands entrepôts',       desc: '+100 capacité de stockage de base.', cout: 1, prerequis: [], effet: m => m.stockageBonus += 100 },
    { id: 'natalite',      nom: 'Médecine ancestrale',    desc: '+40% de vitesse de reproduction.', cout: 2, prerequis: ['agriculture'], effet: m => m.natalite *= 1.4 },
  ];

  const NOMS_ZONES = ['Nord-Ouest', 'Nord', 'Nord-Est', 'Ouest', 'Centre', 'Est', 'Sud-Ouest', 'Sud', 'Sud-Est'];
  for (let i = 0; i < 9; i++) {
    if (i === 4) continue; // le centre est déjà débloqué, pas de tech nécessaire
    const bord = [1, 3, 5, 7].includes(i);
    TECHS.push({
      id: 'zone_' + i,
      nom: 'Exploration : ' + NOMS_ZONES[i],
      desc: 'Débloque la zone « ' + NOMS_ZONES[i] + ' » pour la récolte et la construction.',
      cout: bord ? 1 : 2,
      prerequis: bord ? [] : [1, 3, 5, 7].filter(b => estAdjacent(b, i)).map(b => 'zone_' + b),
      zone: i,
      effet: () => {},
    });
  }
  function estAdjacent(zoneBord, zoneCoin) {
    const dCol = Math.abs((zoneBord % 3) - (zoneCoin % 3));
    const dRow = Math.abs(Math.floor(zoneBord / 3) - Math.floor(zoneCoin / 3));
    return dCol <= 1 && dRow <= 1;
  }

  // ============================================================
  // Bruit procédural (value noise) pour générer la carte
  // ============================================================

  function creerGenerateurBruit(graine) {
    function hachage(ix, iy) {
      const s = Math.sin(ix * 127.1 + iy * 311.7 + graine * 74.7) * 43758.5453123;
      return s - Math.floor(s);
    }
    function bruit(x, y) {
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const xf = x - x0, yf = y - y0;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const n00 = hachage(x0, y0), n10 = hachage(x0 + 1, y0);
      const n01 = hachage(x0, y0 + 1), n11 = hachage(x0 + 1, y0 + 1);
      return (n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v;
    }
    return function bruitFractal(x, y, octaves = 4) {
      let total = 0, freq = 1, amp = 1, ampMax = 0;
      for (let i = 0; i < octaves; i++) {
        total += bruit(x * freq, y * freq) * amp;
        ampMax += amp;
        amp *= 0.5;
        freq *= 2;
      }
      return total / ampMax;
    };
  }

  // ============================================================
  // État du jeu
  // ============================================================

  let etat = null;

  function creerEtatInitial() {
    return {
      tuiles: [],      // biome par tuile
      noeuds: new Map(),    // "col,row" -> noeud de ressource
      batiments: new Map(), // "col,row" -> type de bâtiment
      zonesDebloquees: new Set([4]),
      ressources: { bois: 20, pierre: 10, nourriture: 20 },
      villageois: [],
      capacitePopulation: 8,
      niveau: 1,
      xp: 0,
      pointsTech: 0,
      techsAcquises: new Set(),
      multiplicateurs: { bois: 1, pierre: 1, nourriture: 1, champ: 1, enclos: 1, natalite: 1, coutConstruction: 1, stockageBonus: 0 },
    };
  }

  function xpRequisPour(niveau) {
    return 60 + (niveau - 1) * 45;
  }

  function capaciteStockage() {
    return 80 + etat.multiplicateurs.stockageBonus + [...etat.batiments.values()].filter(b => b === 'entrepot').length * 60;
  }

  function zoneDeCase(col, row) {
    const zc = Math.min(NB_ZONES_COTE - 1, Math.floor(col / (COLONNES / NB_ZONES_COTE)));
    const zr = Math.min(NB_ZONES_COTE - 1, Math.floor(row / (LIGNES / NB_ZONES_COTE)));
    return zr * NB_ZONES_COTE + zc;
  }

  function genererCarte() {
    const graine = Math.random() * 1000;
    const elevBruit = creerGenerateurBruit(graine);
    const humBruit = creerGenerateurBruit(graine + 91.3);
    const pierreBruit = creerGenerateurBruit(graine + 233.7);

    const cx = COLONNES / 2, cy = LIGNES / 2;
    const distMax = Math.hypot(cx, cy);

    const tuiles = [];
    for (let row = 0; row < LIGNES; row++) {
      const ligne = [];
      for (let col = 0; col < COLONNES; col++) {
        const d = Math.hypot(col - cx, row - cy) / distMax;
        let e = elevBruit(col / 9, row / 9, 5) * (1 - d * 0.85);
        e = Math.max(0, Math.min(1, e));
        const h = humBruit(col / 8, row / 8, 4);
        const p = pierreBruit(col / 6, row / 6, 3);

        let biome;
        if (e < 0.30) biome = 'ocean';
        else if (e < 0.35) biome = 'plage';
        else if (e > 0.65) biome = 'neige';
        else if (e > 0.60) biome = (p > 0.55 ? 'carriere' : 'montagne');
        else biome = (h > 0.52 ? 'foret' : 'plaine');

        ligne.push(biome);
      }
      tuiles.push(ligne);
    }

    // Traçage de quelques rivières depuis des sommets vers l'océan
    let tentativesRivieres = 0;
    let riviereCreees = 0;
    while (riviereCreees < 7 && tentativesRivieres < 700) {
      tentativesRivieres++;
      const c0 = Math.floor(Math.random() * COLONNES);
      const r0 = Math.floor(Math.random() * LIGNES);
      if (tuiles[r0][c0] !== 'montagne' && tuiles[r0][c0] !== 'neige') continue;

      let col = c0, row = r0, pas = 0;
      const parcours = [];
      while (pas < 400) {
        pas++;
        parcours.push([col, row]);
        if (tuiles[row][col] === 'ocean') break;
        let meilleur = null, meilleurE = Infinity;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nc = col + dc, nr = row + dr;
            if (nc < 0 || nr < 0 || nc >= COLONNES || nr >= LIGNES) continue;
            const d = Math.hypot(nc - cx, nr - cy) / distMax;
            let ne = elevBruit(nc / 9, nr / 9, 5) * (1 - d * 0.85);
            if (ne < meilleurE) { meilleurE = ne; meilleur = [nc, nr]; }
          }
        }
        if (!meilleur) break;
        [col, row] = meilleur;
      }
      if (tuiles[row] && tuiles[row][col] === 'ocean' && parcours.length > 6) {
        for (const [pc, pr] of parcours) {
          if (tuiles[pr][pc] !== 'ocean') tuiles[pr][pc] = 'riviere';
        }
        riviereCreees++;
      }
    }

    return tuiles;
  }

  function genererNoeudsRessources() {
    const noeuds = new Map();

    const tuilesParBiome = { foret: [], carriere: [], montagne: [], plaine: [], plage: [], eau: [] };
    for (let row = 0; row < LIGNES; row++) {
      for (let col = 0; col < COLONNES; col++) {
        const b = etat.tuiles[row][col];
        if (b === 'foret') tuilesParBiome.foret.push([col, row]);
        else if (b === 'carriere') tuilesParBiome.carriere.push([col, row]);
        else if (b === 'montagne') tuilesParBiome.montagne.push([col, row]);
        else if (b === 'plaine') tuilesParBiome.plaine.push([col, row]);
        else if (b === 'plage') tuilesParBiome.plage.push([col, row]);
        else if (b === 'riviere' || b === 'ocean') tuilesParBiome.eau.push([col, row]);
      }
    }

    const centresToutesZones = [];
    let zoneIdCompteur = 0;

    const VOISINS_ORTHO = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    function placerGroupes(listeTuiles, type, tuilesParGroupe, tailleMin, tailleMax, rayon, biomesAutorises) {
      if (listeTuiles.length === 0) return;
      const distanceMinCentres = Math.max(rayon * 5, tailleMax + 12);
      const centres = centresToutesZones;
      const nbGroupes = Math.max(1, Math.round(listeTuiles.length / tuilesParGroupe));
      for (let g = 0; g < nbGroupes; g++) {
        let ccol, crow, valide = false;
        for (let essaiCentre = 0; essaiCentre < 60; essaiCentre++) {
          [ccol, crow] = listeTuiles[Math.floor(Math.random() * listeTuiles.length)];
          if (noeuds.has(ccol + ',' + crow)) continue;
          if (centres.some(c => Math.hypot(c[0] - ccol, c[1] - crow) < distanceMinCentres)) continue;
          valide = true;
          break;
        }
        if (!valide) continue;
        centres.push([ccol, crow]);

        // Fait grandir la grappe case par case, en ne posant chaque nouvelle
        // ressource que sur une case orthogonalement adjacente à la grappe :
        // toutes les ressources d'une même zone se touchent ainsi forcément.
        const zoneId = zoneIdCompteur++;
        const combien = Math.round(aleatoire(tailleMin, tailleMax));
        const placees = [[ccol, crow]];
        noeuds.set(ccol + ',' + crow, { type, col: ccol, row: crow, zoneId });

        let tentatives = 0;
        while (placees.length < combien && tentatives < combien * 20) {
          tentatives++;
          const [bc, br] = placees[Math.floor(Math.random() * placees.length)];
          const [dc, dr] = VOISINS_ORTHO[Math.floor(Math.random() * VOISINS_ORTHO.length)];
          const col = bc + dc, row = br + dr;
          if (col < 0 || row < 0 || col >= COLONNES || row >= LIGNES) continue;
          const cle = col + ',' + row;
          if (noeuds.has(cle)) continue;
          if (!biomesAutorises.includes(etat.tuiles[row][col])) continue;
          noeuds.set(cle, { type, col, row, zoneId });
          placees.push([col, row]);
        }
      }
    }

    placerGroupes(tuilesParBiome.foret, 'arbre', 30, 3, 7, 2, ['foret']);
    placerGroupes(tuilesParBiome.plaine, 'arbre', 80, 3, 7, 2, ['plaine']);
    placerGroupes(tuilesParBiome.plage, 'arbre', 25, 3, 7, 1, ['plage']);
    placerGroupes(tuilesParBiome.foret, 'gibier', 110, 3, 7, 2, ['foret']);
    placerGroupes(tuilesParBiome.carriere, 'roche', 20, 3, 7, 2, ['carriere']);
    placerGroupes(tuilesParBiome.montagne, 'roche', 70, 3, 7, 2, ['montagne']);
    placerGroupes(tuilesParBiome.plaine, 'gibier', 90, 3, 7, 2, ['plaine']);
    placerGroupes(tuilesParBiome.eau, 'poisson', 42, 3, 7, 2, ['riviere', 'ocean']);

    for (const noeud of noeuds.values()) {
      if (noeud.type === 'arbre') noeud.emoji = emojiArbre(noeud.col, noeud.row);
    }

    return noeuds;
  }

  // ============================================================
  // Villageois : entités animées (tâches assignées + errance au repos)
  // ============================================================

  let villageoisIdCompteur = 0;

  function aleatoire(min, max) {
    return min + Math.random() * (max - min);
  }

  function nbPopulation() {
    return etat.villageois.length;
  }

  function compterTravailleurs(cle) {
    let n = 0;
    for (const v of etat.villageois) if (v.assigneA === cle) n++;
    return n;
  }

  function noeudsDeLaZone(zoneId) {
    const liste = [];
    for (const n of etat.noeuds.values()) if (n.zoneId === zoneId) liste.push(n);
    return liste;
  }

  function population_libre() {
    let n = 0;
    for (const v of etat.villageois) if (v.assigneA === null) n++;
    return n;
  }

  function tuileMarchable(col, row) {
    if (col < 0 || row < 0 || col >= COLONNES || row >= LIGNES) return false;
    const b = etat.tuiles[row][col];
    return b !== 'ocean' && b !== 'riviere';
  }

  function trouverTuileMarchable(centreCol, centreRow, rayon) {
    for (let tentative = 0; tentative < 40; tentative++) {
      const col = Math.max(0, Math.min(COLONNES - 1, Math.round(centreCol + aleatoire(-rayon, rayon))));
      const row = Math.max(0, Math.min(LIGNES - 1, Math.round(centreRow + aleatoire(-rayon, rayon))));
      if (tuileMarchable(col, row)) return { col, row };
    }
    return { col: Math.round(centreCol), row: Math.round(centreRow) };
  }

  function creerVillageois(col, row) {
    return {
      id: villageoisIdCompteur++,
      x: col * TAILLE_TUILE + TAILLE_TUILE / 2,
      y: row * TAILLE_TUILE + TAILLE_TUILE / 2,
      assigneA: null,
      cibleX: undefined,
      cibleY: undefined,
      mode: 'attente',
      pause: aleatoire(0, 2),
      vitesseBase: aleatoire(22, 32),
      phase: Math.random() * Math.PI * 2,
      enMouvement: false,
      travaille: false,
    };
  }

  function genererVillageoisInitiaux(n) {
    const cx = COLONNES / 2, cy = LIGNES / 2;
    const liste = [];
    for (let i = 0; i < n; i++) {
      const { col, row } = trouverTuileMarchable(cx, cy, 3);
      liste.push(creerVillageois(col, row));
    }
    return liste;
  }

  function choisirNouvelleCibleErrance(v) {
    const col = Math.round(v.x / TAILLE_TUILE);
    const row = Math.round(v.y / TAILLE_TUILE);
    for (let tentative = 0; tentative < 10; tentative++) {
      const nc = Math.max(0, Math.min(COLONNES - 1, col + Math.round(aleatoire(-2.5, 2.5))));
      const nr = Math.max(0, Math.min(LIGNES - 1, row + Math.round(aleatoire(-2.5, 2.5))));
      if (!tuileMarchable(nc, nr)) continue;
      if (!etat.zonesDebloquees.has(zoneDeCase(nc, nr))) continue;
      v.cibleX = nc * TAILLE_TUILE + TAILLE_TUILE / 2 + aleatoire(-6, 6);
      v.cibleY = nr * TAILLE_TUILE + TAILLE_TUILE / 2 + aleatoire(-6, 6);
      return;
    }
    v.cibleX = v.x;
    v.cibleY = v.y;
  }

  function mettreAJourVillageois(dt) {
    const parNoeud = new Map();
    for (const v of etat.villageois) {
      if (!v.assigneA) continue;
      if (!parNoeud.has(v.assigneA)) parNoeud.set(v.assigneA, []);
      parNoeud.get(v.assigneA).push(v);
    }

    for (const v of etat.villageois) {
      if (v.assigneA) {
        const [col, row] = v.assigneA.split(',').map(Number);
        const groupe = parNoeud.get(v.assigneA);
        const idx = groupe.indexOf(v);
        const angleOffset = (idx / Math.max(1, groupe.length)) * Math.PI * 2;
        const rayon = groupe.length > 1 ? TAILLE_TUILE * 0.38 : 0;
        const tx = col * TAILLE_TUILE + TAILLE_TUILE / 2 + Math.cos(angleOffset) * rayon;
        const ty = row * TAILLE_TUILE + TAILLE_TUILE / 2 + Math.sin(angleOffset) * rayon;
        const d = Math.hypot(tx - v.x, ty - v.y);
        v.enMouvement = d > 2;
        v.travaille = !v.enMouvement;
        if (v.enMouvement) {
          const pas = Math.min(d, v.vitesseBase * 1.6 * dt);
          v.x += (tx - v.x) / d * pas;
          v.y += (ty - v.y) / d * pas;
        }
      } else {
        v.travaille = false;
        if (v.mode === 'attente') {
          v.enMouvement = false;
          v.pause -= dt;
          if (v.pause <= 0) {
            choisirNouvelleCibleErrance(v);
            v.mode = 'marche';
          }
        } else {
          const d = Math.hypot(v.cibleX - v.x, v.cibleY - v.y);
          if (d < 2) {
            v.mode = 'attente';
            v.pause = aleatoire(1, 3);
            v.enMouvement = false;
          } else {
            const pas = Math.min(d, v.vitesseBase * dt);
            v.x += (v.cibleX - v.x) / d * pas;
            v.y += (v.cibleY - v.y) / d * pas;
            v.enMouvement = true;
          }
        }
      }
    }
  }

  function dessinerVillageois(temps) {
    const t = temps / 1000;
    for (const v of etat.villageois) {
      const x = v.x - camera.x;
      const y = v.y - camera.y;
      if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) continue;

      let offsetY = 0, echelleY = 1;
      if (v.travaille) {
        const osc = Math.sin(t * 7 + v.phase);
        offsetY = osc * 1.5;
        echelleY = 1 + osc * 0.08;
      } else if (v.enMouvement) {
        offsetY = Math.abs(Math.sin(t * 9 + v.phase)) * -2;
      }

      ctx.save();
      ctx.translate(x, y + 3);
      ctx.beginPath();
      ctx.ellipse(0, 3, 6, 2.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      ctx.translate(0, offsetY);
      ctx.scale(1, echelleY);
      ctx.font = (TAILLE_TUILE * 0.58) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧑', 0, -4);
      ctx.restore();
    }
  }

  // ============================================================
  // Initialisation / nouvelle partie
  // ============================================================

  function nouvellePartie() {
    etat = creerEtatInitial();
    etat.tuiles = genererCarte();
    etat.noeuds = genererNoeudsRessources();
    etat.villageois = genererVillageoisInitiaux(6);
    caseSelectionnee = null;
    modeConstruction = null;
    mettreAJourPalette();
    afficherSelection();
    centrerCameraSurLeDepart();
    dessinerMinicarteFond();
    fermerModalTech();
    document.getElementById('notifications').innerHTML = '';
  }

  function centrerCameraSurLeDepart() {
    camera.x = LARGEUR_MONDE / 2 - canvas.clientWidth / 2;
    camera.y = HAUTEUR_MONDE / 2 - canvas.clientHeight / 2;
    clamperCamera();
  }

  // ============================================================
  // Rendu : éléments DOM
  // ============================================================

  const canvas = document.getElementById('carte');
  const ctx = canvas.getContext('2d');
  const minicarte = document.getElementById('minicarte');
  const ctxMini = minicarte.getContext('2d');
  let minicarteFond = null;

  const camera = { x: 0, y: 0 };
  const touches = { haut: false, bas: false, gauche: false, droite: false };
  let glisser = false;
  let glisserOrigine = null;
  let aBouge = false;

  let caseSelectionnee = null;
  let modeConstruction = null;
  let enPause = false;

  function redimensionner() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    clamperCamera();
  }
  window.addEventListener('resize', redimensionner);

  function clamperCamera() {
    camera.x = Math.max(0, Math.min(LARGEUR_MONDE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(HAUTEUR_MONDE - canvas.height, camera.y));
    if (LARGEUR_MONDE <= canvas.width) camera.x = -(canvas.width - LARGEUR_MONDE) / 2;
    if (HAUTEUR_MONDE <= canvas.height) camera.y = -(canvas.height - HAUTEUR_MONDE) / 2;
  }

  function dessinerMinicarteFond() {
    minicarte.width = 160;
    minicarte.height = Math.round(160 * (LIGNES / COLONNES));
    const off = document.createElement('canvas');
    off.width = COLONNES;
    off.height = LIGNES;
    const octx = off.getContext('2d');
    for (let row = 0; row < LIGNES; row++) {
      for (let col = 0; col < COLONNES; col++) {
        octx.fillStyle = BIOMES[etat.tuiles[row][col]].couleur;
        octx.fillRect(col, row, 1, 1);
      }
    }
    minicarteFond = off;
  }

  function dessinerMinicarte() {
    if (!minicarteFond) return;
    ctxMini.imageSmoothingEnabled = false;
    ctxMini.drawImage(minicarteFond, 0, 0, minicarte.width, minicarte.height);

    // Zones verrouillées
    const zw = minicarte.width / NB_ZONES_COTE, zh = minicarte.height / NB_ZONES_COTE;
    for (let i = 0; i < 9; i++) {
      if (etat.zonesDebloquees.has(i)) continue;
      const zc = i % NB_ZONES_COTE, zr = Math.floor(i / NB_ZONES_COTE);
      ctxMini.fillStyle = 'rgba(0,0,0,0.55)';
      ctxMini.fillRect(zc * zw, zr * zh, zw, zh);
    }

    const ratioX = minicarte.width / LARGEUR_MONDE;
    const ratioY = minicarte.height / HAUTEUR_MONDE;
    ctxMini.strokeStyle = '#fff';
    ctxMini.lineWidth = 1.5;
    ctxMini.strokeRect(camera.x * ratioX, camera.y * ratioY, canvas.width * ratioX, canvas.height * ratioY);
  }

  function dessinerCarte(temps) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const colDebut = Math.max(0, Math.floor(camera.x / TAILLE_TUILE));
    const colFin = Math.min(COLONNES - 1, Math.ceil((camera.x + canvas.width) / TAILLE_TUILE));
    const rowDebut = Math.max(0, Math.floor(camera.y / TAILLE_TUILE));
    const rowFin = Math.min(LIGNES - 1, Math.ceil((camera.y + canvas.height) / TAILLE_TUILE));

    for (let row = rowDebut; row <= rowFin; row++) {
      for (let col = colDebut; col <= colFin; col++) {
        const x = col * TAILLE_TUILE - camera.x;
        const y = row * TAILLE_TUILE - camera.y;
        ctx.fillStyle = BIOMES[etat.tuiles[row][col]].couleur;
        ctx.fillRect(x, y, TAILLE_TUILE + 1, TAILLE_TUILE + 1);

        const cle = col + ',' + row;
        const noeud = etat.noeuds.get(cle);
        const batiment = etat.batiments.get(cle);
        const zoneOk = etat.zonesDebloquees.has(zoneDeCase(col, row));

        if (zoneOk && batiment) {
          const emojiBat = batiment === 'enclos' ? emojiEnclos(col, row) : BATIMENTS[batiment].emoji;
          ctx.font = (TAILLE_TUILE * 0.8) + 'px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emojiBat, x + TAILLE_TUILE / 2, y + TAILLE_TUILE / 2);
        } else if (zoneOk && noeud) {
          const emojiNoeud = noeud.emoji || TYPES_RESSOURCE_NOEUD[noeud.type].emoji;
          ctx.font = (TAILLE_TUILE * 0.72) + 'px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emojiNoeud, x + TAILLE_TUILE / 2, y + TAILLE_TUILE / 2);
          const nbTravailleurs = compterTravailleurs(cle);
          if (nbTravailleurs > 0) {
            ctx.fillStyle = '#0b1220';
            ctx.beginPath();
            ctx.arc(x + TAILLE_TUILE - 6, y + 6, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3ddc84';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(String(nbTravailleurs), x + TAILLE_TUILE - 6, y + 7);
          }
        }

        if (!zoneOk) {
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(x, y, TAILLE_TUILE + 1, TAILLE_TUILE + 1);
        }
      }
    }

    dessinerVillageois(temps);

    // Étiquette + cadenas au centre des zones verrouillées visibles
    for (let i = 0; i < 9; i++) {
      if (etat.zonesDebloquees.has(i)) continue;
      const zc = i % NB_ZONES_COTE, zr = Math.floor(i / NB_ZONES_COTE);
      const centreCol = (zc + 0.5) * (COLONNES / NB_ZONES_COTE);
      const centreRow = (zr + 0.5) * (LIGNES / NB_ZONES_COTE);
      const x = centreCol * TAILLE_TUILE - camera.x;
      const y = centreRow * TAILLE_TUILE - camera.y;
      if (x > -50 && x < canvas.width + 50 && y > -50 && y < canvas.height + 50) {
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', x, y);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(NOMS_ZONES[i], x, y + 22);
      }
    }

    // Sélection
    if (caseSelectionnee) {
      let tuilesAContourer;
      if (caseSelectionnee.verrouillee) {
        tuilesAContourer = [caseSelectionnee];
      } else {
        const noeudSel = etat.noeuds.get(caseSelectionnee.col + ',' + caseSelectionnee.row);
        tuilesAContourer = noeudSel ? noeudsDeLaZone(noeudSel.zoneId) : [caseSelectionnee];
      }
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 2;
      for (const t of tuilesAContourer) {
        const x = t.col * TAILLE_TUILE - camera.x;
        const y = t.row * TAILLE_TUILE - camera.y;
        ctx.strokeRect(x + 1, y + 1, TAILLE_TUILE - 2, TAILLE_TUILE - 2);
      }
    }
  }

  // ============================================================
  // Interactions : navigation caméra
  // ============================================================

  let glisserPointerId = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (glisserPointerId !== null) return;
    glisserPointerId = e.pointerId;
    glisser = true;
    aBouge = false;
    glisserOrigine = { x: e.clientX, y: e.clientY, camX: camera.x, camY: camera.y };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!glisser || e.pointerId !== glisserPointerId || !glisserOrigine) return;
    const dx = e.clientX - glisserOrigine.x;
    const dy = e.clientY - glisserOrigine.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) aBouge = true;
    camera.x = glisserOrigine.camX - dx;
    camera.y = glisserOrigine.camY - dy;
    clamperCamera();
  });
  function terminerGlisser(e) {
    if (e.pointerId !== glisserPointerId) return;
    if (glisser && !aBouge) {
      const rect = canvas.getBoundingClientRect();
      gererClicCarte(e.clientX - rect.left, e.clientY - rect.top);
    }
    glisser = false;
    glisserOrigine = null;
    glisserPointerId = null;
  }
  canvas.addEventListener('pointerup', terminerGlisser);
  canvas.addEventListener('pointercancel', terminerGlisser);

  minicarte.addEventListener('click', (e) => {
    const rect = minicarte.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    camera.x = rx * LARGEUR_MONDE - canvas.width / 2;
    camera.y = ry * HAUTEUR_MONDE - canvas.height / 2;
    clamperCamera();
  });

  const TOUCHES_MAP = {
    ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite',
    z: 'haut', s: 'bas', q: 'gauche', d: 'droite',
    w: 'haut',
  };
  window.addEventListener('keydown', (e) => {
    const t = TOUCHES_MAP[e.key];
    if (t) touches[t] = true;
  });
  window.addEventListener('keyup', (e) => {
    const t = TOUCHES_MAP[e.key];
    if (t) touches[t] = false;
  });

  function gererClicCarte(px, py) {
    const col = Math.floor((px + camera.x) / TAILLE_TUILE);
    const row = Math.floor((py + camera.y) / TAILLE_TUILE);
    if (col < 0 || row < 0 || col >= COLONNES || row >= LIGNES) return;

    const zoneOk = etat.zonesDebloquees.has(zoneDeCase(col, row));
    if (!zoneOk) {
      caseSelectionnee = { col, row, verrouillee: true };
      afficherSelection();
      return;
    }

    if (modeConstruction) {
      tenterConstruction(col, row);
      return;
    }

    caseSelectionnee = { col, row, verrouillee: false };
    afficherSelection();
  }

  // ============================================================
  // Construction
  // ============================================================

  function mettreAJourPalette() {
    const palette = document.getElementById('paletteConstruction');
    palette.innerHTML = '';
    if (!modeConstruction && !document.getElementById('btnModeConstruire').classList.contains('mode-actif')) {
      palette.hidden = true;
      return;
    }
    palette.hidden = false;
    for (const [id, b] of Object.entries(BATIMENTS)) {
      if (b.requiert && !etat.techsAcquises.has(b.requiert)) continue;
      const btn = document.createElement('button');
      btn.className = 'carte-batiment' + (modeConstruction === id ? ' selectionne' : '');
      const cout = coutBatiment(b);
      btn.innerHTML = `<span>${b.emoji} ${b.nom}<br><small>${b.desc}</small></span><span>🪵${cout.bois} 🪨${cout.pierre}</span>`;
      btn.addEventListener('click', () => {
        modeConstruction = (modeConstruction === id) ? null : id;
        mettreAJourPalette();
      });
      palette.appendChild(btn);
    }
  }

  function coutBatiment(b) {
    const mult = etat.multiplicateurs.coutConstruction;
    return { bois: Math.round(b.cout.bois * mult), pierre: Math.round(b.cout.pierre * mult) };
  }

  function tenterConstruction(col, row) {
    const def = BATIMENTS[modeConstruction];
    const biome = etat.tuiles[row][col];
    const cle = col + ',' + row;

    if (!def.biomes.includes(biome)) {
      notifier('❌ Impossible de construire un(e) ' + def.nom.toLowerCase() + ' sur une case de type ' + BIOMES[biome].nom + '.');
      return;
    }
    if (etat.batiments.has(cle) || etat.noeuds.has(cle)) {
      notifier('❌ Cette case est déjà occupée.');
      return;
    }
    const cout = coutBatiment(def);
    if (etat.ressources.bois < cout.bois || etat.ressources.pierre < cout.pierre) {
      notifier('❌ Ressources insuffisantes pour construire ' + def.nom.toLowerCase() + '.');
      return;
    }
    etat.ressources.bois -= cout.bois;
    etat.ressources.pierre -= cout.pierre;
    etat.batiments.set(cle, modeConstruction);
    if (def.nom === 'Maison') etat.capacitePopulation += 4;
    gagnerXp(20);
    notifier('✅ ' + def.nom + ' construit(e) !');
    caseSelectionnee = { col, row, verrouillee: false };
    afficherSelection();
  }

  // ============================================================
  // Sélection : panneau latéral
  // ============================================================

  function afficherSelection() {
    const conteneur = document.getElementById('contenuSelection');
    if (!caseSelectionnee) {
      conteneur.innerHTML = '<p class="astuce">Cliquez sur une case de la carte pour l\'inspecter.</p>';
      return;
    }
    const { col, row, verrouillee } = caseSelectionnee;
    if (verrouillee) {
      const zone = zoneDeCase(col, row);
      conteneur.innerHTML = `<h3>🔒 Zone verrouillée</h3><p>La zone « ${NOMS_ZONES[zone]} » n'est pas encore explorée. Débloquez-la dans l'arbre technologique.</p>`;
      return;
    }
    const biome = etat.tuiles[row][col];
    const cle = col + ',' + row;
    const noeud = etat.noeuds.get(cle);
    const batiment = etat.batiments.get(cle);

    let html = `<h3>${BIOMES[biome].nom}</h3><p>Case (${col}, ${row})</p>`;

    if (batiment) {
      const def = BATIMENTS[batiment];
      const emojiBat = batiment === 'enclos' ? emojiEnclos(col, row) : def.emoji;
      html += `<p>${emojiBat} <b>${def.nom}</b><br>${def.desc}</p>`;
    } else if (noeud) {
      const def = TYPES_RESSOURCE_NOEUD[noeud.type];
      const emojiNoeud = noeud.emoji || def.emoji;
      const zone = noeudsDeLaZone(noeud.zoneId);
      const capaciteZone = zone.length * def.max;
      let travailleursZone = 0;
      for (const n of zone) travailleursZone += compterTravailleurs(n.col + ',' + n.row);
      const idle = population_libre();
      html += `<p>${emojiNoeud} <b>${def.nom}</b><br>Zone de ${zone.length} ressource${zone.length > 1 ? 's' : ''}<br>Travailleurs assignés : ${travailleursZone} / ${capaciteZone}</p>`;
      html += `<div class="ligne-action">
        <button id="btnRetirer" ${travailleursZone <= 0 ? 'disabled' : ''}>− Retirer</button>
        <span>👥 ${idle} libres</span>
        <button id="btnAssigner" ${(idle <= 0 || travailleursZone >= capaciteZone) ? 'disabled' : ''}>+ Assigner</button>
      </div>`;
    } else {
      html += '<p class="astuce">Case libre. Passez en mode Construire pour y bâtir quelque chose.</p>';
    }

    conteneur.innerHTML = html;

    const btnA = document.getElementById('btnAssigner');
    const btnR = document.getElementById('btnRetirer');
    if (btnA) btnA.addEventListener('click', () => {
      const def = TYPES_RESSOURCE_NOEUD[noeud.type];
      const zone = noeudsDeLaZone(noeud.zoneId);
      const cibleNoeud = zone.find(n => compterTravailleurs(n.col + ',' + n.row) < def.max);
      const libre = etat.villageois.find(v => v.assigneA === null);
      if (cibleNoeud && libre) libre.assigneA = cibleNoeud.col + ',' + cibleNoeud.row;
      afficherSelection();
    });
    if (btnR) btnR.addEventListener('click', () => {
      const zone = noeudsDeLaZone(noeud.zoneId);
      for (const n of zone) {
        const cleN = n.col + ',' + n.row;
        const assigne = etat.villageois.find(v => v.assigneA === cleN);
        if (assigne) {
          assigne.assigneA = null;
          assigne.mode = 'attente';
          assigne.pause = aleatoire(0.2, 1);
          break;
        }
      }
      afficherSelection();
    });
  }

  // ============================================================
  // Boucle de simulation (tick)
  // ============================================================

  function tick() {
    const m = etat.multiplicateurs;
    let gain = { bois: 0, pierre: 0, nourriture: 0 };

    for (const noeud of etat.noeuds.values()) {
      const cle = noeud.col + ',' + noeud.row;
      const nbTravailleurs = compterTravailleurs(cle);
      if (nbTravailleurs <= 0) continue;
      if (!etat.zonesDebloquees.has(zoneDeCase(noeud.col, noeud.row))) continue;
      const def = TYPES_RESSOURCE_NOEUD[noeud.type];
      const production = nbTravailleurs * def.taux * m[def.ressource];
      gain[def.ressource] += production;
    }

    for (const type of etat.batiments.values()) {
      if (type === 'champ') gain.nourriture += 2 * m.champ;
      if (type === 'enclos') gain.nourriture += 3 * m.enclos;
    }

    const cap = capaciteStockage();
    etat.ressources.bois = Math.min(cap, etat.ressources.bois + gain.bois);
    etat.ressources.pierre = Math.min(cap, etat.ressources.pierre + gain.pierre);
    etat.ressources.nourriture = Math.min(cap, etat.ressources.nourriture + gain.nourriture);

    // Reproduction de la population
    if (etat.ressources.nourriture >= 15 && nbPopulation() < etat.capacitePopulation) {
      const chance = 0.15 * m.natalite;
      if (Math.random() < chance) {
        etat.ressources.nourriture -= 10;
        const maisons = [...etat.batiments.entries()].filter(([, type]) => type === 'maison');
        let colNaissance, rowNaissance;
        if (maisons.length > 0) {
          const [cle] = maisons[Math.floor(Math.random() * maisons.length)];
          [colNaissance, rowNaissance] = cle.split(',').map(Number);
        } else {
          colNaissance = COLONNES / 2;
          rowNaissance = LIGNES / 2;
        }
        const pos = trouverTuileMarchable(colNaissance, rowNaissance, 2);
        etat.villageois.push(creerVillageois(pos.col, pos.row));
        notifier('👶 La population a grandi ! (' + nbPopulation() + ')');
      }
    }

    const xpGagne = (gain.bois + gain.pierre + gain.nourriture) * 0.4;
    if (xpGagne > 0) gagnerXp(xpGagne);
  }

  function gagnerXp(montant) {
    etat.xp += montant;
    let requis = xpRequisPour(etat.niveau);
    while (etat.xp >= requis) {
      etat.xp -= requis;
      etat.niveau++;
      etat.pointsTech++;
      etat.capacitePopulation += 1;
      notifier('⭐ Niveau ' + etat.niveau + ' atteint ! +1 point de technologie.');
      requis = xpRequisPour(etat.niveau);
    }
  }

  // ============================================================
  // Technologies
  // ============================================================

  function techDisponible(t) {
    return t.prerequis.every(p => etat.techsAcquises.has(p));
  }

  function acquerirTech(t) {
    if (etat.techsAcquises.has(t.id)) return;
    if (!techDisponible(t)) return;
    if (etat.pointsTech < t.cout) return;
    etat.pointsTech -= t.cout;
    etat.techsAcquises.add(t.id);
    t.effet(etat.multiplicateurs);
    if (typeof t.zone === 'number') etat.zonesDebloquees.add(t.zone);
    notifier('🔬 Technologie acquise : ' + t.nom);
    mettreAJourPalette();
    afficherModalTech();
  }

  function afficherModalTech() {
    const grille = document.getElementById('grilleTech');
    grille.innerHTML = '';
    for (const t of TECHS) {
      const acquise = etat.techsAcquises.has(t.id);
      const dispo = techDisponible(t);
      const div = document.createElement('div');
      div.className = 'carte-tech' + (acquise ? ' acquise' : (!dispo ? ' verrouillee' : ''));
      div.innerHTML = `<h3>${acquise ? '✅' : (dispo ? '🔓' : '🔒')} ${t.nom}</h3>
        <p>${t.desc}</p>
        <span class="cout">${acquise ? 'Acquise' : 'Coût : ' + t.cout + ' pt(s)'}</span>`;
      if (!acquise && dispo) {
        const btn = document.createElement('button');
        btn.textContent = 'Débloquer';
        btn.disabled = etat.pointsTech < t.cout;
        btn.addEventListener('click', () => acquerirTech(t));
        div.appendChild(btn);
      }
      grille.appendChild(div);
    }
  }

  function ouvrirModalTech() {
    afficherModalTech();
    document.getElementById('modalTech').hidden = false;
  }
  function fermerModalTech() {
    document.getElementById('modalTech').hidden = true;
  }

  // ============================================================
  // Notifications
  // ============================================================

  function notifier(texte) {
    const conteneur = document.getElementById('notifications');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = texte;
    conteneur.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
    while (conteneur.children.length > 4) conteneur.removeChild(conteneur.firstChild);
  }

  // ============================================================
  // Rendu de l'interface (barre du haut)
  // ============================================================

  function majInterface() {
    const cap = capaciteStockage();
    document.getElementById('stBois').textContent = Math.floor(etat.ressources.bois);
    document.getElementById('stBoisCap').textContent = cap;
    document.getElementById('stPierre').textContent = Math.floor(etat.ressources.pierre);
    document.getElementById('stPierreCap').textContent = cap;
    document.getElementById('stNourriture').textContent = Math.floor(etat.ressources.nourriture);
    document.getElementById('stNourritureCap').textContent = cap;
    document.getElementById('stPopulation').textContent = nbPopulation();
    document.getElementById('stCapacite').textContent = etat.capacitePopulation;
    document.getElementById('stNiveau').textContent = etat.niveau;
    document.getElementById('stPoints').textContent = etat.pointsTech;

    const requis = xpRequisPour(etat.niveau);
    document.getElementById('barreXpRemplie').style.width = Math.min(100, (etat.xp / requis) * 100) + '%';
  }

  // ============================================================
  // Légende des biomes
  // ============================================================

  function initLegende() {
    const ul = document.getElementById('legendeBiomes');
    ul.innerHTML = '';
    for (const [id, b] of Object.entries(BIOMES)) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="pastille" style="background:${b.couleur}"></span>${b.nom}`;
      ul.appendChild(li);
    }
  }

  // ============================================================
  // Boucles principales
  // ============================================================

  let dernierTemps = performance.now();
  function boucleRendu(temps) {
    const dt = (temps - dernierTemps) / 1000;
    dernierTemps = temps;

    let dx = 0, dy = 0;
    if (touches.haut) dy -= 1;
    if (touches.bas) dy += 1;
    if (touches.gauche) dx -= 1;
    if (touches.droite) dx += 1;
    if (dx || dy) {
      const norme = Math.hypot(dx, dy) || 1;
      camera.x += (dx / norme) * VITESSE_PAN * dt;
      camera.y += (dy / norme) * VITESSE_PAN * dt;
      clamperCamera();
    }

    mettreAJourVillageois(dt);
    dessinerCarte(temps);
    dessinerMinicarte();
    requestAnimationFrame(boucleRendu);
  }

  function demarrerBoucleSimulation() {
    setInterval(() => {
      if (!enPause) tick();
      majInterface();
      if (caseSelectionnee && !caseSelectionnee.verrouillee) afficherSelection();
    }, TICK_MS);
  }

  // ============================================================
  // Écouteurs UI
  // ============================================================

  document.getElementById('btnPause').addEventListener('click', (e) => {
    enPause = !enPause;
    e.target.textContent = enPause ? '▶ Reprendre' : '⏸ Pause';
  });
  document.getElementById('btnNouvellePartie').addEventListener('click', nouvellePartie);

  document.getElementById('btnModeExplorer').addEventListener('click', () => {
    modeConstruction = null;
    document.getElementById('btnModeExplorer').classList.add('mode-actif');
    document.getElementById('btnModeConstruire').classList.remove('mode-actif');
    document.getElementById('paletteConstruction').hidden = true;
  });
  document.getElementById('btnModeConstruire').addEventListener('click', () => {
    document.getElementById('btnModeConstruire').classList.add('mode-actif');
    document.getElementById('btnModeExplorer').classList.remove('mode-actif');
    document.getElementById('paletteConstruction').hidden = false;
    mettreAJourPalette();
  });

  document.getElementById('btnTech').addEventListener('click', ouvrirModalTech);
  document.getElementById('fermerTech').addEventListener('click', fermerModalTech);
  document.getElementById('modalTech').addEventListener('click', (e) => {
    if (e.target.id === 'modalTech') fermerModalTech();
  });

  // ============================================================
  // Démarrage
  // ============================================================

  initLegende();
  redimensionner();
  nouvellePartie();
  majInterface();
  demarrerBoucleSimulation();
  requestAnimationFrame(boucleRendu);
})();
