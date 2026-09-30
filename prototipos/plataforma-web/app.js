/* Compartido: íconos inline, shell (sidebar + barra superior), formato es-AR, gráficos SVG y altura para la galería.
   Todas las cifras salen de data.js (window.B), que genera exportar_datos.py. */
(function () {
  const B = window.B;
  // Nombres de alternativas con el signo tipográfico: «(<= 149)» → «(≤ 149)».
  (function fix(o) { for (const k in o) { if (typeof o[k] === 'string') o[k] = o[k].replace(/<= /g, '≤ '); else if (o[k] && typeof o[k] === 'object') fix(o[k]); } })(B);
  const QS = new URLSearchParams(location.search);

  // ---------- Íconos (trazos de lucide, 24×24) ----------
  const P = {
    panel: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    hoja: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17V9M13 17V5M18 17v-3"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    calcheck: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/>',
    up: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    dn: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    off: '<path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"/>',
    flask: '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>',
    pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  };
  const I = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- Formato es-AR ----------
  const num = n => n == null ? '—' : Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (x, d = 2) => x == null ? '—' : Number(x).toFixed(d).replace('.', ',');
  const pct = (x, d = 1) => x == null ? '—' : dec(100 * x, d) + ' %';
  const rng = (r, d = 1) => r ? `${dec(100 * r[0], d)}–${dec(100 * r[1], d)} %` : 'sin resultados';
  const rngx = (r, d = 2) => r ? `${dec(r[0], d)}–${dec(r[1], d)}` : '—';
  const V = B.meta.tramo_validacion;
  const tramoV = `validación ${V[0]}–${V[1]}`;
  const Q = (tramo = tramoV, n = B.meta.n_validacion, unidad = 'VIN') =>
    `entre auditados con actividad QLS, ${tramo}, base ficticia, n = ${num(n)} ${unidad}`.trim();
  const Qs = (...x) => { const t = Q(...x); return t.charAt(0).toUpperCase() + t.slice(1); };
  const lect = l => ({
    mejora: `<span class="tag ok">${I('check')}mejora</span>`,
    inconcluso: `<span class="tag gray">${I('info')}inconcluso</span>`,
    peor: `<span class="tag bad">${I('dn')}peor</span>`,
  }[l] || `<span class="tag gray">${l}</span>`);
  const pend = (t = 'pendiente de la sesión conjunta') => `<span class="tag pend">${I('lock')}${t}</span>`;
  const prop = (t = 'propuesta') => `<span class="tag prop">${t}</span>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Shell ----------
  const NAV = [
    ['Operación diaria', [['inicio', 'd-inicio.html', 'Panel del día', 'panel'], ['hoja', 'd-hoja.html', 'Hoja de códigos', 'hoja'], ['ronda', 'd-ronda.html', 'Ronda en la playa', 'pin']]],
    ['Códigos y mercado', [['codigos', 'd-codigos.html', 'Códigos programados', 'grid'], ['codigo', 'd-codigo.html', 'Detalle de código', 'search'], ['alertas', 'd-alertas.html', 'Alertas de cambio', 'bell']]],
    ['Evidencia del modelo', [['evaluacion', 'd-evaluacion.html', 'Evaluación', 'chart'], ['exploracion', 'd-exploracion.html', 'Exploración', 'compass'], ['datos', 'd-datos.html', 'Datos y prueba final', 'db']]],
    ['Implementación', [['control', 'd-control.html', 'Días de control', 'calcheck'], ['config', 'd-config.html', 'Configuración', 'sliders']]],
  ];
  function alertasConocidas() {
    return B.detector.alertas.filter(a => a.conocida <= B.meta.dia);
  }
  function shell() {
    const b = document.body;
    const active = b.dataset.active;
    const page = document.getElementById('page');
    const act = document.getElementById('act');
    const nActivas = QS.get('estado') === 'sin-alertas' ? 0 : alertasConocidas().length;
    const grupo = (NAV.find(([, items]) => items.some(([id]) => id === active)) || [''])[0];
    const side = `<aside class="side">
      <div class="brand"><div class="ey">Ford Innovation Challenge III</div><b>FordwardAI</b><span>Calidad predictiva</span><i></i></div>
      ${NAV.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([id, href, label, ic]) =>
        `<a class="it ${id === active ? 'on' : ''}" href="${href}">${I(ic)}<span>${label}</span>${id === 'alertas' && nActivas ? `<span class="cnt">${nActivas}</span>` : ''}</a>`).join('')).join('')}
      <div class="foot"><div class="who"><div class="av">EA</div><div><div>Equipo de analistas</div><div class="xs" style="color:var(--text-grey)">rol: selección en la playa</div></div></div>
      Prototipo de pantallas · sin conexión a QLS</div>
    </aside>`;
    const top = `<header class="top">
      <span class="ey">FordwardAI · Calidad predictiva</span><span class="tag prop">propuesta de plataforma</span>
      <div class="sp"></div>
      <div class="daysel" data-tip="En el prototipo solo el Día ${B.meta.dia} tiene hoja armada. Los resultados que usa son de Día ≤ ${B.meta.dia - B.meta.margen}.">${I('cal')}<span class="muted">Día del VIN</span><b>${B.meta.dia}</b>${I('chev')}</div>
      <span class="pill q" data-tip="${esc(Q())}">${I('info')}${esc(Q())}</span>
      <span class="pill badge-ficticia">${I('alert')}Base ficticia</span>
    </header>`;
    const phd = `<div class="phd"><div><div class="ey">${grupo}</div><h1>${b.dataset.title || ''}</h1><div class="sub">${b.dataset.sub || ''}</div></div><div class="sp"></div><div class="act-slot"></div></div>`;
    const wrap = document.createElement('div');
    wrap.className = 'app';
    wrap.innerHTML = side + `<div class="main">${top}<main class="content">${phd}</main></div>`;
    const main = wrap.querySelector('.content');
    if (page) main.appendChild(page);
    if (act) { act.classList.add('act'); wrap.querySelector('.act-slot').replaceWith(act); }
    b.prepend(wrap);
  }

  // ---------- Tooltips ----------
  function tips() {
    const t = document.createElement('div');
    t.className = 'tip';
    document.body.appendChild(t);
    document.addEventListener('mousemove', e => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) { t.style.display = 'none'; return; }
      t.innerHTML = el.getAttribute('data-tip');
      t.style.display = 'block';
      const x = Math.min(e.clientX + 14, innerWidth - t.offsetWidth - 8);
      t.style.left = x + 'px';
      t.style.top = (e.clientY + 16) + 'px';
    });
  }

  // ---------- Gráficos SVG ----------
  // Escala lineal.
  const sc = (d0, d1, r0, r1) => v => r0 + (v - d0) * (r1 - r0) / (d1 - d0);
  // Serie temporal con banda: series [{pts:[{x,y,lo,hi,tip}], color, band, dash, label, dots}]
  function lineChart(o) {
    const W = o.w || 760, H = o.h || 240, m = Object.assign({ l: 44, r: 16, t: 12, b: 28 }, o.m || {});
    const X = sc(o.x0, o.x1, m.l, W - m.r), Y = sc(o.y0 || 0, o.y1, H - m.b, m.t);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">`;
    s += '<g class="grid ax">';
    (o.yt || []).forEach(v => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 6}" y="${Y(v) + 3.5}" text-anchor="end">${o.yf ? o.yf(v) : v}</text>`; });
    (o.xt || []).forEach(v => { s += `<text x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${o.xf ? o.xf(v) : v}</text>`; });
    s += '</g>';
    const ends = [];
    (o.shade || []).forEach(z => { s += `<rect x="${X(z.a)}" y="${m.t}" width="${X(z.b) - X(z.a)}" height="${H - m.b - m.t}" fill="${z.fill || '#f1f3f6'}"/>${z.label ? `<text x="${X(z.a) + 6}" y="${m.t + 12}" style="font-size:14px;fill:var(--muted)">${z.label}</text>` : ''}`; });
    (o.series || []).forEach(se => {
      const pts = se.pts.filter(p => p.y != null);
      if (se.band) {
        const bp = pts.filter(p => p.lo != null);
        if (bp.length) s += `<path d="M${bp.map(p => `${X(p.x)},${Y(p.hi)}`).join('L')}L${bp.slice().reverse().map(p => `${X(p.x)},${Y(p.lo)}`).join('L')}Z" fill="${se.band}" opacity=".9"/>`;
      }
      if (se.step) {
        s += `<path d="${pts.map((p, i) => (i ? `L${X(p.x)},${Y(pts[i - 1].y)}L` : 'M') + `${X(p.x)},${Y(p.y)}`).join('')}" fill="none" stroke="${se.color}" stroke-width="${se.sw || 2}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''}/>`;
      } else {
        s += `<path d="M${pts.map(p => `${X(p.x)},${Y(p.y)}`).join('L')}" fill="none" stroke="${se.color}" stroke-width="${se.sw || 2}" stroke-linejoin="round" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''}/>`;
      }
      if (se.dots) pts.forEach(p => { s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${se.r || 3.5}" fill="${se.color}" stroke="#fff" stroke-width="1.5"/>`; });
      if (se.tipPts) pts.forEach(p => { s += `<rect x="${X(p.x) - 7}" y="${m.t}" width="14" height="${H - m.b - m.t}" fill="transparent" data-tip="${esc(p.tip || '')}"/>`; });
      if (se.label && pts.length) { const p = pts[pts.length - 1]; ends.push({ x: X(p.x) + 6, y: Y(p.y) + 4, t: se.label }); }
    });
    ends.sort((a, b) => a.y - b.y).forEach((e, i) => { if (i && e.y - ends[i - 1].y < 16) e.y = ends[i - 1].y + 16; });
    ends.forEach(e => { s += `<text x="${e.x}" y="${e.y}" style="font-weight:500">${e.t}</text>`; });
    (o.hlines || []).forEach(h => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(h.y)}" y2="${Y(h.y)}" stroke="${h.color || 'var(--ink-2)'}" stroke-width="${h.sw || 1.5}" ${h.dash ? `stroke-dasharray="${h.dash}"` : ''}/>${h.label ? `<text x="${h.left ? m.l + 6 : W - m.r - 4}" y="${Y(h.y) - 5}" text-anchor="${h.left ? 'start' : 'end'}" style="font-size:14px">${h.label}</text>` : ''}`; });
    (o.vlines || []).forEach(v => { s += `<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${m.t}" y2="${H - m.b}" stroke="${v.color || 'var(--ink)'}" stroke-width="1.5" ${v.dash ? `stroke-dasharray="${v.dash}"` : ''}/>${v.label ? `<text x="${X(v.x) + (v.anchor === 'end' ? -5 : 5)}" y="${m.t + (v.dy || 24)}" text-anchor="${v.anchor || 'start'}" style="font-size:14px;font-weight:500;fill:var(--ink)">${v.label}</text>` : ''}`; });
    (o.marks || []).forEach(k => { s += `<g data-tip="${esc(k.tip || '')}"><circle cx="${X(k.x)}" cy="${Y(k.y)}" r="${k.r || 6}" fill="${k.fill || '#fff'}" stroke="${k.color || 'var(--bad)'}" stroke-width="2"/>${k.label ? `<text x="${X(k.x)}" y="${Y(k.y) - 10}" text-anchor="middle" style="font-size:14px;font-weight:500;fill:var(--ink)">${k.label}</text>` : ''}</g>`; });
    return s + '</svg>';
  }

  // Filas punto + rango (comparación de alternativas).
  function dotRows(o) {
    const W = o.w || 760, rowH = o.rowH || 22, m = Object.assign({ l: 300, r: 120, t: 26, b: 30 }, o.m || {});
    const rows = o.rows, H = m.t + rows.length * rowH + m.b;
    const X = sc(o.x0, o.x1, m.l, W - m.r);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}"><g class="grid ax">`;
    (o.xt || []).forEach(v => { s += `<line x1="${X(v)}" x2="${X(v)}" y1="${m.t - 6}" y2="${H - m.b}"/><text x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${o.xf ? o.xf(v) : v}</text>`; });
    s += '</g>';
    (o.vlines || []).forEach(v => { s += `<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${m.t - 10}" y2="${H - m.b}" stroke="${v.color || 'var(--ink)'}" stroke-width="1.5" ${v.dash ? `stroke-dasharray="${v.dash}"` : ''}/><text x="${X(v.x) + 5}" y="${m.t - 12}" style="font-size:14px;font-weight:500;fill:var(--ink)">${v.label}</text>`; });
    rows.forEach((r, i) => {
      const y = m.t + i * rowH + rowH / 2;
      if (r.head) { s += `<text x="${m.l - 10}" y="${y + 4}" text-anchor="end" style="font-weight:500;fill:var(--ink)">${esc(r.label)}</text>`; return; }
      const c = r.color || 'var(--ref)';
      s += `<g data-tip="${esc(r.tip || '')}"><rect x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}" fill="${r.bg || 'transparent'}"/>`;
      s += `<text x="${m.l - 10}" y="${y + 4}" text-anchor="end" style="${r.bold ? 'font-weight:500;fill:var(--ink)' : ''}">${esc(r.label)}</text>`;
      s += `<line x1="${X(r.lo)}" x2="${X(r.hi)}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="${r.bold ? 3 : 2.2}" stroke-linecap="round" opacity="${r.bold ? 1 : .75}"/>`;
      s += r.diamond ? `<rect x="${X(r.v) - 5}" y="${y - 5}" width="10" height="10" transform="rotate(45 ${X(r.v)} ${y})" fill="#fff" stroke="var(--ink-2)" stroke-width="2"/>`
        : `<circle cx="${X(r.v)}" cy="${y}" r="${r.bold ? 5.5 : 4.2}" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
      s += `<text x="${W - m.r + 10}" y="${y + 4}" style="${r.bold ? 'font-weight:500;fill:var(--ink)' : 'fill:var(--muted)'}">${esc(r.note || '')}</text></g>`;
    });
    return s + '</svg>';
  }

  // Barras horizontales simples (χ² por agrupación, tasa por mercado).
  function hbars(o) {
    const W = o.w || 420, rowH = o.rowH || 26, m = Object.assign({ l: 130, r: 70, t: 6, b: 6 }, o.m || {});
    const H = m.t + o.rows.length * rowH + m.b, X = sc(0, o.max, m.l, W - m.r);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">`;
    if (o.ref != null) s += `<line x1="${X(o.ref)}" x2="${X(o.ref)}" y1="0" y2="${H}" stroke="var(--ink-2)" stroke-dasharray="3 3"/>`;
    o.rows.forEach((r, i) => {
      const y = m.t + i * rowH;
      s += `<g data-tip="${esc(r.tip || '')}"><text x="${m.l - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" style="${r.bold ? 'font-weight:500;fill:var(--ink)' : ''}">${esc(r.label)}</text>`;
      if (r.lo != null) s += `<line x1="${X(r.lo)}" x2="${X(r.hi)}" y1="${y + rowH / 2}" y2="${y + rowH / 2}" stroke="var(--ink-2)" stroke-width="1.2"/>`;
      s += `<rect x="${m.l}" y="${y + 6}" width="${Math.max(2, X(r.v) - m.l)}" height="${rowH - 12}" rx="4" fill="${r.color || 'var(--accent)'}" opacity="${r.lo != null ? .75 : 1}"/>`;
      s += `<text x="${X(Math.max(r.v, r.hi || 0)) + 6}" y="${y + rowH / 2 + 4}">${esc(r.text)}</text></g>`;
    });
    return s + '</svg>';
  }

  // ---------- Altura para la galería ----------
  function report() {
    const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    try { parent.postMessage({ collageH: h, src: location.pathname.split('/').pop() + location.search }, '*'); } catch (e) { /* sin galería */ }
  }

  window.UI = { B, QS, I, num, dec, pct, rng, rngx, Q, Qs, tramoV, lect, pend, prop, esc, lineChart, dotRows, hbars, alertasConocidas };
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.render === 'function') window.render(window.UI);
    if (document.body.dataset.role === 'desk') shell();
    tips();
    report();
    addEventListener('load', report);
    setTimeout(report, 400);
  });
})();
