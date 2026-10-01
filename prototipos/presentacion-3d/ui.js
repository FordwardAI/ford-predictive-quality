// Render de capítulos, índice, panel de detalle e indicador de sección.
// Consume `contenido.js` (meta, secciones, capitulos) y el Map de `cifras.js`.
// Todo el texto entra por textContent: el contenido es dato, nunca HTML.

const PENDIENTE_RE = /\[PENDIENTE[^\]]*\]/g;
const SECCIONES_ESPECIALES = { portada: 'Portada', cierre: 'Cierre' };

// Cuenta todos los marcadores del contenido (incluye notas y textos de hotspots,
// que no se ven hasta abrirlos) y las cifras usadas que están pendientes.
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
  if (!segmentosTitular.has(h)) return;
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

function crearTitular(cap, nivel) {
  const h = document.createElement(nivel);
  h.className = 'titular';
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
function crearCifra(clave, cifras) {
  const li = document.createElement('li');
  li.className = 'cifra';
  li.dataset.anim = '';
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
  if (c.etiqueta) li.append(crear('span', 'cifra-etiqueta', c.etiqueta));
  const leyenda = [c.leyenda, c.respaldo ? 'valor de respaldo' : null].filter(Boolean).join(' · ');
  if (leyenda) li.append(crear('span', 'cifra-leyenda', leyenda));
  if (c.fuente) li.title = `Fuente: ${c.fuente}`;
  return li;
}

// ---------- Capítulos ----------
export function renderizarCapitulos({ main, meta = {}, secciones = [], capitulos = [], cifras, alTocarPunto }) {
  main.textContent = '';
  const elementos = capitulos.map((cap, indice) => {
    const especial = SECCIONES_ESPECIALES[cap.seccion] ? cap.seccion : null;
    const sec = document.createElement('section');
    sec.className = 'capitulo';
    if (especial) sec.classList.add(`capitulo-${especial}`);
    if (ladoDe(cap, secciones) === 'derecha') sec.classList.add('lado-derecha');
    sec.id = cap.id;
    sec.tabIndex = -1;
    sec.dataset.indice = String(indice);
    sec.setAttribute('aria-labelledby', `titular-${cap.id}`);

    const texto = crear('div', 'capitulo-texto');

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
      texto.append(ante);
    }

    texto.append(crearTitular(cap, indice === 0 ? 'h1' : 'h2'));

    if (cap.bajada) {
      const bajada = crear('p', 'bajada', cap.bajada);
      bajada.dataset.anim = '';
      texto.append(bajada);
    }

    if (cap.cifras?.length) {
      const ul = crear('ul', 'cifras');
      ul.setAttribute('aria-label', 'Cifras');
      for (const clave of cap.cifras) ul.append(crearCifra(clave, cifras));
      texto.append(ul);
    }

    if (cap.puntos?.length) {
      const ul = crear('ul', 'puntos');
      ul.dataset.anim = '';
      ul.setAttribute('aria-label', 'Puntos para explorar');
      ul.append(crear('li', 'puntos-rotulo', 'Explorar'));
      for (const p of cap.puntos) {
        const li = document.createElement('li');
        const b = crear('button', 'boton boton-punto', p.titulo ?? p.id);
        b.type = 'button';
        b.dataset.punto = p.id;
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', 'detalle-panel');
        b.addEventListener('click', () => alTocarPunto?.(p.id, b, cap.id));
        li.append(b);
        ul.append(li);
      }
      texto.append(ul);
    }

    if (cap.detalle?.length) {
      const cont = crear('div', 'detalles');
      cont.dataset.anim = '';
      for (const d of cap.detalle) {
        const det = crear('details', 'detalle');
        det.append(crear('summary', null, d.titulo), crear('p', 'detalle-cuerpo', d.texto));
        cont.append(det);
      }
      texto.append(cont);
    }

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

    if (cap.figura?.src) {
      const fig = crear('figure', 'capitulo-figura');
      fig.dataset.anim = '';
      const img = document.createElement('img');
      img.src = cap.figura.src;
      img.alt = cap.figura.alt ?? '';
      img.loading = indice < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.addEventListener('load', () => {
        if (img.naturalHeight > img.naturalWidth) fig.classList.add('figura-alta');
      }, { once: true });
      img.addEventListener('error', () => console.warn(`[presentacion] no se pudo cargar la figura ${cap.figura.src}`), { once: true });
      fig.append(img);
      if (cap.figura.pie) fig.append(crear('figcaption', null, cap.figura.pie));
      sec.append(fig);
    }

    if (indice === 0) {
      const pista = crear('p', 'pista-scroll');
      pista.append(crear('kbd', null, '→'), ' Avanzar');
      pista.setAttribute('aria-hidden', 'true');
      sec.append(pista);
    }

    main.append(sec);
    return sec;
  });
  main.removeAttribute('aria-busy');
  return elementos;
}

// ---------- Animación de entrada ----------
const yaAnimados = new WeakSet();

export function prepararEntrada(sec) {
  const gsap = window.gsap;
  if (!gsap || yaAnimados.has(sec)) return;
  gsap.set(sec.querySelectorAll('.titular .linea-interior'), { yPercent: 105 });
  gsap.set(sec.querySelectorAll('[data-anim]'), { autoAlpha: 0, y: 24 });
}

export function animarEntrada(sec, { movimientoReducido } = {}) {
  const gsap = window.gsap;
  if (yaAnimados.has(sec)) return;
  yaAnimados.add(sec);
  if (!gsap) return;
  const lineas = sec.querySelectorAll('.titular .linea-interior');
  const resto = sec.querySelectorAll('[data-anim]');
  if (movimientoReducido) { gsap.set([...lineas, ...resto], { clearProps: 'all' }); return; }
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(lineas, { yPercent: 0, duration: 1.0, stagger: 0.09 }, 0)
    .to(resto, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, clearProps: 'transform' }, 0.25);
}

export function estaAnimado(sec) {
  return yaAnimados.has(sec);
}

// ---------- Índice ----------
export function construirIndice({ lista, secciones, capitulos, alElegir }) {
  lista.textContent = '';
  const grupos = [
    { numero: 'portada', titulo: 'Portada' },
    ...secciones.map((s) => ({ numero: s.numero, titulo: s.titulo })),
    { numero: 'cierre', titulo: 'Cierre' },
  ];
  for (const g of grupos) {
    const caps = capitulos.filter((c) => c.seccion === g.numero);
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
        const b = crear('button', 'indice-capitulo', textoTitular(c) || c.id);
        b.type = 'button';
        b.dataset.capitulo = c.id;
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
  lista.querySelectorAll('.indice-capitulo').forEach((b) => {
    if (b.dataset.capitulo === cap.id) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  lista.querySelectorAll('.indice-seccion').forEach((li) => li.classList.toggle('actual', li.dataset.seccion === cap.seccion));
}

// ---------- Indicador y marcas de progreso ----------
export function actualizarIndicador({ numero, titulo }, cap, secciones) {
  const especial = SECCIONES_ESPECIALES[cap.seccion];
  numero.textContent = especial ? '' : cap.seccion;
  const total = secciones.length ? String(secciones.length).padStart(2, '0') : '';
  titulo.textContent = tituloSeccion(cap.seccion, secciones);
  const lector = especial ? especial : `Sección ${cap.seccion}${total ? ` de ${total}` : ''}: ${titulo.textContent}`;
  numero.parentElement.setAttribute('aria-label', lector);
}

export function construirMarcas(ol, capitulos) {
  ol.textContent = '';
  const n = capitulos.length;
  capitulos.forEach((c, i) => {
    const li = document.createElement('li');
    li.style.top = `${n > 1 ? (i / (n - 1)) * 100 : 0}%`;
    if (i === 0 || capitulos[i - 1].seccion !== c.seccion) li.classList.add('seccion-inicio');
    ol.append(li);
  });
}

export function marcarProgreso(ol, indice) {
  [...ol.children].forEach((li, i) => li.classList.toggle('pasado', i <= indice));
}

// ---------- Panel de detalle ----------
let disparadorPanel = null;

export function abrirDetalle(panel, { antetitulo, titulo, texto }, disparador) {
  const [ante, h, p] = ['detalle-antetitulo', 'detalle-titulo', 'detalle-texto'].map((id) => panel.querySelector(`#${id}`));
  ante.textContent = '';
  ante.append(textoRico(antetitulo ?? ''));
  h.textContent = '';
  h.append(textoRico(titulo ?? ''));
  p.textContent = '';
  p.append(textoRico(texto ?? ''));
  document.querySelectorAll('.boton-punto[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  disparador?.setAttribute?.('aria-expanded', 'true');
  disparadorPanel = disparador ?? document.activeElement;
  panel.hidden = false;
  h.focus({ preventScroll: true });
}

export function cerrarDetalle(panel, { devolverFoco = true } = {}) {
  if (panel.hidden) return false;
  panel.hidden = true;
  document.querySelectorAll('.boton-punto[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  if (devolverFoco && disparadorPanel?.isConnected) disparadorPanel.focus({ preventScroll: true });
  disparadorPanel = null;
  return true;
}
