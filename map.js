/* ==========================================================================
   L'Évolution — la vallée (rendu canvas)
   Une vallée immense entourée de montagnes, une rivière et un lac.
   ========================================================================== */
(function (root) {
  'use strict';

  const W = 800, H = 1100;          // taille du monde
  const VX = 400, VY = 580, VRX = 320, VRY = 440;   // ellipse de la vallée
  const LAKE = { x: 505, y: 925, rx: 112, ry: 74 };
  const RES = 2;                     // résolution du calque statique

  /* ---------- hasard reproductible ---------- */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const vnorm = (x, y) => Math.hypot((x - VX) / VRX, (y - VY) / VRY);
  const lnorm = (x, y) => Math.hypot((x - LAKE.x) / LAKE.rx, (y - LAKE.y) / LAKE.ry);

  /* ---------- la rivière ---------- */
  const RIVER_CTRL = [[372, -20], [376, 130], [345, 240], [290, 340], [318, 450], [262, 560], [282, 670], [360, 760], [440, 830], [478, 880]];
  function catmull(pts, steps) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 1 / steps) {
        const t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const RIVER = catmull(RIVER_CTRL, 12);
  function riverDist(x, y) {
    let d = 1e9;
    for (const p of RIVER) d = Math.min(d, Math.hypot(p[0] - x, p[1] - y));
    return d;
  }
  const RIVER_HALF = 19;            // demi-largeur de la rivière (élargie)
  const isWater = (x, y, margin) => riverDist(x, y) < RIVER_HALF + (margin || 0) || lnorm(x, y) < 1 + (margin || 0) / 80;

  /* ---------- Barrières invisibles : on ne marche pas dans l'eau ----------
     La rivière coupe la vallée en deux rives. Pour passer de l'une à
     l'autre, on emprunte un gué (puis un pont). */
  function nearestRiver(x, y) {
    let best = 0, d = 1e9;
    for (let i = 0; i < RIVER.length; i++) { const q = Math.hypot(RIVER[i][0] - x, RIVER[i][1] - y); if (q < d) { d = q; best = i; } }
    return best;
  }
  function sideOf(x, y) {
    const i = Math.min(RIVER.length - 2, nearestRiver(x, y));
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1];
    return Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax)) || 1;
  }
  const CROSS_AT = [0.3, 0.48, 0.7];
  const CROSSINGS = CROSS_AT.map((f) => {
    const i = Math.floor(RIVER.length * f), [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / len, ny = (bx - ax) / len, k = RIVER_HALF + 7;
    const P = { x: ax + nx * k, y: ay + ny * k }, Q = { x: ax - nx * k, y: ay - ny * k };
    return { i, ends: { [sideOf(P.x, P.y)]: P, [sideOf(Q.x, Q.y)]: Q } };
  });
  // une ligne droite traverse-t-elle l'eau ?
  function crossesWater(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6);
    for (let k = 1; k < n; k++) { const t = k / n; if (isWater(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, -3)) return true; }
    return false;
  }
  // chemin à pied de a vers b (liste de points), ou null si impossible
  function route(a, b) {
    if (isWater(b.x, b.y, 2)) return null;
    const sa = sideOf(a.x, a.y), sb = sideOf(b.x, b.y);
    if (sa === sb) return crossesWater(a, b) ? null : [b];
    let best = null, bd = 1e9;
    for (const c of CROSSINGS) {
      const P = c.ends[sa], Q = c.ends[sb];
      if (!P || !Q) continue;
      const d = Math.hypot(P.x - a.x, P.y - a.y) + Math.hypot(b.x - Q.x, b.y - Q.y);
      if (d < bd && !crossesWater(a, P) && !crossesWater(Q, b)) { bd = d; best = [P, Q, b]; }
    }
    return best;
  }

  const SITES = {
    riviere: { x: 336, y: 600, label: 'A', title: 'Au bord de la rivière', sub: 'De l\'eau et des terres fertiles : +25% de nourriture' },
    lac: { x: 615, y: 845, label: 'B', title: 'Au bord du lac', sub: 'La pêche et un port : +3 🍖 et +2 💰 par jour' },
  };

  // le camp de l'armée, à côté du village
  const CAMP = { riviere: { x: 392, y: 650 }, lac: { x: 640, y: 770 } };

  /* ---------- génération des arbres & emplacements ---------- */
  const rnd = mulberry(20260);
  const trees = [];
  for (let i = 0; i < 2600; i++) {
    const a = rnd() * Math.PI * 2;
    const band = rnd();
    let n;
    if (band < 0.62) n = 0.8 + rnd() * 0.27;        // ceinture forestière
    else n = Math.sqrt(rnd()) * 0.8;                // arbres épars
    if (band >= 0.62 && rnd() < 0.55) continue;
    const x = VX + Math.cos(a) * VRX * n, y = VY + Math.sin(a) * VRY * n;
    if (isWater(x, y, 6)) continue;
    trees.push({ x, y, r: 5 + rnd() * 5, pine: rnd() < 0.65, shade: rnd(), alive: true });
  }

  const CELL = 34;
  function buildSlots(site) {
    const s = SITES[site];
    const r = mulberry(site === 'lac' ? 7 : 3);
    const slots = [];
    for (let y = 120; y < H - 60; y += CELL) {
      for (let x = 60; x < W - 60; x += CELL) {
        const ox = ((y / CELL) % 2) * (CELL / 2);
        const px = x + ox, py = y;
        if (vnorm(px, py) > 0.86) continue;
        if (isWater(px, py, 16)) continue;
        if (Math.hypot(px - s.x, py - s.y) < 18) continue;   // place du drapeau
        if (Math.hypot(px - CAMP[site].x, py - CAMP[site].y - 6) < 36) continue;   // camp de l'armée
        slots.push({ x: px, y: py, d: Math.hypot(px - s.x, (py - s.y) * 1.1) + r() * 26 });
      }
    }
    slots.sort((a, b) => a.d - b.d);
    // emplacements au pied des montagnes (carrières, mines)
    const edge = [];
    for (let a = 0; a < Math.PI * 2; a += 0.075) {
      const px = VX + Math.cos(a) * VRX * 0.92, py = VY + Math.sin(a) * VRY * 0.92;
      if (isWater(px, py, 22) || py < 150) continue;
      edge.push({ x: px, y: py, edge: true, d: Math.hypot(px - s.x, py - s.y) });
    }
    edge.sort((a, b) => a.d - b.d);
    return slots.concat(edge);
  }

  /* ---------- dessin : petits utilitaires ---------- */
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function ell(ctx, x, y, rx, ry, fill) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  }
  function rect(ctx, x, y, w, h, fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  function poly(ctx, pts, fill) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  function shadow(ctx, x, y, w) { ell(ctx, x + w * 0.18, y + 1, w * 0.62, w * 0.22, 'rgba(20,40,10,.28)'); }

  // Bloc en vue « aérienne inclinée » : façade + toit
  function block(ctx, x, y, w, d, h, front, top) {
    shadow(ctx, x, y, w + h * 0.4);
    rect(ctx, x - w / 2, y - h, w, h, front);
    rect(ctx, x - w / 2, y - h - d, w, d, top);
  }
  function gable(ctx, x, y, w, d, h, wall, roof) {
    shadow(ctx, x, y, w + 4);
    rect(ctx, x - w / 2, y - h, w, h, wall);
    rect(ctx, x - w / 2 - 2, y - h - d / 2, w + 4, d / 2, roof);
    rect(ctx, x - w / 2 - 2, y - h - d, w + 4, d / 2, shade(roof, -0.25));
  }
  function windows(ctx, x, y, w, h, rows, cols, color) {
    const gx = w / cols, gy = h / rows;
    ctx.fillStyle = color;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      ctx.fillRect(x + c * gx + gx * 0.28, y + r * gy + gy * 0.25, gx * 0.44, gy * 0.5);
    }
  }
  function door(ctx, x, y, w, h, c) { rect(ctx, x - w / 2, y - h, w, h, c || '#5a3a22'); }

  /* ---------- dessins des bâtiments ---------- */
  const ARCH = {
    hut(ctx, x, y) {
      shadow(ctx, x, y, 16);
      poly(ctx, [x - 10, y, x + 10, y, x, y - 18], '#b88a4f');
      poly(ctx, [x, y, x + 10, y, x, y - 18], '#97703f');
      ctx.strokeStyle = '#6e4e2a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 3, y - 24); ctx.lineTo(x + 1, y - 15); ctx.moveTo(x + 3, y - 24); ctx.lineTo(x - 1, y - 15); ctx.stroke();
      poly(ctx, [x - 3, y, x + 3, y, x, y - 7], '#3b2a18');
    },
    camp(ctx, x, y) {
      shadow(ctx, x, y, 18);
      poly(ctx, [x - 13, y, x + 1, y, x - 6, y - 13], '#d9b98c');
      poly(ctx, [x - 6, y, x + 1, y, x - 6, y - 13], '#bc996b');
      ctx.strokeStyle = '#6e4e2a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 11); ctx.lineTo(x + 13, y - 11); ctx.lineTo(x + 13, y); ctx.stroke();
      rect(ctx, x + 7, y - 10, 3, 6, '#8b3c2c');
      ell(ctx, x + 2, y + 5, 3, 1.6, '#e8742a');
    },
    fire(ctx, x, y) {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ell(ctx, x + Math.cos(a) * 9, y + Math.sin(a) * 5, 2.4, 1.8, '#8d8d8d'); }
      poly(ctx, [x - 4, y + 1, x + 4, y + 1, x, y - 10], '#f39c12');
      poly(ctx, [x - 2, y + 1, x + 2, y + 1, x, y - 5], '#ffe066');
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; ell(ctx, x + Math.cos(a) * 15, y + Math.sin(a) * 9, 2.4, 2.4, '#7a5a3a'); }
    },
    menhir(ctx, x, y) {
      shadow(ctx, x, y, 12);
      ctx.fillStyle = '#9aa0a6';
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 4, y - 18); ctx.quadraticCurveTo(x, y - 25, x + 4, y - 18); ctx.lineTo(x + 5, y); ctx.fill();
      rect(ctx, x + 1, y - 18, 3, 18, '#7d838a');
    },
    field(ctx, x, y) {
      rect(ctx, x - 16, y - 12, 32, 22, '#c9a53c');
      ctx.fillStyle = '#e8c95a';
      for (let i = 0; i < 6; i++) ctx.fillRect(x - 16, y - 12 + i * 3.8, 32, 1.8);
      ctx.strokeStyle = '#8a6d2a'; ctx.lineWidth = 1; ctx.strokeRect(x - 16, y - 12, 32, 22);
    },
    house(ctx, x, y) { gable(ctx, x, y, 20, 12, 11, '#d6ccbb', '#b5523b'); door(ctx, x, y, 4, 6); windows(ctx, x - 10, y - 10, 20, 5, 1, 4, '#5d4a36'); },
    market(ctx, x, y) {
      shadow(ctx, x, y, 22);
      const cols = ['#d8433b', '#e9b949', '#3b8fd8'];
      for (let i = 0; i < 3; i++) {
        const sx = x - 14 + i * 10;
        rect(ctx, sx, y - 6, 8, 6, '#8a6a43');
        rect(ctx, sx - 1, y - 11, 10, 5, cols[i]);
        rect(ctx, sx + 2, y - 11, 2, 5, '#fff8');
        rect(ctx, sx + 6, y - 11, 2, 5, '#fff8');
      }
    },
    temple(ctx, x, y) {
      shadow(ctx, x, y, 26);
      rect(ctx, x - 14, y - 3, 28, 3, '#cfcabb');
      for (let i = 0; i < 6; i++) rect(ctx, x - 12 + i * 4.6, y - 15, 2.4, 12, '#f1ede2');
      rect(ctx, x - 14, y - 18, 28, 3, '#e2ddce');
      poly(ctx, [x - 15, y - 18, x + 15, y - 18, x, y - 26], '#d9d3c3');
    },
    library(ctx, x, y) {
      block(ctx, x, y, 24, 10, 12, '#e6dcc4', '#b98c55');
      for (let i = 0; i < 4; i++) rect(ctx, x - 10 + i * 6, y - 11, 2, 11, '#fff7e4');
      door(ctx, x, y, 4, 6, '#6b4b2a');
    },
    mill(ctx, x, y, t) {
      gable(ctx, x, y, 14, 10, 16, '#e5dccb', '#7a4a2a');
      door(ctx, x, y, 4, 6);
      const hx = x, hy = y - 17, a = (t || 0) * 0.0012;
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const b = a + i * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(b) * 15, hy + Math.sin(b) * 15); ctx.stroke();
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(b); ctx.fillStyle = '#f5f0e6'; ctx.fillRect(4, -1, 11, 4); ctx.restore();
      }
      ell(ctx, hx, hy, 2, 2, '#3b2616');
    },
    timber(ctx, x, y) {
      gable(ctx, x, y, 20, 13, 16, '#efe3c8', '#5b4a44');
      ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 1.4;
      ctx.strokeRect(x - 10, y - 16, 20, 16);
      ctx.beginPath(); ctx.moveTo(x - 10, y - 8); ctx.lineTo(x + 10, y - 8); ctx.moveTo(x - 10, y - 16); ctx.lineTo(x - 3, y - 8); ctx.moveTo(x + 10, y - 16); ctx.lineTo(x + 3, y - 8); ctx.stroke();
      door(ctx, x, y, 4, 6);
    },
    monastery(ctx, x, y) {
      shadow(ctx, x, y, 28);
      rect(ctx, x - 15, y - 20, 30, 20, '#b9ad97');
      rect(ctx, x - 9, y - 15, 18, 11, '#7fb85a');
      rect(ctx, x - 17, y - 24, 6, 24, '#a59a85');
      poly(ctx, [x - 18, y - 24, x - 10, y - 24, x - 14, y - 31], '#7a4a2a');
    },
    castle(ctx, x, y) {
      shadow(ctx, x, y, 34);
      rect(ctx, x - 15, y - 14, 30, 14, '#8f9399');
      rect(ctx, x - 15, y - 26, 30, 12, '#a9adb3');
      rect(ctx, x - 9, y - 24, 18, 8, '#6f9a49');
      for (const [tx, ty] of [[-15, 0], [15, 0], [-15, -24], [15, -24]]) {
        rect(ctx, x + tx - 4, y + ty - 18, 8, 18, '#7d8187');
        poly(ctx, [x + tx - 5, y + ty - 18, x + tx + 5, y + ty - 18, x + tx, y + ty - 26], '#2f4f8f');
      }
      door(ctx, x, y, 6, 8, '#3b2a18');
    },
    church(ctx, x, y) {
      shadow(ctx, x, y, 30);
      rect(ctx, x - 6, y - 16, 22, 16, '#d8cfbe');
      rect(ctx, x - 6, y - 24, 22, 8, '#5d6670');
      rect(ctx, x - 14, y - 26, 9, 26, '#cfc5b2');
      poly(ctx, [x - 15, y - 26, x - 4, y - 26, x - 9.5, y - 46], '#4f5862');
      ell(ctx, x - 9.5, y - 18, 2.6, 2.6, '#3b6fb6');
      door(ctx, x - 9.5, y, 4, 7, '#4a2f1a');
    },
    barn(ctx, x, y) {
      gable(ctx, x, y, 22, 12, 13, '#b23a2e', '#6d6d6d');
      rect(ctx, x - 4, y - 9, 8, 9, '#f2eee6');
      rect(ctx, x - 3, y - 8, 6, 8, '#7b2a21');
      ell(ctx, x + 16, y - 2, 3.5, 2.2, '#fff'); ell(ctx, x + 15, y - 2, 1.2, 1, '#222');
    },
    mansion(ctx, x, y) {
      block(ctx, x, y, 26, 9, 16, '#efe6d3', '#4a5d74');
      windows(ctx, x - 13, y - 15, 26, 13, 2, 5, '#3c5168');
      door(ctx, x, y, 4, 6, '#3d2b1a');
    },
    bank(ctx, x, y) {
      shadow(ctx, x, y, 28);
      rect(ctx, x - 14, y - 3, 28, 3, '#cbc3ad');
      rect(ctx, x - 13, y - 16, 26, 13, '#e9e2cd');
      for (let i = 0; i < 5; i++) rect(ctx, x - 11 + i * 5.2, y - 15, 2.4, 12, '#fffaf0');
      poly(ctx, [x - 14, y - 16, x + 14, y - 16, x, y - 24], '#d4b24a');
    },
    university(ctx, x, y) {
      block(ctx, x, y, 30, 10, 14, '#d9c6a5', '#9c6b4a');
      windows(ctx, x - 15, y - 13, 30, 10, 2, 6, '#4f5d6e');
      ell(ctx, x, y - 26, 7, 6, '#4f8a8b');
      rect(ctx, x - 7, y - 26, 14, 3, '#d9c6a5');
    },
    theatre(ctx, x, y) {
      shadow(ctx, x, y, 28);
      ell(ctx, x, y - 6, 15, 8, '#c75a3c');
      ell(ctx, x, y - 12, 15, 8, '#e3c9a0');
      ell(ctx, x, y - 12, 9, 4.5, '#8f2f2f');
      rect(ctx, x - 15, y - 12, 30, 6, '#c75a3c');
    },
    factory(ctx, x, y) {
      shadow(ctx, x, y, 32);
      rect(ctx, x - 16, y - 14, 30, 14, '#9b4a36');
      for (let i = 0; i < 3; i++) poly(ctx, [x - 16 + i * 10, y - 14, x - 6 + i * 10, y - 14, x - 6 + i * 10, y - 22], '#6d6f73');
      rect(ctx, x + 10, y - 34, 6, 34, '#7d3a2a');
      rect(ctx, x + 10, y - 34, 6, 3, '#4b2318');
      windows(ctx, x - 16, y - 12, 24, 8, 1, 4, '#f2c75c');
    },
    tenement(ctx, x, y) {
      block(ctx, x, y, 22, 9, 30, '#a65b43', '#5f5a55');
      windows(ctx, x - 11, y - 29, 22, 27, 5, 4, '#e8d9a8');
      door(ctx, x, y, 4, 5, '#2d1e14');
    },
    tractor(ctx, x, y) {
      rect(ctx, x - 17, y - 13, 34, 24, '#79b343');
      ctx.fillStyle = '#e2c45a';
      for (let i = 0; i < 6; i++) ctx.fillRect(x - 17 + i * 6, y - 13, 3, 24);
      rect(ctx, x - 3, y - 4, 9, 6, '#d63b2f');
      rect(ctx, x + 1, y - 9, 5, 5, '#2b2b2b');
      ell(ctx, x - 2, y + 3, 2.6, 2.6, '#222'); ell(ctx, x + 6, y + 3, 1.8, 1.8, '#222');
    },
    station(ctx, x, y) {
      shadow(ctx, x, y, 34);
      rect(ctx, x - 18, y + 1, 36, 2, '#4d4d4d');
      rect(ctx, x - 16, y - 12, 32, 12, '#c9b48c');
      ell(ctx, x, y - 12, 16, 7, '#5d6b7a');
      rect(ctx, x - 16, y - 13, 32, 2, '#c9b48c');
      ell(ctx, x, y - 21, 3, 3, '#fff');
      windows(ctx, x - 16, y - 10, 32, 7, 1, 6, '#3e4a57');
    },
    school(ctx, x, y) {
      gable(ctx, x, y, 26, 10, 13, '#efe0c0', '#a0422f');
      windows(ctx, x - 13, y - 12, 26, 9, 1, 5, '#3c5c7a');
      door(ctx, x, y, 4, 6);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 15, y); ctx.lineTo(x + 15, y - 26); ctx.stroke();
      rect(ctx, x + 15, y - 26, 7, 2, '#2b59c3'); rect(ctx, x + 15, y - 24, 7, 2, '#fff'); rect(ctx, x + 15, y - 22, 7, 2, '#e23b3b');
    },
    wind(ctx, x, y, t) {
      for (const [dx, dy] of [[-9, 4], [9, -4]]) {
        const bx = x + dx, by = y + dy;
        shadow(ctx, bx, by, 8);
        rect(ctx, bx - 1, by - 30, 2, 30, '#f2f2f2');
        const a = (t || 0) * 0.003 + dx;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const b = a + i * Math.PI * 2 / 3;
          ctx.beginPath(); ctx.moveTo(bx, by - 30); ctx.lineTo(bx + Math.cos(b) * 12, by - 30 + Math.sin(b) * 12); ctx.stroke();
        }
        ell(ctx, bx, by - 30, 1.8, 1.8, '#cfd6dc');
      }
    },
    tower(ctx, x, y) {
      block(ctx, x, y, 20, 10, 62, '#5d8bb8', '#3f6286');
      ctx.fillStyle = '#a8d2f2';
      for (let r = 0; r < 12; r++) ctx.fillRect(x - 9, y - 60 + r * 5, 18, 2);
      rect(ctx, x + 3, y - 62, 7, 62, 'rgba(0,0,0,.14)');
    },
    greentower(ctx, x, y) {
      block(ctx, x, y, 18, 9, 44, '#cfe8d4', '#3e9b4f');
      ctx.fillStyle = '#4caf50';
      for (let r = 0; r < 9; r++) ctx.fillRect(x - 9, y - 42 + r * 5, 18, 2.5);
    },
    hospital(ctx, x, y) {
      block(ctx, x, y, 28, 10, 22, '#f4f6f8', '#c9d1d8');
      windows(ctx, x - 14, y - 21, 28, 17, 3, 6, '#88b4d6');
      rect(ctx, x - 2, y - 30, 4, 10, '#e33'); rect(ctx, x - 5, y - 27, 10, 4, '#e33');
    },
    lab(ctx, x, y) {
      block(ctx, x, y, 28, 10, 14, '#e9eef2', '#b9c3cc');
      windows(ctx, x - 14, y - 13, 28, 9, 1, 6, '#4aa3c7');
      ell(ctx, x + 6, y - 27, 7, 6, '#f7fbff');
      rect(ctx, x + 5, y - 33, 2, 6, '#333');
    },
    rocket(ctx, x, y, t, s) {
      rect(ctx, x - 18, y - 6, 36, 12, '#8b8f94');
      rect(ctx, x - 16, y - 4, 32, 8, '#a5aab0');
      rect(ctx, x + 8, y - 44, 4, 40, '#c0392b');
      const lift = s && s.launch ? s.launch : 0;
      const ry = y - lift;
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath(); ctx.moveTo(x - 5, ry - 6); ctx.lineTo(x - 5, ry - 36); ctx.quadraticCurveTo(x, ry - 52, x + 5, ry - 36); ctx.lineTo(x + 5, ry - 6); ctx.fill();
      poly(ctx, [x - 5, ry - 6, x - 10, ry, x - 5, ry - 16], '#c0392b');
      poly(ctx, [x + 5, ry - 6, x + 10, ry, x + 5, ry - 16], '#c0392b');
      ell(ctx, x, ry - 30, 2.4, 2.4, '#4aa3c7');
      if (lift > 0) {
        poly(ctx, [x - 4, ry - 4, x + 4, ry - 4, x, ry + 14 + Math.random() * 10], '#ffb300');
        poly(ctx, [x - 2, ry - 4, x + 2, ry - 4, x, ry + 8], '#fff3b0');
      }
    },
  };
  Object.assign(ARCH, {
    lumber(ctx, x, y) {
      shadow(ctx, x, y, 18);
      gable(ctx, x - 6, y - 2, 11, 7, 7, '#a77b4a', '#6e4e2a');
      for (let i = 0; i < 3; i++) { rect(ctx, x + 2, y - 3 - i * 3.4, 12, 3.2, '#9c6b3c'); ell(ctx, x + 14, y - 1.4 - i * 3.4, 1.6, 1.6, '#d9b07a'); }
      ell(ctx, x - 12, y + 3, 2.5, 1.3, '#7a5530');
    },
    quarry(ctx, x, y) {
      ell(ctx, x, y - 3, 16, 10, '#8d8f93');
      ell(ctx, x, y - 2, 11, 6.5, '#6f7176');
      rect(ctx, x - 9, y - 12, 6, 5, '#c3c5c9'); rect(ctx, x + 4, y - 11, 7, 5, '#b4b7bc'); rect(ctx, x - 2, y + 2, 6, 4, '#c9cbcf');
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 9, y + 4); ctx.lineTo(x + 14, y - 6); ctx.stroke();
    },
    mine(ctx, x, y) {
      ell(ctx, x, y - 4, 16, 12, '#7d6a58');
      ell(ctx, x - 3, y - 8, 9, 7, '#8f7b67');
      ctx.fillStyle = '#1e1712'; ctx.beginPath(); ctx.arc(x, y - 1, 6, Math.PI, 0); ctx.lineTo(x + 6, y + 1); ctx.lineTo(x - 6, y + 1); ctx.fill();
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 1.6; ctx.strokeRect(x - 6.5, y - 7, 13, 8);
      rect(ctx, x + 9, y - 2, 7, 4, '#5c5f63'); ell(ctx, x + 10.5, y + 2.4, 1.4, 1.4, '#222'); ell(ctx, x + 14.5, y + 2.4, 1.4, 1.4, '#222');
      rect(ctx, x + 10, y - 4, 5, 2.4, '#a0643a');
    },
    coalmine(ctx, x, y) {
      shadow(ctx, x, y, 26);
      ell(ctx, x + 9, y - 2, 9, 5, '#26262a');
      ctx.strokeStyle = '#4a4f57'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 6, y - 28); ctx.lineTo(x, y); ctx.moveTo(x - 10, y - 10); ctx.lineTo(x - 2, y - 10); ctx.moveTo(x - 9, y - 18); ctx.lineTo(x - 3, y - 18); ctx.stroke();
      ell(ctx, x - 6, y - 28, 4, 4, '#2b2f36'); ell(ctx, x - 6, y - 28, 2, 2, '#9aa3ad');
      rect(ctx, x + 2, y - 10, 12, 8, '#7a5a44'); rect(ctx, x + 2, y - 12, 12, 2, '#3a3a3a');
    },
    sawmill(ctx, x, y) {
      gable(ctx, x - 3, y, 18, 9, 10, '#b88a57', '#5d4030');
      ell(ctx, x - 3, y - 5, 3.2, 3.2, '#c9ced4'); ell(ctx, x - 3, y - 5, 1, 1, '#555');
      for (let i = 0; i < 2; i++) rect(ctx, x + 7, y - 2 - i * 3, 10, 2.8, '#9c6b3c');
    },
    stoneyard(ctx, x, y) {
      gable(ctx, x - 5, y, 16, 9, 10, '#cfc6b8', '#6b6f75');
      for (const [dx, dy] of [[6, -1], [12, -1], [9, -5]]) rect(ctx, x + dx, y + dy - 4, 6, 4, '#d9dbde');
    },
    furnace(ctx, x, y) {
      shadow(ctx, x, y, 28);
      rect(ctx, x - 14, y - 12, 18, 12, '#5f6670');
      ctx.fillStyle = '#7b2f22'; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + 4, y - 30); ctx.lineTo(x + 12, y - 30); ctx.lineTo(x + 14, y); ctx.fill();
      rect(ctx, x + 3, y - 33, 10, 3, '#3d1d16');
      ell(ctx, x + 8, y - 6, 3, 3, '#ff8a1f'); ell(ctx, x + 8, y - 6, 1.5, 1.5, '#ffe08a');
      windows(ctx, x - 14, y - 10, 18, 6, 1, 3, '#f2a64a');
    },
    port(ctx, x, y) {
      // un ponton qui s'avance dans le lac, des caisses et une grue en bois
      const a = Math.atan2(LAKE.y - y, LAKE.x - x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      rect(ctx, -6, -5, 34, 10, '#8b6438');
      ctx.fillStyle = '#6b4a2a'; for (let i = 0; i < 6; i++) ctx.fillRect(-4 + i * 5.5, -5, 1, 10);
      for (const px of [2, 14, 26]) { rect(ctx, px, -7, 2, 2, '#4a3220'); rect(ctx, px, 5, 2, 2, '#4a3220'); }
      ctx.restore();
      shadow(ctx, x, y, 16);
      rect(ctx, x - 9, y - 7, 6, 6, '#b88a57'); rect(ctx, x - 3, y - 6, 5, 5, '#a77b4a');
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y - 18); ctx.lineTo(x + 12, y - 14); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x + 12, y - 14); ctx.lineTo(x + 12, y - 8); ctx.stroke();
    },
    main(ctx, x, y, t, s) {
      // le bâtiment principal change à chaque niveau (une fois par ère)
      const L = s ? (s.mainLevel || 0) : 0;
      const banner = (bx, by, c) => { ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - 12); ctx.stroke(); rect(ctx, bx, by - 12, 6, 4, c || '#d6453d'); };
      if (L === 0) {            // grande hutte du clan
        shadow(ctx, x, y, 30);
        poly(ctx, [x - 17, y, x + 17, y, x, y - 26], '#a77b4a');
        poly(ctx, [x, y, x + 17, y, x, y - 26], '#8b6438');
        ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 4, y - 32); ctx.lineTo(x + 1, y - 22); ctx.moveTo(x + 4, y - 32); ctx.lineTo(x - 1, y - 22); ctx.stroke();
        poly(ctx, [x - 4, y, x + 4, y, x, y - 9], '#3b2a18');
        for (const dx of [-14, 14]) { rect(ctx, x + dx - 1, y - 14, 2, 14, '#6b4a2a'); ell(ctx, x + dx, y - 15, 2.4, 2.4, '#e9e0c9'); }
      } else if (L === 1) {     // palais antique
        shadow(ctx, x, y, 36);
        rect(ctx, x - 19, y - 4, 38, 4, '#cfc9b8');
        for (let i = 0; i < 7; i++) rect(ctx, x - 17 + i * 5.3, y - 18, 2.6, 14, '#f4efe2');
        rect(ctx, x - 19, y - 22, 38, 4, '#e6dfcd');
        poly(ctx, [x - 20, y - 22, x + 20, y - 22, x, y - 33], '#c9533e');
        banner(x + 20, y - 4, '#7a3fb0');
      } else if (L === 2) {     // beffroi médiéval
        block(ctx, x - 6, y, 24, 10, 14, '#d8cfbe', '#8a4a2e');
        rect(ctx, x + 8, y - 34, 11, 34, '#c9bea8');
        poly(ctx, [x + 7, y - 34, x + 20, y - 34, x + 13.5, y - 46], '#5d6670');
        ell(ctx, x + 13.5, y - 26, 3, 3, '#f4efe2'); ell(ctx, x + 13.5, y - 26, 1, 1, '#333');
        door(ctx, x - 6, y, 5, 7, '#4a2f1a');
        banner(x - 18, y, '#2f5fa8');
      } else if (L === 3) {     // hôtel de ville
        block(ctx, x, y, 38, 10, 18, '#efe6d3', '#4a5d74');
        windows(ctx, x - 19, y - 17, 38, 14, 2, 7, '#3c5168');
        rect(ctx, x - 5, y - 36, 10, 10, '#efe6d3'); poly(ctx, [x - 6, y - 36, x + 6, y - 36, x, y - 44], '#4a5d74');
        ell(ctx, x, y - 31, 2.6, 2.6, '#fff'); 
        door(ctx, x, y, 5, 7, '#3d2b1a');
      } else {                   // palais du gouvernement / capitole
        block(ctx, x, y, 40, 10, 18, '#f2efe8', '#c8c2b5');
        for (let i = 0; i < 8; i++) rect(ctx, x - 18 + i * 5, y - 17, 2.4, 15, '#fffdf7');
        ell(ctx, x, y - 34, L === 5 ? 12 : 9, L === 5 ? 11 : 8, L === 5 ? '#e9e4d8' : '#7f97ad');
        rect(ctx, x - (L === 5 ? 12 : 9), y - 34, L === 5 ? 24 : 18, 6, '#f2efe8');
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - (L === 5 ? 45 : 42)); ctx.lineTo(x, y - 54); ctx.stroke();
        rect(ctx, x, y - 54, 7, 4, '#d6453d');
      }
    },
    research(ctx, x, y, t, s) {
      if (s && s.era >= 2) {
        // un observatoire : bâtiment de pierre et coupole
        block(ctx, x, y, 24, 9, 13, '#d9cfbd', '#a89c86');
        windows(ctx, x - 12, y - 12, 24, 8, 1, 4, '#3c5168');
        ell(ctx, x + 3, y - 26, 8, 7, '#7f97ad');
        rect(ctx, x - 5, y - 26, 16, 4, '#d9cfbd');
        ctx.strokeStyle = '#3b4652'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 4, y - 29); ctx.lineTo(x + 12, y - 36); ctx.stroke();
        return;
      }
      // la hutte du savoir : hutte ronde, tablettes gravées et un bâton à étoile
      shadow(ctx, x, y, 22);
      ell(ctx, x, y - 6, 11, 7, '#c9b48c');
      poly(ctx, [x - 12, y - 7, x + 12, y - 7, x, y - 22], '#8a6a43');
      poly(ctx, [x, y - 7, x + 12, y - 7, x, y - 22], '#735634');
      rect(ctx, x - 2, y - 7, 4, 7, '#3b2a18');
      rect(ctx, x + 12, y - 8, 5, 7, '#a3a8ae'); rect(ctx, x + 13, y - 7, 3, 1, '#6d737a'); rect(ctx, x + 13, y - 5, 3, 1, '#6d737a');
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 14, y - 24); ctx.stroke();
      ctx.fillStyle = '#ffd34d'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x - 14, y - 26);
    },
    armory(ctx, x, y, t, s) {
      // atelier d'armes : un bâtiment avec deux épées croisées
      gable(ctx, x, y, 22, 11, 12, '#b7a48a', '#5b3a2a');
      door(ctx, x - 5, y, 4, 6, '#3b2a18');
      ell(ctx, x + 5, y - 6, 4.5, 4.5, '#efe6d3');
      ctx.strokeStyle = '#7d858e'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x + 2, y - 9); ctx.lineTo(x + 8, y - 3); ctx.moveTo(x + 8, y - 9); ctx.lineTo(x + 2, y - 3); ctx.stroke();
      ell(ctx, x + 10, y - 22, 1.6, 1.6, 'rgba(120,120,120,.5)');
      rect(ctx, x + 8, y - 21, 3, 6, '#6d4c3a');
    },
    traps(ctx, x, y) {
      // deux pièges à lacet et un appât au pied des arbres
      for (const [dx, dy] of [[-8, 2], [7, -3]]) {
        const tx = x + dx, ty = y + dy;
        ell(ctx, tx, ty + 1, 6, 2.5, 'rgba(60,40,20,.25)');
        ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(tx - 4, ty); ctx.lineTo(tx, ty - 9); ctx.lineTo(tx + 4, ty); ctx.stroke();
        ctx.strokeStyle = '#d9c39a'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(tx, ty - 2, 2.6, 0, Math.PI * 2); ctx.stroke();
      }
      ell(ctx, x, y + 5, 3, 2, '#c0392b'); ell(ctx, x - 0.8, y + 4.4, 1, 0.7, '#f5b7b1');
    },
    recycle(ctx, x, y) {
      block(ctx, x, y, 26, 9, 12, '#d8e8d2', '#4c9a5b');
      ctx.fillStyle = '#2e7d32'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♻', x, y - 6);
      rect(ctx, x + 14, y - 5, 6, 5, '#8a9099');
    },
  });
  const EDGE = { quarry: 1, mine: 1, coalmine: 1, traps: 1 };
  const DYNAMIC = { mill: 1, wind: 1, rocket: 1 };

  /* ---------- Le décor statique ---------- */
  function paintTerrain(ctx, state) {
    const r = mulberry(99);
    // neige et roche
    ctx.fillStyle = '#e8ecef'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, n = 1.2 + r() * 0.9;
      const x = VX + Math.cos(a) * VRX * n, y = VY + Math.sin(a) * VRY * n;
      const sz = 40 + r() * 70;
      poly(ctx, [x - sz, y + sz * 0.5, x + sz * 0.1, y - sz * 0.6, x + sz, y + sz * 0.5], 'rgba(255,255,255,.9)');
      poly(ctx, [x + sz * 0.1, y - sz * 0.6, x + sz, y + sz * 0.5, x + sz * 0.25, y + sz * 0.5], 'rgba(150,160,172,.35)');
    }
    for (let i = 0; i < 380; i++) {
      const a = r() * Math.PI * 2, n = 1.05 + r() * 1.2;
      const x = VX + Math.cos(a) * VRX * n, y = VY + Math.sin(a) * VRY * n;
      const len = 14 + r() * 40;
      ctx.strokeStyle = `rgba(${120 + r() * 40},${130 + r() * 40},${140 + r() * 40},${0.25 + r() * 0.3})`;
      ctx.lineWidth = 1 + r() * 2.5;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a + (r() - 0.5) * 0.8) * len, y + Math.sin(a + (r() - 0.5) * 0.8) * len);
      ctx.stroke();
    }
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2, n = 1.15 + r() * 1.2;
      ell(ctx, VX + Math.cos(a) * VRX * n, VY + Math.sin(a) * VRY * n, 10 + r() * 30, 6 + r() * 16, 'rgba(255,255,255,.7)');
    }
    // falaises
    ctx.save(); ctx.translate(VX, VY); ctx.scale(VRX, VRY);
    let g = ctx.createRadialGradient(0, 0, 0.95, 0, 0, 1.22);
    g.addColorStop(0, '#4f463e'); g.addColorStop(0.45, '#7a6d61'); g.addColorStop(1, 'rgba(160,160,165,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1.22, 0, Math.PI * 2); ctx.fill();
    // prairie
    g = ctx.createRadialGradient(-0.1, -0.1, 0.1, 0, 0, 1);
    g.addColorStop(0, '#8fd05a'); g.addColorStop(0.75, '#74b944'); g.addColorStop(1, '#4f8f30');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2, n = Math.sqrt(r()) * 0.9;
      ell(ctx, VX + Math.cos(a) * VRX * n, VY + Math.sin(a) * VRY * n, 8 + r() * 22, 5 + r() * 12, r() < 0.5 ? 'rgba(170,220,110,.25)' : 'rgba(60,120,40,.12)');
    }
    // cascade au nord
    ctx.strokeStyle = '#cfe9f7'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(372, -20); ctx.lineTo(376, 140); ctx.stroke();
    // lac
    ell(ctx, LAKE.x, LAKE.y, LAKE.rx + 7, LAKE.ry + 6, '#d9cf9c');
    let lg = ctx.createRadialGradient(LAKE.x - 20, LAKE.y - 10, 10, LAKE.x, LAKE.y, LAKE.rx);
    lg.addColorStop(0, '#5fb3e6'); lg.addColorStop(1, '#3d93cf');
    ell(ctx, LAKE.x, LAKE.y, LAKE.rx, LAKE.ry, lg);
    // rivière
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); RIVER.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
    stroke(RIVER_HALF * 2 + 8, '#cdbf8a'); stroke(RIVER_HALF * 2, '#4aa0d8'); stroke(10, 'rgba(255,255,255,.22)');

    if (!state || !state.site) return;
    // routes : chaque bâtiment est relié au plus proche plus ancien
    const placed = state.buildings.filter((b) => b.x != null && b.slot !== 'port');   // le port est relié par l'eau
    const origin = SITES[state.site];
    const modern = state.era >= 4;
    ctx.strokeStyle = modern ? '#6d7177' : state.era >= 2 ? '#c7b48a' : '#b9a578';
    ctx.lineWidth = modern ? 7 : state.era >= 2 ? 5 : 3.5;
    ctx.beginPath();
    placed.forEach((b, i) => {
      let best = origin, bd = Math.hypot(b.x - origin.x, b.y - origin.y);
      for (let j = 0; j < i; j++) { const o = placed[j]; const d = Math.hypot(b.x - o.x, b.y - o.y); if (d < bd) { bd = d; best = o; } }
      // si la route traverse l'eau, elle passe par le gué / le pont
      const way = crossesWater(best, b) ? (route(best, b) || [b]) : [b];
      ctx.moveTo(best.x, best.y + 3);
      for (const q of way) ctx.lineTo(q.x, q.y + 3);
    });
    ctx.stroke();
    if (modern) {
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
    // gués (pierres de passage), puis ponts à partir du Moyen Âge
    for (const c of CROSSINGS) {
      const ends = Object.values(c.ends);
      if (ends.length < 2) continue;
      const [P, Q] = ends;
      if (state.era >= 2) {
        ctx.strokeStyle = modern ? '#8a8f96' : '#9b7a4f'; ctx.lineWidth = 7; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y); ctx.stroke();
        ctx.strokeStyle = modern ? '#5d6168' : '#6b4a2a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(P.x, P.y - 3.5); ctx.lineTo(Q.x, Q.y - 3.5); ctx.moveTo(P.x, P.y + 3.5); ctx.lineTo(Q.x, Q.y + 3.5); ctx.stroke();
        ctx.lineCap = 'round';
      } else {
        ctx.strokeStyle = 'rgba(214, 196, 140, .75)'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y); ctx.stroke();
        for (let k = 0; k <= 7; k++) { const t = k / 7; ell(ctx, P.x + (Q.x - P.x) * t, P.y + (Q.y - P.y) * t, 3.6, 2.8, '#8f949a'); ell(ctx, P.x + (Q.x - P.x) * t - 0.8, P.y + (Q.y - P.y) * t - 0.8, 1.6, 1.2, '#c3c7cb'); }
      }
    }
  }

  function paintTree(ctx, t) {
    const dark = t.shade * 0.25;
    if (t.pine) {
      ell(ctx, t.x + 3, t.y + 1, t.r * 0.8, t.r * 0.35, 'rgba(10,40,10,.3)');
      poly(ctx, [t.x - t.r * 0.8, t.y, t.x + t.r * 0.8, t.y, t.x, t.y - t.r * 2.4], shade('#2f6b2a', -dark));
      poly(ctx, [t.x, t.y, t.x + t.r * 0.8, t.y, t.x, t.y - t.r * 2.4], shade('#25561f', -dark));
    } else {
      ell(ctx, t.x + 3, t.y + 1, t.r, t.r * 0.4, 'rgba(10,40,10,.3)');
      ell(ctx, t.x, t.y - t.r * 0.8, t.r, t.r * 0.95, shade('#4f9a35', -dark));
      ell(ctx, t.x - t.r * 0.3, t.y - t.r * 1.05, t.r * 0.45, t.r * 0.4, 'rgba(255,255,255,.12)');
    }
  }

  /* ---------- Le module « Map » ---------- */
  function create(canvas) {
    const ctx = canvas.getContext('2d');
    const bg = document.createElement('canvas');
    bg.width = W * RES; bg.height = H * RES;
    const bctx = bg.getContext('2d');
    let state = null, slots = [], dirty = true;
    let people = [];
    let smoke = [];
    const cam = { x: VX, y: VY, z: 1, tx: VX, ty: VY, tz: 1, manual: false };
    let markers = null;      // pendant le vote de fondation
    let light = 1, night = false;   // cycle jour / nuit
    let flagImg = null;

    function setState(s) {
      state = s;
      if (s && s.site) {
        slots = buildSlots(s.site);
        const used = new Set();
        for (const b of s.buildings) {
          if (!Engine.B[b.id] || !Engine.B[b.id].arch) continue;   // améliorations : rien à dessiner
          if (Engine.B[b.id].arch === 'port') { const q = portSpot(); b.slot = 'port'; b.x = q.x; b.y = q.y; continue; }
          if (b.slot == null || used.has(b.slot) || !slots[b.slot] || !!slots[b.slot].edge !== isEdge(b)) b.slot = nextSlot(used, isEdge(b));
          used.add(b.slot);
          b.x = slots[b.slot].x; b.y = slots[b.slot].y;
        }
        clearTrees();
      }
      dirty = true;
      autoCamera(true);
    }
    function nextSlot(used, edge) {
      for (let i = 0; i < slots.length; i++) if (!used.has(i) && !!slots[i].edge === !!edge) return i;
      for (let i = 0; i < slots.length; i++) if (!used.has(i)) return i;
      return 0;
    }
    const isEdge = (b) => !!EDGE[Engine.B[b.id].arch];
    function portSpot() {
      const o = SITES[state.site];
      let best = null, bd = 1e9;
      for (let a = 0; a < Math.PI * 2; a += 0.04) {
        const x = LAKE.x + Math.cos(a) * LAKE.rx * 1.12, y = LAKE.y + Math.sin(a) * LAKE.ry * 1.12;
        if (riverDist(x, y) < 45 || vnorm(x, y) > 0.93) continue;
        const d = Math.hypot(x - o.x, y - o.y);
        if (d < bd) { bd = d; best = { x, y }; }
      }
      return best || { x: LAKE.x, y: LAKE.y - LAKE.ry * 1.12 };
    }
    function place(b) {
      if (!Engine.B[b.id].arch) return b;
      if (Engine.B[b.id].arch === 'port') { const q = portSpot(); b.slot = 'port'; b.x = q.x; b.y = q.y; dirty = true; autoCamera(); return b; }
      const used = new Set(state.buildings.filter((x) => x !== b && x.slot != null && Engine.B[x.id].arch).map((x) => x.slot));
      b.slot = nextSlot(used, isEdge(b));
      b.x = slots[b.slot].x; b.y = slots[b.slot].y;
      clearTrees();
      dirty = true;
      autoCamera();
      return b;
    }
    function clearTrees() {
      for (const t of trees) t.alive = true;
      if (!state || !state.site) return;
      const pts = state.buildings.filter((b) => b.x != null).concat([SITES[state.site], CAMP[state.site]]);
      for (const t of trees) for (const p of pts) if (Math.hypot(t.x - p.x, t.y - p.y) < 26) { t.alive = false; break; }
    }

    function repaint() {
      bctx.setTransform(RES, 0, 0, RES, 0, 0);
      paintTerrain(bctx, state);
      // arbres et bâtiments, triés par profondeur
      const items = trees.filter((t) => t.alive).map((t) => ({ y: t.y, t }));
      if (state && state.site) {
        for (const b of state.buildings) if (b.x != null && !DYNAMIC[Engine.B[b.id].arch]) items.push({ y: b.y, b });
      }
      items.sort((a, b) => a.y - b.y);
      for (const it of items) {
        if (it.t) paintTree(bctx, it.t);
        else ARCH[Engine.B[it.b.id].arch](bctx, it.b.x, it.b.y, 0, state);
      }
      dirty = false;
    }

    /* --- caméra --- */
    function autoCamera(instant) {
      if (cam.manual) return;
      if (!state || !state.site) { cam.tx = VX; cam.ty = VY; cam.tz = overviewZ(); }
      else {
        const pts = state.buildings.filter((b) => b.x != null).concat([SITES[state.site]]);
        let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
        for (const p of pts) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); }
        cam.tx = (minx + maxx) / 2; cam.ty = (miny + maxy) / 2;
        const span = Math.max((maxx - minx + 160) / W, (maxy - miny + 220) / H);
        cam.tz = Math.max(1, Math.min(2.6, 1 / span));
      }
      if (instant) { cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; }
    }
    function overviewZ() {
      const contain = Math.min(canvas.width / W, canvas.height / H);
      return Math.max(0.55, Math.min(1, contain / baseScale() * 1.08));
    }
    function baseScale() {
      return Math.max(canvas.width / W, canvas.height / H);
    }
    function clampCam() {
      const s = baseScale() * cam.z;
      const hw = canvas.width / s / 2, hh = canvas.height / s / 2;
      cam.x = hw * 2 >= W ? W / 2 : Math.max(hw, Math.min(W - hw, cam.x));
      cam.y = hh * 2 >= H ? H / 2 : Math.max(hh, Math.min(H - hh, cam.y));
    }
    function toWorld(px, py) {
      const s = baseScale() * cam.z;
      return { x: (px - canvas.width / 2) / s + cam.x, y: (py - canvas.height / 2) / s + cam.y };
    }

    /* --- habitants --- */
    const COLORS = ['#f0a030', '#2ab3a3', '#e8c23a', '#9b59d0', '#e35d6a', '#3d8fe0', '#f2f2f2', '#7ccf5a'];
    // Les arbres de la forêt les plus proches du village : là où vont les bûcherons
    function forestSpots() {
      const o = SITES[state.site];
      return trees.filter((t) => t.alive && vnorm(t.x, t.y) > 0.78 && vnorm(t.x, t.y) < 1.0)
        .sort((a, b) => Math.hypot(a.x - o.x, a.y - o.y) - Math.hypot(b.x - o.x, b.y - o.y)).slice(0, 36);
    }
    function syncPeople() {
      if (!state || !state.site) { people = []; return; }
      people = people.filter((p) => !p.soldier);
      const want = Math.min(state.pop, 140);
      const homes = state.buildings.filter((b) => b.x != null);
      const pick = () => { const h = homes.length ? homes[Math.floor(Math.random() * homes.length)] : SITES[state.site]; return { x: h.x + (Math.random() - 0.5) * 50, y: h.y + 8 + (Math.random() - 0.5) * 40 }; };
      const spots = forestSpots();
      const woodPick = () => {
        if (!spots.length || Math.random() < 0.25) return pick();       // ramener le bois au village
        const t = spots[Math.floor(Math.random() * spots.length)];
        return { x: t.x + (Math.random() - 0.5) * 8, y: t.y + 4 };
      };
      const o = SITES[state.site];
      const rocks = [];
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const x = VX + Math.cos(a) * VRX * 0.97, y = VY + Math.sin(a) * VRY * 0.97;
        if (!isWater(x, y, 20) && y > 150) rocks.push({ x, y, d: Math.hypot(x - o.x, y - o.y) });
      }
      rocks.sort((a, b) => a.d - b.d);
      const near = rocks.slice(0, 8);
      const stonePick = () => {
        if (!near.length || Math.random() < 0.3) return pick();
        const r = near[Math.floor(Math.random() * near.length)];
        return { x: r.x + (Math.random() - 0.5) * 14, y: r.y + (Math.random() - 0.5) * 8 };
      };
      while (people.length < want) {
        const p = pick();
        if (isWater(p.x, p.y, 2)) continue;
        people.push({ x: p.x, y: p.y, tx: p.x, ty: p.y, c: COLORS[Math.floor(Math.random() * COLORS.length)], wait: Math.random() * 3000, pick });
      }
      if (people.length > want) people.length = want;
      // les chasseurs vont plus loin dans la forêt, les gardes tournent autour du village
      const hunt = trees.filter((t) => t.alive && vnorm(t.x, t.y) > 0.7 && vnorm(t.x, t.y) < 0.98);
      const huntPick = () => {
        if (!hunt.length || Math.random() < 0.2) return pick();
        const t = hunt[Math.floor(Math.random() * hunt.length)];
        return { x: t.x + 6, y: t.y + 4 };
      };
      const guardPick = () => { const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 30; return { x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r * 0.8 }; };
      // les agriculteurs travaillent dans les champs et les fermes
      const fields = state.buildings.filter((b) => b.x != null && ['field', 'mill', 'barn', 'tractor', 'greentower'].includes(Engine.B[b.id].arch));
      const farmPick = () => {
        if (!fields.length || Math.random() < 0.2) return pick();
        const f = fields[Math.floor(Math.random() * fields.length)];
        return { x: f.x + (Math.random() - 0.5) * 30, y: f.y + (Math.random() - 0.5) * 18 };
      };
      const PICK = { wood: woodPick, stone: stonePick, iron: stonePick, coal: stonePick, hunt: huntPick, guard: guardPick, farm: farmPick };
      const vs = state.villagers || [];
      people.forEach((p, i) => {
        p.home = pick;
        const was = p.job;
        const v = vs[Math.floor(i * vs.length / Math.max(1, people.length))];
        p.job = v ? v.job : 'idle';
        if (v && v.hue != null) p.c = `hsl(${v.hue},65%,58%)`;
        p.lumber = !!PICK[p.job];
        p.pick = PICK[p.job] || pick;
        if (p.job !== was) { goTo(p, p.pick()); p.wait = Math.random() * 400; }
      });
      // en temps de paix, une partie de l'armée part chasser
      if (state.army && state.day >= (state.warUntil || 0)) {
        const c = CAMP[state.site];
        const best = (state.troops && state.troops.length) ? state.troops[state.troops.length - 1].era : state.era;
        const n = Math.min(18, Math.ceil(state.army * 0.6));
        for (let i = 0; i < n; i++) {
          const q = { x: c.x + (Math.random() - 0.5) * 30, y: c.y + Math.random() * 12, c: LOOK[best].body, soldier: true, job: 'hunt', lumber: true, pick: huntPick, home: () => ({ x: c.x + (Math.random() - 0.5) * 30, y: c.y + Math.random() * 12 }), wait: Math.random() * 1500 };
          q.tx = q.x; q.ty = q.y;
          people.push(q);
        }
      }
    }
    // choisir une destination atteignable à pied (sinon on reste sur place)
    function goTo(p, n) {
      if (!n || vnorm(n.x, n.y) > (p.lumber ? 1.02 : 0.9)) return false;
      const r = route(p, n);
      if (!r) return false;
      const q = r.shift(); p.tx = q.x; p.ty = q.y; p.path = r;
      return true;
    }
    function updatePeople(dt) {
      for (const p of people) {
        if (p.wait > 0) { p.wait -= dt; continue; }
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
        if (d < 1) {
          if (p.path && p.path.length) { const q = p.path.shift(); p.tx = q.x; p.ty = q.y; continue; }
          goTo(p, night && p.home ? p.home() : p.pick());
          p.wait = (p.lumber ? 1200 : 500) + Math.random() * 3500;
          continue;
        }
        const sp = 0.012 * dt;
        p.x += dx / d * Math.min(sp, d); p.y += dy / d * Math.min(sp, d);
      }
    }
    function drawPerson(p) {
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath(); ctx.ellipse(p.x + 1, p.y + 0.5, 2.2, 0.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p.x - 1.6, p.y - 5, 3.2, 5, 1.5) : ctx.rect(p.x - 1.6, p.y - 5, 3.2, 5); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y - 6.2, 1.5, 0, Math.PI * 2); ctx.fill();
      if (p.job === 'farm') {
        ctx.fillStyle = '#e8c95a'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 7.4, 2.6, 0.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(p.x + 2.2, p.y); ctx.lineTo(p.x + 2.2, p.y - 8); ctx.lineTo(p.x + 3.8, p.y - 8); ctx.stroke();
      } else if (p.job === 'hunt') {
        ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(p.x + 2.2, p.y); ctx.lineTo(p.x + 2.2, p.y - 10); ctx.stroke();
        ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.moveTo(p.x + 1.4, p.y - 10); ctx.lineTo(p.x + 3, p.y - 10); ctx.lineTo(p.x + 2.2, p.y - 12); ctx.fill();
      } else if (p.job === 'guard') {
        ctx.fillStyle = '#8a8f96'; ctx.beginPath(); ctx.arc(p.x, p.y - 6.6, 1.7, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#b5523b'; ctx.fillRect(p.x - 3.4, p.y - 4.6, 2, 3);
      } else if (p.job === 'iron' || p.job === 'coal') {
        ctx.fillStyle = p.job === 'coal' ? '#2b2b2b' : '#a0643a'; ctx.fillRect(p.x - 1.8, p.y - 10.2, 3.6, 2.6);
        ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(p.x, p.y - 7.2, 0.7, 0, Math.PI * 2); ctx.fill();
      } else if (p.job === 'stone') {
        ctx.fillStyle = '#9ea3a8'; ctx.fillRect(p.x - 1.8, p.y - 10.2, 3.6, 2.6);
        ctx.fillStyle = '#c3c7cb'; ctx.fillRect(p.x - 1.8, p.y - 10.2, 3.6, 1);
      } else if (p.job === 'wood') {
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(p.x + 1.2, p.y - 3); ctx.lineTo(p.x + 3.4, p.y - 7.4); ctx.stroke();
        ctx.fillStyle = '#9aa3ad'; ctx.fillRect(p.x + 2.6, p.y - 8.2, 2, 1.6);
      }
    }

    /* --- l'armée : une petite troupe en formation, équipée selon son époque --- */
    const LOOK = [
      { body: '#8b5a2b', head: '#c68a5a', gear: 'spear' },     // guerriers
      { body: '#b23a2e', head: '#d9b44a', gear: 'shield' },    // légionnaires
      { body: '#9aa3ad', head: '#6d757e', gear: 'sword' },     // chevaliers
      { body: '#2f5fa8', head: '#1d2433', gear: 'musket' },    // mousquetaires
      { body: '#6b7046', head: '#4d5233', gear: 'rifle' },     // fusiliers
      { body: '#4f6b3a', head: '#2f4024', gear: 'rifle' },     // armée moderne
    ];
    function drawTroops(t) {
      if (!state || !state.site || !state.army) return;
      const c = CAMP[state.site];
      const groups = (state.troops && state.troops.length) ? state.troops : [{ era: state.era, n: state.army }];
      const total = groups.reduce((a, g) => a + g.n, 0);
      const peace = state.day >= (state.warUntil || 0);
      const figs = Math.min(36, peace ? Math.max(0, total - Math.min(18, Math.ceil(total * 0.6))) : total);
      if (!figs) return;
      // les meilleures unités devant
      const list = [];
      groups.slice().sort((a, b) => b.era - a.era).forEach((g) => { const k = Math.max(1, Math.round(g.n / total * figs)); for (let i = 0; i < k; i++) list.push(g.era); });
      list.length = Math.min(list.length, figs);
      const cols = 6;
      // terrain d'entraînement
      ctx.fillStyle = 'rgba(160,130,80,.35)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 8, 30, 16 + Math.ceil(list.length / cols) * 2, 0, 0, Math.PI * 2); ctx.fill();
      // véhicules de l'armée moderne
      const modern = groups.find((g) => g.era === 5);
      if (modern) for (let i = 0; i < Math.min(3, Math.ceil(modern.n / 10)); i++) {
        const vx = c.x - 26 + i * 18, vy = c.y - 12;
        ctx.fillStyle = '#4f6b3a'; ctx.fillRect(vx - 6, vy - 3, 12, 6);
        ctx.fillStyle = '#3d5530'; ctx.fillRect(vx - 3, vy - 6, 6, 3);
        ctx.strokeStyle = '#3d5530'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(vx + 3, vy - 4.5); ctx.lineTo(vx + 9, vy - 5); ctx.stroke();
      }
      // canon pour les mousquetaires
      if (groups.find((g) => g.era === 3)) {
        const vx = c.x + 30, vy = c.y + 4;
        ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.arc(vx, vy, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b2b2b'; ctx.save(); ctx.translate(vx, vy - 1); ctx.rotate(-0.3); ctx.fillRect(0, -1.2, 9, 2.4); ctx.restore();
      }
      list.forEach((era, i) => {
        const L = LOOK[era];
        const x = c.x - 20 + (i % cols) * 8 + (Math.floor(i / cols) % 2) * 4;
        const y = c.y + Math.floor(i / cols) * 6;
        const step = Math.sin(t * 0.006 + i) * 0.4;
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 0.5, 2.2, 0.9, 0, 0, Math.PI * 2); ctx.fill();
        if (era === 2 && i % 3 === 0) {          // un chevalier à cheval
          ctx.fillStyle = '#7a5530'; ctx.fillRect(x - 3.5, y - 4, 7, 3); ctx.fillRect(x + 3, y - 6, 2, 3);
        }
        ctx.fillStyle = L.body; ctx.fillRect(x - 1.6, y - 5 + step, 3.2, 5);
        ctx.fillStyle = L.head; ctx.beginPath(); ctx.arc(x, y - 6.2 + step, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3b2a18'; ctx.lineWidth = 0.7; ctx.beginPath();
        if (L.gear === 'spear') { ctx.moveTo(x + 2.2, y); ctx.lineTo(x + 2.2, y - 11); }
        else if (L.gear === 'sword') { ctx.strokeStyle = '#d7dde3'; ctx.moveTo(x + 2, y - 3); ctx.lineTo(x + 3.5, y - 8); }
        else { ctx.strokeStyle = '#2b2b2b'; ctx.moveTo(x + 1.5, y - 2); ctx.lineTo(x + 3, y - 10); }
        ctx.stroke();
        if (L.gear === 'shield') { ctx.fillStyle = '#d9b44a'; ctx.fillRect(x - 3.6, y - 5, 2, 4); }
      });
    }

    /* --- bateaux de commerce (quand il y a un port) --- */
    function drawBoats(t) {
      if (!state || !state.site || !state.buildings.some((b) => b.id === 'port' && b.x != null)) return;
      const n = Math.min(3, 1 + (state.era || 0));
      for (let i = 0; i < n; i++) {
        const a = t * 0.00012 * (i % 2 ? -1 : 1) + i * 2.1;
        const x = LAKE.x + Math.cos(a) * LAKE.rx * (0.55 - i * 0.12), y = LAKE.y + Math.sin(a) * LAKE.ry * (0.55 - i * 0.12);
        const dir = (i % 2 ? -1 : 1) * (Math.sin(a) > 0 ? -1 : 1);
        ell(ctx, x + 2, y + 2, 8, 2.4, 'rgba(0,30,60,.25)');
        ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 2); ctx.lineTo(x + 8, y - 2); ctx.lineTo(x + 5, y + 2); ctx.lineTo(x - 5, y + 2); ctx.fill();
        rect(ctx, x - 0.6, y - 14, 1.2, 12, '#4a3220');
        ctx.fillStyle = state.era >= 3 ? '#f4efe2' : '#e9d8b4';
        ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x + 7 * dir, y - 4); ctx.lineTo(x, y - 4); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - 10 * dir, y + 1); ctx.lineTo(x - 16 * dir, y + 1.5); ctx.stroke();
      }
    }

    /* --- drapeau planté au point de fondation --- */
    function drawFlag(t) {
      if (!state || !state.site) return;
      const s = SITES[state.site];
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 34); ctx.stroke();
      ell(ctx, s.x, s.y - 34, 1.4, 1.4, '#e0b93a');
      if (flagImg) {
        const w = 18, h = 12;
        for (let i = 0; i < w; i++) {
          const off = Math.sin(t * 0.004 + i * 0.35) * 1.2 * (i / w);
          ctx.drawImage(flagImg, (i / w) * flagImg.width, 0, flagImg.width / w + 1, flagImg.height, s.x + i, s.y - 33 + off, 1.2, h);
        }
      }
    }

    /* --- marqueurs A/B du vote de fondation --- */
    function drawMarkers(t) {
      if (!markers) return;
      for (const key in SITES) {
        const s = SITES[key];
        const bob = Math.sin(t * 0.004 + (key === 'lac' ? 1 : 0)) * 3;
        // fantômes de maisons
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
        for (let i = 0; i < 9; i++) {
          const a = i * 2.4, rr = 16 + (i % 3) * 13;
          const hx = s.x + Math.cos(a) * rr, hy = s.y + Math.sin(a) * rr * 0.8;
          if (isWater(hx, hy, 4)) continue;
          ctx.fillRect(hx - 5, hy - 6, 10, 7); ctx.strokeRect(hx - 5, hy - 6, 10, 7);
        }
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 48, 36, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        const col = key === 'lac' ? '#f08a24' : '#2f7fe0';
        const my = s.y - 30 + bob;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(s.x, my, 11, Math.PI, 0); ctx.lineTo(s.x, my + 17); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.label, s.x, my + 1);
      }
    }

    /* --- fumée des usines --- */
    function updateSmoke(dt) {
      if (state && state.site && Math.random() < 0.08) {
        for (const b of state.buildings) {
          if (b.x == null || Engine.B[b.id].arch !== 'factory' || Math.random() > 0.4) continue;
          smoke.push({ x: b.x + 13, y: b.y - 36, r: 2.5, a: 0.55 });
        }
      }
      for (const s of smoke) { s.y -= dt * 0.012; s.x += dt * 0.006; s.r += dt * 0.004; s.a -= dt * 0.00025; }
      smoke = smoke.filter((s) => s.a > 0);
    }

    let last = performance.now();
    function frame(t) {
      const dt = Math.min(60, t - last); last = t;
      if (dirty) repaint();
      const k = 1 - Math.pow(0.996, dt);
      cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.z += (cam.tz - cam.z) * k;
      clampCam();
      updatePeople(dt); updateSmoke(dt);

      const s = baseScale() * cam.z;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#e8ecef'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, canvas.width / 2 - cam.x * s, canvas.height / 2 - cam.y * s);
      ctx.drawImage(bg, 0, 0, W, H);
      // reflets sur l'eau
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const ox = Math.sin(t * 0.0007 + i * 1.7) * 40;
        ctx.beginPath(); ctx.moveTo(LAKE.x - 30 + ox, LAKE.y - 40 + i * 14); ctx.lineTo(LAKE.x - 14 + ox, LAKE.y - 40 + i * 14); ctx.stroke();
      }
      // éléments animés + habitants triés par profondeur
      const items = people.map((p) => ({ y: p.y, p }));
      if (state && state.site) for (const b of state.buildings) if (b.x != null && DYNAMIC[Engine.B[b.id].arch]) items.push({ y: b.y, b });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) {
        if (it.p) drawPerson(it.p);
        else ARCH[Engine.B[it.b.id].arch](ctx, it.b.x, it.b.y, t, state);
      }
      for (const sm of smoke) ell(ctx, sm.x, sm.y, sm.r, sm.r, `rgba(90,90,95,${sm.a})`);
      drawTroops(t);
      drawBoats(t);
      if (light < 1) {
        const dark = 1 - light;
        ctx.fillStyle = `rgba(12, 20, 55, ${dark * 0.62})`;
        ctx.fillRect(-50, -50, W + 100, H + 100);
        // les maisons s'éclairent
        if (state && state.site) for (const b of state.buildings) {
          if (b.x == null) continue;
          const g = ctx.createRadialGradient(b.x, b.y - 8, 0, b.x, b.y - 8, 16);
          g.addColorStop(0, `rgba(255, 210, 120, ${0.55 * dark})`); g.addColorStop(1, 'rgba(255, 210, 120, 0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y - 8, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255, 225, 140, ${0.9 * dark})`; ctx.fillRect(b.x - 2, b.y - 9, 2.5, 2.5); ctx.fillRect(b.x + 3, b.y - 9, 2.5, 2.5);
        }
        // quelques étoiles sur les montagnes
        for (let i = 0; i < 40; i++) {
          const sx = (i * 197) % W, sy = (i * 113) % 260 + (i % 2 ? 0 : 820);
          const tw = 0.5 + 0.5 * Math.sin(t * 0.003 + i);
          ctx.fillStyle = `rgba(255,255,255,${dark * 0.8 * tw})`; ctx.fillRect(sx, sy, 1.6, 1.6);
        }
      }
      drawFlag(t);
      drawMarkers(t);
      // nuages qui passent
      for (let i = 0; i < 4; i++) {
        const cx = ((t * 0.006 + i * 260) % (W + 300)) - 150, cy = 120 + i * 260;
        for (const [dx, dy, r] of [[0, 0, 34], [30, 6, 28], [-28, 8, 24], [12, -14, 26]]) ell(ctx, cx + dx, cy + dy, r, r * 0.8, 'rgba(255,255,255,.55)');
      }
      requestAnimationFrame(frame);
    }

    /* --- glisser / zoomer --- */
    const pointers = new Map();
    let pinch0 = null;
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    canvas.addEventListener('pointerup', (e) => { pointers.delete(e.pointerId); pinch0 = null; });
    canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); pinch0 = null; });
    canvas.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dpr = canvas.width / canvas.clientWidth;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        const s = baseScale() * cam.z;
        cam.x -= (e.clientX - prev.x) * dpr / s; cam.y -= (e.clientY - prev.y) * dpr / s;
        cam.tx = cam.x; cam.ty = cam.y; cam.manual = true;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) { cam.z = cam.tz = Math.max(0.6, Math.min(4, cam.z * d / pinch0)); cam.manual = true; }
        pinch0 = d;
      }
      onManual && onManual();
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      cam.z = cam.tz = Math.max(0.6, Math.min(4, cam.z * (e.deltaY < 0 ? 1.12 : 0.89)));
      cam.manual = true; onManual && onManual();
    }, { passive: false });
    let onManual = null;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    }
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);

    return {
      setState, place, syncPeople,
      redraw() { dirty = true; },
      showMarkers(on) { markers = on; },
      focus(x, y, z) { cam.manual = false; cam.tx = x; cam.ty = y; cam.tz = z; },
      overview(instant) { cam.manual = false; cam.tx = VX; cam.ty = VY; cam.tz = overviewZ(); if (instant) { cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; } },
      recenter() { cam.manual = false; autoCamera(); },
      onManual(fn) { onManual = fn; },
      setFlag(img) { flagImg = img; },
      setLight(v, isNight) {
        light = v;
        if (isNight !== night) {
          night = isNight;
          for (const p of people) { p.path = []; goTo(p, night && p.home ? p.home() : p.pick()); p.wait = Math.random() * 600; }
        }
      },
      SITES,
    };
  }

  root.ValleyMap = { create, SITES, W, H, CROSSINGS };
})(window);
