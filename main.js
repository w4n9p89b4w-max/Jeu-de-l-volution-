/* ==========================================================================
   L'Évolution — interface et déroulement de la partie
   ========================================================================== */
(function () {
  'use strict';
  const E = window.Engine;
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = 'evolution-pays-v1';

  const map = ValleyMap.create($('map'));
  // l'écran du jeu ne doit jamais défiler (sinon tout se décale)
  $('app').addEventListener('scroll', () => { $('app').scrollTop = 0; $('app').scrollLeft = 0; });
  let state = null;
  let busy = false;

  /* ---------- Sauvegarde ---------- */
  function save() {
    if (!state) return;
    try {
      const copy = JSON.parse(JSON.stringify(state));
      delete copy.launch;
      for (const b of copy.buildings) { delete b.x; delete b.y; }
      localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
    } catch (e) { /* stockage indisponible : on joue sans sauvegarde */ }
  }
  function load() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* rien */ } }

  /* ---------- Drapeau ---------- */
  const PALETTE = ['#d62828', '#f77f00', '#fcbf49', '#2a9d8f', '#3a86ff', '#1d3557', '#6a4c93', '#2b9348', '#ffffff', '#111111', '#8d5524', '#ff70a6'];
  const PATTERNS = ['h3', 'v3', 'cross', 'diag', 'disc', 'two'];
  const SYMBOLS = ['', '★', '☀', '▲', '✦', '❤', '☾', '⚘'];
  let flag = { p: 'h3', c: ['#2b9348', '#ffffff', '#3a86ff'], s: '' };

  function drawFlag(cv, f) {
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    const [a, b, c] = f.c;
    ctx.clearRect(0, 0, w, h);
    const R = (x, y, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, ww, hh); };
    if (f.p === 'h3') { R(0, 0, w, h / 3 + 1, a); R(0, h / 3, w, h / 3 + 1, b); R(0, 2 * h / 3, w, h / 3, c); }
    else if (f.p === 'v3') { R(0, 0, w / 3 + 1, h, a); R(w / 3, 0, w / 3 + 1, h, b); R(2 * w / 3, 0, w / 3, h, c); }
    else if (f.p === 'cross') { R(0, 0, w, h, a); R(w * 0.28, 0, w * 0.16, h, b); R(0, h * 0.4, w, h * 0.2, b); R(w * 0.32, 0, w * 0.08, h, c); R(0, h * 0.45, w, h * 0.1, c); }
    else if (f.p === 'diag') { R(0, 0, w, h, a); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); ctx.strokeStyle = b; ctx.lineWidth = h * 0.16; ctx.beginPath(); ctx.moveTo(-5, h + 3); ctx.lineTo(w + 5, -3); ctx.stroke(); }
    else if (f.p === 'disc') { R(0, 0, w, h, a); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = b; ctx.lineWidth = h * 0.06; ctx.stroke(); }
    else if (f.p === 'two') { R(0, 0, w, h / 2 + 1, a); R(0, h / 2, w, h / 2, c); R(0, 0, w * 0.06, h, b); }
    if (f.s) {
      const under = { h3: b, v3: b, disc: c, diag: b, two: a, cross: a }[f.p];
      const x = f.p === 'cross' ? w * 0.72 : f.p === 'two' ? w * 0.3 : w / 2;
      const y = f.p === 'cross' ? h * 0.24 : f.p === 'two' ? h * 0.27 : h / 2 + h * 0.03;
      ctx.fillStyle = contrast(under);
      ctx.font = `${Math.round(h * (f.p === 'cross' || f.p === 'two' ? 0.3 : 0.42))}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.s, x, y);
    }
  }
  function contrast(hex) {
    const n = parseInt(hex.slice(1), 16);
    const l = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
    return l > 150 ? '#1d2433' : '#ffffff';
  }

  let editColor = 0;
  function buildFlagEditor() {
    const pats = $('fPatterns'); pats.innerHTML = '<span>Motif</span>';
    for (const p of PATTERNS) {
      const bt = document.createElement('button'); bt.className = 'pat'; bt.dataset.p = p;
      const cv = document.createElement('canvas'); cv.width = 39; cv.height = 26;
      drawFlag(cv, { p, c: ['#3a86ff', '#ffffff', '#d62828'], s: '' });
      bt.appendChild(cv); bt.onclick = () => { flag.p = p; refreshFlagEditor(); };
      pats.appendChild(bt);
    }
    const pal = $('fPalette'); pal.innerHTML = '';
    for (const c of PALETTE) {
      const bt = document.createElement('button'); bt.className = 'pal'; bt.style.background = c;
      bt.onclick = () => { flag.c[editColor] = c; editColor = (editColor + 1) % 3; refreshFlagEditor(); };
      pal.appendChild(bt);
    }
    document.querySelectorAll('.swatch').forEach((sw) => { sw.onclick = () => { editColor = +sw.dataset.i; refreshFlagEditor(); }; });
    const sy = $('fSymbols'); sy.innerHTML = '<span>Symbole</span>';
    for (const s of SYMBOLS) {
      const bt = document.createElement('button'); bt.className = 'sym'; bt.textContent = s || '∅'; bt.dataset.s = s;
      bt.onclick = () => { flag.s = s; refreshFlagEditor(); };
      sy.appendChild(bt);
    }
    refreshFlagEditor();
  }
  function refreshFlagEditor() {
    drawFlag($('flagPreview'), flag);
    document.querySelectorAll('.pat').forEach((b) => b.classList.toggle('on', b.dataset.p === flag.p));
    document.querySelectorAll('.sym').forEach((b) => b.classList.toggle('on', b.dataset.s === flag.s));
    document.querySelectorAll('.swatch').forEach((b) => { b.style.background = flag.c[+b.dataset.i]; b.classList.toggle('on', +b.dataset.i === editColor); });
  }
  function applyFlag() {
    drawFlag($('hFlag'), state.flag);
    const cv = document.createElement('canvas'); cv.width = 60; cv.height = 40;
    drawFlag(cv, state.flag);
    map.setFlag(cv);
  }

  /* ---------- Légendes, toast, nuit ---------- */
  let capTimer = 0;
  function caption(html, ms) {
    const c = $('caption');
    c.innerHTML = html; c.classList.add('show');
    clearTimeout(capTimer);
    if (ms) capTimer = setTimeout(() => c.classList.remove('show'), ms);
  }
  function hideCaption() { $('caption').classList.remove('show'); }
  let toastTimer = 0;
  function toast(html, ms) {
    const t = $('toast'); t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2600);
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Modale ---------- */
  function modal({ icon, title, html, text, good, buttons }) {
    return new Promise((resolve) => {
      $('mIco').textContent = icon || '';
      $('mTitle').textContent = title || '';
      if (html != null) $('mText').innerHTML = html; else $('mText').textContent = text || '';
      const card = document.querySelector('.modal-card');
      card.classList.remove('good', 'bad');
      if (good === true) card.classList.add('good');
      if (good === false) card.classList.add('bad');
      card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
      const acts = $('mActions'); acts.innerHTML = '';
      for (const b of buttons || [{ label: 'Continuer', value: true, primary: true }]) {
        const bt = document.createElement('button');
        bt.className = 'btn' + (b.primary ? ' primary' : '') + (b.cls ? ' ' + b.cls : '');
        bt.textContent = b.label;
        if (b.hint) { const sm = document.createElement('small'); sm.textContent = b.hint; bt.appendChild(sm); }
        bt.onclick = () => { $('modal').classList.add('hidden'); resolve(b.value); };
        acts.appendChild(bt);
      }
      $('modal').classList.remove('hidden');
    });
  }

  /* ---------- HUD ---------- */
  const fmt = (n) => n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
  const short = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + 'k' : String(n));
  let lastPop = 0;
  function updateHUD() {
    if (!state) return;
    const f = E.forecast(state);
    $('hDay').textContent = state.day;
    const hp = $('hPop');
    hp.textContent = fmt(state.pop);
    if (state.pop > lastPop) { hp.classList.remove('bump'); void hp.offsetWidth; hp.classList.add('bump'); }
    lastPop = state.pop;
    $('hName').textContent = state.name;
    const idle = (state.villagers || []).filter((v) => v.job === 'idle').length;
    $('idleN').textContent = idle || '';
    const era = E.ERAS[state.era];
    $('hEra').textContent = `${era.name} · ${era.year}`;
    // une seule ligne : l'icône et la quantité ; le détail s'ouvre en touchant la ligne
    const mood = state.happy >= 70 ? '😄' : state.happy >= 40 ? '🙂' : state.happy >= 25 ? '😐' : '😠';
    $('res').innerHTML = E.known(state).map((r) =>
      `<span class="rc${r === 'food' && f.food < 0 ? ' warn' : ''}">${E.RES_ICONS[r]}<b>${short(state.res[r])}</b></span>`).concat([
      `<span class="rc${state.happy < 30 ? ' warn' : ''}">${mood}<b>${state.happy}%</b></span>`,
      `<span class="rc${state.pop >= f.cap ? ' warn' : ''}">🏠<b>${fmt(state.pop)}/${fmt(f.cap)}</b></span>`,
    ]).join('');
    $('enemyBox').innerHTML = enemyChip();
    // pastilles : nombre de choix possibles
    document.querySelectorAll('.tile').forEach((t) => {
      if (t.dataset.cat === 'tech') {
        // recherche : « ! » si la file est vide, et la progression de la recherche en cours
        const q = E.queueOf(state), cur = q.find((id) => E.nodeState(state, E.NODE[id]) === 'open');
        const anyOpen = E.NODES.some((n) => E.nodeState(state, n) === 'open');
        t.querySelector('.badge').textContent = !E.hasCentre(state) ? '🔨' : !q.length && anyOpen ? '!' : '';
        $('tprog').style.width = cur ? `${Math.round(100 * E.researchProg(state, cur) / E.researchCost(state, E.NODE[cur]))}%` : '0%';
        return;
      }
      const n = E.options(state, t.dataset.cat).filter((o) => o.can).length;
      t.querySelector('.badge').textContent = t.dataset.cat === 'war' ? '' : n ? n : '';
    });
  }

  // L'ennemi de l'ère : petite pastille, qui grandit quand une attaque approche
  function enemyChip() {
    const R = E.rival(state), en = E.ERAS[state.era].enemy, name = en[0].toUpperCase() + en.slice(1);
    if (R.dead) return `<button class="enemy small-e dead" id="enemyChip">🏆 ${name} vaincu</button>`;
    const truce = state.peaceUntil > state.day;
    const days = Math.max(0, R.nextRaid - state.day);
    const when = truce ? `🕊️ trêve ${state.peaceUntil - state.day} j` : days === 0 ? '⚠️ attaque cette nuit !' : `attaque dans ${days} j`;
    const near = !truce && days <= 2;
    const fire = E.atPeace(state) ? '' : ` · 🔥 guerre ${state.warUntil - state.day} j`;
    if (!near) return `<button class="enemy small-e" id="enemyChip" title="Touchez pour ouvrir les choix de guerre">🏴 ${name} · ❤️ ${R.hp} % · ${when}${fire}</button>`;
    const danger = E.power(state) < E.rivalForce(state) * 0.9;
    return `<button class="enemy${days <= 1 ? ' soon' : ''}" id="enemyChip" title="Touchez pour ouvrir les choix de guerre">
      <span class="en">🏴 ${name}</span><span class="hp"><span style="width:${R.hp}%"></span></span>
      <span class="ef${danger ? ' bad' : ''}">⚔️ ${E.rivalForce(state)} contre ${E.power(state)}</span><span class="ew">${when}</span></button>`;
  }
  $('enemyBox').addEventListener('click', (e) => { if (e.target.closest('#enemyChip')) openSheet('war'); });

  // Détail des ressources (touche la ligne des ressources)
  function showResources() {
    if (!state) return;
    const f = E.forecast(state);
    const sg = (v) => (v > 0 ? `<span class="g">+${v}</span>` : v < 0 ? `<span class="b">${v}</span>` : '0');
    const rows = E.known(state).map((r) => `<tr><td>${E.RES_ICONS[r]} ${E.RES_NAMES[r]}</td><td><b>${fmt(state.res[r])}</b></td><td>${sg(f[r])} /jour</td></tr>`).join('');
    modal({
      icon: '📊', title: 'Vos ressources',
      html: `<table class="vcard">${rows}
        <tr><td>😊 Bonheur</td><td><b>${state.happy} %</b></td><td>${state.happy < 30 ? '<span class="b">manifs possibles</span>' : ''}</td></tr>
        <tr><td>🏠 Logements</td><td><b>${state.pop}/${f.cap}</b></td><td>${state.pop >= f.cap ? '<span class="b">plein</span>' : ''}</td></tr>
        <tr><td>⚔️ Puissance</td><td><b>${E.power(state)}</b></td><td>${E.atPeace(state) ? 'en paix' : `<span class="b">🔥 en guerre ${state.warUntil - state.day} j</span>`}</td></tr></table>
        <p class="finfo">La nourriture : ${f.foodProd} produite, ${f.foodCons} mangée par jour.</p>`,
      buttons: [{ label: '👷 Voir les villageois', value: 'people', primary: true }, { label: 'Fermer', value: false }],
    }).then((v) => { if (v === 'people') openForest(); });
  }
  $('res').addEventListener('click', showResources);

  /* ---------- Feuille de choix ---------- */
  const CAT = {
    build: { title: '🏠 Constructions', sub: 'Que construit-on aujourd\'hui ?' },
    law: { title: '📜 Lois', sub: 'Une loi adoptée s\'applique pour toujours.' },
    war: { title: '⚔️ Guerres', sub: 'L\'ennemi attaque régulièrement : seule une victoire l\'arrête.' },
    tech: { title: '💡 Découvertes', sub: '' },
  };
  function openSheet(cat) {
    if (busy || !state) return;
    if (cat === 'tech') { openResearch(); return; }
    if (state.chosen) { toast(`Choix du jour déjà fait. Prochain jour dans ${secondsLeft()} s`); return; }
    const c = CAT[cat];
    $('sheetTitle').textContent = c.title;
    let sub = c.sub;
    if (cat === 'tech') {
      const left = E.DISCOVERIES.filter((d) => d.era === state.era && !state.disc.includes(d.id)).length;
      sub = state.era < E.ERAS.length - 1
        ? `Encore ${left} découverte${left > 1 ? 's' : ''} pour entrer dans : ${E.ERAS[state.era + 1].name}`
        : 'Dernière ère : visez les étoiles !';
    }
    $('sheetSub').textContent = sub;
    const list = $('sheetList'); list.innerHTML = '';
    const opts = E.options(state, cat);
    if (!opts.length) list.innerHTML = '<div class="empty">Rien de nouveau pour l\'instant…</div>';
    for (const o of opts) {
      const bt = document.createElement('button');
      bt.className = 'opt' + (o.can ? '' : ' off');
      const isNew = o.era != null && o.era === state.era && state.era > 0 && cat !== 'tech';
      bt.innerHTML = `<span class="oi">${o.icon}</span><span class="ot"><b>${o.name}${isNew ? '<span class="new">NOUVEAU</span>' : ''}</b><p>${o.desc}</p>
        <span class="bm plus">${o.plus.join(' · ') || '—'}</span><span class="bm minus">${o.minus.join(' · ') || 'Aucun malus'}</span>${o.can ? '' : `<span class="why">${o.why}</span>`}</span>`;
      bt.onclick = () => { if (o.can) { closeSheet(); choisir(cat, o.id); } };
      list.appendChild(bt);
    }
    if (cat === 'build' || cat === 'war') {
      const hint = document.createElement('button');
      hint.className = 'small rhint';
      hint.textContent = cat === 'build' ? '🔬 Débloquer de nouvelles constructions : Recherche' : '🔬 De meilleures armes : Recherche';
      hint.onclick = () => openResearch();
      list.appendChild(hint);
    }
    $('sheet').classList.add('open');
    $('toast').classList.remove('show');
  }
  function closeSheet() { $('sheet').classList.remove('open'); }

  /* ---------- 🔬 La recherche (ne compte pas comme le choix du jour) ---------- */
  const KIND = { disc: ['⏳', 'Découvertes de l\'ère'], build: ['🏠', 'Constructions'], upgrade: ['📈', 'Améliorations du travail'], weapon: ['🗡️', 'Armes'] };
  function openResearch() {
    renderResearch();
    $('sheet').classList.add('open');
    $('toast').classList.remove('show');
  }
  function renderResearch() {
    const f = E.forecast(state), q = E.queueOf(state);
    const perDay = Math.max(0, f.sci);
    const left = E.DISCOVERIES.filter((d) => d.era === state.era && !state.disc.includes(d.id)).length;
    $('sheetTitle').textContent = '🔬 Recherche';
    $('sheetSub').innerHTML = `Savoir : <b>${state.res.sci} 💡</b> (+${perDay}/jour). Chaque nuit, il nourrit les recherches de votre file, dans l'ordre. Choisir une recherche ne compte pas comme le choix du jour.`;
    const days = (n, extra) => { const r = E.researchCost(state, n) - E.researchProg(state, n.id) - (extra || 0); return perDay ? Math.max(1, Math.ceil((r - state.res.sci) / perDay) + 1) : '∞'; };
    const unlockTxt = (n) => {
      if (n.kind === 'disc') { const d = E.D[n.d]; const e = Object.keys(d.eff).filter((r) => d.eff[r]).map((r) => `${d.eff[r] > 0 ? '+' : ''}${d.eff[r]} ${E.RES_ICONS[r]}`).join(' '); return e || ''; }
      return E.bonusOf(state, n.b).plus.join(' · ');
    };
    let html = '';
    if (!E.hasCentre(state)) {
      const c = E.B.centre.cost;
      html += `<div class="rq nocentre"><b>🔨 Construisez d'abord le Centre de recherche</b>
        <p class="rqe">Sans lui, aucune recherche n'avance et personne ne peut être savant. En attendant, le savoir s'accumule (${state.res.sci} 💡). Vous pouvez déjà préparer votre file.</p>
        <button class="btn primary" id="bCentre"${state.chosen ? ' disabled' : ''}>🔬 Construire le centre (${c.wood} 🪵 ${c.stone} 🪨)${state.chosen ? ' — demain' : ''}</button></div>`;
    }
    // la file
    html += `<div class="rq"><div class="rqh">📋 File de recherche (${q.length}/6)</div>`;
    if (!q.length) html += '<p class="rqe">Vide : touchez une recherche ci-dessous pour l\'ajouter. Le savoir s\'accumule en attendant.</p>';
    let before = 0;
    q.forEach((id, k) => {
      const n = E.NODE[id], cost = E.researchCost(state, n), prog = E.researchProg(state, id);
      const pct = Math.round(100 * prog / cost);
      html += `<button class="ritem inq" data-id="${id}"><span class="rnum">${k + 1}</span><span class="ri">${n.icon}</span><span class="rt"><b>${n.name}</b>
        <span class="rbar"><span style="width:${pct}%"></span></span><small>${prog}/${cost} 💡 · environ ${days(n, -before)} j · touchez pour retirer</small></span></button>`;
      before += cost - prog;
    });
    html += '</div>';
    // ce qu'on peut rechercher
    for (const kind of ['disc', 'build', 'upgrade', 'weapon']) {
      const items = E.NODES.filter((n) => n.kind === kind && !q.includes(n.id) && ['open', 'locked'].includes(E.nodeState(state, n)));
      if (!items.length) continue;
      const [ic, label] = KIND[kind];
      html += `<h3 class="rh">${ic} ${label}${kind === 'disc' && state.era < E.ERAS.length - 1 ? ` <small>· encore ${left} pour entrer dans : ${E.ERAS[state.era + 1].name}</small>` : ''}</h3>`;
      for (const n of items) {
        const st = E.nodeState(state, n), cost = E.researchCost(state, n);
        const canQ = st === 'open' || n.pre.every((p) => E.nodeState(state, E.NODE[p]) === 'done' || q.includes(p));
        const pre = n.pre.filter((p) => E.nodeState(state, E.NODE[p]) !== 'done').map((p) => E.NODE[p].name).join(', ');
        const disc = E.practicedFor(state, n);
        html += `<button class="ritem${canQ ? '' : ' off'}" data-id="${n.id}"><span class="ri">${n.icon}</span><span class="rt"><b>${n.name}</b><small class="rd">${n.desc}</small>
          ${unlockTxt(n) ? `<span class="bm plus">${unlockTxt(n)}</span>` : ''}
          ${st === 'locked' ? `<span class="why">Après : ${pre}</span>` : ''}</span>
          <span class="rc2"><b>${cost} 💡</b>${disc ? '<em class="disc">−50 % pratique</em>' : ''}<small>${perDay ? `~${days(n, -before)} j` : ''}</small></span></button>`;
      }
    }
    $('sheetList').innerHTML = html;
    if ($('bCentre')) $('bCentre').onclick = () => { closeSheet(); choisir('build', 'centre'); };
    $('sheetList').querySelectorAll('.ritem').forEach((bt) => (bt.onclick = () => {
      const id = bt.dataset.id, inQ = E.queueOf(state).includes(id);
      if (!E.setResearch(state, id)) { toast(E.queueOf(state).length >= 6 ? 'La file est pleine (6 recherches)' : 'Il faut d\'abord rechercher ce qui est demandé'); return; }
      toast(inQ ? `Retiré de la file : ${E.NODE[id].name}` : `Ajouté à la file : ${E.NODE[id].name}`);
      save(); renderResearch(); updateHUD();
    }));
  }
  $('sheetClose').onclick = closeSheet;
  document.querySelectorAll('.tile').forEach((t) => (t.onclick = () => openSheet(t.dataset.cat)));
  $('map').addEventListener('pointerdown', closeSheet);

  /* ---------- Le choix du jour ---------- */
  async function choisir(cat, id) {
    if (busy) return;
    if (state.chosen) { toast(`Choix du jour déjà fait. Prochain jour dans ${secondsLeft()} s`); return; }
    const r = E.act(state, cat, id);
    if (!r.ok) return;
    state.chosen = true;
    busy = true;
    $('dock').classList.add('busy');
    if (r.built) {
      map.place(r.built);
      map.syncPeople();
    }
    updateHUD();
    if (r.upgraded) { map.redraw(); caption(`${r.icon} ${r.title.toUpperCase()}<small>Plus de villageois peuvent travailler</small>`, 2600); }
    else if (r.built && r.built.id === 'principal') caption('🛖 BÂTIMENT PRINCIPAL <em>CONSTRUIT</em> !<small>Vos villageois peuvent travailler : 👷 Villageois</small>', 3200);
    else if (r.built && r.built.id === 'centre') caption('🔬 CENTRE DE RECHERCHE <em>CONSTRUIT</em> !<small>Envoyez un savant y travailler : 👷 Villageois</small>', 3200);
    else caption(`${r.icon} ${r.title}`, 1500);

    if (state.won) {
      await launchRocket();
      save();
      await victory();
      busy = false; $('dock').classList.remove('busy');
      return;
    }
    if (cat === 'war' && id === 'attaquer') {
      await wait(500);
      await modal({ icon: r.icon, title: r.title, text: r.text, good: r.good });
    } else {
      await wait(1100);
    }
    if (r.proposeQuarry) await proposeQuarry();
    if (r.newEra != null) await newEra(r.newEra);
    save();
    busy = false; $('dock').classList.remove('busy');
    updateClock();
  }

  /* ---------- Le temps : chaque jour dure un temps fixe ---------- */
  const DAY_MS = 40000;                 // 40 secondes par jour à vitesse ×1
  const SPEEDS = [1, 2, 4];
  let speed = 1, paused = false, lastTick = performance.now();
  const secondsLeft = () => Math.max(0, Math.ceil((DAY_MS - (state.dayTime || 0)) / 1000 / speed));
  // le temps s'arrête quand une fenêtre ou un écran est ouvert
  const blocked = () => !state || !state.site || busy || state.won || state.lost
    || !$('modal').classList.contains('hidden') || !$('rules').hidden || !$('people').hidden
    || !$('hud').offsetParent || document.hidden;
  function updateClock() {
    if (!state) return;
    const k = Math.min(1, (state.dayTime || 0) / DAY_MS);
    $('dayBar').style.width = `${k * 100}%`;
    $('bPause').textContent = paused ? '▶️' : '⏸️';
    $('bPause').setAttribute('aria-label', paused ? 'Reprendre' : 'Pause');
    $('bSpeed').textContent = `×${speed}`;
    const stopped = paused || blocked();
    $('clockTxt').textContent = paused ? 'En pause' : `${secondsLeft()} s`;
    $('clock').classList.toggle('stopped', stopped);
    $('dock').classList.toggle('done', !!state.chosen);
    $('dockTitle').hidden = !state.chosen;
    if (state.chosen) $('dockTitle').innerHTML = `✔ Choix du jour fait · prochain jour dans ${secondsLeft()} s`;
  }
  setInterval(() => {
    const now = performance.now(), dt = Math.min(500, now - lastTick);
    lastTick = now;
    if (!state || paused || blocked()) { updateClock(); return; }
    state.dayTime = (state.dayTime || 0) + dt * speed;
    if (state.dayTime >= DAY_MS) {
      busy = true; $('dock').classList.add('busy');
      closeSheet();
      endOfDay().finally(() => { busy = false; $('dock').classList.remove('busy'); updateClock(); });
    }
    updateClock();
  }, 200);
  $('bPause').onclick = () => { paused = !paused; updateClock(); };
  $('bSpeed').onclick = () => { speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; updateClock(); };

  async function endOfDay() {
    hideCaption();
    $('night').classList.add('on');
    $('nightText').textContent = `JOUR ${state.day + 1}`;
    await wait(900);
    const rep = E.endDay(state);
    state.chosen = false; state.dayTime = 0;
    map.syncPeople();
    map.redraw();
    $('night').classList.remove('on');
    updateHUD();
    const d = rep.delta;
    const pd = rep.popDelta;
    const part = (v, i) => `${v >= 0 ? '+' : ''}${v}${i}`;
    const born = (rep.born || []).map((b) => b.name);
    toast(`${born.length ? `Bienvenue à ${born.slice(0, 3).join(', ')}${born.length > 3 ? ` et ${born.length - 3} autres` : ''} ! Touchez 👷 pour leur donner une tâche.<br>` : ''}Jour ${state.day} · ${E.known(state).filter((r) => d[r]).map((r) => part(d[r], E.RES_ICONS[r])).join(' ')}${pd ? ` · ${part(pd, '👤')}` : ''}`);
    save();
    for (const r of rep.researched || []) {
      await wait(350);
      if (r.kind === 'disc') {
        await modal({ icon: r.icon, title: 'Découverte !', text: `${r.name} — ${E.D[E.NODE[r.node].d].desc}`, good: true });
        if (r.newEra != null) await newEra(r.newEra);
      } else if (!(rep.proposals || []).includes(r.build)) {
        toast(`🔬 Recherche terminée : ${r.name}`);
      }
    }
    for (const pr of rep.proposals || []) { await wait(350); await proposeBuilding(pr); }
    if ((rep.practiced || []).length) toast(`📈 Grâce à la pratique, la recherche est 2 fois moins chère pour : ${rep.practiced.map((id) => E.B[id].name).join(', ')}`, 4500);
    for (const ev of rep.events) {
      await wait(350);
      if (ev.dilemma) await dilemma(ev.dilemma);
      else await modal({ icon: ev.icon, title: ev.title, text: ev.text, good: ev.good });
      updateHUD();
    }
    if (state.lost) {
      wipe();
      await modal({ icon: '🏚️', title: 'La vallée est vide…', text: `Il n'y a plus personne à ${state.name}. Le pays a tenu ${state.day} jours et atteint l'ère : ${E.ERAS[state.era].name}.`, good: false, buttons: [{ label: 'Recommencer', value: true, primary: true }] });
      location.reload();
      return;
    }
    hint();
  }

  // Petits conseils au début de la partie
  function hint() {
    const f = E.forecast(state);
    if (f.food < 0) caption('ATTENTION : <em>FAMINE</em> EN VUE !<small>Construisez de quoi manger</small>', 2600);
    else if (state.pop >= f.cap) caption('PLUS DE <em>PLACE</em> !<small>Construisez des logements</small>', 2600);
    else if (state.happy < 30) caption('LE PEUPLE <em>GRONDE</em>…<small>Lois, fêtes et temples rendent heureux</small>', 2600);
    else if (state.day === 2) caption('UN JOUR DURE <em>40 SECONDES</em><small>Un seul choix par jour · ⏸️ et ×2 / ×4 en haut à gauche</small>', 3000);
    else if (state.day === 3 && !E.hasCentre(state)) caption('CONSTRUISEZ LE <em>CENTRE DE RECHERCHE</em> 🔬<small>pour débloquer de nouvelles constructions</small>', 3000);
    else if (state.day === 5 && E.hasCentre(state)) caption('CHOISISSEZ UNE <em>RECHERCHE</em> 🔬<small>pour débloquer de nouvelles constructions</small>', 2600);
  }

  async function dilemma(dv) {
    const i = await modal({
      icon: dv.icon, title: dv.title, html: `<p>${escapeHtml(dv.text)}</p><p class="choose">À VOUS DE <em>CHOISIR</em></p>`,
      buttons: dv.choices.map((c, k) => ({ label: `${'AB'[k]} · ${c.label}`, hint: c.hint, value: k, primary: k === 0, cls: k ? 'choice-b' : 'choice-a' })),
    });
    const r = E.choose(state, dv.id, i);
    save();
    if (r) { map.syncPeople(); updateHUD(); await modal({ icon: r.icon, title: r.title, text: r.text, good: r.good }); }
  }

  const ERA_ART = ['🛖🔥🦣', '🏛️🏺⚱️', '🏰⚔️⛪', '🎨🔭📜', '🏭🚂⚙️', '🏙️💻🚀'];
  async function newEra(i) {
    map.redraw();
    const e = E.ERAS[i];
    caption(`NOUVELLE ÈRE<br><em>${e.name}</em>`, 2200);
    await wait(1600);
    await modal({ icon: '⏳', title: e.name, html: `<div class="era-art">${ERA_ART[i]}</div><p>${e.intro}</p><p>De nouvelles recherches, lois et unités sont disponibles !</p><p><b>⬆️ Pensez à agrandir le bâtiment principal</b> (🏠 Constructions) pour que plus de villageois puissent travailler.</p>`, good: true, buttons: [{ label: 'En avant !', value: true, primary: true }] });
    updateHUD();
  }

  async function launchRocket() {
    const rocket = state.buildings.find((b) => b.id === 'fusee');
    if (rocket && rocket.x != null) map.focus(rocket.x, rocket.y - 60, 2.4);
    caption('3… 2… 1…', 2000);
    await wait(2000);
    caption('<em>DÉCOLLAGE !</em>', 2500);
    const t0 = performance.now();
    await new Promise((res) => {
      const step = (t) => {
        const k = (t - t0) / 3500;
        state.launch = Math.pow(k, 2) * 600;
        if (rocket && rocket.x != null) map.focus(rocket.x, rocket.y - 60 - state.launch * 0.85, 2.4);
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }
  async function victory() {
    const s = state;
    await modal({
      icon: '🚀', title: 'Vers les étoiles !', good: true,
      html: `<p><b>${s.name}</b> est passé de la Préhistoire au monde moderne… et jusque dans l'espace !</p>
        <p>📅 ${s.day} jours · 👤 ${fmt(s.pop)} habitants<br>🏗️ ${s.stats.built} constructions · ⚔️ ${s.stats.victories}/${s.stats.battles} batailles gagnées</p>`,
      buttons: [{ label: 'Continuer à regarder', value: 'stay', primary: true }, { label: 'Nouvelle partie', value: 'new' }],
    }).then((v) => {
      if (v === 'new') { wipe(); location.reload(); }
    });
  }

  /* ---------- Les villageois : qui fait quoi ---------- */
  const RES_OF = (j) => (j.res === 'def' ? '🛡️' : E.RES_ICONS[j.res]);
  const num = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');
  let jobFilter = 'all';
  function openForest(filter) {
    if (!state || busy) return;
    $('people').hidden = false;
    renderPeople();
  }
  function closePeople() { $('people').hidden = true; save(); map.syncPeople(); updateHUD(); }
  /* Deux onglets : « Combien par tâche » (quotas) et « Préférences » */
  let peopleTab = 'jobs';
  const PREF_TXT = ['Jamais', 'Basse', 'Normale', 'Haute'];
  const SHORT = { farm: 'Champs', hunt: 'Chasse', wood: 'Bois', stone: 'Pierre', iron: 'Fer', coal: 'Charbon', sage: 'Savoir', trade: 'Commerce', guard: 'Garde' };
  const RES_WORD = { food: 'nourriture', wood: 'bois', stone: 'pierre', iron: 'fer', coal: 'charbon', sci: 'savoir', gold: 'or', def: 'défense' };

  function renderPeople() {
    $('tabJobs').classList.toggle('on', peopleTab === 'jobs');
    $('tabPrefs').classList.toggle('on', peopleTab === 'prefs');
    $('tabJobs').setAttribute('aria-selected', peopleTab === 'jobs');
    $('tabPrefs').setAttribute('aria-selected', peopleTab === 'prefs');
    if (peopleTab === 'jobs') renderJobs(); else renderPrefs();
  }
  $('tabJobs').onclick = () => { peopleTab = 'jobs'; renderPeople(); };
  $('tabPrefs').onclick = () => { peopleTab = 'prefs'; renderPeople(); };

  // --- Onglet 1 : la liste de toutes les tâches, on ajoute ou on enlève ---
  function renderJobs() {
    const f = E.forecast(state), jo = f.jobs, q = state.quota || {};
    const idle = jo.count.idle;
    const maxW = E.maxWorkers(state), working = state.villagers.length - idle;
    const rows = E.WORK.map((id) => {
      const j = E.JB[id];
      if (!E.jobOpen(state, id)) {
        return `<div class="jrow locked"><span class="ti">${j.icon}</span><div class="tname"><b>${j.name}</b><small>🔒 ${j.lock}</small></div></div>`;
      }
      const have = jo.count[id] || 0, want = q[id] || 0;
      const out = j.res === 'def' ? `+${Math.round(jo.def)} 🛡️` : `+${num(jo[j.res] * f.mult)} ${RES_OF(j)}/jour`;
      const extra = id === 'hunt' && state.army ? `<br>${f.peace ? `+ ${state.army} soldats en paix : +${num(f.soldierFood)} 🍖/jour` : `les ${state.army} soldats sont en guerre et ne chassent pas`}` : '';
      return `<div class="jrow${have || extra ? ' busy' : ''}">
        <span class="ti">${j.icon}</span>
        <div class="tname"><b>${j.name}</b><small>${have ? out : 'Personne'}${have < want ? ` <span class="warn">· personne de libre</span>` : ''}${extra}</small></div>
        <div class="tstep"><button class="qb" data-job="${id}" data-d="-1" aria-label="Retirer un villageois de ${j.name}"${want ? '' : ' disabled'}>−</button><b>${have}</b><button class="qb" data-job="${id}" data-d="1" aria-label="Ajouter un villageois à ${j.name}"${(idle && working < maxW) || have < want ? '' : ' disabled'}>+</button></div>
      </div>`;
    }).join('');
    const L = E.mainLevel(state);
    const head = !E.hasMain(state)
      ? `<div class="rq nocentre"><b>🛖 Construisez d'abord le bâtiment principal</b><p class="rqe">Sans lui, personne ne peut recevoir de tâche : il organise le travail du village. Il s'agrandit ensuite à chaque ère.</p>
         <button class="btn primary" id="bMain"${state.chosen ? ' disabled' : ''}>🛖 Construire la Grande hutte du clan (${E.B.principal.cost.wood} 🪵)${state.chosen ? ' — demain' : ''}</button></div>`
      : `<div class="mainbar">${E.MAIN[L].icon} <b>${E.MAIN[L].name}</b> · 👷 ${working}/${maxW > 9999 ? '∞' : maxW} au travail${E.canUpgradeMain(state) ? ' · <span class="up">⬆️ peut être agrandi (🏠 Constructions)</span>' : ''}</div>`;
    $('peopleBody').innerHTML = head + `
      <div class="jrow idle${idle ? ' has' : ''}"><span class="ti">🏡</span><div class="tname"><b>Au village, sans tâche</b><small>${!E.hasMain(state) ? 'Il faut d\'abord le bâtiment principal' : idle && working >= maxW ? 'Bâtiment principal plein : agrandissez-le' : idle ? 'Prêts à être envoyés au travail' : 'Tout le monde travaille'}</small></div><b class="idleN">${idle}</b></div>
      ${rows}
      <p class="phelp">Le jeu envoie d'abord ceux qui <b>préfèrent</b> la tâche (onglet ⭐), puis <b>les plus forts</b>.</p>
      <button class="small" id="bAuto">✨ Répartir comme le conseille le jeu</button>`;
    $('peopleBody').querySelectorAll('.qb').forEach((bt) => (bt.onclick = () => {
      const id = bt.dataset.job, d = +bt.dataset.d;
      // ajouter = demander une personne de plus ; enlever = une de moins
      const have = E.forecast(state).jobs.count[id] || 0;
      E.setQuota(state, id, (d > 0 ? Math.max(have, state.quota[id] || 0) : Math.min(have, state.quota[id] || 0)) + d);
      renderPeople(); updateHUD();
    }));
    if ($('bMain')) $('bMain').onclick = () => { closePeople(); choisir('build', 'principal'); };
    $('bAuto').onclick = () => { E.autoAssign(state); renderPeople(); updateHUD(); toast('Villageois répartis selon les besoins'); };
  }

  // --- Onglet 2 : les préférences de chaque villageois ---
  function renderPrefs() {
    const work = E.WORK.filter((j) => E.jobOpen(state, j)).map((j) => E.JB[j]);
    const list = state.villagers.slice().sort((a, b) => a.name.localeCompare(b.name));
    const head = `<tr><th class="nm">Villageois</th>${work.map((j) => `<th><span class="hi">${j.icon}</span><span class="hl">${SHORT[j.id]}</span></th>`).join('')}</tr>`;
    const rows = list.map((v) => `<tr data-id="${v.id}">
      <td class="nm"><button class="vbtn" data-id="${v.id}"><span class="dot" style="--h:${v.hue}"></span><span><b>${escapeHtml(v.name)}</b><small>${E.JB[v.job].icon} ${v.job === 'idle' ? 'au village' : SHORT[v.job]}</small></span></button></td>
      ${work.map((j) => {
        const pr = E.prefOf(v, j.id);
        const note = v.strong === j.id ? '<em class="fort">fort</em>' : v.weak === j.id ? '<em class="faible">faible</em>' : '';
        return `<td><button class="pc p${pr}${v.job === j.id ? ' cur' : ''}" data-job="${j.id}" aria-label="${escapeHtml(v.name)}, ${j.name} : préférence ${PREF_TXT[pr]}"><span class="ps">${E.PREF[pr].sym}</span>${note}</button></td>`;
      }).join('')}</tr>`).join('');
    $('peopleBody').innerHTML = `
      <p class="phelp">Touchez une case pour changer la préférence d'un villageois pour une tâche. Touchez un nom pour voir ce qu'il rapporte partout.</p>
      <div class="legend2"><span class="pc p3 lg"><span class="ps">+</span></span>Haute <span class="pc p2 lg"><span class="ps">○</span></span>Normale <span class="pc p1 lg"><span class="ps">−</span></span>Basse <span class="pc p0 lg"><span class="ps">✕</span></span>Jamais <span class="pc cur lg p2"></span>Tâche actuelle</div>
      <div class="gridwrap"><table class="pgrid">${head}${rows}</table></div>`;
    $('peopleBody').querySelectorAll('.pc[data-job]').forEach((c) => (c.onclick = () => {
      const id = +c.closest('tr').dataset.id, j = c.dataset.job;
      const v = state.villagers.find((x) => x.id === id);
      E.setPref(state, id, j, (E.prefOf(v, j) + 1) % 4);
      renderPeople(); updateHUD();
    }));
    $('peopleBody').querySelectorAll('.vbtn').forEach((b) => (b.onclick = () => villagerCard(+b.dataset.id)));
  }

  // Fiche d'un villageois : ce qu'il rapporterait dans chaque tâche
  function villagerCard(id) {
    const v = state.villagers.find((x) => x.id === id);
    if (!v) return;
    const work = E.WORK.filter((j) => E.jobOpen(state, j)).map((j) => E.JB[j]);
    const rows = work.map((j) => {
      const y = E.yieldOf(state, v, j.id), pr = E.prefOf(v, j.id);
      const xp = Math.round(E.xpBonus(v, j.id) * 100);
      return `<tr class="${v.job === j.id ? 'now' : ''}"><td>${j.icon} ${j.name}${v.strong === j.id ? ' <em class="fort">fort ×1,6</em>' : v.weak === j.id ? ' <em class="faible">faible ×0,5</em>' : ''}${xp ? ` <small>exp. +${xp}%</small>` : ''}</td>
        <td class="y">+${num(y)} ${RES_OF(j)}</td><td><span class="pc p${pr} lg"><span class="ps">${E.PREF[pr].sym}</span></span> ${PREF_TXT[pr]}</td></tr>`;
    }).join('');
    modal({
      icon: '🧑', title: v.name,
      html: `<p>${v.job === 'idle' ? 'Reste au village' : `Travaille comme <b>${E.JB[v.job].icon} ${E.JB[v.job].name}</b>`}</p>
        <p class="finfo"><span class="g">💪 ${E.STRONG[v.strong]} : très bon en ${E.JB[v.strong].icon} ${E.JB[v.strong].name}</span><br><span class="b">🐌 ${E.WEAK[v.weak]} : mauvais en ${E.JB[v.weak].icon} ${E.JB[v.weak].name}</span></p>
        <table class="vcard"><tr><th>Tâche</th><th>Rapporte / jour</th><th>Préférence</th></tr>${rows}</table>`,
      buttons: [{ label: 'Fermer', value: true, primary: true }],
    });
  }
  $('peopleClose').onclick = closePeople;

  // Après les Outils en pierre : proposer d'ouvrir une carrière
  // Propositions A/B : carrière, appâts, camp de chasse (ne comptent pas comme le choix du jour)
  const PROPOSE = {
    carriere: { icon: '🪨', title: 'Ouvrir une carrière ?', done: '🪨 CARRIÈRE <em>OUVERTE</em> !', a: 'Ouvrir la carrière',
      text: 'Avec les outils en pierre, vos ramasseurs ont repéré un bon filon au pied de la montagne. Une vraie carrière produirait bien plus que les cailloux ramassés à la main.', plus: '+4 🪨/jour pour toujours' },
    appats: { icon: '🪤', title: 'Poser des appâts ?', done: '🪤 APPÂTS <em>POSÉS</em> !', a: 'Poser appâts et pièges',
      text: 'Vos chasseurs connaissent maintenant bien la forêt. Avec des appâts et des pièges, ils attraperaient beaucoup plus de gibier.', plus: '+50 % de nourriture pour chaque chasseur' },
    chasse: { icon: '🏹', title: 'Construire un camp de chasse ?', done: '🏹 CAMP DE CHASSE <em>CONSTRUIT</em> !', a: 'Construire le camp',
      text: 'Les pièges marchent bien ! Un camp à l\'orée de la forêt permettrait de fumer la viande et de la garder plus longtemps.', plus: '+4 🍖/jour pour toujours' },
  };
  // texte d'une proposition pour n'importe quelle étape (améliorations, armes…)
  function pitchOf(id) {
    const b = E.B[id];
    if (PROPOSE[id]) return PROPOSE[id];
    const plus = E.bonusOf(state, id).plus.join(' · ');
    if (b.weapon != null) {
      const step = id.slice(-1);
      const intro = step === 'a' ? 'À force de s\'entraîner, vos soldats ont une idée pour de meilleures armes.'
        : step === 'b' ? 'La dernière bataille a beaucoup appris à vos soldats.'
        : 'Vos armes sont au point : il est temps de les fabriquer en série.';
      return { icon: b.icon, title: `Nouvelle arme : ${b.name} ?`, done: `${b.icon} ${b.name.toUpperCase()} <em>!</em>`, a: step === 'c' ? `Construire : ${b.name}` : `Adopter : ${b.name}`, text: `${intro} ${b.desc}`, plus };
    }
    if (b.eff && b.eff.cap) return { icon: b.icon, title: `Construire : ${b.name} ?`, done: `${b.icon} ${b.name.toUpperCase()} <em>!</em>`, a: `Construire : ${b.name}`, text: `À force de bâtir, vos villageois ont appris une nouvelle façon de construire des maisons. ${b.desc}`, plus };
    if (b.eff && b.eff.food) return { icon: b.icon, title: `${b.name} ?`, done: `${b.icon} ${b.name.toUpperCase()} <em>!</em>`, a: `Construire : ${b.name}`, text: `Vos agriculteurs connaissent bien la terre maintenant : ils proposent d'aller plus loin. ${b.desc}`, plus };
    if (id === 'scierie') return { icon: b.icon, title: 'Construire une scierie ?', done: '🪚 SCIERIE <em>CONSTRUITE</em> !', a: 'Construire la scierie', text: 'Les bûcherons n\'arrivent plus à suivre : une scierie couperait le bois bien plus vite.', plus };
    return { icon: b.icon, title: `${b.name} ?`, done: `${b.icon} ${b.name.toUpperCase()} <em>!</em>`, a: `Adopter : ${b.name}`, text: `À force de pratiquer, vos villageois ont trouvé une meilleure façon de travailler. ${b.desc}`, plus };
  }
  async function proposeBuilding(id) {
    const b = E.B[id], P = b && pitchOf(id);
    if (!P || !b) return;
    const cost = E.buildCost(state, b);
    const ok = E.canPay(state, cost);
    const price = Object.keys(cost).map((r) => `−${cost[r]} ${E.RES_ICONS[r]}`).join(' ');
    const where = b.weapon != null ? '⚔️ Guerres' : '🏠 Constructions';
    const v = await modal({
      icon: P.icon, title: P.title,
      html: `<p>${P.text}</p><p class="finfo"><span class="g">${P.plus}</span><br><span class="b">${price}</span></p>`,
      buttons: [
        { label: ok ? `A · ${P.a}` : 'A · Pas assez de ressources…', hint: ok ? `${price} · ${P.plus}` : `Reste disponible dans ${where}`, value: ok ? 'yes' : 'later', primary: true, cls: 'choice-a' },
        { label: 'B · Plus tard', hint: `Reste disponible dans ${where}`, value: 'later', cls: 'choice-b' },
      ],
    });
    if (v !== 'yes') return;
    const r = E.act(state, 'build', id);
    if (r.ok) {
      map.place(r.built); map.syncPeople(); updateHUD(); save();
      caption(P.done, 1800);
      await wait(1200);
    }
  }
  const proposeQuarry = () => proposeBuilding('carriere');
  $('bForest').onclick = openForest;

  $('bRest').onclick = () => choisir('rest');
  function showLog() {
    if (!state) return;
    const rows = state.log.map((l) => `<div><span>J${l.day}</span>${l.text}</div>`).join('') || '<div>Rien encore…</div>';
    modal({ icon: '📖', title: `Journal de ${state.name}`, html: `<div class="log">${rows}</div>`, buttons: [{ label: 'Fermer', value: true }] });
  }
  $('hCountry').onclick = showLog;
  $('bMenu').onclick = async () => {
    const v = await modal({ icon: '☰', title: 'Menu', text: 'La partie est sauvegardée automatiquement chaque nuit.', buttons: [
      { label: '📘 Règles du jeu', value: 'rules', primary: true },
      { label: '📖 Journal du pays', value: 'log' },
      { label: 'Reprendre', value: 'back' },
      { label: 'Nouvelle partie', value: 'new' }] });
    if (v === 'rules') showHelp();
    if (v === 'log') showLog();
    if (v === 'new') {
      const ok = await modal({ icon: '⚠️', title: 'Tout recommencer ?', text: `${state.name} sera effacé pour toujours.`, buttons: [{ label: 'Oui, recommencer', value: true, primary: true }, { label: 'Annuler', value: false }] });
      if (ok) { wipe(); location.reload(); }
    }
  };
  let rulesBuilt = false;
  function showHelp(section) {
    if (!rulesBuilt) {
      const r = Rules.build(E);
      $('rulesBody').innerHTML = r.html;
      $('rulesNav').innerHTML = r.nav.map(([id, label]) => `<button data-id="${id}">${label}</button>`).join('');
      $('rulesNav').querySelectorAll('button').forEach((b) => (b.onclick = () => {
        const el = document.getElementById('r-' + b.dataset.id);
        $('rulesBody').scrollTo({ top: el.offsetTop - $('rulesBody').offsetTop - 6, behavior: 'smooth' });
      }));
      rulesBuilt = true;
    }
    $('rules').hidden = false;
    if (typeof section === 'string') requestAnimationFrame(() => { const el = document.getElementById('r-' + section); if (el) $('rulesBody').scrollTop = el.offsetTop - $('rulesBody').offsetTop - 6; });
  }
  $('rulesClose').onclick = () => { $('rules').hidden = true; };
  $('bRules').onclick = () => showHelp();
  map.onManual(() => $('recenter').classList.remove('hidden'));
  $('recenter').onclick = () => { map.recenter(); $('recenter').classList.add('hidden'); };

  /* ---------- Début de partie ---------- */
  function showScreen(id) {
    ['title', 'setup', 'found'].forEach((s) => $(s).classList.toggle('hidden', s !== id));
  }
  function enterGame() {
    showScreen(null);
    $('hud').classList.remove('hidden');
    $('dock').classList.remove('hidden');
    map.showMarkers(false);
    map.setState(state);
    map.syncPeople();
    applyFlag();
    lastPop = state.pop;
    updateHUD();
  }

  const saved = load();
  if (!saved || !saved.site || saved.won) $('bContinue').classList.add('hidden');
  map.setState(null);
  map.overview(true);

  $('bContinue').onclick = () => {
    state = E.migrate(saved);
    flag = state.flag || flag;
    enterGame();
    caption(`BON RETOUR À<br><em>${escapeHtml(state.name)}</em>`, 2000);
    if (state.pending) setTimeout(() => dilemma(E.dilemmaView(state, state.pending)), 1500);
  };
  $('bNew').onclick = () => {
    showScreen('setup');
    buildFlagEditor();
    setTimeout(() => $('iName').focus(), 100);
  };
  $('bSetupOk').onclick = () => {
    const name = $('iName').value.trim() || 'Prairilande';
    state = E.newState(name, JSON.parse(JSON.stringify(flag)));
    E.log(state, `🚩 Naissance de ${name}`);
    showScreen('found');
    $('hud').classList.remove('hidden');
    $('hName').textContent = name;
    drawFlag($('hFlag'), state.flag);
    $('hDay').textContent = 1; $('hPop').textContent = 0;
    $('res').innerHTML = '';
    map.showMarkers(true);
    map.overview();
  };
  let chosenSite = null;
  document.querySelectorAll('.found').forEach((card) => {
    card.onclick = async () => {
      const site = card.dataset.site;
      const s = ValleyMap.SITES[site];
      if (chosenSite !== site) {
        chosenSite = site;
        document.querySelectorAll('.found').forEach((c) => c.classList.toggle('on', c === card));
        map.focus(s.x, s.y, 2.2);
        toast('Touchez encore pour fonder le pays ici');
        return;
      }
      state.site = site;
      E.log(state, `📍 Fondation ${site === 'lac' ? 'au bord du lac' : 'au bord de la rivière'}`);
      enterGame();
      save();
      caption(`AUJOURD'HUI VOUS ÊTES <em>${state.pop}</em>…<small>Chaque jour, faites un choix pour faire évoluer ${escapeHtml(state.name)}</small>`, 3200);
      await wait(3400);
      if (!busy) caption('CONSTRUISEZ LE <em>BÂTIMENT PRINCIPAL</em> 🛖<small>Sans lui, personne ne peut travailler · 🏠 Constructions</small>', 3600);
    };
  });

  function escapeHtml(t) { return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
})();
