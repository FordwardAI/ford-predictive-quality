// Render de pantallas, índice, riel de progreso y pie.
// Consume `contenido.js` (meta, secciones, capitulos) y el Map de `cifras.js`.
// Todo el texto entra por textContent: el contenido es dato, nunca HTML.
//
// Una pantalla se muestra siempre completa: al llegar (teclado, scroll, índice
// o enlace) todos sus elementos entran en una cascada corta (≤ 1,2 s) con
// opacidad y transform. Los elementos animados llevan `data-anim` y están
// siempre en el DOM.

const PENDIENTE_RE = /\[PENDIENTE[^\]]*\]/g;
const SECCIONES_ESPECIALES = { portada: 'Portada', cierre: 'Cierre' };

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

// ---------- Normalización y numeración ----------
// Listas siempre presentes; `ampliacion` (respaldo para preguntas, solo en las
// notas del orador) queda como [{ titulo, texto }] sin entradas vacías.
export function normalizarCapitulos(todos) {
  const lista = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
  return todos.map((c) => ({
    ...c,
    cifras: lista(c.cifras),
    puntos: lista(c.puntos),
    detalle: lista(c.detalle),
    ampliacion: lista(c.ampliacion)
      .map((a) => ({ titulo: String(a.titulo ?? '').trim(), texto: String(a.texto ?? '').trim() }))
      .filter((a) => a.titulo || a.texto),
  }));
}

// Número visible «00»…«14»; devuelve el de la última pantalla.
export function numerarCapitulos(capitulos) {
  capitulos.forEach((c, i) => { c.numeroPantalla = String(i).padStart(2, '0'); });
  return String(Math.max(capitulos.length - 1, 0)).padStart(2, '0');
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
function leyendaDe(c) {
  return [c?.leyenda, c?.respaldo ? 'valor de respaldo' : null].filter(Boolean).join(' · ');
}

function crearCifra(clave, cifras, { sinLeyenda = false } = {}) {
  const li = document.createElement('li');
  li.className = 'cifra';
  li.dataset.clave = clave;
  li.dataset.anim = '';
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
    x: n, duration: 0.9, ease: 'power2.out',
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
  const conTexto = cap.puntos.filter((p) => p.texto).length;
  if (!conTexto) ol.classList.add('callouts-fila');
  else if (cap.puntos.length >= 4) ol.classList.add('callouts-muchos');
  ol.setAttribute('aria-label', 'Recorrido');
  cap.puntos.forEach((p, i) => {
    const li = crear('li', 'callout');
    li.dataset.punto = p.id;
    li.dataset.anim = '';
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

// Resalta el callout del punto `id` (null: ninguno).
export function marcarCallout(sec, id) {
  sec?.querySelectorAll('.callout').forEach((li) => li.classList.toggle('activo', Boolean(id) && li.dataset.punto === id));
}

// ---------- Tarjetas ----------
function crearTarjetas(detalle) {
  const ul = crear('ul', 'tarjetas');
  ul.style.setProperty('--n', String(detalle.length));
  for (const d of detalle) {
    const li = crear('li', 'tarjeta');
    li.dataset.anim = '';
    li.append(crear('h3', 'tarjeta-titulo', d.titulo), crear('p', 'tarjeta-texto', d.texto));
    ul.append(li);
  }
  return ul;
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
  fig.dataset.anim = '';
  const marco = crear('div', 'figura-marco');
  fig.append(marco);

  if (f.tipo === 'js') {
    let svg = null;
    try { svg = figuras?.crear?.(f.id, { datos, opciones: { titulo: false, ...(f.opciones ?? {}) } }) ?? null; } catch (err) {
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
// Disposición: texto de un lado (≈ 46 %), figura del otro; sin figura, las
// tarjetas van en una banda al pie para no tapar el vehículo 3D.
export function renderizarCapitulos({ main, meta = {}, secciones = [], capitulos = [], cifras, datos, figuras, formatearCifra, alTocarCallout }) {
  formatear = formatearCifra ?? null;
  main.textContent = '';
  const elementos = capitulos.map((cap, indice) => {
    const especial = SECCIONES_ESPECIALES[cap.seccion] ? cap.seccion : null;
    const sec = document.createElement('section');
    sec.className = 'capitulo';
    if (especial) sec.classList.add(`capitulo-${especial}`);
    if (ladoDe(cap, secciones) === 'derecha') sec.classList.add('lado-derecha');
    if (cap.centrado) sec.classList.add('centrado');
    sec.id = cap.id;
    sec.tabIndex = -1;
    sec.dataset.indice = String(indice);
    sec.setAttribute('aria-labelledby', `titular-${cap.id}`);

    const texto = crear('div', 'capitulo-texto');
    const lado = crear('div', 'capitulo-lado');
    const banda = crear('div', 'capitulo-banda');

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

    if (cap.cifras.length) {
      const ul = crear('ul', `cifras cifras-${cap.cifras.length}`);
      ul.setAttribute('aria-label', 'Cifras');
      // Si todas las cifras comparten la leyenda (mismo tramo y n), va una sola vez debajo.
      const leyendas = new Set(cap.cifras.map((k) => leyendaDe(cifras?.get?.(k))));
      const compartida = leyendas.size === 1 ? [...leyendas][0] : '';
      for (const clave of cap.cifras) ul.append(crearCifra(clave, cifras, { sinLeyenda: Boolean(compartida) }));
      texto.append(ul);
      if (compartida) {
        const p = crear('p', 'cifras-leyenda', compartida);
        p.dataset.anim = '';
        texto.append(p);
      }
    }

    if (cap.puntos.length) texto.append(crearCallouts(cap, alTocarCallout));

    const figura = crearFigura(cap, { datos, figuras });
    if (figura) { lado.append(figura); sec.classList.add('con-figura'); }

    if (cap.detalle.length) {
      const enBanda = cap.disposicion ? cap.disposicion === 'tarjetas-escena' : !figura;
      const ul = crearTarjetas(cap.detalle);
      if (enBanda) { banda.append(ul); sec.classList.add('con-banda'); } else texto.append(ul);
    }

    if ((especial === 'portada' || especial === 'cierre') && meta.integrantes?.length && (especial === 'portada' || !capitulos.some((c) => c.seccion === 'portada'))) {
      // Lo que es solo un marcador [PENDIENTE] lleva `.solo-pendiente`: con
      // ?limpio=1 desaparece sin dejar separadores ni filas vacías.
      const soloPendiente = (t) => new RegExp(`^\\s*${PENDIENTE_RE.source}\\s*$`).test(String(t ?? ''));
      const ul = crear('ul', 'integrantes');
      ul.dataset.anim = '';
      ul.setAttribute('aria-label', 'Equipo');
      for (const p of meta.integrantes) {
        const li = document.createElement('li');
        const nombre = crear('span', 'integrante-nombre', p.nombre);
        if (soloPendiente(p.nombre)) nombre.classList.add('solo-pendiente');
        li.append(nombre);
        const partes = [p.carrera, p.universidad].filter(Boolean);
        if (partes.length) {
          const dato = crear('span', 'integrante-dato');
          for (const t of partes) {
            const parte = crear('span', 'integrante-parte', t);
            if (soloPendiente(t)) parte.classList.add('solo-pendiente');
            dato.append(parte);
          }
          li.append(dato);
        }
        const todo = [p.nombre, ...partes];
        if (todo.every(soloPendiente)) li.classList.add('solo-pendiente');
        ul.append(li);
      }
      if ([...ul.children].every((li) => li.classList.contains('solo-pendiente'))) ul.classList.add('solo-pendiente');
      texto.append(ul);
    }

    sec.append(texto);
    if (lado.childElementCount) sec.append(lado);
    if (banda.childElementCount) sec.append(banda);

    if (especial) {
      const pista = crear('p', 'pista');
      pista.dataset.anim = '';
      pista.setAttribute('aria-hidden', 'true');
      if (especial === 'portada') pista.append(crear('kbd', null, '→'), ' Avanzar');
      else pista.append(crear('kbd', null, 'I'), ' Índice', crear('span', 'pista-sep', '·'), crear('kbd', null, '←'), ' Volver');
      sec.append(pista);
    }

    main.append(sec);
    return sec;
  });
  main.removeAttribute('aria-busy');
  return elementos;
}

// Pantallas sin figura que no entran en la ventana: primero las tarjetas pasan
// de la banda al pie de la columna opuesta al texto (debajo del vehículo) y, si
// todavía no entra, también los callouts. Se mide con la tipografía ya
// cargada; al redimensionar se vuelve a medir desde la disposición original.
export function ajustarDisposicion(sec) {
  if (sec.classList.contains('con-figura')) return;
  const texto = sec.querySelector(':scope > .capitulo-texto');
  const tarjetas = sec.querySelector(':scope .tarjetas');
  const callouts = sec.querySelector(':scope .callouts');
  if (!texto || (!tarjetas && !callouts)) return;
  let lado = sec.querySelector(':scope > .capitulo-lado');
  let banda = sec.querySelector(':scope > .capitulo-banda');
  if (!lado) { lado = crear('div', 'capitulo-lado'); texto.after(lado); }
  if (!banda) { banda = crear('div', 'capitulo-banda'); lado.after(banda); }
  if (callouts) {
    // Marca del lugar original de los callouts en la columna de texto.
    sec._marcaCallouts ??= document.createComment('callouts');
    if (!sec._marcaCallouts.parentNode) callouts.before(sec._marcaCallouts);
    sec._marcaCallouts.after(callouts);
  }
  if (tarjetas) banda.append(tarjetas);
  sec.classList.toggle('con-banda', Boolean(tarjetas));
  sec.classList.remove('tarjetas-lado', 'callouts-lado');
  if (sec.classList.contains('centrado') && tarjetas) {
    // Pantalla `centrado`: las tarjetas van siempre en la columna del vehículo, centradas (ver styles.css).
    lado.append(tarjetas);
    sec.classList.remove('con-banda');
    sec.classList.add('tarjetas-lado');
    return;
  }
  const entra = () => sec.scrollHeight <= Math.ceil(innerHeight) + 1;
  if (entra()) return;
  if (tarjetas) {
    lado.append(tarjetas);
    sec.classList.remove('con-banda');
    sec.classList.add('tarjetas-lado');
    if (entra()) return;
  }
  if (callouts) {
    lado.prepend(callouts);
    sec.classList.add('callouts-lado');
  }
}

// ---------- Entrada y salida ----------
function partes(sec) {
  return {
    lineas: [...sec.querySelectorAll('.titular .linea-interior')],
    resto: [...sec.querySelectorAll('[data-anim]')],
    contenedores: [...sec.querySelectorAll('.capitulo-texto, .capitulo-lado, .capitulo-banda, .pista')],
  };
}

// Estado previo a la entrada: todo oculto (los contenedores, visibles).
export function prepararEntrada(sec) {
  const gsap = window.gsap;
  if (!gsap) return;
  const { lineas, resto, contenedores } = partes(sec);
  sec._tl?.kill();
  gsap.killTweensOf([...lineas, ...resto, ...contenedores]);
  gsap.set(contenedores, { autoAlpha: 1 });
  gsap.set(lineas, { yPercent: 105 });
  gsap.set(resto, { autoAlpha: 0, y: 20 });
  sec.querySelectorAll('.capitulo-figura').forEach((f) => f.classList.remove('figura-visible'));
  marcarCallout(sec, null);
}

// Al revelar: conteo de cifras y filas escalonadas de la figura (CSS).
function alRevelar(el, { instantaneo }) {
  if (el.classList.contains('cifra')) contar(el, { instantaneo });
  if (el.classList.contains('capitulo-figura')) {
    el.classList.toggle('figura-entrando', !instantaneo);
    if (instantaneo) el.classList.add('figura-visible');
    else requestAnimationFrame(() => el.classList.add('figura-visible'));
  }
}

// Toda la pantalla en una cascada corta: titular por líneas y el resto en orden
// del documento (≈ 1,15 s en total, haya los elementos que haya).
export function animarEntrada(sec, { movimientoReducido } = {}) {
  const gsap = window.gsap;
  if (!gsap || movimientoReducido) { mostrarTodo(sec, { instantaneo: true }); return; }
  prepararEntrada(sec);
  const { lineas, resto } = partes(sec);
  const inicio = 0.12;
  const escalon = Math.min(0.07, 0.5 / Math.max(1, resto.length - 1));
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(lineas, { yPercent: 0, duration: 0.6, stagger: 0.06 }, 0);
  resto.forEach((el, k) => {
    const t = inicio + k * escalon;
    tl.to(el, { autoAlpha: 1, y: 0, duration: 0.45, clearProps: 'transform' }, t);
    tl.call(() => alRevelar(el, { instantaneo: false }), null, t);
  });
  sec._tl = tl;
}

// Todo visible sin animar (movimiento reducido, pantalla ya activa, impresión).
export function mostrarTodo(sec) {
  const gsap = window.gsap;
  const { lineas, resto, contenedores } = partes(sec);
  sec._tl?.kill();
  if (gsap) {
    gsap.killTweensOf([...lineas, ...resto, ...contenedores]);
    gsap.set([...lineas, ...resto, ...contenedores], { clearProps: 'opacity,visibility,transform' });
  } else {
    for (const el of resto) { el.style.opacity = ''; el.style.visibility = ''; }
  }
  resto.forEach((el) => alRevelar(el, { instantaneo: true }));
}

// Al salir: fundido breve (0,25 s) y queda lista para re-reproducir la entrada.
// Nunca bloquea: la entrada siguiente mata esta línea de tiempo.
export function animarSalida(sec, { movimientoReducido } = {}) {
  const gsap = window.gsap;
  if (!gsap || movimientoReducido) return;
  const { contenedores } = partes(sec);
  sec._tl?.kill();
  sec._tl = gsap.timeline()
    .to(contenedores, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
    .add(() => prepararEntrada(sec));
}

// ---------- Índice (diálogo) ----------
export function construirIndice({ lista, secciones, capitulos, alElegir }) {
  lista.textContent = '';
  for (const c of capitulos) {
    const li = document.createElement('li');
    const b = crear('button', 'indice-capitulo');
    b.type = 'button';
    b.dataset.capitulo = c.id;
    const seccion = tituloSeccion(c.seccion, secciones);
    b.append(
      crear('span', 'indice-capitulo-numero', c.numeroPantalla ?? ''),
      crear('span', 'indice-capitulo-titulo', textoTitular(c) || c.id),
      crear('span', 'indice-capitulo-seccion', SECCIONES_ESPECIALES[c.seccion] ? seccion : `${c.seccion} · ${seccion}`),
    );
    b.addEventListener('click', () => alElegir(c.id));
    li.append(b);
    lista.append(li);
  }
}

export function marcarIndice(lista, cap) {
  lista.querySelectorAll('.indice-capitulo').forEach((b) => {
    if (b.dataset.capitulo === cap.id) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
}

// ---------- Pie: «09 / 14» y sección ----------
export function actualizarPie({ numero, seccion }, cap, secciones, total) {
  const especial = SECCIONES_ESPECIALES[cap.seccion];
  numero.textContent = `${cap.numeroPantalla ?? ''} / ${total}`;
  const titulo = tituloSeccion(cap.seccion, secciones);
  seccion.textContent = especial ? titulo : `${cap.seccion} · ${titulo}`;
  seccion.setAttribute('aria-label', especial ? titulo : `Sección ${cap.seccion} de ${String(secciones.length).padStart(2, '0')}: ${titulo}`);
}

// ---------- Riel de progreso: una marca igual por pantalla ----------
export function construirMarcas(ol, capitulos, alElegir) {
  ol.textContent = '';
  capitulos.forEach((c) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'marca';
    b.dataset.capitulo = c.id;
    const nombre = `${c.numeroPantalla} · ${textoTitular(c) || c.id}`;
    b.title = nombre;
    b.setAttribute('aria-label', nombre);
    b.addEventListener('click', () => alElegir(c.id));
    li.append(b);
    ol.append(li);
  });
}

export function marcarProgreso(ol, indice) {
  [...ol.querySelectorAll('.marca')].forEach((b, i) => {
    if (i === indice) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
}
