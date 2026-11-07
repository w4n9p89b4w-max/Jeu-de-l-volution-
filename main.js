/* ==========================================================================
   L'Évolution — interface et déroulement de la partie
   ========================================================================== */
(function () {
  'use strict';
  const E = window.Engine;
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = 'evolution-pays-v1';

  const map = ValleyMap.create($('map'));
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
    const era = E.ERAS[state.era];
    $('hEra').textContent = `${era.name} · ${era.year}`;
    const d = (v) => v > 0 ? `<i class="up">+${v}</i>` : v < 0 ? `<i class="down">${v}</i>` : '';
    const peace = state.peaceUntil > state.day ? ' 🕊️' : '';
    $('res').innerHTML = E.known(state).map((r) =>
      `<span class="chip${r === 'food' && f.food < 0 ? ' warn' : ''}" title="${E.RES_NAMES[r]}">${E.RES_ICONS[r]} ${fmt(state.res[r])} ${d(f[r])}</span>`).concat([
      `<span class="chip${state.happy < 30 ? ' warn' : ''}" title="Bonheur">${state.happy >= 70 ? '😄' : state.happy >= 40 ? '🙂' : state.happy >= 25 ? '😐' : '😠'} ${state.happy}%</span>`,
      `<span class="chip${state.pop >= f.cap ? ' warn' : ''}" title="Logements">🏠 ${fmt(state.pop)}/${fmt(f.cap)}</span>`,
      `<span class="chip" title="Puissance militaire">⚔️ ${E.power(state)}${peace}</span>`,
    ]).join('');
    const g = E.nextGoal(state);
    $('hGoal').innerHTML = g ? `🎯 ${g.icon} ${g.text} · ${g.need}` : '';
    $('hGoal').hidden = !g;
    renderCards();
  }

  /* ---------- Les 4 cartes du jour ---------- */
  let selected = -1;
  const TAGCLASS = { build: 't-build', law: 't-law', tech: 't-tech', war: 't-war', trade: 't-trade' };
  function renderCards() {
    const hand = E.ensureHand(state);
    const box = $('cards'); box.innerHTML = '';
    hand.forEach((c, i) => {
      const ok = E.playable(state, c);
      const bt = document.createElement('button');
      bt.className = `pcard ${TAGCLASS[c.kind] || ''}${ok ? '' : ' off'}${i === selected ? ' sel' : ''}`;
      bt.innerHTML = `<span class="pl">${'ABCD'[i]}</span><span class="ptag">${c.tag}</span>
        <span class="phead"><span class="pi">${c.icon}</span><b>${c.title}</b></span>
        <span class="plus">${c.plus.join(' ') || '—'}</span>
        <span class="minus">${c.minus.join(' ') || 'Aucun malus'}</span>${ok ? '' : '<span class="why">Pas assez de ressources</span>'}`;
      bt.title = c.desc;
      bt.onclick = () => pickCard(i);
      box.appendChild(bt);
    });
    const c = hand[selected];
    $('confirm').hidden = !c;
    if (c) $('confirm').innerHTML = `Choisir ${'ABCD'[selected]} · ${c.icon} ${c.title}<small>${c.desc}</small>`;
  }
  function pickCard(i) {
    if (busy) return;
    const c = state.hand[i];
    if (!E.playable(state, c)) { toast('Pas assez de ressources pour cette carte'); return; }
    selected = selected === i ? -1 : i;
    renderCards();
  }
  $('confirm').onclick = () => { if (selected >= 0) choisir(selected); };

  /* ---------- Le choix du jour ---------- */
  async function choisir(i) {
    if (busy) return;
    let r;
    if (i === 'rest') { r = E.act(state, 'rest'); state.hand = null; }
    else {
      const c = state.hand[i];
      r = E.play(state, i);
      if (r.ok && c.kind === 'war' && c.id === 'attaquer') r.battle = true;
    }
    if (!r.ok) return;
    selected = -1;
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
    if (r.battle) {
      await wait(500);
      await modal({ icon: r.icon, title: r.title, text: r.text, good: r.good });
    } else {
      await wait(1100);
    }
    if (r.newEra != null) await newEra(r.newEra);
    await endOfDay();
    busy = false; $('dock').classList.remove('busy');
  }

  async function endOfDay() {
    hideCaption();
    $('night').classList.add('on');
    $('nightText').textContent = `JOUR ${state.day + 1}`;
    await wait(900);
    const rep = E.endDay(state);
    map.syncPeople();
    map.redraw();
    $('night').classList.remove('on');
    updateHUD();
    const d = rep.delta;
    const pd = rep.popDelta;
    const part = (v, i) => `${v >= 0 ? '+' : ''}${v}${i}`;
    toast(`Jour ${state.day} · ${E.known(state).filter((r) => d[r]).map((r) => part(d[r], E.RES_ICONS[r])).join(' ')}${pd ? ` · ${part(pd, '👤')}` : ''}`);
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
    else if (state.day === 2) caption('CHAQUE JOUR<br><em>VOUS CHOISISSEZ</em>', 2200);
    else if (state.day === 4) caption('ACCUMULEZ DU <em>SAVOIR</em> 💡<small>pour faire des découvertes et changer d\'ère</small>', 2400);
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
      if (!busy) caption('CHOISISSEZ UNE <em>CARTE</em><small>chaque carte a un bonus et un malus</small>', 2600);
    };
  });

  function escapeHtml(t) { return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
})();
