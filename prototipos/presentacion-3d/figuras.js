// Figuras de datos como SVG inline, dibujadas desde los agregados ya publicados
// (solucion/resultados/*.json). Contrato con ui.js:
//
//   crear(id, { datos, opciones }) -> SVGElement | null
//   cargarDatos(leerJson?) -> Promise<datos>
//   disponible(id, datos) -> boolean
//   ajustar(svg)  (ya en el documento: comprime textos que no entren)
//
// `id`: comparacion | veces_azar_prueba_final | donde_mirar | etiquetas_parciales
//       | detector | particiones | seleccion
// `datos`: lo que devuelve cargarDatos(): un JSON por clave (p3, p4, eleccion,
//   pruebaFinal, p5, p6, preparacion, precision), o null si ese fetch falló.
// `opciones`:
//   - { titulo: false } en todas: omite el título y el subtítulo internos (la
//     pantalla ya tiene titular).
//   - { resumen: true } en `comparacion` (la variante de la presentación): un
//     punto por alternativa sobre un solo eje de precisión en el cupo, en tres
//     carriles (tasa por código, aprendizaje automático, no elegibles), con la
//     elegida, la mejor precisión, el azar al mismo cupo y cuántas empatan con la
//     mejor; sin rangos del 95 %. Sin `resumen`, la variante completa de 33 filas.
//   - { resaltar: 'fuga' } en `comparacion` (con o sin `resumen`): la versión con
//     fuga en el color de alerta.
// Devuelve null si falta un JSON que la figura necesita; ui.js usa entonces el
// SVG de matplotlib de respaldo (docs/entrega/figuras/) si la pantalla lo
// declara. `seleccion` y `veces_azar_prueba_final` no tienen respaldo en la
// presentación: sin figura, la pantalla queda sin figura.
//   - `seleccion`: elección por precisión (precision.json): un punto por
//     alternativa del ranking sobre un eje de precisión en selección, con
//     CatBoost destacado, el azar y el oráculo; ninguna otra alternativa rotulada.
//   - `veces_azar_prueba_final`: CatBoost en la prueba final (primera corrida
//     de solucion/preregistro-precision.json), una fila por tramo.
//
// Reglas:
// - Ninguna cifra escrita a mano: todo número sale del JSON. Los textos fijos
//   (títulos, pies, rótulos de familia) son los de solucion/figuras.py.
// - Solo agregados: ningún VIN, ninguna tasa por código ni por mercado.
// - Colores solo por variables CSS (--figura-*), con respaldo para el tema
//   oscuro Twilight. Para un contenedor claro, definir las variables (ver
//   herramientas/figuras-demo.html).
// - Cada fila (o segmento, o punto) es un <g class="fila" style="--i: n"> para
//   que la interfaz pueda animarlas en cascada; el SVG no anima nada por sí mismo.
// - Tamaños. En index.html a 1920×1080 el panel de figura (.figura-marco) mide
//   746 px; la escala viewBox→px es ancho del panel / ancho del viewBox. Toda la
//   página escala con el viewport (a 1366×768 el panel mide 531 px), así que la
//   proporción con el resto de la pantalla se mantiene.
//   · `particiones`, `seleccion` y `comparacion` con `resumen`: 740 de ancho (escala ≈ 1,0 a
//     1920 px) y alto según el contenido; letra de 22 px o más en rótulos y
//     valores principales y nunca menos de 18 px (ejes, «margen»).
//   · `veces_azar_prueba_final`: 900 de ancho con letra de 23 a 40 (≈ 19 a 33 px
//     efectivos en el panel de 746 px).
//   · Sin pies dentro de esas figuras: la pantalla tiene su pie y el detalle va
//     en <desc>. Ningún texto depende de textLength (se acorta o se parte la línea).
//   · `comparacion` completa: 830 de ancho, letra de 14–15 px (para el informe).
//   · `donde_mirar`, `etiquetas_parciales` y `detector` (fuera de la presentación):
//     viewBox 1200×675.
//   Revisión: herramientas/figuras-demo.html?solo=<id>&ancho=746&medir=1.
// - Las clases de los textos llevan prefijo cuando chocan con la página
//   (`figura-pie`, no `pie`: styles.css usa `.pie` para el pie fijo).

import { formatear } from './cifras.js';

export const IDS = [
  'comparacion',
  'veces_azar_prueba_final',
  'donde_mirar',
  'etiquetas_parciales',
  'detector',
  'particiones',
  'seleccion',
];

// JSON que necesita cada figura (clave en `datos`).
const REQUISITOS = {
  comparacion: ['p3', 'p4', 'eleccion'],
  veces_azar_prueba_final: ['pruebaFinal'],
  donde_mirar: ['p6'],
  etiquetas_parciales: ['p5'],
  detector: ['p6'],
  particiones: ['preparacion', 'p3', 'eleccion', 'pruebaFinal'],
  seleccion: ['precision'],
};

const ARCHIVOS = {
  p3: 'solucion/resultados/p3.json',
  p4: 'solucion/resultados/p4.json',
  eleccion: 'solucion/resultados/eleccion.json',
  pruebaFinal: 'solucion/resultados/prueba-final.json',
  p5: 'solucion/resultados/p5.json',
  p6: 'solucion/resultados/p6.json',
  preparacion: 'solucion/resultados/preparacion.json',
  precision: 'solucion/resultados/precision.json',
};

const RAIZ = '../../'; // relativo a prototipos/presentacion-3d/

async function leerJsonPropio(archivo) {
  const respuesta = await fetch(new URL(RAIZ + archivo, import.meta.url));
  if (!respuesta.ok) throw new Error(`${archivo}: HTTP ${respuesta.status}`);
  return respuesta.json();
}

/**
 * Lee los JSON de las figuras. `leerJson(archivo)` recibe la ruta desde la raíz
 * del repo (la misma convención que cifras.js); si no se pasa, se usa un fetch
 * equivalente. Un fetch fallido deja esa clave en null.
 */
export async function cargarDatos(leerJson = leerJsonPropio) {
  const claves = Object.keys(ARCHIVOS);
  const lecturas = await Promise.allSettled(claves.map((k) => leerJson(ARCHIVOS[k])));
  const datos = {};
  claves.forEach((k, i) => {
    datos[k] = lecturas[i].status === 'fulfilled' ? lecturas[i].value : null;
  });
  return datos;
}

export function disponible(id, datos) {
  const req = REQUISITOS[id];
  return Boolean(req && datos && req.every((k) => datos[k]));
}

export function crear(id, { datos, opciones = {} } = {}) {
  if (!disponible(id, datos)) return null;
  try {
    const svg = CONSTRUCTORES[id](datos, opciones);
    // Si la interfaz lo inserta en el mismo turno, se corrige cualquier texto que no entre.
    if (svg && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => { if (svg.isConnected) ajustar(svg); });
    }
    return svg;
  } catch (error) {
    // Un JSON con otra forma no rompe la pantalla: se usa el respaldo.
    if (typeof location !== 'undefined' && /[?&]debug\b/.test(location.search)) {
      console.warn(`[figuras] ${id}: uso el respaldo (${error.message})`);
    }
    return null;
  }
}

/**
 * Red de seguridad para tipografías más anchas que la estimada: comprime en
 * horizontal (textLength) el texto que se saldría del viewBox. Requiere que el
 * SVG ya esté en el documento; se puede llamar de nuevo tras cargar las fuentes
 * (document.fonts.ready). No cambia ningún texto.
 */
export function ajustar(svg) {
  const caja = svg?.viewBox?.baseVal;
  if (!caja || !svg.isConnected) return;
  const margen = 8;
  for (const t of svg.querySelectorAll('text')) {
    t.removeAttribute('textLength');
    t.removeAttribute('lengthAdjust');
    const ancla = t.getAttribute('text-anchor') || 'start';
    if (ancla === 'middle') continue;
    const x = Number(t.getAttribute('x'));
    const disponible = ancla === 'end' ? x - margen : caja.width - margen - x;
    let largo;
    try { largo = t.getComputedTextLength(); } catch { continue; }
    if (disponible > 0 && largo > disponible) {
      t.setAttribute('textLength', disponible.toFixed(1));
      t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
  }
}

// --- Colores (solo variables CSS con respaldo oscuro) ------------------------

const C = {
  fondo: 'var(--figura-fondo, transparent)',
  texto: 'var(--figura-texto, #FFFFFF)',
  tenue: 'var(--figura-tenue, rgba(255, 255, 255, .72))',
  linea: 'var(--figura-linea, rgba(255, 255, 255, .16))',
  rango: 'var(--figura-rango, rgba(255, 255, 255, .40))',
  punto: 'var(--figura-punto, #B4B6C2)',
  acento: 'var(--figura-acento, #066FEF)',
  acentoSuave: 'var(--figura-acento-suave, rgba(6, 111, 239, .28))',
  sobreAcento: 'var(--figura-sobre-acento, #FFFFFF)', // texto sobre un relleno de acento
  alerta: 'var(--figura-alerta, #FBAE40)',
  alertaSuave: 'var(--figura-alerta-suave, rgba(251, 174, 64, .16))',
  superficie: 'var(--figura-superficie, #00142E)',
};

// --- Formato -----------------------------------------------------------------

const pct = (x) => formatear('pct1', x);
const veces = (x) => formatear('veces', x);
const entero = (x) => formatear('entero', x);
const NBSP = ' ';

function pctEje(x) {
  const v = x * 100;
  const dec = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1;
  return v.toFixed(dec).replace('.', ',') + NBSP + '%';
}

// solucion/figuras.py: _nombre y _capital.
const nombre = (t) => (t || '').replaceAll('<=', '≤');
function capital(t) {
  const s = nombre(t);
  const c = s.slice(0, 1);
  return c && (/^[\x00-\x7F]$/.test(c) || 'áéíóúñ'.includes(c)) ? c.toUpperCase() + s.slice(1) : s;
}

const esNumero = (x) => typeof x === 'number' && Number.isFinite(x);
const esRango = (r) => Array.isArray(r) && r.length === 2 && r.every(esNumero);

// --- Primitivas SVG ----------------------------------------------------------

const NS = 'http://www.w3.org/2000/svg';

function el(padre, tag, attrs = {}, contenido) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && v !== false) n.setAttribute(k, String(v));
  }
  if (contenido !== undefined) n.textContent = contenido;
  if (padre) padre.appendChild(n);
  return n;
}

function texto(padre, x, y, contenido, {
  tam = 18, color = C.texto, ancla = 'start', peso = 400, base = 'central', clase, halo = false,
} = {}) {
  // `halo`: contorno del color de la superficie para que la grilla no cruce el texto.
  const contorno = halo ? `;paint-order:stroke;stroke:${C.superficie};stroke-width:6px;stroke-linejoin:round` : '';
  return el(padre, 'text', {
    x, y, 'text-anchor': ancla, 'dominant-baseline': base, class: clase,
    style: `fill:${color};font-size:${tam}px;font-weight:${peso}${contorno}`,
  }, contenido);
}

// Ancho aproximado de un texto (Roboto / Arial): sirve para decidir cortes de línea.
// Factores conservadores: valen para Roboto, Arial y FORD F-1 (más anchas que Roboto).
const LETRA = 0.55;
const LETRA_NEGRITA = 0.58;
const anchoTexto = (s, tam) => s.length * tam * 0.52;

/** Corta un texto en líneas de hasta `max` caracteres, por palabras. */
function partir(s, max) {
  const lineas = [];
  let actual = '';
  for (const palabra of String(s).split(' ')) {
    if (actual && (actual + ' ' + palabra).length > max) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = actual ? actual + ' ' + palabra : palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Corta en dos líneas lo más parejas posible (para rótulos largos de fila). */
function partirEnDos(s) {
  const palabras = s.split(' ');
  let mejor = [s];
  let diferencia = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const a = palabras.slice(0, i).join(' ');
    const b = palabras.slice(i).join(' ');
    const d = Math.abs(a.length - b.length);
    if (d < diferencia) { diferencia = d; mejor = [a, b]; }
  }
  return mejor;
}

/** Texto de varias líneas centrado verticalmente en y. */
function textoLineas(padre, x, y, lineas, opciones, interlinea) {
  const alto = interlinea ?? (opciones.tam ?? 18) * 1.2;
  lineas.forEach((l, i) => texto(padre, x, y + (i - (lineas.length - 1) / 2) * alto, l, opciones));
}

// Tamaños base (unidades del viewBox; a 900 px de ancho se ven al 75 %).
const T = { titulo: 32, sub: 20, rotulo: 23, valor: 22, valorSub: 17, eje: 20, pie: 19, ref: 19 };

function linea(padre, x1, y1, x2, y2, color, ancho = 1) {
  return el(padre, 'line', {
    x1, y1, x2, y2, style: `stroke:${color};stroke-width:${ancho};stroke-linecap:round`,
  });
}

function rect(padre, x, y, w, h, color, { radio = 0 } = {}) {
  return el(padre, 'rect', { x, y, width: Math.max(0, w), height: h, rx: radio || undefined, style: `fill:${color}` });
}

function fila(padre, i, clases = '') {
  return el(padre, 'g', { class: `fila ${clases}`.trim(), style: `--i:${i}` });
}

function escala(dmin, dmax, x0, x1) {
  return (v) => x0 + ((v - dmin) / (dmax - dmin)) * (x1 - x0);
}

// Marcas «redondas» como MaxNLocator(nbins=7, steps=[1, 2, 5, 10]).
function ticks(dmax, maxTicks = 7) {
  const base = 10 ** Math.floor(Math.log10(dmax / maxTicks));
  for (const m of [1, 2, 5, 10, 20]) {
    const paso = m * base;
    if (dmax / paso <= maxTicks) {
      const n = Math.floor(dmax / paso + 1e-9);
      return Array.from({ length: n + 1 }, (_, i) => +(i * paso).toFixed(10));
    }
  }
  return [0, dmax];
}

/**
 * Crea el <svg> con fondo, título, subtítulo y pie. Devuelve { svg, arriba, abajo }:
 * el área libre para el gráfico va de `arriba` a `abajo`.
 */
function lienzo(id, ancho, alto, { titulo, subtitulo = [], desc, pie, opciones, escala: k = 1 }) {
  const svg = el(null, 'svg', {
    xmlns: NS, viewBox: `0 0 ${ancho} ${alto}`, role: 'img',
    class: `figura-datos figura-${id}`, 'data-figura': id,
    style: 'display:block;width:100%;height:auto;font-family:inherit;font-variant-numeric:tabular-nums;overflow:visible',
  });
  el(svg, 'title', {}, titulo);
  if (desc) el(svg, 'desc', {}, desc);
  rect(svg, 0, 0, ancho, alto, C.fondo);
  const margen = 32;
  const util = ancho - 2 * margen;
  let abajo = alto - 12;
  if (pie) {
    const tam = T.pie * k;
    const lineas = partir(pie, Math.floor(util / (tam * LETRA)));
    lineas.forEach((l, i) => texto(svg, margen, alto - 20 - (lineas.length - 1 - i) * tam * 1.3, l, { tam, color: C.tenue, clase: 'figura-pie' }));
    abajo = alto - 20 - lineas.length * tam * 1.3 - 8;
  }
  if (opciones.titulo === false) return { svg, arriba: 24, abajo };
  const tamT = T.titulo * k;
  const tamS = T.sub * k;
  partir(titulo, Math.floor(util / (tamT * LETRA_NEGRITA))).forEach((l, i) => {
    texto(svg, margen, 30 + tamT / 2 + i * tamT * 1.2, l, { tam: tamT, peso: 500, clase: 'titulo' });
  });
  const lineasTitulo = partir(titulo, Math.floor(util / (tamT * LETRA_NEGRITA))).length;
  let y = 30 + tamT * 1.2 * lineasTitulo + 6;
  for (const s of subtitulo) {
    for (const l of partir(s, Math.floor(util / (tamS * LETRA)))) {
      texto(svg, margen, y + tamS / 2, l, { tam: tamS, color: C.tenue, clase: 'subtitulo' });
      y += tamS * 1.35;
    }
  }
  return { svg, arriba: y + 12, abajo };
}

/** Grilla vertical, línea base, marcas y rótulo del eje x. Devuelve yBase. */
function eje(svg, esc, valores, yArriba, abajo, formato, rotulo, x0, x1, k = 1) {
  const yBase = abajo - (rotulo ? 64 : 34) * k;
  const g = el(svg, 'g', { class: 'eje' });
  for (const v of valores) {
    linea(g, esc(v), yArriba, esc(v), yBase, C.linea, 1);
    texto(g, esc(v), yBase + 22 * k, formato(v), { tam: T.eje * k, color: C.tenue, ancla: 'middle' });
  }
  linea(g, x0, yBase, x1, yBase, C.rango, 1.5);
  if (rotulo) texto(g, (x0 + x1) / 2, yBase + 52 * k, rotulo, { tam: T.eje * k, color: C.tenue, ancla: 'middle' });
  return yBase;
}

/** Línea de referencia vertical con su rótulo arriba. */
function referencia(svg, x, yArriba, yBase, rotulo, k = 1) {
  const g = el(svg, 'g', { class: 'referencia' });
  linea(g, x, yArriba, x, yBase, C.texto, 1.5);
  texto(g, x + 8, yArriba + 2, rotulo, { tam: T.ref * k, color: C.tenue, base: 'hanging', halo: true });
}

/** Punto con intervalo. tipo: destacada | normal | referencia | fuga. */
function puntoIntervalo(g, esc, y, valor, rango, tipo, r = 8) {
  const colorRango = tipo === 'destacada' ? C.acento : tipo === 'fuga' ? C.alerta : C.rango;
  if (rango) linea(g, esc(rango[0]), y, esc(rango[1]), y, colorRango, 4);
  const x = esc(valor);
  if (tipo === 'referencia' || tipo === 'fuga') {
    const d = r * 1.15;
    el(g, 'path', {
      d: `M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`,
      style: `fill:${C.superficie};stroke:${tipo === 'fuga' ? C.alerta : C.texto};stroke-width:2.5;stroke-linejoin:round`,
    });
  } else {
    el(g, 'circle', {
      cx: x, cy: y, r,
      style: `fill:${tipo === 'destacada' ? C.acento : C.punto};stroke:${C.superficie};stroke-width:2.5`,
    });
  }
}

// --- Gráfico genérico de punto e intervalo (figuras.py: _puntos) ----------------

function figuraPuntos(id, opciones, {
  titulo, subtitulo, desc, filas, dominio, formatoEje, rotuloX, ref, pie,
  xEtiqueta = 470, xPlot1 = 960, xValores = 980,
}) {
  const { svg, arriba, abajo } = lienzo(id, 1200, 675, { titulo, subtitulo, desc, pie, opciones });
  const x0 = xEtiqueta + 28;
  const esc = escala(dominio[0], dominio[1], x0, xPlot1);
  const yBase = eje(svg, esc, ticks(dominio[1]), arriba, abajo, formatoEje, rotuloX, x0, xPlot1);
  const yInicio = arriba + (ref ? 34 : 8); // espacio para el rótulo de la referencia
  const paso = Math.min(130, (yBase - 8 - yInicio) / filas.length);
  if (ref) referencia(svg, esc(ref.valor), arriba, yBase, ref.texto);
  const maxRotulo = xEtiqueta - 32;
  filas.forEach((f, i) => {
    const y = yInicio + paso * (i + 0.5);
    const g = fila(svg, i, f.destacada ? 'destacada' : '');
    const peso = f.destacada ? 600 : 400;
    const lineas = anchoTexto(f.etiqueta, T.rotulo) > maxRotulo ? partirEnDos(f.etiqueta) : [f.etiqueta];
    textoLineas(g, xEtiqueta, y, lineas, { tam: T.rotulo, ancla: 'end', peso });
    puntoIntervalo(g, esc, y, f.valor, f.rango, f.destacada ? 'destacada' : 'normal', 9);
    const color = f.destacada ? C.texto : C.tenue;
    if (f.valorSub) {
      texto(g, xValores, y - 12, f.valorTexto, { tam: T.valor, color, peso });
      texto(g, xValores, y + 14, f.valorSub, { tam: T.valorSub, color: C.tenue });
    } else {
      texto(g, xValores, y, f.valorTexto, { tam: T.valor, color, peso });
    }
  });
  return svg;
}

// --- 1. comparacion (figuras.py:143-247) ---------------------------------------

const FAMILIAS = {
  tasa_fija: 'Tasa fija',
  movil: 'Tasa móvil',
  movil_mercado: 'Suavizado hacia el mercado',
  decaimiento: 'Decaimiento exponencial',
  ml_logistica: 'Logística',
  ml_nb: 'Naive Bayes',
  ml_rf: 'Random Forest',
  ml_xgboost: 'XGBoost',
  ml_lightgbm: 'LightGBM',
  ml_catboost: 'CatBoost',
  ml_mlp: 'red neuronal (MLP)',
  ml_promedio: 'promedio de modelos',
  ml_stacking: 'stacking',
};
const REFERENCIAS = ['oraculo', 'fuga'];

// Comparación de tuplas como en Python (lexicográfica; el prefijo va primero).
function compararTuplas(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return a.length - b.length;
}

/** Grupos de filas, en el mismo orden que _filas_comparacion de figuras.py. */
export function gruposComparacion(p3, p4) {
  const alternativas = [
    ...p3.resultados.map((r) => ({ ...r, pieza: 'p3' })),
    ...((p4 && p4.resultados) || []).map((r) => ({ ...r, pieza: 'p4' })),
  ].filter((r) => r.precision_cupo !== null && r.precision_cupo !== undefined
    && Array.isArray(r.precision_rango95) && r.precision_rango95.length);
  const elegibles = alternativas.filter((r) => r.elegible)
    .sort((a, b) => compararTuplas(a.orden_simplicidad ?? [99], b.orden_simplicidad ?? [99]));
  const grupos = [];
  let anterior = null;
  for (const r of elegibles) {
    const clave = `${r.pieza}|${r.familia}`;
    if (clave !== anterior) {
      const nom = FAMILIAS[r.familia] ?? capital(r.familia.replaceAll('_', ' '));
      grupos.push({ lineas: r.pieza === 'p3' ? [nom] : ['Aprendizaje automático:', nom], tipo: 'alternativa', filas: [] });
      anterior = clave;
    }
    grupos[grupos.length - 1].filas.push(r);
  }
  const referencias = alternativas.filter((r) => REFERENCIAS.includes(r.familia));
  if (referencias.length) grupos.push({ lineas: ['Referencias no elegibles'], tipo: 'referencia', filas: referencias });
  return grupos;
}

function etiquetaComparacion(r) {
  if (r.familia === 'oraculo') return 'Oráculo: tasa real del tramo (techo)';
  if (r.familia === 'fuga') return capital(r.alternativa.replace(/^con fuga: /, '')) + ' (con fuga, didáctica)';
  if (r.pieza === 'p4') {
    const t = r.alternativa
      .replace(/, semilla \d+/g, '')
      .replace(/ reentrenado cada 5 d, vida media (?:de cada base|(\d+) d)/g,
        (_, dias) => (dias ? ` reentrenado (vida ${dias} d)` : ' reentrenado'));
    return capital(t);
  }
  return capital(r.alternativa);
}

/**
 * Ubica puntos de radio r alrededor de una línea (enjambre): cada punto baja o
 * sube lo mínimo para no pisar a los ya ubicados. Los primeros de la lista
 * (destacados) quedan sobre la línea. Con `soloAbajo`, el enjambre crece solo hacia
 * abajo (deja libre el espacio de arriba para un rótulo). Devuelve el desplazamiento
 * vertical de cada uno.
 */
function enjambre(xs, r, { separacion = 2, soloAbajo = false } = {}) {
  const ubicados = [];
  const minimo = 2 * r + separacion;
  return xs.map((x) => {
    for (let paso = 0; ; paso++) {
      const dy = soloAbajo ? paso * 2 : (paso % 2 ? 1 : -1) * Math.ceil(paso / 2) * 2;
      if (ubicados.every((u) => Math.hypot(u.x - x, u.dy - dy) >= minimo)) {
        ubicados.push({ x, dy });
        return dy;
      }
    }
  });
}

/**
 * Variante `resumen` (presentación proyectada): un punto por alternativa sobre un
 * solo eje de precisión en el cupo, en tres carriles (tasa por código, aprendizaje
 * automático y no elegibles). Sin rangos del 95 % (están en el informe y en la
 * variante completa). Ancho 740 (el panel de la pantalla mide ~746 px a 1920 px,
 * así 1 unidad ≈ 1 px): letra de 18 a 28 px.
 */
function figuraComparacionResumen(datos, opciones) {
  const { p3, p4, eleccion } = datos;
  const grupos = gruposComparacion(p3, p4);
  const todas = grupos.flatMap((g) => g.filas);
  if (!todas.length) return null;
  const azar = p3.resultados.find((r) => r.familia === 'azar');
  const comparacion = new Map((eleccion.comparacion || []).map((c) => [c.alternativa, c]));
  const ganadora = eleccion.ganadora?.alternativa;
  const mejor = eleccion.mejor_precision;
  const filaGanadora = todas.find((r) => r.alternativa === ganadora);
  const filaMejor = todas.find((r) => r.alternativa === mejor);
  if (!filaGanadora || !filaMejor) return null;
  const resaltarFuga = opciones.resaltar === 'fuga';
  const calificador = todas.find((r) => r.elegible)?.calificador ?? '';
  // Misma cuenta que la variante completa: empatan con la mejor, sin contar la ganadora ni la mejor.
  const empatan = todas.filter((r) => r.alternativa !== ganadora && r.alternativa !== mejor
    && comparacion.get(r.alternativa)?.empata).length;

  const carriles = [
    { clave: 'codigo', lineas: ['Tasa por código', '(referencias)'], filas: todas.filter((r) => r.elegible && r.pieza === 'p3') },
    { clave: 'ml', lineas: ['Aprendizaje', 'automático'], filas: todas.filter((r) => r.elegible && r.pieza === 'p4') },
    { clave: 'no-elegibles', lineas: ['No elegibles'], filas: todas.filter((r) => REFERENCIAS.includes(r.familia)) },
  ].filter((c) => c.filas.length);

  const ANCHO = 740;
  const TAM = { carril: 24, carrilSub: 20, destacado: 28, rotulo: 22, eje: 20, nota: 22 };
  const R = 8;
  const R_GANADORA = 13;
  const x0 = 232;
  const x1 = 712;
  const tope = Math.max(0.3, ...todas.map((r) => r.precision_cupo + 0.02));
  const esc = escala(0, tope, x0, x1);
  const titulo = 'Comparación de alternativas en validación';
  const desc = `Precisión en el cupo diario del 5 % de cada alternativa (estimación puntual), ${calificador}. `
    + `Elegida: ${nombre(ganadora)}, ${pct(filaGanadora.precision_cupo)}; mejor precisión: ${nombre(mejor)}, `
    + `${pct(filaMejor.precision_cupo)}; ${empatan} alternativas más empatan con la mejor. `
    + (azar ? `Azar al mismo cupo: ${pct(azar.azar_mismo_cupo)}. ` : '')
    + 'El oráculo (techo) y la versión con fuga (didáctica) no son elegibles.';
  const { svg, arriba } = lienzo('comparacion', ANCHO, 2000, {
    titulo, desc, opciones, subtitulo: [`Precisión en el cupo diario del 5 %, ${calificador}.`],
  });
  svg.classList.add('figura-comparacion-resumen');
  if (resaltarFuga) svg.classList.add('resaltar-fuga');

  // Enjambre por carril: la ganadora y la mejor primero, para que queden sobre la línea.
  // El carril de la ganadora crece hacia abajo: arriba va su rótulo, con la línea guía libre.
  for (const c of carriles) {
    const soloAbajo = c.filas.includes(filaGanadora);
    const orden = [...c.filas].sort((a, b) => {
      const peso = (r) => (r.alternativa === ganadora ? 0 : r.alternativa === mejor ? 1 : 2);
      return peso(a) - peso(b) || a.precision_cupo - b.precision_cupo;
    });
    const dys = enjambre(orden.map((r) => esc(r.precision_cupo)), R + 1, { soloAbajo });
    c.puntos = orden.map((r, j) => ({ r, dy: dys[j] }));
    c.sobre = Math.max(R_GANADORA, ...dys.map((d) => -d + R + 1));
    c.bajo = Math.max(R_GANADORA, ...dys.map((d) => d + R + 1));
  }
  // La mejor precisión se rotula a su derecha (en dos o tres líneas) si nada de su
  // carril queda más allá; si no, debajo del carril.
  const carrilMejor = carriles.find((c) => c.filas.includes(filaMejor));
  const xMejor = esc(filaMejor.precision_cupo);
  const lineasMejor = carrilMejor.filas.every((r) => esc(r.precision_cupo) <= xMejor + 2 * R)
    ? [['Mejor precisión', pct(filaMejor.precision_cupo)], ['Mejor', 'precisión', pct(filaMejor.precision_cupo)]]
      .find((ls) => xMejor + R + 18 + Math.max(...ls.map((l) => anchoTexto(l, TAM.rotulo))) * 1.15 <= ANCHO - 8)
    : undefined;
  const mejorAlLado = Boolean(lineasMejor);

  // Disposición vertical: rótulo del azar, rótulo de la elegida, carriles.
  const yAzar = arriba + 14;
  const yElegida = yAzar + 52;
  let y = yElegida + 22;
  for (const c of carriles) {
    y += Math.max(c.sobre + 12, 34);
    c.y = y;
    y += c.bajo + (c === carrilMejor && !mejorAlLado ? 62 : 22);
  }
  const yBase = y;

  // Grilla, eje y rótulo del eje.
  const g = el(svg, 'g', { class: 'eje' });
  for (const v of ticks(tope, 4)) {
    linea(g, esc(v), yElegida + 22, esc(v), yBase, C.linea, 1);
    texto(g, esc(v), yBase + 24, pctEje(v), { tam: TAM.eje, color: C.tenue, ancla: 'middle' });
  }
  linea(g, x0, yBase, x1, yBase, C.rango, 1.5);
  texto(g, (x0 + x1) / 2, yBase + 60, 'Precisión en el cupo (% CALIBRADA)', {
    tam: TAM.eje, color: C.tenue, ancla: 'middle',
  });

  // Azar al mismo cupo: línea vertical con su rótulo arriba, a la izquierda.
  const xAzar = azar && esNumero(azar.azar_mismo_cupo) ? esc(azar.azar_mismo_cupo) : null;
  if (xAzar !== null) {
    const xa = xAzar;
    const ga = el(svg, 'g', { class: 'referencia azar' });
    linea(ga, xa, yAzar + 12, xa, yBase, C.texto, 2);
    texto(ga, xa - 10, yAzar, `Azar al mismo cupo · ${pct(azar.azar_mismo_cupo)}`, {
      tam: TAM.rotulo, color: C.tenue, ancla: 'end',
    });
  }

  // Carriles.
  let i = 0;
  for (const c of carriles) {
    const gc = el(svg, 'g', { class: `carril carril-${c.clave}` });
    if (c.lineas.length > 1) {
      texto(gc, 20, c.y - 13, c.lineas[0], { tam: TAM.carril, peso: 600 });
      texto(gc, 20, c.y + 15, c.lineas[1], { tam: TAM.carrilSub, color: C.tenue });
    } else {
      texto(gc, 20, c.y, c.lineas[0], { tam: TAM.carril, peso: 600 });
    }
    linea(gc, x0, c.y, x1, c.y, C.linea, 1);
    // Los destacados se dibujan al final para quedar encima.
    const puntos = [...c.puntos].reverse();
    for (const { r, dy } of puntos) {
      const esGanadora = r.alternativa === ganadora;
      const esMejor = r.alternativa === mejor;
      const esFuga = r.familia === 'fuga';
      const clases = [esGanadora && 'ganadora', esMejor && 'mejor', !r.elegible && 'referencia', esFuga && 'fuga']
        .filter(Boolean).join(' ');
      const gp = fila(svg, i++, `punto ${clases}`);
      el(gp, 'title', {}, `${etiquetaComparacion(r)}: ${pct(r.precision_cupo)}`);
      const x = esc(r.precision_cupo);
      const yc = c.y + dy;
      if (!r.elegible) {
        const alerta = esFuga && resaltarFuga;
        const d = R * 1.4;
        if (alerta) el(gp, 'circle', { cx: x, cy: yc, r: d + 9, style: `fill:${C.alertaSuave}` });
        el(gp, 'path', {
          d: `M${x} ${yc - d}L${x + d} ${yc}L${x} ${yc + d}L${x - d} ${yc}Z`,
          style: `fill:${C.superficie};stroke:${alerta ? C.alerta : C.texto};stroke-width:3;stroke-linejoin:round`,
        });
        // Oráculo a la izquierda, fuga a la derecha (la fuga es la de mayor precisión).
        const rotulo = esFuga ? 'Con fuga' : 'Oráculo';
        texto(gp, esFuga ? x + d + 12 : x - d - 12, yc, rotulo, {
          tam: TAM.rotulo, ancla: esFuga ? 'start' : 'end', peso: alerta ? 600 : 400,
          color: alerta ? C.alerta : C.texto, halo: true,
        });
      } else if (esGanadora) {
        el(gp, 'circle', { cx: x, cy: yc, r: R_GANADORA + 6, style: `fill:${C.acentoSuave}` });
        el(gp, 'circle', { cx: x, cy: yc, r: R_GANADORA, style: `fill:${C.acento};stroke:${C.superficie};stroke-width:3` });
        linea(gp, x, yElegida + 20, x, yc - R_GANADORA - 6, C.acento, 2);
        // El rótulo se corre a la derecha si pisaría la línea del azar.
        const rotulo = `${FAMILIAS[r.familia] ?? capital(r.familia)} · ${pct(r.precision_cupo)}`;
        const mitad = (anchoTexto(rotulo, TAM.destacado) * 1.15) / 2;
        const xr = Math.min(xAzar === null ? x : Math.min(Math.max(x, xAzar + 16 + mitad), x + mitad - 12), ANCHO - 8 - mitad);
        texto(gp, xr, yElegida, rotulo, {
          tam: TAM.destacado, peso: 700, ancla: 'middle', halo: true,
        });
      } else if (esMejor) {
        el(gp, 'circle', { cx: x, cy: yc, r: R + 2, style: `fill:${C.texto};stroke:${C.superficie};stroke-width:2.5` });
        if (mejorAlLado) {
          lineasMejor.forEach((l, k) => texto(gp, x + R + 14, yc + (k - (lineasMejor.length - 1) / 2) * 27 + 8, l, {
            tam: TAM.rotulo, peso: 600, halo: true,
          }));
        } else {
          const yr = c.y + c.bajo + 34;
          linea(gp, x, yc + R + 4, x, yr - 16, C.texto, 1.5);
          texto(gp, x + 10, yr, `Mejor precisión · ${pct(r.precision_cupo)}`, { tam: TAM.rotulo, peso: 600, ancla: 'end', halo: true });
        }
      } else {
        el(gp, 'circle', { cx: x, cy: yc, r: R, style: `fill:${C.punto};stroke:${C.superficie};stroke-width:2` });
      }
    }
  }

  // Nota única debajo del eje (sin pie: la pantalla tiene el suyo y los rangos del
  // 95 % están en el informe); el alto final depende de si hay nota.
  let yFin = yBase + 84;
  if (empatan) {
    texto(svg, 20, yBase + 108, `Otras ${empatan} empatan con la mejor: gana la más simple.`, {
      tam: TAM.nota, peso: 500, clase: 'nota',
    });
    yFin = yBase + 132;
  }
  const alto = Math.ceil(yFin);
  svg.setAttribute('viewBox', `0 0 ${ANCHO} ${alto}`);
  svg.querySelector('rect')?.setAttribute('height', alto);
  return svg;
}

function figuraComparacion(datos, opciones) {
  if (opciones.resumen) return figuraComparacionResumen(datos, opciones);
  const { p3, p4, eleccion } = datos;
  const grupos = gruposComparacion(p3, p4);
  const azar = p3.resultados.find((r) => r.familia === 'azar');
  const comparacion = new Map((eleccion.comparacion || []).map((c) => [c.alternativa, c]));
  const ganadora = eleccion.ganadora?.alternativa;
  const mejor = eleccion.mejor_precision;
  const resaltarFuga = opciones.resaltar === 'fuga';
  const todas = grupos.flatMap((g) => g.filas);
  const calificador = todas.find((r) => r.elegible)?.calificador ?? '';

  // Notas de figuras.py; «empata con la mejor» no se repite en cada fila: va una vez en la leyenda.
  const notaDe = (r, grupo) => {
    const nota = [];
    if (r.alternativa === ganadora) nota.push(`${pct(r.precision_cupo)} · ganadora`);
    if (r.alternativa === mejor) nota.push(`${pct(r.precision_cupo)} · mejor precisión`);
    if (grupo.tipo === 'referencia') nota.push(pct(r.precision_cupo));
    else if (comparacion.has(r.alternativa) && !nota.length) {
      return comparacion.get(r.alternativa).empata ? { empata: true, texto: '' } : { empata: false, texto: 'por debajo de la mejor' };
    }
    return { empata: false, texto: nota.join(' / ') };
  };
  const empatanSinNota = grupos.flatMap((g) => g.filas.map((r) => notaDe(r, g))).filter((n) => n.empata).length;

  // Pensada para ~830 px de ancho: 1 unidad del viewBox ≈ 1 px; 31 alternativas + 2
  // referencias en ~870 px de alto, con letra de 14–15 px.
  const ANCHO = 830;
  const k = 0.75; // título, subtítulo, eje y pie en escala con el resto
  const TAM = { rotulo: 15, grupo: 14, nota: 14 };
  const PASO = 18.5;
  const SEPARACION = 3;
  const titulo = 'Comparación de alternativas en validación';
  const desc = `Precisión en el cupo por alternativa, con rango del 95 % (bootstrap por días), ${calificador}. `
    + `La ganadora (${nombre(ganadora)}) es la más simple entre las que empatan con la mejor (${nombre(mejor)}). `
    + 'El oráculo (techo) y la versión con fuga (didáctica) no son elegibles. La línea vertical es el azar al mismo cupo.';
  const { svg, arriba } = lienzo('comparacion', ANCHO, 2000, {
    titulo, desc, opciones, escala: k,
    subtitulo: [`Precisión en el cupo diario del 5 %, ${calificador}.`,
      'Rango del 95 % por bootstrap de días. Los rombos huecos son referencias que no pueden elegirse.'],
  });
  if (resaltarFuga) svg.classList.add('resaltar-fuga');

  const xGrupo = 34;      // nombres de familia (a la derecha de la llave de aprendizaje automático)
  const xEtiqueta = 450;  // borde derecho de los rótulos de fila
  const x0 = 462;
  const x1 = 712;         // las notas van a la derecha de cada intervalo
  const yInicio = arriba + 28; // rótulo del azar
  const alternativas = grupos.filter((g) => g.tipo !== 'referencia');
  const alturaFilas = todas.length * PASO + SEPARACION * (grupos.length - 1)
    + (grupos.some((g) => g.tipo === 'referencia') ? PASO : 0); // encabezado de las referencias
  const yBase = yInicio + alturaFilas + 6;
  const tope = Math.max(0.3, ...todas.map((r) => r.precision_rango95[1] + 0.02));
  const esc = escala(0, tope, x0, x1);
  eje(svg, esc, ticks(tope, 4), arriba, yBase + 64 * k, pctEje,
    'Precisión en el cupo: CALIBRADA entre los elegidos (rango del 95 %)', x0, x1, k);
  if (azar) referencia(svg, esc(azar.azar_mismo_cupo), arriba, yBase, `azar al mismo cupo: ${pct(azar.azar_mismo_cupo)}`, k);

  let y = yInicio;
  let i = 0;
  let mlDesde = null;
  let mlHasta = null;
  grupos.forEach((grupo, gi) => {
    if (gi) {
      linea(svg, xGrupo, y + SEPARACION / 2, xEtiqueta, y + SEPARACION / 2, C.linea, 1);
      y += SEPARACION;
    }
    const nom = grupo.lineas[grupo.lineas.length - 1];
    if (grupo.tipo === 'referencia') {
      // Encabezado propio: el rótulo de la versión con fuga es largo y ocupa la columna.
      texto(svg, xGrupo, y + PASO / 2, nom, { tam: TAM.grupo, peso: 600, clase: 'grupo' });
      y += PASO;
    } else {
      if (grupo.lineas.length > 1) { // aprendizaje automático: la llave común lleva ese rótulo
        mlDesde ??= y;
        mlHasta = y + grupo.filas.length * PASO;
      }
      const lineas = grupo.filas.length > 1 ? partir(nom, 15).slice(0, grupo.filas.length) : [nom];
      lineas.forEach((l, li) => texto(svg, xGrupo, y + PASO * (li + 0.5), l, { tam: TAM.grupo, peso: 600, clase: 'grupo' }));
    }
    for (const r of grupo.filas) {
      const yc = y + PASO / 2;
      const esGanadora = r.alternativa === ganadora;
      const esMejor = r.alternativa === mejor;
      const esFuga = resaltarFuga && r.familia === 'fuga';
      const tipo = esFuga ? 'fuga' : grupo.tipo === 'referencia' ? 'referencia' : esGanadora ? 'destacada' : 'normal';
      const clases = [esGanadora && 'ganadora', esMejor && 'mejor', grupo.tipo === 'referencia' && 'referencia',
        r.familia === 'fuga' && 'fuga'].filter(Boolean).join(' ');
      const g = fila(svg, i, clases);
      if (esFuga) rect(g, 6, yc - PASO / 2, ANCHO - 12, PASO, C.alertaSuave, { radio: 4 });
      texto(g, xEtiqueta, yc, etiquetaComparacion(r), {
        tam: TAM.rotulo, ancla: 'end', peso: esGanadora || esFuga ? 600 : 400, color: esFuga ? C.alerta : C.texto,
      });
      puntoIntervalo(g, esc, yc, r.precision_cupo, r.precision_rango95, tipo, 6);
      const nota = notaDe(r, grupo).texto;
      if (nota) {
        const fuerte = esGanadora || esMejor || esFuga;
        texto(g, esc(r.precision_rango95[1]) + 10, yc, nota, {
          tam: TAM.nota, color: esFuga ? C.alerta : fuerte ? C.texto : C.tenue, peso: fuerte ? 600 : 400, halo: true,
        });
      }
      y += PASO;
      i += 1;
    }
  });
  if (mlDesde !== null && alternativas.length) {
    const xLlave = 20;
    el(svg, 'path', {
      d: `M${xLlave + 6} ${mlDesde + 3}H${xLlave}V${mlHasta - 3}H${xLlave + 6}`,
      style: `fill:none;stroke:${C.tenue};stroke-width:1.5`,
    });
    const yc = (mlDesde + mlHasta) / 2;
    texto(svg, xLlave - 8, yc, 'Aprendizaje automático', {
      tam: TAM.grupo, color: C.tenue, ancla: 'middle', clase: 'grupo',
    }).setAttribute('transform', `rotate(-90 ${xLlave - 8} ${yc})`);
  }

  // Leyenda y pie, debajo del eje; el alto final del viewBox depende de cuántas líneas ocupen.
  const pie = [
    empatanSinNota ? `Sin nota: empata con la mejor (${empatanSinNota} alternativas).` : '',
    opciones.titulo === false ? 'Los rombos huecos son referencias que no pueden elegirse.' : '',
    'Regla de elección (#10): mayor precisión en el cupo; si el rango pareado de la diferencia con la mejor '
      + 'incluye 0, empatan y gana la más simple.',
  ].filter(Boolean).join(' ');
  const tamPie = T.pie * k;
  let yPie = yBase + 64 * k + 22;
  for (const l of partir(pie, Math.floor((ANCHO - 64) / (tamPie * LETRA)))) {
    texto(svg, 32, yPie, l, { tam: tamPie, color: C.tenue, clase: 'figura-pie' });
    yPie += tamPie * 1.3;
  }
  const alto = Math.ceil(yPie + 4);
  svg.setAttribute('viewBox', `0 0 ${ANCHO} ${alto}`);
  svg.querySelector('rect')?.setAttribute('height', alto);
  return svg;
}

// --- 2. veces_azar_prueba_final: CatBoost en la prueba final, por tramo -------

const PREREGISTRO_CATBOOST = 'solucion/preregistro-precision.json';
// Tramos que se grafican (prueba-final.json → corridas[].tramos[].tramo) y su rótulo.
const TRAMOS_PRUEBA = [
  ['prueba completa', 'Prueba completa', (t) => `Día ${t.dias_del_vin[0]}–${t.dias_del_vin[1]}`],
  ['prueba ≤260', 'Prueba ≤260', (t) => `Día ${t.dias_del_vin[0]}–${t.dias_del_vin[1]}`],
  ['sensibilidad con la cohorte posterior a 260', 'Sensibilidad con la', () => 'cohorte posterior a 260'],
];

function figuraPruebaFinal(datos, opciones) {
  // La primera corrida del preregistro de CatBoost (corridas[1]); corridas[2]
  // la repite exactamente y no se grafica. Una fila por tramo.
  const corrida = datos.pruebaFinal.corridas.find((c) => c.preregistro === PREREGISTRO_CATBOOST);
  if (!corrida) return null;
  const filas = [];
  for (const [clave, linea1, linea2] of TRAMOS_PRUEBA) {
    const t = corrida.tramos?.find((x) => x.tramo === clave);
    const g = t?.ganadora;
    if (!g || !esNumero(g.veces_azar) || !esRango(g.veces_azar_rango95) || !esRango(t.dias_del_vin)) continue;
    filas.push({
      linea1, linea2: linea2(t), g, valor: g.veces_azar, rango: g.veces_azar_rango95, destacada: !filas.length,
      valorTexto: veces(g.veces_azar),
      valorSub: `${veces(g.veces_azar_rango95[0]).replace(/\s×$/, '')} a ${veces(g.veces_azar_rango95[1])}`,
    });
  }
  if (!filas.length) return null;
  const principal = filas[0].g;
  const sinPct = (x) => pct(x).replace(/\s%$/, '');

  // Pensada para ~900 px de ancho (1 unidad ≈ 1 px). El panel de la pantalla la
  // muestra a ~0,8: rótulos de 28 y valores de 40 (≥ 22 px efectivos), rangos y
  // eje de 23 (≥ 18 px efectivos).
  const ANCHO = 900;
  const TAM = { rotulo: 28, valor: 40, rango: 23, eje: 23, ref: 23 };
  const PASO = 120;
  const { svg, arriba } = lienzo('veces_azar_prueba_final', ANCHO, 2000, {
    titulo: 'Prueba final: veces el azar de CatBoost',
    subtitulo: [`Prueba completa: ${sinPct(principal.precision_cupo)} de cada 100 elegidos, `
      + `contra ${sinPct(principal.azar_mismo_cupo)} al azar; ${principal.calificador}.`],
    desc: `Veces el azar en la prueba final de ${nombre(corrida.ganadora?.alternativa)} (preregistro de precisión, `
      + 'primera corrida), con rango del 95 % por bootstrap de días: '
      + filas.map((f) => `${f.linea1} ${f.linea2}: ${pct(f.g.precision_cupo)} contra ${pct(f.g.azar_mismo_cupo)} al azar, `
        + `${f.valorTexto} (${f.valorSub}), lectura ${f.g.lectura}, ${f.g.calificador}`).join('; ') + '.',
    opciones,
  });
  const xEtiqueta = 24;
  const x0 = 400;
  const x1 = 680;
  const xValor = 706;
  const dominio = Math.max(2.5, ...filas.map((f) => f.rango[1] + 0.1));
  const esc = escala(0, dominio, x0, x1);
  const yAzar = arriba + 14;
  const yInicio = yAzar + 26;
  const yBase = yInicio + PASO * filas.length;

  const g = el(svg, 'g', { class: 'eje' });
  for (const v of ticks(dominio, 3)) {
    linea(g, esc(v), yInicio, esc(v), yBase, C.linea, 1);
    texto(g, esc(v), yBase + 26, v.toFixed(1).replace('.', ',') + NBSP + '×', { tam: TAM.eje, color: C.tenue, ancla: 'middle' });
  }
  linea(g, x0, yBase, x1, yBase, C.rango, 1.5);
  texto(g, (x0 + x1) / 2, yBase + 64, 'Veces el azar (rango del 95 %)', { tam: TAM.eje, color: C.tenue, ancla: 'middle' });

  const gr = el(svg, 'g', { class: 'referencia' });
  linea(gr, esc(1), yAzar + 12, esc(1), yBase, C.texto, 2);
  texto(gr, esc(1) - 10, yAzar, `Azar = 1${NBSP}×`, { tam: TAM.ref, color: C.tenue, ancla: 'end' });

  filas.forEach((f, i) => {
    const y = yInicio + PASO * (i + 0.5);
    const gf = fila(svg, i, f.destacada ? 'destacada' : '');
    texto(gf, xEtiqueta, y - 17, f.linea1, { tam: TAM.rotulo, peso: 700, color: f.destacada ? C.texto : C.tenue });
    texto(gf, xEtiqueta, y + 17, f.linea2, { tam: TAM.rotulo, peso: f.destacada ? 600 : 400 });
    puntoIntervalo(gf, esc, y, f.valor, f.rango, f.destacada ? 'destacada' : 'normal', f.destacada ? 13 : 11);
    texto(gf, xValor, y - 15, f.valorTexto, { tam: TAM.valor, peso: 700, color: f.destacada ? C.texto : C.tenue });
    texto(gf, xValor, y + 26, f.valorSub, { tam: TAM.rango, color: C.tenue });
  });

  const alto = Math.ceil(yBase + 90);
  svg.setAttribute('viewBox', `0 0 ${ANCHO} ${alto}`);
  svg.querySelector('rect')?.setAttribute('height', alto);
  return svg;
}

// --- 3. donde_mirar (figuras.py:415-439) ----------------------------------------

function figuraDondeMirar(datos, opciones) {
  const c = datos.p6.componente;
  const grupos = [['todas_las_calibrada', 'todas'], ['calibrada_elegidas_por_la_ganadora', 'elegidas']];
  const filas = [];
  for (const [clave, rotulo] of grupos) {
    const g = c?.[clave];
    if (!g || !esNumero(g.acierto_codigo)) continue;
    for (const [k, txt, propia] of [['acierto_codigo', 'Top 3 del código', true], ['acierto_general', 'Top 3 general', false]]) {
      const rango = g[`${k}_rango95`];
      filas.push({
        etiqueta: `${txt} · ${rotulo} (n = ${g.calibrada_evaluadas})`, valor: g[k],
        rango: esRango(rango) ? rango : null, destacada: propia, valorTexto: pct(g[k]),
      });
    }
  }
  if (!filas.length) return null;
  const calificador = c.todas_las_calibrada?.calificador ?? datos.p6.calificador?.componente ?? '';
  const tope = Math.max(...filas.map((f) => f.valor), ...filas.filter((f) => f.rango).map((f) => f.rango[1]));
  return figuraPuntos('donde_mirar', opciones, {
    titulo: '«Dónde mirar»: acierto del componente en los 3 primeros',
    subtitulo: [`${capital(calificador)}.`],
    desc: 'Acierto en los 3 primeros componentes por código («top 3 del código») frente a los 3 más frecuentes en '
      + 'general, sobre todas las CALIBRADA de validación y sobre las CALIBRADA que eligió la ganadora, '
      + `${calificador}.`,
    filas,
    dominio: [0, tope * 1.15],
    formatoEje: pctEje,
    rotuloX: 'CALIBRADA cuyo componente está entre los 3 sugeridos',
    pie: c.lectura,
    xEtiqueta: 500, xPlot1: 1050, xValores: 1072,
  });
}

// --- 4. etiquetas_parciales (figuras.py:393-412) --------------------------------

function figuraEtiquetasParciales(datos, opciones) {
  const p5 = datos.p5;
  const elegida = typeof p5.politica === 'object' && p5.politica ? p5.politica.nombre : null;
  const filas = [];
  for (const r of Array.isArray(p5.resultados) ? p5.resultados : []) {
    const nom = ['alternativa', 'nombre', 'politica'].map((k) => r[k]).find((v) => typeof v === 'string');
    if (!nom || !esNumero(r.precision_cupo)) continue;
    filas.push({
      etiqueta: capital(nom), valor: r.precision_cupo,
      rango: esRango(r.precision_rango95) ? r.precision_rango95 : null,
      destacada: Boolean(r.elegida || r.ganadora || nom === elegida), valorTexto: pct(r.precision_cupo),
    });
  }
  if (!filas.length) return null;
  const calificador = typeof p5.calificador === 'string' ? p5.calificador
    : p5.resultados.find((r) => typeof r.calificador === 'string')?.calificador ?? '';
  const tope = Math.max(...filas.map((f) => f.valor), ...filas.filter((f) => f.rango).map((f) => f.rango[1]));
  return figuraPuntos('etiquetas_parciales', opciones, {
    titulo: 'Políticas con etiquetas parciales en validación',
    subtitulo: [`${capital(calificador)}.`],
    desc: 'Precisión en el cupo de cada política de exploración con etiquetas parciales '
      + `(solo se conoce lo inspeccionado desde el Día 155), ${calificador}.`,
    filas,
    dominio: [0, tope * 1.15],
    formatoEje: pctEje,
    rotuloX: 'Precisión en el cupo (rango del 95 %)',
    pie: typeof p5.supuesto === 'string' ? `Supuesto: ${p5.supuesto}.` : undefined,
    xEtiqueta: 500, xPlot1: 1050, xValores: 1072,
  });
}

// --- 5. detector (figuras.py:442-465, en barras) --------------------------------

function figuraDetector(datos, opciones) {
  const d = datos.p6.detector;
  const potencia = d?.potencia_validacion;
  if (!potencia) return null;
  const rotulos = [['sube_x2', 'La tasa se duplica'], ['baja_a_la_mitad', 'La tasa baja a la mitad']];
  const filas = rotulos.map(([k, t]) => ({ clave: k, etiqueta: t, v: potencia[k] }))
    .filter((f) => f.v && esNumero(f.v.deteccion));
  if (!filas.length) return null;
  const calificador = d.calificador ?? datos.p6.calificador?.detector ?? '';
  const conf = d.configuracion ?? {};
  const pie = [
    esNumero(potencia.dia_cambio) && `Cambio inyectado el Día ${potencia.dia_cambio}`,
    esNumero(potencia.codigos) && `en ${potencia.codigos} códigos`,
    esNumero(potencia.replicas) && `${potencia.replicas} réplicas`,
    esNumero(conf.falsas_alarmas_cada_30_dia_max)
      && `umbral calibrado con ≤149 para ≤${String(conf.falsas_alarmas_cada_30_dia_max).replace('.', ',')} falsa alarma cada 30 días`,
  ].filter(Boolean).join(', ');
  const { svg, arriba, abajo } = lienzo('detector', 1200, 675, {
    titulo: 'Detector de cambios: detección de cambios sintéticos', opciones,
    subtitulo: [`${capital(calificador)}.`],
    pie: pie ? pie + '.' : undefined,
    desc: `Detección del CUSUM de Bernoulli por código ante cambios sintéticos inyectados en validación en ${potencia.codigos} códigos: `
      + filas.map((f) => `${f.etiqueta.toLowerCase()} ${pct(f.v.deteccion)}`).join('; ') + '.',
  });
  const xEtiqueta = 400;
  const x0 = 428;
  const x1 = 960;
  const esc = escala(0, 1, x0, x1);
  const yBase = eje(svg, esc, [0, 0.2, 0.4, 0.6, 0.8, 1], arriba, abajo, pctEje, 'Cambios sintéticos detectados', x0, x1);
  const paso = Math.min(150, (yBase - 8 - arriba) / filas.length);
  filas.forEach((f, i) => {
    const y = arriba + paso * (i + 0.5);
    const g = fila(svg, i, f.clave === 'sube_x2' ? 'destacada' : '');
    const demora = f.v.demora_mediana_dia;
    texto(g, xEtiqueta, esNumero(demora) ? y - 14 : y, f.etiqueta, { tam: 25, ancla: 'end', peso: 500 });
    if (esNumero(demora)) {
      texto(g, xEtiqueta, y + 17, `demora mediana ${demora.toFixed(0)} días`, { tam: 19, ancla: 'end', color: C.tenue });
    }
    const alto = 56;
    rect(g, x0, y - alto / 2, esc(f.v.deteccion) - x0, alto, f.clave === 'sube_x2' ? C.acento : C.punto, { radio: 4 });
    const xv = esc(f.v.deteccion) + 16;
    const conCasos = esNumero(f.v.detectadas) && esNumero(f.v.casos);
    texto(g, xv, conCasos ? y - 13 : y, pct(f.v.deteccion), { tam: 28, peso: 600, halo: true });
    if (conCasos) {
      texto(g, xv, y + 17, `${entero(f.v.detectadas)} de ${entero(f.v.casos)} casos`, { tam: 18, color: C.tenue, halo: true });
    }
  });
  return svg;
}

// --- 6. particiones (nueva: días 1–284) ------------------------------------------

function figuraParticiones(datos, opciones) {
  const cp = datos.preparacion.control_particiones;
  const hastaComparacion = datos.eleccion.ganadora?.parametros?.hasta;
  const m = String(datos.p3.tramo ?? '').match(/(\d+)\s*[–-]\s*(\d+)/);
  const corrida = datos.pruebaFinal.corridas[0];
  const hastaFinal = corrida.ganadora?.parametros?.hasta;
  const tramoCompleto = corrida.tramos.find((t) => t.tramo === 'prueba completa');
  const tramo260 = corrida.tramos.find((t) => t.tramo === 'prueba ≤260');
  if (!esNumero(hastaComparacion) || !m || !esNumero(hastaFinal) || !tramoCompleto || !tramo260) return null;
  const valIni = Number(m[1]);
  const valFin = Number(m[2]);
  const [pruIni, pruFin] = tramoCompleto.dias_del_vin;
  const corte = tramo260.dias_del_vin[1];
  const DIA_INICIAL = 1; // base completa: Día 1–284 (cifras.js, tramo «base»)

  // Ancho 740 (el panel de la pantalla mide ~746 px a 1920 px, así 1 unidad ≈ 1 px):
  // el carril ocupa todo el ancho y su nombre va arriba; letra de 18 a 26 px.
  const ANCHO = 740;
  const TAM = { carril: 26, tramo: 24, detalle: 22, margen: 18, eje: 20, llave: 22 };
  const { svg, arriba } = lienzo('particiones', ANCHO, 2000, {
    titulo: 'Cómo se separaron los días', opciones,
    subtitulo: [`Cada VIN cuenta en un solo tramo, según su Día del VIN. Entre entrenamiento y evaluación, `
      + `${valIni - hastaComparacion - 1} días de margen sin etiquetas.`],
    desc: `Elección: entrenamiento Día ${DIA_INICIAL}–${hastaComparacion} (${entero(cp.entrenamiento_comparacion.vins)} VIN), `
      + `validación ${valIni}–${valFin} (${entero(cp.validacion.vins)} VIN). Prueba final: entrenamiento ${DIA_INICIAL}–${hastaFinal} `
      + `(${entero(cp.entrenamiento_final.vins)} VIN), prueba ${pruIni}–${pruFin} (${entero(cp.prueba_final.vins)} VIN; `
      + `>${corte}, solo descriptivo). Población principal: ${entero(cp.poblacion_principal.vins)} VIN con primera `
      + `inspección ≤ DIA_${corte}; ${entero(cp.cohorte_posterior_260.vins)} VIN con primera inspección posterior van aparte. `
      + 'Base ficticia.',
  });
  const x0 = 16;
  const x1 = 724;
  const dia = escala(DIA_INICIAL - 1, pruFin, x0, x1); // el día d ocupa [dia(d - 1), dia(d)]
  const tramoX = (a, b) => [dia(a - 1), dia(b)];
  const alto = 92;
  const yCarril1 = arriba + 34 + alto / 2;
  const yCarril2 = yCarril1 + alto + 84;
  const carriles = [
    {
      etiqueta: 'Elección', y: yCarril1,
      segmentos: [
        { a: DIA_INICIAL, b: hastaComparacion, t: 'Entrenamiento', d: `Día ${DIA_INICIAL}–${hastaComparacion}`, tipo: 'entrena' },
        { a: hastaComparacion + 1, b: valIni - 1, tipo: 'margen' },
        { a: valIni, b: valFin, t: 'Validación', d: `Día ${valIni}–${valFin}`, tipo: 'evalua' },
      ],
    },
    {
      etiqueta: 'Prueba final (corrida única)', y: yCarril2,
      segmentos: [
        { a: DIA_INICIAL, b: hastaFinal, t: 'Entrenamiento final', d: `Día ${DIA_INICIAL}–${hastaFinal}`, tipo: 'entrena' },
        { a: hastaFinal + 1, b: pruIni - 1, tipo: 'margen' },
        { a: pruIni, b: corte, t: `≤${corte}`, d: `${pruIni}–${corte}`, tipo: 'prueba' },
        { a: corte + 1, b: pruFin, t: `>${corte}`, d: `${corte + 1}–${pruFin}`, tipo: 'descriptiva' },
      ],
    },
  ];
  // Líneas para rotular un tramo a su derecha ([nombre, detalle] o [nombre, días, VIN]), o null.
  const alLado = (s, xb) => [[s.d], s.d.split(' · ')].map((partes) => [s.t, ...partes]).find((lineas) =>
    Math.max(...lineas.map((l, k) => anchoTexto(l, k ? TAM.detalle : TAM.tramo))) * 1.12 <= x1 - xb - 14) ?? null;
  let i = 0;
  for (const c of carriles) {
    const arribaBarra = c.y - alto / 2;
    const yRotulo = arribaBarra - 22;
    texto(svg, x0, yRotulo, c.etiqueta, { tam: TAM.carril, peso: 600 });
    rect(svg, x0, arribaBarra, x1 - x0, alto, C.linea, { radio: 6 });
    for (const s of c.segmentos) {
      const [xa, xb] = tramoX(s.a, s.b);
      const g = fila(svg, i++, `segmento ${s.tipo}`);
      if (s.tipo === 'margen') {
        rect(g, xa, arribaBarra, xb - xa, alto, C.superficie);
        // Solo «margen»: los días de cada margen están en el pie de la pantalla y en <desc>.
        texto(g, (xa + xb) / 2, yRotulo, 'margen', { tam: TAM.margen, color: C.tenue, ancla: 'middle' });
        linea(g, (xa + xb) / 2, yRotulo + 12, (xa + xb) / 2, arribaBarra, C.tenue, 1.5);
        continue;
      }
      const relleno = { entrena: C.punto, evalua: C.acento, prueba: C.acento, descriptiva: C.acentoSuave }[s.tipo];
      rect(g, xa + 1, arribaBarra, xb - xa - 2, alto, relleno, { radio: 4 });
      const ancho = xb - xa - 24;
      const color = s.tipo === 'entrena' ? C.superficie : s.tipo === 'descriptiva' ? C.texto : C.sobreAcento;
      if (anchoTexto(s.t, TAM.tramo) * 1.12 <= ancho && anchoTexto(s.d, TAM.detalle) * 1.1 <= ancho) {
        // Adentro: a la izquierda en los tramos largos, centrado en los cortos.
        const centrado = ancho < 260;
        const x = centrado ? (xa + xb) / 2 : xa + 14;
        const ancla = centrado ? 'middle' : 'start';
        texto(g, x, c.y - 14, s.t, { tam: TAM.tramo, peso: 700, color, ancla });
        texto(g, x, c.y + 18, s.d, { tam: TAM.detalle, color, peso: 500, ancla });
      } else if (alLado(s, xb)) {
        // A la derecha, sobre la pista vacía del carril: en dos líneas o, si no entra, en tres.
        const lineas = alLado(s, xb);
        lineas.forEach((l, k) => {
          const yl = c.y + (k - (lineas.length - 1) / 2) * 28;
          texto(g, xb + 14, yl, l, k ? { tam: TAM.detalle, color: C.tenue } : { tam: TAM.tramo, peso: 700 });
        });
      } else {
        // Sin lugar al lado (el tramo final): arriba, con una línea guía.
        const xm = (xa + xb) / 2;
        texto(g, x1, yRotulo, `${s.t} · ${s.d}`, { tam: TAM.llave, peso: 600, ancla: 'end' });
        linea(g, xm, yRotulo + 14, xm, arribaBarra, C.tenue, 1.5);
      }
    }
  }
  // Llave bajo la prueba final.
  const [pa, pb] = tramoX(pruIni, pruFin);
  const yLlave = yCarril2 + alto / 2 + 12;
  const gl = fila(svg, i++, 'llave');
  el(gl, 'path', {
    d: `M${pa + 1} ${yLlave - 6}V${yLlave}H${pb - 1}V${yLlave - 6}`,
    style: `fill:none;stroke:${C.tenue};stroke-width:1.5`,
  });
  texto(gl, pb, yLlave + 26, `Prueba final · Día ${pruIni}–${pruFin}`, {
    tam: TAM.llave, ancla: 'end', peso: 600,
  });
  // Eje de días.
  const yEje = yLlave + 66;
  linea(svg, x0, yEje, x1, yEje, C.rango, 1.5);
  for (const d of [DIA_INICIAL, 50, 100, 150, 200, 250, pruFin]) {
    const x = d === DIA_INICIAL ? dia(d - 1) : dia(d);
    linea(svg, x, yEje, x, yEje + 6, C.rango, 1.5);
    texto(svg, x, yEje + 24, String(d), {
      tam: TAM.eje, color: C.tenue, ancla: d === DIA_INICIAL ? 'start' : d === pruFin ? 'end' : 'middle',
    });
  }
  texto(svg, (x0 + x1) / 2, yEje + 56, 'Día del VIN', { tam: TAM.eje, color: C.tenue, ancla: 'middle' });
  const altoTotal = Math.ceil(yEje + 76);
  svg.setAttribute('viewBox', `0 0 ${ANCHO} ${altoTotal}`);
  svg.querySelector('rect')?.setAttribute('height', altoTotal);
  return svg;
}

// --- 7. seleccion: elección por precisión en bloques de tiempo (precision.json) --

/**
 * Un punto por alternativa del ranking (estimación puntual en selección), sobre un
 * solo eje. Solo se rotulan CatBoost (la ganadora), el azar y el oráculo; las demás
 * alternativas quedan anónimas. Ancho 740 (≈ 1 px por unidad en el panel de 746 px):
 * letra de 20 a 28 px.
 */
function figuraSeleccion(datos, opciones) {
  const p = datos.precision;
  const ranking = (Array.isArray(p.ranking) ? p.ranking : [])
    .filter((r) => r.elegible !== false && esNumero(r.precision_seleccion));
  const ganadora = ranking.find((r) => r.clave === p.ganadora?.clave);
  const azar = p.azar?.precision_seleccion;
  const oraculo = p.oraculo?.precision_seleccion;
  const bloques = p.protocolo?.bloques_seleccion;
  const elegidos = p.ganadora?.elegidos_seleccion;
  if (!ganadora || !esNumero(azar) || !esNumero(oraculo) || !Array.isArray(bloques) || !bloques.length
    || !esNumero(elegidos)) return null;
  const diaIni = bloques[0][0];
  const diaFin = bloques[bloques.length - 1][1];

  const ANCHO = 740;
  const TAM = { destacado: 28, rotulo: 22, eje: 20, nota: 22 };
  const R = 8;
  const R_GANADORA = 13;
  const x0 = 40;
  const x1 = 700;
  // Dominio en múltiplos de 5 puntos que contienen todos los valores.
  const valores = [azar, oraculo, ...ranking.map((r) => r.precision_seleccion)];
  const dmin = Math.floor(Math.min(...valores) * 20) / 20;
  const dmax = Math.ceil(Math.max(...valores) * 20) / 20;
  const esc = escala(dmin, dmax, x0, x1);
  const desc = `Precisión en el cupo diario del 5 % de cada una de las ${ranking.length} alternativas elegibles, `
    + `selección Día ${diaIni}–${diaFin} (${entero(elegidos)} elegidos por alternativa), ${p.calificador_seleccion ?? ''}. `
    + `CatBoost con atributos del código: ${pct(ganadora.precision_seleccion)}; azar: ${pct(azar)}; `
    + `oráculo (techo con el código, no elegible): ${pct(oraculo)}. Los primeros empatan: es una familia.`;
  const { svg, arriba } = lienzo('seleccion', ANCHO, 2000, {
    titulo: 'Elección por precisión en bloques de tiempo', desc, opciones,
    subtitulo: [`Precisión en el cupo, selección Día ${diaIni}–${diaFin}.`],
  });

  // Enjambre hacia abajo: CatBoost primero (queda sobre la línea), después de
  // izquierda a derecha.
  const orden = [ganadora, ...ranking.filter((r) => r !== ganadora)
    .sort((a, b) => a.precision_seleccion - b.precision_seleccion)];
  const dys = enjambre(orden.map((r) => esc(r.precision_seleccion)), R + 1, { soloAbajo: true });
  const bajo = Math.max(R_GANADORA, ...dys.map((dy) => dy + R + 1));

  // Disposición vertical: rótulos del azar y del oráculo, rótulo de CatBoost,
  // puntos, eje y nota.
  const yRef = arriba + 14;
  const yGanadora = yRef + 52;
  const yLinea = yGanadora + 22 + R_GANADORA + 18;
  const yBase = yLinea + bajo + 22;

  const g = el(svg, 'g', { class: 'eje' });
  for (let k = 0; dmin + k * 0.05 <= dmax + 1e-9; k++) {
    const v = +(dmin + k * 0.05).toFixed(4);
    linea(g, esc(v), yGanadora + 22, esc(v), yBase, C.linea, 1);
    texto(g, esc(v), yBase + 24, pctEje(v), { tam: TAM.eje, color: C.tenue, ancla: 'middle' });
  }
  linea(g, x0, yBase, x1, yBase, C.rango, 1.5);
  texto(g, (x0 + x1) / 2, yBase + 60, `Precisión en el cupo (${entero(elegidos)} elegidos)`, {
    tam: TAM.eje, color: C.tenue, ancla: 'middle',
  });

  // Azar: línea vertical, rótulo arriba a su derecha.
  const xAzar = esc(azar);
  const ga = el(svg, 'g', { class: 'referencia azar' });
  linea(ga, xAzar, yRef + 14, xAzar, yBase, C.texto, 2);
  texto(ga, xAzar + 10, yRef, `Azar · ${pct(azar)}`, { tam: TAM.rotulo, color: C.tenue });

  let i = 0;
  // Oráculo: rombo hueco sobre la línea, rótulo arriba con línea guía.
  const xOr = esc(oraculo);
  const go = fila(svg, i++, 'punto referencia oraculo');
  el(go, 'title', {}, `Oráculo (techo con el código, no elegible): ${pct(oraculo)}`);
  const d = R * 1.5;
  el(go, 'path', {
    d: `M${xOr} ${yLinea - d}L${xOr + d} ${yLinea}L${xOr} ${yLinea + d}L${xOr - d} ${yLinea}Z`,
    style: `fill:${C.superficie};stroke:${C.texto};stroke-width:3;stroke-linejoin:round`,
  });
  const rotuloOr = `Oráculo · ${pct(oraculo)}`;
  const mitadOr = (anchoTexto(rotuloOr, TAM.rotulo) * 1.15) / 2;
  texto(go, Math.min(xOr, ANCHO - 8 - mitadOr), yRef, rotuloOr, { tam: TAM.rotulo, ancla: 'middle', halo: true });
  linea(go, xOr, yRef + 16, xOr, yLinea - d - 6, C.tenue, 1.5);

  // Alternativas: de izquierda a derecha para la cascada; CatBoost al final, encima.
  const puntos = orden.map((r, j) => ({ r, dy: dys[j] })).slice(1)
    .sort((a, b) => a.r.precision_seleccion - b.r.precision_seleccion);
  for (const { r, dy } of puntos) {
    const gp = fila(svg, i++, 'punto');
    el(gp, 'title', {}, pct(r.precision_seleccion));
    el(gp, 'circle', {
      cx: esc(r.precision_seleccion), cy: yLinea + dy, r: R,
      style: `fill:${C.punto};stroke:${C.superficie};stroke-width:2`,
    });
  }
  const xG = esc(ganadora.precision_seleccion);
  const gg = fila(svg, i++, 'punto ganadora');
  el(gg, 'title', {}, `CatBoost con atributos del código: ${pct(ganadora.precision_seleccion)}`);
  el(gg, 'circle', { cx: xG, cy: yLinea, r: R_GANADORA + 6, style: `fill:${C.acentoSuave}` });
  el(gg, 'circle', { cx: xG, cy: yLinea, r: R_GANADORA, style: `fill:${C.acento};stroke:${C.superficie};stroke-width:3` });
  linea(gg, xG, yGanadora + 20, xG, yLinea - R_GANADORA - 6, C.acento, 2);
  const rotuloG = `CatBoost · ${pct(ganadora.precision_seleccion)}`;
  const mitadG = (anchoTexto(rotuloG, TAM.destacado) * 1.15) / 2;
  texto(gg, Math.max(xAzar + 16 + mitadG, Math.min(xG, ANCHO - 8 - mitadG)), yGanadora, rotuloG, {
    tam: TAM.destacado, peso: 700, ancla: 'middle', halo: true,
  });

  const gn = fila(svg, i++, 'nota');
  texto(gn, 20, yBase + 106, 'Los primeros empatan: es una familia.', { tam: TAM.nota, peso: 500, clase: 'nota' });
  const alto = Math.ceil(yBase + 130);
  svg.setAttribute('viewBox', `0 0 ${ANCHO} ${alto}`);
  svg.querySelector('rect')?.setAttribute('height', alto);
  return svg;
}

const CONSTRUCTORES = {
  comparacion: figuraComparacion,
  veces_azar_prueba_final: figuraPruebaFinal,
  donde_mirar: figuraDondeMirar,
  etiquetas_parciales: figuraEtiquetasParciales,
  detector: figuraDetector,
  particiones: figuraParticiones,
  seleccion: figuraSeleccion,
};
