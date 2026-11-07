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
    const d = (v) => v > 0 ? `<i class="up">+${v}</i>` : v < 0 ? `<i class="down">${v}</i>` : '';
    const peace = state.peaceUntil > state.day ? ' 🕊️' : '';
    $('res').innerHTML = E.known(state).map((r) =>
      `<span class="chip${r === 'food' && f.food < 0 ? ' warn' : ''}" title="${E.RES_NAMES[r]}">${E.RES_ICONS[r]} ${fmt(state.res[r])} ${d(f[r])}</span>`).concat([
      `<span class="chip${state.happy < 30 ? ' warn' : ''}" title="Bonheur">${state.happy >= 70 ? '😄' : state.happy >= 40 ? '🙂' : state.happy >= 25 ? '😐' : '😠'} ${state.happy}%</span>`,
      `<span class="chip${state.pop >= f.cap ? ' warn' : ''}" title="Logements">🏠 ${fmt(state.pop)}/${fmt(f.cap)}</span>`,
      `<span class="chip${E.atPeace(state) ? '' : ' warn'}" title="${E.atPeace(state) ? 'En paix : les soldats chassent' : 'En guerre : les soldats restent au camp'}">⚔️ ${E.power(state)}${E.atPeace(state) ? '' : ` 🔥 ${state.warUntil - state.day} j`}</span>`,
    ]).join('') + enemyChip();
    // pastilles : nombre de choix possibles
    document.querySelectorAll('.tile').forEach((t) => {
      const n = E.options(state, t.dataset.cat).filter((o) => o.can).length;
      t.querySelector('.badge').textContent = t.dataset.cat === 'war' ? '' : n ? n : '';
    });
  }

  // L'ennemi de l'ère : sa vie, sa force et sa prochaine attaque
  function enemyChip() {
    const R = E.rival(state), en = E.ERAS[state.era].enemy, name = en[0].toUpperCase() + en.slice(1);
    if (R.dead) return `<button class="enemy dead" id="enemyChip">🏆 ${name} est vaincu</button>`;
    const days = Math.max(0, R.nextRaid - state.day);
    const when = state.peaceUntil > state.day ? `🕊️ trêve ${state.peaceUntil - state.day} j` : days === 0 ? '⚠️ attaque cette nuit !' : `attaque dans ${days} j`;
    const danger = E.power(state) < E.rivalForce(state) * 0.9;
    return `<button class="enemy${days <= 1 && !(state.peaceUntil > state.day) ? ' soon' : ''}" id="enemyChip" title="Touchez pour ouvrir les choix de guerre">
      <span class="en">🏴 ${name}</span><span class="hp"><span style="width:${R.hp}%"></span></span><span class="hpt">${R.hp} %</span>
      <span class="ef${danger ? ' bad' : ''}">⚔️ ${E.rivalForce(state)}</span><span class="ew">${when}</span></button>`;
  }
  $('res').addEventListener('click', (e) => { if (e.target.closest('#enemyChip')) { e.stopPropagation(); openSheet('war'); } }, true);

  /* ---------- Feuille de choix ---------- */
  const CAT = {
    build: { title: '🏠 Constructions', sub: 'Que construit-on aujourd\'hui ?' },
    law: { title: '📜 Lois', sub: 'Une loi adoptée s\'applique pour toujours.' },
    war: { title: '⚔️ Guerres', sub: 'L\'ennemi attaque régulièrement : seule une victoire l\'arrête.' },
    tech: { title: '💡 Découvertes', sub: '' },
  };
  function openSheet(cat) {
    if (busy || !state) return;
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
    if (!opts.length) list.innerHTML = '<div class="empty">Rien de nouveau pour l\'instant…<br>Faites des découvertes pour changer d\'ère !</div>';
    for (const o of opts) {
      const bt = document.createElement('button');
      bt.className = 'opt' + (o.can ? '' : ' off');
      const isNew = o.era != null && o.era === state.era && state.era > 0 && cat !== 'tech';
      bt.innerHTML = `<span class="oi">${o.icon}</span><span class="ot"><b>${o.name}${isNew ? '<span class="new">NOUVEAU</span>' : ''}</b><p>${o.desc}</p>
        <span class="bm plus">${o.plus.join(' · ') || '—'}</span><span class="bm minus">${o.minus.join(' · ') || 'Aucun malus'}</span>${o.can ? '' : `<span class="why">${o.why}</span>`}</span>`;
      bt.onclick = () => { if (o.can) { closeSheet(); choisir(cat, o.id); } };
      list.appendChild(bt);
    }
    $('sheet').classList.add('open');
    $('toast').classList.remove('show');
  }
  function closeSheet() { $('sheet').classList.remove('open'); }
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
    caption(`${r.icon} ${r.title}`, 1500);

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
    $('dockTitle').innerHTML = state.chosen
      ? `CHOIX DU JOUR <em>FAIT ✔</em> <small>prochain jour dans ${secondsLeft()} s</small>`
      : 'CHAQUE JOUR <em>VOUS CHOISISSEZ</em>';
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
    else if (state.day === 2) caption('UN JOUR DURE <em>40 SECONDES</em><small>Un seul choix par jour · ⏸️ pause et ×2 / ×4 en haut</small>', 3000);
    else if (state.day === 4) caption('FAITES DES <em>DÉCOUVERTES</em><small>pour changer d\'ère</small>', 2400);
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
    await modal({ icon: '⏳', title: e.name, html: `<div class="era-art">${ERA_ART[i]}</div><p>${e.intro}</p><p>De nouvelles constructions, lois et découvertes sont disponibles !</p>`, good: true, buttons: [{ label: 'En avant !', value: true, primary: true }] });
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
  const SHORT = { hunt: 'Chasse', wood: 'Bois', stone: 'Pierre', iron: 'Fer', coal: 'Charbon', sage: 'Savoir', trade: 'Commerce', guard: 'Garde' };
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
        <div class="tstep"><button class="qb" data-job="${id}" data-d="-1" aria-label="Retirer un villageois de ${j.name}"${want ? '' : ' disabled'}>−</button><b>${have}</b><button class="qb" data-job="${id}" data-d="1" aria-label="Ajouter un villageois à ${j.name}"${idle || have < want ? '' : ' disabled'}>+</button></div>
      </div>`;
    }).join('');
    $('peopleBody').innerHTML = `
      <div class="jrow idle${idle ? ' has' : ''}"><span class="ti">🏡</span><div class="tname"><b>Au village, sans tâche</b><small>${idle ? 'Prêts à être envoyés au travail' : 'Tout le monde travaille'}</small></div><b class="idleN">${idle}</b></div>
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
  async function proposeQuarry() {
    const b = E.B.carriere;
    const cost = E.buildCost(state, b);
    const ok = E.canPay(state, cost);
    const v = await modal({
      icon: '🪨', title: 'Ouvrir une carrière ?',
      html: `<p>Avec les outils en pierre, vos ramasseurs ont repéré un bon filon au pied de la montagne. Une vraie carrière produirait bien plus que les cailloux ramassés à la main.</p>
        <p class="finfo"><span class="g">+4 🪨/jour</span> pour toujours<br><span class="b">−${cost.wood} 🪵</span></p>`,
      buttons: [
        { label: ok ? 'A · Ouvrir la carrière' : 'A · Pas assez de bois…', hint: ok ? `−${cost.wood} 🪵, +4 🪨/jour` : 'Elle reste disponible dans Constructions', value: ok ? 'open' : 'later', primary: true, cls: 'choice-a' },
        { label: 'B · Plus tard', hint: 'Elle reste disponible dans Constructions', value: 'later', cls: 'choice-b' },
      ],
    });
    if (v !== 'open') return;
    const r = E.act(state, 'build', 'carriere');
    if (r.ok) {
      map.place(r.built); map.syncPeople(); updateHUD(); save();
      caption('🪨 CARRIÈRE <em>OUVERTE</em> !', 1800);
      await wait(1200);
    }
  }
  $('bForest').onclick = openForest;
  $('res').addEventListener('click', (e) => { if (e.target.closest('.chip') && !e.target.closest('#enemyChip')) openForest(); });

  $('bRest').onclick = () => choisir('rest');
  $('bLog').onclick = () => {
    if (!state) return;
    const rows = state.log.map((l) => `<div><span>J${l.day}</span>${l.text}</div>`).join('') || '<div>Rien encore…</div>';
    modal({ icon: '📖', title: `Journal de ${state.name}`, html: `<div class="log">${rows}</div>`, buttons: [{ label: 'Fermer', value: true }] });
  };
  $('bHelp').onclick = () => showHelp();
  $('hCountry').onclick = $('bLog').onclick;
  $('bMenu').onclick = async () => {
    const v = await modal({ icon: '⚙️', title: 'Menu', text: 'La partie est sauvegardée automatiquement à la fin de chaque jour.', buttons: [{ label: 'Reprendre', value: 'back', primary: true }, { label: 'Nouvelle partie', value: 'new' }] });
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
      if (!busy) caption('QUI FAIT <em>QUOI</em> ?<small>Touchez 👷 pour donner une tâche à chaque villageois</small>', 3200);
    };
  });

  function escapeHtml(t) { return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
})();
