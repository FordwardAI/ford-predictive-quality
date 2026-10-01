// Figuras de datos como SVG inline, dibujadas desde los agregados ya publicados
// (solucion/resultados/*.json). Contrato con ui.js:
//
//   crear(id, { datos, opciones }) -> SVGElement | null
//   cargarDatos(leerJson?) -> Promise<datos>
//   disponible(id, datos) -> boolean
//   ajustar(svg)  (ya en el documento: comprime textos que no entren)
//
// `id`: comparacion | veces_azar_prueba_final | donde_mirar | etiquetas_parciales
//       | detector | particiones
// `datos`: lo que devuelve cargarDatos(): un JSON por clave (p3, p4, eleccion,
//   pruebaFinal, p5, p6, preparacion), o null si ese fetch falló.
// `opciones`: { resaltar: 'fuga' } en `comparacion`; { titulo: false } en todas
//   para omitir el título y el subtítulo internos (la pantalla ya tiene titular).
// Devuelve null si falta un JSON que la figura necesita; ui.js usa entonces el
// SVG de matplotlib de respaldo (docs/entrega/figuras/).
//
// Reglas:
// - Ninguna cifra escrita a mano: todo número sale del JSON. Los textos fijos
//   (títulos, pies, rótulos de familia) son los de solucion/figuras.py.
// - Solo agregados: ningún VIN, ninguna tasa por código ni por mercado.
// - Colores solo por variables CSS (--figura-*), con respaldo para el tema
//   oscuro Twilight. Para un contenedor claro, definir las variables (ver
//   herramientas/figuras-demo.html).
// - Cada fila (o segmento) es un <g class="fila" style="--i: n"> para que la
//   interfaz pueda animarlas en cascada; el SVG no anima nada por sí mismo.
// - viewBox 1200×675 (16:9), salvo `comparacion`: 1000×1100, porque 31
//   alternativas y 2 referencias no entran legibles en 16:9.

import { formatear } from './cifras.js';

export const IDS = [
  'comparacion',
  'veces_azar_prueba_final',
  'donde_mirar',
  'etiquetas_parciales',
  'detector',
  'particiones',
];

// JSON que necesita cada figura (clave en `datos`).
const REQUISITOS = {
  comparacion: ['p3', 'p4', 'eleccion'],
  veces_azar_prueba_final: ['pruebaFinal'],
  donde_mirar: ['p6'],
  etiquetas_parciales: ['p5'],
  detector: ['p6'],
  particiones: ['preparacion', 'p3', 'eleccion', 'pruebaFinal'],
};

const ARCHIVOS = {
  p3: 'solucion/resultados/p3.json',
  p4: 'solucion/resultados/p4.json',
  eleccion: 'solucion/resultados/eleccion.json',
  pruebaFinal: 'solucion/resultados/prueba-final.json',
  p5: 'solucion/resultados/p5.json',
  p6: 'solucion/resultados/p6.json',
  preparacion: 'solucion/resultados/preparacion.json',
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
    lineas.forEach((l, i) => texto(svg, margen, alto - 20 - (lineas.length - 1 - i) * tam * 1.3, l, { tam, color: C.tenue, clase: 'pie' }));
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

function figuraComparacion(datos, opciones) {
  const { p3, p4, eleccion } = datos;
  const grupos = gruposComparacion(p3, p4);
  const azar = p3.resultados.find((r) => r.familia === 'azar');
  const comparacion = new Map((eleccion.comparacion || []).map((c) => [c.alternativa, c]));
  const ganadora = eleccion.ganadora?.alternativa;
  const mejor = eleccion.mejor_precision;
  const resaltarFuga = opciones.resaltar === 'fuga';
  const todas = grupos.flatMap((g) => g.filas);
  const calificador = todas.find((r) => r.elegible)?.calificador ?? '';

  const ANCHO = 1000;
  const ALTO = 1100;
  const titulo = 'Comparación de alternativas en validación';
  const desc = `Precisión en el cupo por alternativa, con rango del 95 % (bootstrap por días), ${calificador}. `
    + `La ganadora (${nombre(ganadora)}) es la más simple entre las que empatan con la mejor (${nombre(mejor)}). `
    + 'El oráculo (techo) y la versión con fuga (didáctica) no son elegibles. La línea vertical es el azar al mismo cupo.';
  const k = 0.82; // textos de soporte algo más chicos: la figura tiene 33 filas
  const { svg, arriba, abajo } = lienzo('comparacion', ANCHO, ALTO, {
    titulo, desc, opciones, escala: k,
    subtitulo: [`Precisión en el cupo diario del 5 %, ${calificador}.`,
      'Rango del 95 % por bootstrap de días. Los rombos huecos son referencias que no pueden elegirse.'],
    pie: 'Regla de elección (#10): mayor precisión en el cupo; si el rango pareado de la diferencia con la mejor '
      + 'incluye 0, empatan y gana la más simple.',
  });
  if (resaltarFuga) svg.classList.add('resaltar-fuga');

  const xGrupo = 20;
  const xEtiqueta = 500;
  const x0 = 514;
  const x1 = 800;
  const xNota = 812;
  const tope = Math.max(0.3, ...todas.map((r) => r.precision_rango95[1] + 0.02));
  const esc = escala(0, tope, x0, x1);
  const yBase = eje(svg, esc, ticks(tope, 4), arriba, abajo, pctEje,
    'Precisión en el cupo: CALIBRADA entre los elegidos (rango del 95 %)', x0, x1, k);
  const yInicio = arriba + 28;
  const separacion = 6;
  const paso = (yBase - 8 - yInicio - separacion * (grupos.length - 1)) / todas.length;
  if (azar) referencia(svg, esc(azar.azar_mismo_cupo), arriba, yBase, `azar al mismo cupo: ${pct(azar.azar_mismo_cupo)}`, k);

  let y = yInicio;
  let i = 0;
  grupos.forEach((grupo, gi) => {
    if (gi) {
      linea(svg, xGrupo, y + separacion / 2, xEtiqueta, y + separacion / 2, C.linea, 1);
      y += separacion;
    }
    // Rótulos de familia largos en dos líneas si el grupo tiene filas para eso.
    const lineas = grupo.lineas.length === 1 && grupo.tipo !== 'referencia' && grupo.filas.length > 1
      ? partir(grupo.lineas[0], 16) : grupo.lineas;
    lineas.forEach((l, li) => {
      const ultima = grupo.lineas.length === 1 || li === lineas.length - 1;
      texto(svg, xGrupo, y + paso * (li + 0.5), l, {
        tam: 13, peso: ultima ? 600 : 400, color: ultima ? C.texto : C.tenue, clase: 'grupo',
      });
    });
    for (const r of grupo.filas) {
      const yc = y + paso / 2;
      const esGanadora = r.alternativa === ganadora;
      const esMejor = r.alternativa === mejor;
      const esFuga = resaltarFuga && r.familia === 'fuga';
      const tipo = esFuga ? 'fuga' : grupo.tipo === 'referencia' ? 'referencia' : esGanadora ? 'destacada' : 'normal';
      const clases = [esGanadora && 'ganadora', esMejor && 'mejor', grupo.tipo === 'referencia' && 'referencia',
        r.familia === 'fuga' && 'fuga'].filter(Boolean).join(' ');
      const g = fila(svg, i, clases);
      if (esFuga) rect(g, xGrupo - 8, yc - paso / 2, ANCHO - 2 * xGrupo + 16, paso, C.alertaSuave, { radio: 4 });
      texto(g, xEtiqueta, yc, etiquetaComparacion(r), {
        tam: 15, ancla: 'end', peso: esGanadora || esFuga ? 600 : 400,
        color: esFuga ? C.alerta : C.texto,
      });
      puntoIntervalo(g, esc, yc, r.precision_cupo, r.precision_rango95, tipo, 6.5);
      const nota = [];
      if (esGanadora) nota.push(`${pct(r.precision_cupo)} · ganadora`);
      if (esMejor) nota.push(`${pct(r.precision_cupo)} · mejor precisión`);
      if (grupo.tipo === 'referencia') nota.push(pct(r.precision_cupo));
      else if (comparacion.has(r.alternativa) && !nota.length) {
        nota.push(comparacion.get(r.alternativa).empata ? 'empata con la mejor' : 'por debajo de la mejor');
      }
      const fuerte = esGanadora || esMejor || esFuga;
      texto(g, xNota, yc, nota.join(' / '), {
        tam: 14, color: esFuga ? C.alerta : fuerte ? C.texto : C.tenue, peso: fuerte ? 600 : 400,
      });
      y += paso;
      i += 1;
    }
  });
  return svg;
}

// --- 2. veces_azar_prueba_final (figuras.py:297-344) ----------------------------

function figuraPruebaFinal(datos, opciones) {
  // corridas[0] es la corrida única del preregistro (tasa fija ≤194), la misma
  // que publica docs/entrega/figuras/veces_azar_prueba_final.svg y cifras.js.
  // corridas[1] y [2] son la segunda lectura (CatBoost) y no se grafican.
  const corrida = datos.pruebaFinal.corridas[0];
  const tramos = corrida.tramos.filter((t) => esRango(t.ganadora?.veces_azar_rango95)
    && !String(t.lectura_del_tramo ?? '').startsWith('descriptiva'));
  if (!tramos.length) return null;
  const filas = tramos.map((t, i) => {
    const g = t.ganadora;
    return {
      etiqueta: capital(t.tramo), valor: g.veces_azar, rango: g.veces_azar_rango95, destacada: i === 0,
      valorTexto: veces(g.veces_azar),
      valorSub: `${veces(g.veces_azar_rango95[0])} a ${veces(g.veces_azar_rango95[1])}`,
    };
  });
  const principal = tramos[0].ganadora;
  const sinPct = (x) => pct(x).replace(/\s%$/, '');
  return figuraPuntos('veces_azar_prueba_final', opciones, {
    titulo: `Prueba final: de cada 100 elegidos se calibrarían ${sinPct(principal.precision_cupo)}, `
      + `contra ${sinPct(principal.azar_mismo_cupo)} al azar`,
    subtitulo: [
      `Veces el azar de la ganadora, ${principal.calificador}.`,
      `Rango del 95 % por bootstrap de días; lectura de la prueba completa: ${principal.lectura}.`,
    ],
    desc: `Veces el azar de la ganadora (${nombre(corrida.ganadora?.alternativa)}) en la prueba final, por tramo: `
      + filas.map((f) => `${f.etiqueta.toLowerCase()} ${f.valorTexto} (${f.valorSub})`).join('; ') + '.',
    filas,
    dominio: [0, Math.max(2.5, ...filas.map((f) => f.rango[1] + 0.1))],
    formatoEje: (x) => x.toFixed(1).replace('.', ',') + NBSP + '×',
    rotuloX: 'Veces el azar al mismo cupo (rango del 95 %)',
    ref: { valor: 1, texto: `azar esperado = 1${NBSP}×` },
    pie: 'Corrida única del preregistro acordado. El tramo >260 (cupo ~8) es solo descriptivo y no se grafica.',
    xEtiqueta: 470, xPlot1: 1000, xValores: 1024,
  });
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
      + `(solo se conoce lo auditado desde el Día 155), ${calificador}.`,
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

  const { svg, arriba, abajo } = lienzo('particiones', 1200, 675, {
    titulo: 'Cómo se separaron los días', opciones,
    subtitulo: [`Cada VIN cuenta en un solo tramo, según su Día del VIN. Entre entrenamiento y evaluación, `
      + `${valIni - hastaComparacion - 1} días de margen sin etiquetas.`],
    pie: `Población principal: ${entero(cp.poblacion_principal.vins)} VIN con primera inspección ≤ DIA_${corte}; `
      + `${entero(cp.cohorte_posterior_260.vins)} VIN con primera inspección posterior van aparte. Base ficticia.`,
    desc: `Elección: entrenamiento Día ${DIA_INICIAL}–${hastaComparacion} (${entero(cp.entrenamiento_comparacion.vins)} VIN), `
      + `validación ${valIni}–${valFin} (${entero(cp.validacion.vins)} VIN). Prueba final: entrenamiento ${DIA_INICIAL}–${hastaFinal} `
      + `(${entero(cp.entrenamiento_final.vins)} VIN), prueba ${pruIni}–${pruFin} (${entero(cp.prueba_final.vins)} VIN).`,
  });
  const x0 = 270;
  const x1 = 1168;
  const dia = escala(DIA_INICIAL - 1, pruFin, x0, x1); // el día d ocupa [dia(d - 1), dia(d)]
  const tramoX = (a, b) => [dia(a - 1), dia(b)];
  const alto = 72;
  const yEje = abajo - 34;
  const espacio = yEje - arriba;
  const carriles = [
    {
      etiqueta: 'Elección', sub: 'validación', y: arriba + espacio * 0.25,
      segmentos: [
        { a: DIA_INICIAL, b: hastaComparacion, t: 'Entrenamiento', d: `Día ${DIA_INICIAL}–${hastaComparacion} · ${entero(cp.entrenamiento_comparacion.vins)} VIN`, tipo: 'entrena' },
        { a: hastaComparacion + 1, b: valIni - 1, tipo: 'margen' },
        { a: valIni, b: valFin, t: 'Validación', d: `${valIni}–${valFin} · ${entero(cp.validacion.vins)} VIN`, tipo: 'evalua' },
      ],
    },
    {
      etiqueta: 'Prueba final', sub: 'corrida única', y: arriba + espacio * 0.62,
      segmentos: [
        { a: DIA_INICIAL, b: hastaFinal, t: 'Entrenamiento final', d: `Día ${DIA_INICIAL}–${hastaFinal} · ${entero(cp.entrenamiento_final.vins)} VIN`, tipo: 'entrena' },
        { a: hastaFinal + 1, b: pruIni - 1, tipo: 'margen' },
        { a: pruIni, b: corte, t: `≤${corte}`, d: `${entero(cp.prueba_final_hasta_260.vins)} VIN`, tipo: 'prueba' },
        { a: corte + 1, b: pruFin, t: `>${corte}`, d: `${entero(cp.prueba_final_despues_260.vins)} VIN`, tipo: 'descriptiva' },
      ],
    },
  ];
  let i = 0;
  for (const c of carriles) {
    texto(svg, 32, c.y - 14, c.etiqueta, { tam: 26, peso: 500 });
    texto(svg, 32, c.y + 17, c.sub, { tam: 19, color: C.tenue });
    rect(svg, x0, c.y - alto / 2, x1 - x0, alto, C.linea, { radio: 6 });
    for (const s of c.segmentos) {
      const [xa, xb] = tramoX(s.a, s.b);
      const g = fila(svg, i++, `segmento ${s.tipo}`);
      if (s.tipo === 'margen') {
        rect(g, xa, c.y - alto / 2, xb - xa, alto, C.superficie);
        texto(g, (xa + xb) / 2, c.y - alto / 2 - 20, `margen ${s.a}–${s.b}`, { tam: 17, color: C.tenue, ancla: 'middle' });
        linea(g, (xa + xb) / 2, c.y - alto / 2 - 9, (xa + xb) / 2, c.y - alto / 2, C.tenue, 1.5);
        continue;
      }
      const relleno = { entrena: C.punto, evalua: C.acento, prueba: C.acento, descriptiva: C.acentoSuave }[s.tipo];
      rect(g, xa + 1, c.y - alto / 2, xb - xa - 2, alto, relleno, { radio: 4 });
      const ancho = xb - xa - 20;
      const color = s.tipo === 'entrena' ? C.superficie : C.texto;
      // Primero adentro (dos tamaños); si no entra, a la derecha sobre la pista vacía.
      const tam = [[21, 17], [18, 15], [16, 13]].find(([a, b]) => anchoTexto(s.t, a) <= ancho && anchoTexto(s.d, b) <= ancho);
      if (tam) {
        const centrado = ancho < 220;
        const x = centrado ? (xa + xb) / 2 : xa + 14;
        const ancla = centrado ? 'middle' : 'start';
        texto(g, x, c.y - 13, s.t, { tam: tam[0], peso: 600, color, ancla });
        texto(g, x, c.y + 15, s.d, { tam: tam[1], color, peso: 500, ancla });
      } else {
        texto(g, xb + 14, c.y - 13, s.t, { tam: 21, peso: 600 });
        texto(g, xb + 14, c.y + 15, s.d, { tam: 17, color: C.tenue });
      }
    }
  }
  // Llave bajo la prueba final y nota del tramo descriptivo.
  const [pa, pb] = tramoX(pruIni, pruFin);
  const yLlave = carriles[1].y + alto / 2 + 14;
  const gl = fila(svg, i++, 'llave');
  el(gl, 'path', {
    d: `M${pa + 1} ${yLlave - 6}V${yLlave}H${pb - 1}V${yLlave - 6}`,
    style: `fill:none;stroke:${C.tenue};stroke-width:1.5`,
  });
  texto(gl, pb, yLlave + 24, `Prueba final ${pruIni}–${pruFin} · ${entero(cp.prueba_final.vins)} VIN`, { tam: 19, ancla: 'end', peso: 500 });
  texto(gl, pb, yLlave + 50, `>${corte}: solo descriptivo`, { tam: 17, ancla: 'end', color: C.tenue });
  // Eje de días.
  linea(svg, x0, yEje, x1, yEje, C.rango, 1.5);
  for (const d of [DIA_INICIAL, 50, 100, 150, 200, 250, pruFin]) {
    const x = d === DIA_INICIAL ? dia(d - 1) : dia(d);
    linea(svg, x, yEje, x, yEje + 6, C.rango, 1.5);
    texto(svg, x, yEje + 22, String(d), { tam: T.eje, color: C.tenue, ancla: 'middle' });
  }
  texto(svg, x0 - 16, yEje, 'Día del VIN', { tam: T.eje, color: C.tenue, ancla: 'end' });
  return svg;
}

const CONSTRUCTORES = {
  comparacion: figuraComparacion,
  veces_azar_prueba_final: figuraPruebaFinal,
  donde_mirar: figuraDondeMirar,
  etiquetas_parciales: figuraEtiquetasParciales,
  detector: figuraDetector,
  particiones: figuraParticiones,
};
