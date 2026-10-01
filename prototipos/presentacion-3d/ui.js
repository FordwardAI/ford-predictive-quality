// Render de pantallas, pasos, índice y pie.
// Consume `contenido.js` (meta, secciones, capitulos) y el Map de `cifras.js`.
// Todo el texto entra por textContent: el contenido es dato, nunca HTML.
//
// Pasos: cada pantalla tiene una cabecera (antetítulo, titular, bajada) que
// entra siempre, y una lista de pasos (`sec._pasos`) que se revelan con
// opacidad y transform (nunca `display`): cifras, callouts, figura, tarjetas y
// lista, en ese orden. Los elementos están siempre en el DOM.

const PENDIENTE_RE = /\[PENDIENTE[^\]]*\]/g;
const SECCIONES_ESPECIALES = { portada: 'Portada', cierre: 'Cierre' };
const HEREDADOS = ['seccion', 'subseccion', 'escena', 'nucleo', 'orbita', 'antetitulo', 'titulo', 'acento', 'notas', 'lado', 'diapositiva'];

let formatear = null; // de cifras.js, para el conteo animado

// Cuenta todos los marcadores del contenido (incluye notas y figuras locales)
// y las cifras usadas que están pendientes.
export function contarPendientes({ meta, capitulos, cifras }) {
  const texto = JSON.stringify({ meta, capitulos });
  let n = (texto.match(PENDIENTE_RE) ?? []).length;
  const claves = new Set(capitulos.flatMap((c) => c.cifras ?? []));
  for (const clave of claves) {
    const c = cifras?.get?.(clave);
    if (c && (c.pendiente === true || esPendiente(c.valor))) n += 1;
  }
  return n;
}

export function esPendiente(texto) {
  return typeof texto === 'string' && new RegExp(PENDIENTE_RE.source).test(texto);
}

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto != null) el.append(textoRico(texto));
  return el;
}

function chipPendiente(marca) {
  const interior = marca.replace(/^\[PENDIENTE:?\s*/, '').replace(/\]$/, '').trim();
  const chip = document.createElement('span');
  chip.className = 'pendiente';
  chip.textContent = interior ? `Pendiente: ${interior}` : 'Pendiente';
  chip.title = chip.textContent;
  return chip;
}

// Texto plano con los marcadores [PENDIENTE: …] convertidos en chips.
export function textoRico(texto) {
  const frag = document.createDocumentFragment();
  const cadena = String(texto ?? '');
  let ultimo = 0;
  for (const m of cadena.matchAll(PENDIENTE_RE)) {
    if (m.index > ultimo) frag.append(cadena.slice(ultimo, m.index));
    frag.append(chipPendiente(m[0]));
    ultimo = m.index + m[0].length;
  }
  if (ultimo < cadena.length) frag.append(cadena.slice(ultimo));
  return frag;
}

export function tituloSeccion(numero, secciones) {
  if (SECCIONES_ESPECIALES[numero]) return SECCIONES_ESPECIALES[numero];
  return secciones.find((s) => s.numero === numero)?.titulo ?? '';
}

export function textoTitular(cap) {
  return `${cap.titulo ?? ''}${cap.acento ?? ''}`.replace(PENDIENTE_RE, '').replace(/\s+/g, ' ').trim();
}

// ---------- Pantallas de continuación y numeración ----------
// Resuelve `continuacion`: hereda del padre lo que la pantalla no define.
export function normalizarCapitulos(todos) {
  const porId = new Map(todos.map((c) => [c.id, c]));
  return todos.map((c) => {
    if (!c.continuacion) return c;
    const padre = porId.get(c.continuacion);
    if (!padre) {
      console.warn(`[presentacion] «${c.id}» continúa a «${c.continuacion}», que no existe`);
      return c;
    }
    const heredado = {};
    for (const k of HEREDADOS) if (c[k] === undefined && padre[k] !== undefined) heredado[k] = padre[k];
    return { ...heredado, ...c, padre: padre.id };
  });
}

// Número visible: «09» para las pantallas principales, «09b» para sus continuaciones.
export function numerarCapitulos(capitulos) {
  let n = -1;
  const letras = new Map();
  for (const c of capitulos) {
    if (c.padre && capitulos.some((p) => p.id === c.padre)) {
      const k = (letras.get(c.padre) ?? 0) + 1;
      letras.set(c.padre, k);
      const padre = capitulos.find((p) => p.id === c.padre);
      c.numeroPantalla = `${padre.numeroPantalla}${String.fromCharCode(97 + k)}`;
    } else {
      n += 1;
      c.numeroPantalla = String(n).padStart(2, '0');
    }
  }
  return String(Math.max(n, 0)).padStart(2, '0');
}

// Lado del texto: `cap.lado` si viene; si no, las secciones pares van a la derecha.
function ladoDe(cap, secciones) {
  if (cap.lado === 'derecha' || cap.lado === 'izquierda') return cap.lado;
  if (SECCIONES_ESPECIALES[cap.seccion]) return 'izquierda';
  const i = secciones.findIndex((s) => s.numero === cap.seccion);
  return i >= 0 && i % 2 === 1 ? 'derecha' : 'izquierda';
}

// ---------- Titular dividido en líneas ----------
const segmentosTitular = new WeakMap();

function segmentosDe(cap) {
  const segs = [];
  const agregar = (texto, acento) => {
    const cadena = String(texto ?? '');
    let ultimo = 0;
    for (const m of cadena.matchAll(PENDIENTE_RE)) {
      if (m.index > ultimo) segs.push({ texto: cadena.slice(ultimo, m.index), acento });
      segs.push({ pendiente: m[0] });
      ultimo = m.index + m[0].length;
    }
    if (ultimo < cadena.length) segs.push({ texto: cadena.slice(ultimo), acento });
  };
  agregar(cap.titulo, false);
  agregar(cap.acento, true);
  return segs;
}

// Palabras como spans medibles (sin líneas todavía).
function pintarPalabras(h) {
  h.textContent = '';
  const palabras = [];
  for (const seg of segmentosTitular.get(h)) {
    if (seg.pendiente) {
      const chip = chipPendiente(seg.pendiente);
      palabras.push({ el: chip, acento: false });
      h.append(chip, ' ');
      continue;
    }
    for (const parte of seg.texto.split(/(\s+)/)) {
      if (!parte) continue;
      if (/^\s+$/.test(parte)) { h.append(' '); continue; }
      const span = document.createElement('span');
      span.className = seg.acento ? 'palabra acento' : 'palabra';
      span.textContent = parte;
      palabras.push({ el: span, acento: seg.acento });
      h.append(span);
    }
  }
  return palabras;
}

export function dividirLineas(h) {
  if (!h || !segmentosTitular.has(h)) return;
  const palabras = pintarPalabras(h);
  const lineas = [];
  let top = null;
  for (const p of palabras) {
    const y = p.el.offsetTop;
    if (top === null || Math.abs(y - top) > 4) { lineas.push([]); top = y; }
    lineas.at(-1).push(p.el);
  }
  h.textContent = '';
  for (const grupo of lineas) {
    const linea = document.createElement('span');
    linea.className = 'linea';
    const interior = document.createElement('span');
    interior.className = 'linea-interior';
    grupo.forEach((el, i) => { if (i) interior.append(' '); interior.append(el); });
    linea.append(interior);
    h.append(linea);
  }
}

function crearTitular(cap, nivel, clase = 'titular') {
  const h = document.createElement(nivel);
  h.className = clase;
  h.id = `titular-${cap.id}`;
  h.setAttribute('aria-label', textoTitular(cap));
  segmentosTitular.set(h, segmentosDe(cap));
  // Primer render: texto legible aunque no se llegue a dividir en líneas.
  for (const seg of segmentosTitular.get(h)) {
    if (seg.pendiente) h.append(chipPendiente(seg.pendiente), ' ');
    else if (seg.acento) h.append(crear('span', 'acento', seg.texto));
    else h.append(seg.texto);
  }
  return h;
}

// ---------- Cifras ----------
function leyendaDe(c) {
  return [c?.leyenda, c?.respaldo ? 'valor de respaldo' : null].filter(Boolean).join(' · ');
}

function crearCifra(clave, cifras, { sinLeyenda = false } = {}) {
  const li = document.createElement('li');
  li.className = 'cifra';
  li.dataset.clave = clave;
  const c = cifras?.get?.(clave);
  if (!c) {
    console.warn(`[presentacion] cifra sin clave en cifras.js: «${clave}»`);
    li.classList.add('cifra-faltante');
    li.append(crear('span', 'cifra-valor', '—'), crear('span', 'cifra-leyenda', `Falta la cifra «${clave}».`));
    return li;
  }
  const valorPendiente = c.pendiente === true || esPendiente(c.valor) || c.valor === '[PENDIENTE]';
  if (valorPendiente) li.classList.add('cifra-pendiente');
  const valor = crear('span', 'cifra-valor');
  if (valorPendiente && !esPendiente(c.valor)) valor.append(chipPendiente(`[PENDIENTE: ${clave}]`));
  else valor.append(textoRico(c.valor));
  li.append(valor);
  if (!valorPendiente && typeof c.numero === 'number' && c.numero !== 0 && c.formato) {
    li.dataset.numero = String(c.numero);
    li.dataset.formato = c.formato;
    li.dataset.final = c.valor;
  }
  if (c.etiqueta) li.append(crear('span', 'cifra-etiqueta', c.etiqueta));
  const leyenda = leyendaDe(c);
  if (leyenda && !sinLeyenda) li.append(crear('span', 'cifra-leyenda', leyenda));
  if (c.fuente) li.title = `Fuente: ${c.fuente}`;
  return li;
}

// Conteo de 0 al valor con el mismo formato de cifras.js; termina en el texto exacto.
function contar(li, { instantaneo } = {}) {
  const gsap = window.gsap;
  const valor = li.querySelector('.cifra-valor');
  const final = li.dataset.final;
  const n = Number(li.dataset.numero);
  if (!valor || final == null) return;
  gsap?.killTweensOf(li._conteo ?? {});
  if (instantaneo || !gsap || !formatear || !Number.isFinite(n)) { valor.textContent = final; return; }
  const proxy = { x: 0 };
  li._conteo = proxy;
  try { valor.textContent = formatear(li.dataset.formato, 0); } catch { valor.textContent = final; return; }
  gsap.to(proxy, {
    x: n, duration: 1.1, ease: 'power2.out',
    onUpdate: () => { valor.textContent = formatear(li.dataset.formato, proxy.x); },
    onComplete: () => { valor.textContent = final; },
  });
}

// Deja todas las cifras en su valor final (antes de imprimir).
export function terminarConteos(raiz = document) {
  raiz.querySelectorAll('.cifra[data-final]').forEach((li) => contar(li, { instantaneo: true }));
}

// ---------- Callouts (puntos de la escena) ----------
function crearCallouts(cap, alTocarCallout) {
  const ol = crear('ol', 'callouts');
  if (cap.puntos.length >= 5) ol.classList.add('callouts-muchos');
  ol.setAttribute('aria-label', 'Recorrido');
  cap.puntos.forEach((p, i) => {
    const li = crear('li', 'callout');
    li.dataset.punto = p.id;
    const b = crear('button', 'callout-boton');
    b.type = 'button';
    b.append(crear('span', 'callout-numero', String(i + 1)), crear('span', 'callout-titulo', p.titulo ?? p.id));
    b.addEventListener('click', () => alTocarCallout?.(cap.id, p.id));
    li.append(b);
    if (p.texto) li.append(crear('p', 'callout-texto', p.texto));
    ol.append(li);
  });
  return ol;
}

// ---------- Tarjetas ----------
function crearTarjetas(detalle, nivel = 'h3') {
  const ul = crear('ul', 'tarjetas');
  for (const d of detalle) {
    const li = crear('li', 'tarjeta');
    if ((d.texto ?? '').length > 300) li.classList.add('tarjeta-larga');
    li.append(crear(nivel, 'tarjeta-titulo', d.titulo), crear('p', 'tarjeta-texto', d.texto));
    ul.append(li);
  }
  return ul;
}

function crearLista(items) {
  const ol = crear('ol', 'lista-pasos');
  items.forEach((t, i) => {
    const li = crear('li', 'lista-paso');
    li.append(crear('span', 'lista-numero', String(i + 1)), crear('span', 'lista-texto', t));
    ol.append(li);
  });
  return ol;
}

// ---------- Figuras ----------
function esIlustracion(src) {
  return typeof src === 'string' && /^assets\/ilustraciones\/[\w.-]+\.svg$/.test(src);
}

// Inserta un SVG propio (versionado) en línea, para que tome las variables CSS
// del tema. Se quitan scripts y atributos on* por las dudas.
async function svgEnLinea(src) {
  const r = await fetch(src);
  if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`);
  const doc = new DOMParser().parseFromString(await r.text(), 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) throw new Error(`${src}: SVG inválido`);
  svg.querySelectorAll('script, foreignObject').forEach((n) => n.remove());
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const a of [...el.attributes]) if (/^on/i.test(a.name) || /javascript:/i.test(a.value)) el.removeAttribute(a.name);
  }
  svg.classList.add('figura-svg');
  svg.setAttribute('role', 'img');
  return document.importNode(svg, true);
}

// Sin loading="lazy": la imagen se inserta recién cuando cargó, y una imagen
// diferida fuera del documento no carga nunca.
function cargarImagen(src, alt) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.alt = alt ?? '';
    img.decoding = 'async';
    img.addEventListener('load', () => ok(img), { once: true });
    img.addEventListener('error', () => mal(new Error(`no se pudo cargar ${src}`)), { once: true });
    img.src = src;
  });
}

// Llena `marco` con la primera fuente que cargue. Devuelve true si cargó alguna.
async function llenarMarco(marco, fuentes, alt) {
  for (const src of fuentes.filter(Boolean)) {
    try {
      if (esIlustracion(src)) {
        const svg = await svgEnLinea(src);
        if (alt) svg.setAttribute('aria-label', alt);
        marco.replaceChildren(svg);
        marco.dataset.tipo = 'ilustracion';
      } else {
        const img = await cargarImagen(src, alt);
        marco.replaceChildren(img);
        marco.dataset.tipo = /\.svg$/i.test(src) && src.includes('docs/entrega/figuras') ? 'lamina' : 'imagen';
      }
      return true;
    } catch (err) {
      console.info(`[presentacion] figura: ${err.message}`);
    }
  }
  return false;
}

function crearFigura(cap, { datos, figuras }) {
  const f = cap.figura;
  if (!f) return null;
  const fig = crear('figure', 'capitulo-figura');
  const marco = crear('div', 'figura-marco');
  fig.append(marco);

  if (f.tipo === 'js') {
    let svg = null;
    try { svg = figuras?.crear?.(f.id, { datos, opciones: f.opciones ?? {} }) ?? null; } catch (err) {
      console.warn(`[presentacion] figuras.js no pudo dibujar «${f.id}»`, err);
    }
    if (svg instanceof Element) {
      svg.classList?.add('figura-svg');
      const vb = svg.viewBox?.baseVal;
      if (vb?.width && vb.height > vb.width) fig.classList.add('figura-alta');
      if (f.alt && !svg.getAttribute('aria-label')) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', f.alt); }
      marco.append(svg);
      marco.dataset.tipo = 'js';
    } else if (f.src) {
      llenarMarco(marco, [f.src], f.alt);
    } else {
      return null; // sin figura nueva ni respaldo: la pantalla queda sin figura
    }
  } else if (f.tipo === 'local') {
    const candidatos = Array.isArray(f.src) ? f.src : [f.src];
    llenarMarco(marco, candidatos, f.alt).then(async (local) => {
      if (local) { fig.classList.add('figura-local'); return; }
      await llenarMarco(marco, [f.respaldo], f.alt);
      if (f.pendiente) {
        const chip = chipPendiente(f.pendiente);
        chip.classList.add('figura-chip');
        chip.textContent = 'Captura local pendiente';
        fig.append(chip);
      }
    });
  } else if (f.src) {
    llenarMarco(marco, [f.src, f.respaldo], f.alt).then((ok) => {
      if (!ok) console.warn(`[presentacion] no se pudo cargar la figura ${f.src}`);
    });
  } else {
    return null;
  }
  if (f.pie) fig.append(crear('figcaption', null, f.pie));
  return fig;
}

// ---------- Pantallas ----------
export function renderizarCapitulos({ main, meta = {}, secciones = [], capitulos = [], cifras, datos, figuras, formatearCifra, alTocarCallout }) {
  formatear = formatearCifra ?? null;
  main.textContent = '';
  const elementos = capitulos.map((cap, indice) => {
    const especial = SECCIONES_ESPECIALES[cap.seccion] ? cap.seccion : null;
    const sec = document.createElement('section');
    sec.className = 'capitulo';
    if (especial) sec.classList.add(`capitulo-${especial}`);
    if (cap.padre) sec.classList.add('es-continuacion');
    if (ladoDe(cap, secciones) === 'derecha') sec.classList.add('lado-derecha');
    sec.id = cap.id;
    sec.tabIndex = -1;
    sec.dataset.indice = String(indice);
    sec.setAttribute('aria-labelledby', `titular-${cap.id}`);

    const texto = crear('div', 'capitulo-texto');
    const lado = crear('div', 'capitulo-lado');

    if (especial === 'portada') {
      const lista = crear('ul', 'portada-meta');
      lista.dataset.anim = '';
      for (const dato of [meta.evento, meta.fecha]) if (dato && dato !== cap.antetitulo) lista.append(crear('li', null, dato));
      if (lista.childElementCount) texto.append(lista);
    }

    if (cap.antetitulo) {
      const ante = crear('p', 'antetitulo');
      ante.dataset.anim = '';
      if (!especial && cap.seccion) ante.append(crear('span', 'antetitulo-numero', cap.seccion), ' ');
      ante.append(textoRico(cap.antetitulo));
      if (cap.padre) ante.append(crear('span', 'antetitulo-continua', 'continúa'));
      texto.append(ante);
    }

    texto.append(crearTitular(cap, indice === 0 ? 'h1' : 'h2', cap.padre ? 'titular titular-continuacion' : 'titular'));

    if (cap.bajada) {
      const bajada = crear('p', 'bajada', cap.bajada);
      bajada.dataset.anim = '';
      texto.append(bajada);
    }
    if (cap.subtitulo) {
      const sub = crear('h3', 'subtitulo', cap.subtitulo);
      sub.dataset.anim = '';
      texto.append(sub);
    }

    if (cap.cifras?.length) {
      const ul = crear('ul', 'cifras');
      if (cap.cifras.length >= 4) ul.classList.add('cifras-muchas');
      ul.setAttribute('aria-label', 'Cifras');
      // Si todas las cifras comparten la leyenda (mismo tramo y n), va una sola vez debajo.
      const leyendas = new Set(cap.cifras.map((k) => leyendaDe(cifras?.get?.(k))));
      const compartida = cap.cifras.length > 1 && leyendas.size === 1 ? [...leyendas][0] : '';
      for (const clave of cap.cifras) ul.append(crearCifra(clave, cifras, { sinLeyenda: Boolean(compartida) }));
      texto.append(ul);
      if (compartida) {
        const p = crear('p', 'cifras-leyenda', compartida);
        ul.lastElementChild._leyenda = p; // se revela con la última cifra
        texto.append(p);
      }
    }

    if (cap.puntos?.length) texto.append(crearCallouts(cap, alTocarCallout));

    const figura = crearFigura(cap, { datos, figuras });
    if (figura) { lado.append(figura); sec.classList.add('con-figura'); }

    if (cap.detalle?.length) {
      const enEscena = cap.disposicion ? cap.disposicion === 'tarjetas-escena' : !figura;
      const ul = crearTarjetas(cap.detalle);
      if (enEscena) { lado.append(ul); sec.classList.add('tarjetas-escena'); } else texto.append(ul);
      if (cap.detalle.length >= 4 && !enEscena) ul.classList.add('tarjetas-compactas');
    }

    if (cap.lista?.length) texto.append(crearLista(cap.lista));

    if ((especial === 'portada' || especial === 'cierre') && meta.integrantes?.length && (especial === 'portada' || !capitulos.some((c) => c.seccion === 'portada'))) {
      const ul = crear('ul', 'integrantes');
      ul.dataset.anim = '';
      ul.setAttribute('aria-label', 'Equipo');
      for (const p of meta.integrantes) {
        const li = document.createElement('li');
        li.append(crear('span', 'integrante-nombre', p.nombre));
        const dato = [p.carrera, p.universidad].filter(Boolean).join(' · ');
        if (dato) li.append(crear('span', 'integrante-dato', dato));
        ul.append(li);
      }
      texto.append(ul);
    }

    sec.append(texto);
    if (lado.childElementCount) sec.append(lado);

    if (especial) {
      const pista = crear('p', 'pista');
      pista.dataset.anim = '';
      pista.setAttribute('aria-hidden', 'true');
      if (especial === 'portada') pista.append(crear('kbd', null, '→'), ' Avanzar');
      else pista.append(crear('kbd', null, 'I'), ' Índice', crear('span', 'pista-sep', '·'), crear('kbd', null, '←'), ' Volver');
      sec.append(pista);
    }

    numerarPasos(sec, cap);
    main.append(sec);
    return sec;
  });
  main.removeAttribute('aria-busy');
  return elementos;
}

// ---------- Pasos ----------
function modoDe(cap, grupo, n) {
  const m = cap.pasos?.[grupo];
  if (m === 'uno' || m === 'pares' || m === 'todos') return m;
  if (grupo === 'cifras') return n <= 3 ? 'uno' : 'todos';
  if (grupo === 'tarjetas') return n <= 4 ? 'uno' : 'pares';
  return 'uno';
}

function agrupar(elementos, modo) {
  if (modo === 'todos') return [elementos];
  const tam = modo === 'pares' ? 2 : 1;
  const grupos = [];
  for (let i = 0; i < elementos.length; i += tam) grupos.push(elementos.slice(i, i + tam));
  return grupos;
}

// Asigna `data-paso` (1…n) y guarda en `sec._pasos` la lista de pasos con su
// rótulo (para las notas) y, en los callouts, el punto de la escena.
export function numerarPasos(sec, cap) {
  const pasos = [];
  const cifras = [...sec.querySelectorAll('.cifra')];
  for (const g of agrupar(cifras, modoDe(cap, 'cifras', cifras.length))) {
    if (g.at(-1)?._leyenda) g.push(g.at(-1)._leyenda);
    const etiquetas = g.map((li) => li.querySelector?.('.cifra-etiqueta')?.textContent).filter(Boolean);
    pasos.push({ tipo: 'cifras', elementos: g, rotulo: etiquetas.length > 1 ? 'Cifras' : `Cifra: ${etiquetas[0] ?? ''}`.trim() });
  }
  const callouts = [...sec.querySelectorAll('.callout')];
  callouts.forEach((li, k) => {
    pasos.push({ tipo: 'callout', elementos: [li], punto: li.dataset.punto, indiceCallout: k, totalCallouts: callouts.length, rotulo: li.querySelector('.callout-titulo')?.textContent ?? '' });
  });
  const figura = sec.querySelector('.capitulo-figura');
  if (figura) pasos.push({ tipo: 'figura', elementos: [figura], rotulo: `Figura: ${cap.figura?.alt ?? ''}`.trim() });
  const tarjetas = [...sec.querySelectorAll('.tarjeta')];
  for (const g of agrupar(tarjetas, modoDe(cap, 'tarjetas', tarjetas.length))) {
    pasos.push({ tipo: 'tarjetas', elementos: g, rotulo: g.map((li) => li.querySelector('.tarjeta-titulo')?.textContent).join(' · ') });
  }
  for (const li of sec.querySelectorAll('.lista-paso')) {
    pasos.push({ tipo: 'lista', elementos: [li], rotulo: li.querySelector('.lista-texto')?.textContent ?? '' });
  }
  pasos.forEach((p, i) => p.elementos.forEach((el) => { el.dataset.paso = String(i + 1); el.classList.add('paso'); }));
  sec._pasos = pasos;
  sec._paso = pasos.length;
  return pasos;
}

function tween(els, visible, { instantaneo = false, retraso = 0, escalonado = 0.07 } = {}) {
  if (!els.length) return;
  const gsap = window.gsap;
  if (!gsap) {
    for (const el of els) { el.style.opacity = visible ? '' : '0'; el.style.visibility = visible ? '' : 'hidden'; }
    return;
  }
  gsap.killTweensOf(els);
  if (instantaneo) {
    gsap.set(els, visible ? { autoAlpha: 1, y: 0, clearProps: 'transform' } : { autoAlpha: 0, y: 16 });
    return;
  }
  if (visible) gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.5, delay: retraso, stagger: escalonado, ease: 'power3.out', clearProps: 'transform' });
  else gsap.to(els, { autoAlpha: 0, y: 12, duration: 0.3, ease: 'power2.in' });
}

function alRevelar(paso, { instantaneo }) {
  if (paso.tipo === 'cifras') for (const li of paso.elementos) if (li.classList.contains('cifra')) contar(li, { instantaneo });
  // Figuras de figuras.js: las filas (<g class="fila" style="--i:n">) entran escalonadas por CSS.
  if (paso.tipo === 'figura') paso.elementos[0].classList.toggle('figura-entrando', !instantaneo);
  if (paso.tipo === 'figura') requestAnimationFrame(() => paso.elementos[0].classList.add('figura-visible'));
}

// Oculta todos los pasos sin animación (estado de llegada por teclado).
export function prepararPasos(sec) {
  for (const p of sec._pasos ?? []) tween(p.elementos, false, { instantaneo: true });
  sec.querySelectorAll('.capitulo-figura').forEach((f) => f.classList.remove('figura-visible'));
  sec.querySelectorAll('.callout.activo').forEach((li) => li.classList.remove('activo'));
  sec._paso = 0;
}

export function mostrarPaso(sec, k, { instantaneo = false } = {}) {
  const paso = sec._pasos?.[k - 1];
  if (!paso) return null;
  tween(paso.elementos, true, { instantaneo });
  alRevelar(paso, { instantaneo });
  sec.querySelectorAll('.callout.activo').forEach((li) => li.classList.remove('activo'));
  if (paso.tipo === 'callout') paso.elementos[0].classList.add('activo');
  sec._paso = k;
  // Si el paso queda fuera de la pantalla (pantallas bajas), traerlo.
  const r = paso.elementos.at(-1).getBoundingClientRect();
  if (r.bottom > innerHeight - 24 || r.top < 0) {
    paso.elementos.at(-1).scrollIntoView({ block: 'nearest', behavior: instantaneo ? 'auto' : 'smooth' });
  }
  return paso;
}

export function ocultarPaso(sec, k) {
  const paso = sec._pasos?.[k - 1];
  if (!paso) return null;
  tween(paso.elementos, false);
  paso.elementos.forEach((li) => li.classList.remove('activo', 'figura-visible'));
  sec._paso = k - 1;
  const anterior = sec._pasos[k - 2];
  if (anterior?.tipo === 'callout') anterior.elementos[0].classList.add('activo');
  return anterior ?? null;
}

// Revela todos los pasos (llegada por scroll: en cascada; reducido: de una vez).
export function mostrarTodo(sec, { instantaneo = false, retraso = 0.35 } = {}) {
  const pasos = sec._pasos ?? [];
  sec.querySelectorAll('.callout.activo').forEach((li) => li.classList.remove('activo'));
  pasos.forEach((p, i) => {
    tween(p.elementos, true, { instantaneo, retraso: retraso + i * 0.12, escalonado: 0.05 });
    alRevelar(p, { instantaneo });
  });
  sec._paso = pasos.length;
}

// ---------- Entrada y salida de la cabecera ----------
function cabecera(sec) {
  return {
    lineas: sec.querySelectorAll('.titular .linea-interior'),
    resto: sec.querySelectorAll('[data-anim]'),
    contenedores: sec.querySelectorAll('.capitulo-texto, .capitulo-lado, .pista'),
  };
}

export function prepararEntrada(sec) {
  const gsap = window.gsap;
  if (!gsap) return;
  const { lineas, resto, contenedores } = cabecera(sec);
  sec._tl?.kill();
  gsap.set(contenedores, { autoAlpha: 1 });
  gsap.set(lineas, { yPercent: 105 });
  gsap.set(resto, { autoAlpha: 0, y: 24 });
}

export function animarEntrada(sec, { movimientoReducido } = {}) {
  const gsap = window.gsap;
  if (!gsap) return;
  const { lineas, resto, contenedores } = cabecera(sec);
  sec._tl?.kill();
  if (movimientoReducido) { gsap.set([...lineas, ...resto, ...contenedores], { clearProps: 'all' }); return; }
  prepararEntrada(sec);
  sec._tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to(lineas, { yPercent: 0, duration: 0.9, stagger: 0.08 }, 0)
    .to(resto, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, clearProps: 'transform' }, 0.2);
}

// Al salir: se desvanece y queda lista para re-reproducir la entrada.
export function animarSalida(sec, { movimientoReducido } = {}) {
  const gsap = window.gsap;
  if (!gsap || movimientoReducido) return;
  const { contenedores } = cabecera(sec);
  sec._tl?.kill();
  sec._tl = gsap.timeline()
    .to(contenedores, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' })
    .add(() => { prepararEntrada(sec); prepararPasos(sec); });
}

// ---------- Índice ----------
export function construirIndice({ lista, secciones, capitulos, alElegir }) {
  lista.textContent = '';
  const principales = capitulos.filter((c) => !c.padre);
  const grupos = [
    { numero: 'portada', titulo: 'Portada' },
    ...secciones.map((s) => ({ numero: s.numero, titulo: s.titulo })),
    { numero: 'cierre', titulo: 'Cierre' },
  ];
  for (const g of grupos) {
    const caps = principales.filter((c) => c.seccion === g.numero);
    if (!caps.length) continue;
    const li = crear('li', 'indice-seccion');
    li.dataset.seccion = g.numero;
    const boton = crear('button', 'indice-seccion-boton');
    boton.type = 'button';
    boton.append(
      crear('span', 'indice-numero', SECCIONES_ESPECIALES[g.numero] ? '—' : g.numero),
      crear('span', 'indice-seccion-titulo', g.titulo),
    );
    boton.addEventListener('click', () => alElegir(caps[0].id));
    li.append(boton);
    if (caps.length > 1 || !SECCIONES_ESPECIALES[g.numero]) {
      const ul = crear('ol', 'indice-capitulos');
      for (const c of caps) {
        const item = document.createElement('li');
        const b = crear('button', 'indice-capitulo');
        b.type = 'button';
        b.dataset.capitulo = c.id;
        b.append(crear('span', 'indice-capitulo-numero', c.numeroPantalla ?? ''), crear('span', null, textoTitular(c) || c.id));
        b.addEventListener('click', () => alElegir(c.id));
        item.append(b);
        ul.append(item);
      }
      li.append(ul);
    }
    lista.append(li);
  }
}

export function marcarIndice(lista, cap) {
  const id = cap.padre ?? cap.id;
  lista.querySelectorAll('.indice-capitulo').forEach((b) => {
    if (b.dataset.capitulo === id) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  lista.querySelectorAll('.indice-seccion').forEach((li) => li.classList.toggle('actual', li.dataset.seccion === cap.seccion));
}

// ---------- Pie: «09 / 18», sección y pasos ----------
export function actualizarPie({ numero, seccion, pasos }, cap, secciones, total) {
  const especial = SECCIONES_ESPECIALES[cap.seccion];
  numero.textContent = `${cap.numeroPantalla ?? ''} / ${total}`;
  const titulo = tituloSeccion(cap.seccion, secciones);
  seccion.textContent = especial ? titulo : `${cap.seccion} · ${titulo}`;
  seccion.setAttribute('aria-label', especial ? titulo : `Sección ${cap.seccion} de ${String(secciones.length).padStart(2, '0')}: ${titulo}`);
  pasos.textContent = '';
}

export function marcarPasosPie(ol, paso, total) {
  if (ol.childElementCount !== total) {
    ol.textContent = '';
    for (let i = 0; i < total; i++) ol.append(document.createElement('li'));
  }
  [...ol.children].forEach((li, i) => li.classList.toggle('hecho', i < paso));
  ol.hidden = total === 0;
}

// ---------- Marcas de progreso ----------
export function construirMarcas(ol, capitulos) {
  ol.textContent = '';
  const n = capitulos.length;
  capitulos.forEach((c, i) => {
    const li = document.createElement('li');
    li.style.top = `${n > 1 ? (i / (n - 1)) * 100 : 0}%`;
    if (i === 0 || capitulos[i - 1].seccion !== c.seccion) li.classList.add('seccion-inicio');
    if (c.padre) li.classList.add('continuacion');
    ol.append(li);
  });
}

export function marcarProgreso(ol, indice) {
  [...ol.children].forEach((li, i) => li.classList.toggle('pasado', i <= indice));
}
