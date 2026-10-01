// Orquestación: carga contenido y cifras, crea la escena (o el modo respaldo),
// vincula scroll ↔ escena y maneja el teclado del modo presentación.
//
// Parámetros de URL:
//   ?estatico=1  sin WebGL (diapositivas sobre fondo CSS)
//   ?nucleo=1    solo capítulos con `nucleo: true`
//   ?limpio=1    oculta los marcadores [PENDIENTE: …]
import * as ui from './ui.js';

const params = new URLSearchParams(location.search);
const forzarEstatico = params.get('estatico') === '1';
const soloNucleo = params.get('nucleo') === '1';
const limpio = params.get('limpio') === '1';
const consultaMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
let movimientoReducido = consultaMovimiento.matches;

const raiz = document.documentElement;
const $ = (id) => document.getElementById(id);
const dom = {
  main: $('capitulos'),
  canvas: $('escena'),
  etiquetas: $('etiquetas'),
  indice: $('indice'),
  indiceLista: $('indice-lista'),
  indicePendientes: $('indice-pendientes'),
  panel: $('detalle-panel'),
  numero: $('indicador-numero'),
  tituloSeccion: $('indicador-titulo'),
  relleno: $('progreso-relleno'),
  marcas: $('progreso-marcas'),
  ayudaOrbita: $('ayuda-orbita'),
  ayudaOrbitaTexto: $('ayuda-orbita-texto'),
  botonPantalla: $('boton-pantalla'),
};

const estado = {
  meta: {},
  secciones: [],
  capitulos: [],
  elementos: [],
  actual: -1,
  objetivo: -1,
  tiempoNav: 0,
  escena: null,
  orbita: false,
};

if (limpio) raiz.classList.add('limpio');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// ---------- Escena ----------
function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function activarEstatico(motivo) {
  if (motivo) console.warn(`[presentacion] modo estático: ${motivo}`);
  raiz.classList.add('estatico');
  raiz.classList.remove('orbitando');
  const e = estado.escena;
  estado.escena = null;
  estado.orbita = false;
  dom.ayudaOrbita.hidden = true;
  try { e?.destruir?.(); } catch (err) { console.error(err); }
}

function enEscena(fn) {
  const e = estado.escena;
  if (!e) return;
  try { fn(e); } catch (err) {
    console.error('[presentacion] error de la escena', err);
    activarEstatico('error de la escena');
  }
}

async function iniciarEscena() {
  if (forzarEstatico) return activarEstatico();
  if (!webglDisponible()) return activarEstatico('WebGL no disponible');
  try {
    const mod = await import('./escena/escena.js');
    const escena = await mod.crearEscena({
      canvas: dom.canvas,
      capaEtiquetas: dom.etiquetas,
      modeloUrl: 'assets/ranger.glb',
      movimientoReducido,
    });
    if (raiz.classList.contains('estatico')) { escena?.destruir?.(); return; }
    estado.escena = escena;
    escena.alTocarPunto?.((id) => abrirPunto(id));
    const cap = estado.capitulos[estado.actual];
    if (cap) {
      enEscena((e) => {
        e.irA(cap.escena, { duracion: 0 });
        e.encuadrar?.(estado.elementos[estado.actual]?.classList.contains('lado-derecha') ? 'derecha' : 'izquierda', { duracion: 0 });
        e.mostrarPuntos((cap.puntos ?? []).map((p) => p.id));
      });
      actualizarAyudaOrbita(cap);
    }
  } catch (err) {
    console.error(err);
    activarEstatico('no se pudo crear la escena');
  }
}

window.addEventListener('error', (ev) => {
  if (estado.escena && /\/escena\//.test(ev.filename ?? '')) activarEstatico('error en tiempo de ejecución de la escena');
});

// ---------- Capítulo activo ----------
function activar(i) {
  if (i === estado.actual || !estado.capitulos[i]) return;
  const anterior = estado.capitulos[estado.actual];
  estado.actual = i;
  const cap = estado.capitulos[i];
  const sec = estado.elementos[i];

  if (location.hash.slice(1) !== cap.id) history.replaceState(null, '', `${location.pathname}${location.search}#${cap.id}`);
  ui.actualizarIndicador({ numero: dom.numero, titulo: dom.tituloSeccion }, cap, estado.secciones);
  ui.marcarIndice(dom.indiceLista, cap);
  ui.marcarProgreso(dom.marcas, i);
  ui.animarEntrada(sec, { movimientoReducido });
  raiz.classList.toggle('texto-derecha', sec.classList.contains('lado-derecha'));
  ui.cerrarDetalle(dom.panel, { devolverFoco: false });

  if (estado.orbita && !cap.orbita) alternarOrbita(false);
  if (!anterior || anterior.escena !== cap.escena) enEscena((e) => e.irA(cap.escena));
  enEscena((e) => e.encuadrar?.(sec.classList.contains('lado-derecha') ? 'derecha' : 'izquierda'));
  enEscena((e) => e.mostrarPuntos((cap.puntos ?? []).map((p) => p.id)));
  actualizarAyudaOrbita(cap);
  enviarEstado();
}

function actualizarAyudaOrbita(cap) {
  dom.ayudaOrbita.hidden = !(cap?.orbita && estado.escena);
  dom.ayudaOrbitaTexto.textContent = estado.orbita ? 'volver al recorrido' : 'explorar el vehículo';
}

function alternarOrbita(forzar) {
  const cap = estado.capitulos[estado.actual];
  const valor = typeof forzar === 'boolean' ? forzar : !estado.orbita;
  if (valor && (!cap?.orbita || !estado.escena)) return;
  estado.orbita = valor;
  raiz.classList.toggle('orbitando', valor);
  enEscena((e) => e.orbita(valor));
  actualizarAyudaOrbita(cap);
}

// ---------- Navegación ----------
function indiceDesdeScroll() {
  const y = window.scrollY + window.innerHeight * 0.5;
  let idx = 0;
  estado.elementos.forEach((el, i) => { if (el.offsetTop <= y) idx = i; });
  return idx;
}

function irA(i, { instantaneo = false } = {}) {
  const n = estado.elementos.length;
  if (!n) return;
  const destino = Math.max(0, Math.min(n - 1, i));
  estado.objetivo = destino;
  estado.tiempoNav = performance.now();
  const el = estado.elementos[destino];
  window.scrollTo({ top: el.offsetTop, behavior: instantaneo || movimientoReducido ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
  if (instantaneo || !window.ScrollTrigger) activar(destino);
}

function irAId(id, opciones) {
  const i = estado.capitulos.findIndex((c) => c.id === id);
  if (i >= 0) irA(i, opciones);
  return i >= 0;
}

function base() {
  // Mientras dura un desplazamiento suave, encadenar sobre el destino pedido.
  return performance.now() - estado.tiempoNav < 900 && estado.objetivo >= 0 ? estado.objetivo : indiceDesdeScroll();
}
const siguiente = () => irA(base() + 1);
const anterior = () => irA(base() - 1);

// ↓/↑/PageDown/PageUp/Espacio: si el capítulo es más alto que la pantalla, primero recorrerlo.
function desplazarDentro(direccion) {
  if (performance.now() - estado.tiempoNav < 900) return false;
  const el = estado.elementos[indiceDesdeScroll()];
  if (!el) return false;
  const arriba = el.offsetTop;
  const abajo = arriba + el.offsetHeight;
  const paso = Math.round(window.innerHeight * 0.8);
  const comportamiento = movimientoReducido ? 'auto' : 'smooth';
  if (direccion > 0 && abajo - (window.scrollY + window.innerHeight) > 8) {
    window.scrollTo({ top: Math.min(window.scrollY + paso, abajo - window.innerHeight), behavior: comportamiento });
    return true;
  }
  if (direccion < 0 && window.scrollY - arriba > 8) {
    window.scrollTo({ top: Math.max(window.scrollY - paso, arriba), behavior: comportamiento });
    return true;
  }
  return false;
}

function irASeccion(digito) {
  const numero = digito === '0' ? 'portada' : digito.padStart(2, '0');
  const i = estado.capitulos.findIndex((c) => c.seccion === numero);
  if (i >= 0) irA(i);
}

// ---------- Índice ----------
function abrirIndice() {
  if (dom.indice.open) return;
  ui.cerrarDetalle(dom.panel, { devolverFoco: false });
  dom.indice.showModal();
  const actual = dom.indiceLista.querySelector('[aria-current="true"]') ?? dom.indiceLista.querySelector('button');
  actual?.focus();
}
function cerrarIndice() {
  if (dom.indice.open) dom.indice.close();
}

// ---------- Panel de hotspot ----------
function abrirPunto(id, disparador, idCapitulo) {
  const cap = estado.capitulos.find((c) => c.id === idCapitulo) ?? estado.capitulos[estado.actual];
  let punto = cap?.puntos?.find((p) => p.id === id);
  let origen = cap;
  if (!punto) {
    origen = estado.capitulos.find((c) => c.puntos?.some((p) => p.id === id));
    punto = origen?.puntos.find((p) => p.id === id);
  }
  const boton = disparador ?? estado.elementos[estado.actual]?.querySelector(`.boton-punto[data-punto="${CSS.escape(id)}"]`);
  // El panel se abre del lado de la escena, opuesto a la columna de texto.
  const textoADerecha = estado.elementos[estado.actual]?.classList.contains('lado-derecha');
  dom.panel.classList.toggle('lado-izquierda', Boolean(textoADerecha));
  ui.abrirDetalle(dom.panel, {
    antetitulo: origen?.antetitulo ?? '',
    titulo: punto?.titulo ?? id.replace(/-/g, ' '),
    texto: punto?.texto ?? '',
  }, boton ?? document.activeElement);
}

// ---------- Pantalla completa ----------
function alternarPantalla() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen ?? d.webkitExitFullscreen).call(d);
  else (raiz.requestFullscreen ?? raiz.webkitRequestFullscreen)?.call(raiz)?.catch?.(() => {});
}
document.addEventListener('fullscreenchange', () => {
  dom.botonPantalla.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
});

// ---------- Notas del orador (ventana aparte, BroadcastChannel) ----------
const canal = 'BroadcastChannel' in window ? new BroadcastChannel('fordwardai-presentacion') : null;

function enviarEstado() {
  if (!canal) return;
  const i = estado.actual;
  const cap = estado.capitulos[i];
  if (!cap) return;
  const sig = estado.capitulos[i + 1];
  canal.postMessage({
    tipo: 'estado',
    indice: i,
    total: estado.capitulos.length,
    seccion: ui.tituloSeccion(cap.seccion, estado.secciones),
    numero: cap.seccion,
    titulo: ui.textoTitular(cap),
    notas: cap.notas ?? '',
    siguiente: sig ? ui.textoTitular(sig) : '',
    limpio,
  });
}

canal?.addEventListener('message', ({ data }) => {
  if (data?.tipo === 'pedir-estado') enviarEstado();
  if (data?.tipo === 'navegar') {
    if (data.accion === 'siguiente') siguiente();
    if (data.accion === 'anterior') anterior();
  }
});

const HTML_NOTAS = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Notas · FordwardAI</title>
<style>
:root{--tw:#00142E;--sky:#066FEF;--w72:rgba(255,255,255,.72);--w16:rgba(255,255,255,.16);--warn:#FBAE40}
*{box-sizing:border-box}html,body{margin:0;background:var(--tw);color:#fff;font-family:"Ford F-1",Roboto,Arial,sans-serif;letter-spacing:-.03em}
body{padding:32px 40px;display:flex;flex-direction:column;min-height:100vh;gap:24px}
.fila{display:flex;align-items:center;gap:16px;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--w72)}
.fila b{color:#fff;font-weight:500}.reloj{margin-left:auto;font-size:40px;letter-spacing:-.03em;color:#fff;font-variant-numeric:tabular-nums}
h1{margin:0;font-size:40px;font-weight:500;line-height:1.1}
#notas{font-size:24px;line-height:1.5;white-space:pre-wrap;flex:1;margin:0}
.sig{border-top:1px solid var(--w16);padding-top:16px;font-size:20px;color:var(--w72)}
.pendiente{display:inline-block;border:2px dashed var(--warn);border-radius:9999px;padding:0 10px;font-size:16px;color:#fff}
button{font:inherit;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:none;border:2px solid var(--sky);border-radius:9999px;height:40px;padding:0 16px;cursor:pointer}
button:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
</style></head><body>
<div class="fila"><span id="pos">—</span><span id="sec"></span><span class="reloj" id="reloj" aria-label="Tiempo transcurrido">00:00</span></div>
<h1 id="titulo">Esperando la presentación…</h1>
<p id="notas"></p>
<p class="sig" id="sig"></p>
<div class="fila"><button type="button" id="ant">← Anterior</button><button type="button" id="prox">Siguiente →</button><button type="button" id="reiniciar">Reiniciar reloj</button></div>
<script>
const c=new BroadcastChannel('fordwardai-presentacion');let t0=Date.now();
const $=id=>document.getElementById(id);const re=/\\[PENDIENTE[^\\]]*\\]/g;
function rico(el,txt,limpio){el.textContent='';let u=0;for(const m of String(txt||'').matchAll(re)){el.append(txt.slice(u,m.index));if(!limpio){const s=document.createElement('span');s.className='pendiente';s.textContent=m[0].slice(1,-1);el.append(s);}u=m.index+m[0].length;}el.append(String(txt||'').slice(u));}
c.onmessage=({data:d})=>{if(!d||d.tipo!=='estado')return;$('pos').textContent=(d.indice+1)+' / '+d.total;$('sec').textContent=(/^\\d/.test(d.numero)?d.numero+' · ':'')+d.seccion;
rico($('titulo'),d.titulo,d.limpio);rico($('notas'),d.notas||'Sin notas para este capítulo.',d.limpio);$('sig').textContent=d.siguiente?'Sigue: '+d.siguiente:'Último capítulo';document.title=(d.indice+1)+' · Notas';};
const nav=a=>c.postMessage({tipo:'navegar',accion:a});$('ant').onclick=()=>nav('anterior');$('prox').onclick=()=>nav('siguiente');$('reiniciar').onclick=()=>{t0=Date.now();tick();};
addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();nav('siguiente');}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();nav('anterior');}});
function tick(){const s=Math.floor((Date.now()-t0)/1000);$('reloj').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
setInterval(tick,1000);c.postMessage({tipo:'pedir-estado'});
<\/script></body></html>`;

let ventanaNotas = null;
function abrirNotas() {
  if (!canal) { console.warn('[presentacion] BroadcastChannel no disponible: las notas no se sincronizan'); }
  if (ventanaNotas && !ventanaNotas.closed) { ventanaNotas.focus(); enviarEstado(); return; }
  ventanaNotas = window.open('', 'fordwardai-notas', 'popup,width=760,height=640');
  if (!ventanaNotas) { console.warn('[presentacion] el navegador bloqueó la ventana de notas'); return; }
  if (!ventanaNotas.document.getElementById('notas')) {
    ventanaNotas.document.open();
    ventanaNotas.document.write(HTML_NOTAS);
    ventanaNotas.document.close();
  }
  setTimeout(enviarEstado, 100);
}

// ---------- Teclado ----------
function enControlInteractivo(t) {
  return t instanceof Element && Boolean(t.closest('button, summary, a[href], input, textarea, select, [contenteditable="true"]'));
}

document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const k = e.key;

  if (dom.indice.open) {
    if (k === 'i' || k === 'I') { e.preventDefault(); cerrarIndice(); }
    return; // Esc lo cierra el <dialog>
  }

  if (k === 'Escape') {
    e.preventDefault();
    if (!ui.cerrarDetalle(dom.panel)) abrirIndice();
    return;
  }
  if (k === ' ' && enControlInteractivo(e.target)) return;

  switch (k) {
    case 'ArrowRight':
      e.preventDefault(); siguiente(); break;
    case 'ArrowDown': case 'PageDown':
      e.preventDefault(); if (!desplazarDentro(1)) siguiente(); break;
    case ' ':
      e.preventDefault();
      if (e.shiftKey) { if (!desplazarDentro(-1)) anterior(); } else if (!desplazarDentro(1)) siguiente();
      break;
    case 'ArrowLeft':
      e.preventDefault(); anterior(); break;
    case 'ArrowUp': case 'PageUp':
      e.preventDefault(); if (!desplazarDentro(-1)) anterior(); break;
    case 'Home': e.preventDefault(); irA(0); break;
    case 'End': e.preventDefault(); irA(estado.elementos.length - 1); break;
    case 'i': case 'I': e.preventDefault(); abrirIndice(); break;
    case 'n': case 'N': e.preventDefault(); abrirNotas(); break;
    case 'f': case 'F': e.preventDefault(); alternarPantalla(); break;
    case 'o': case 'O': e.preventDefault(); alternarOrbita(); break;
    default:
      if (/^[0-6]$/.test(k)) { e.preventDefault(); irASeccion(k); }
  }
});

// ---------- Scroll ----------
function vincularScroll() {
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    estado.elementos.forEach((sec, i) => {
      const cap = estado.capitulos[i];
      ScrollTrigger.create({
        trigger: sec,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => { if (self.isActive) activar(i); },
      });
      const proxy = { t: 0 };
      gsap.to(proxy, {
        t: 1,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: movimientoReducido ? true : 0.6 },
        onUpdate: () => enEscena((e) => e.progreso(cap.escena, proxy.t)),
      });
    });
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => { dom.relleno.style.transform = `scaleY(${self.progress.toFixed(4)})`; },
    });
    return;
  }
  // Respaldo sin GSAP: IntersectionObserver para el capítulo activo.
  console.warn('[presentacion] GSAP/ScrollTrigger no disponible: navegación sin scrub');
  const io = new IntersectionObserver((entradas) => {
    for (const en of entradas) if (en.isIntersecting) activar(Number(en.target.dataset.indice));
  }, { rootMargin: '-50% 0px -50% 0px' });
  estado.elementos.forEach((s) => io.observe(s));
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    dom.relleno.style.transform = `scaleY(${max > 0 ? scrollY / max : 0})`;
  }, { passive: true });
}

// ---------- Inicio ----------
function mostrarError(mensaje) {
  dom.main.textContent = '';
  const p = document.createElement('p');
  p.className = 'error-carga';
  p.textContent = mensaje;
  dom.main.append(p);
  dom.main.removeAttribute('aria-busy');
}

async function cargarModulos() {
  const contenido = await import('./contenido.js');
  let cifras = new Map();
  try {
    const modCifras = await import('./cifras.js');
    cifras = await modCifras.cargarCifras();
  } catch (err) {
    console.error('[presentacion] no se pudieron cargar las cifras', err);
  }
  return { contenido, cifras };
}

let temporizadorResize = 0;
function alRedimensionar() {
  clearTimeout(temporizadorResize);
  temporizadorResize = setTimeout(() => {
    estado.elementos.forEach((sec) => {
      ui.dividirLineas(sec.querySelector('.titular'));
      if (!ui.estaAnimado(sec)) ui.prepararEntrada(sec);
    });
    window.ScrollTrigger?.refresh();
  }, 200);
}

async function iniciar() {
  let contenido;
  let cifras;
  try {
    ({ contenido, cifras } = await cargarModulos());
  } catch (err) {
    console.error(err);
    mostrarError('No se pudo cargar el contenido de la presentación (contenido.js).');
    return;
  }

  estado.meta = contenido.meta ?? {};
  estado.secciones = contenido.secciones ?? [];
  const todos = contenido.capitulos ?? [];
  estado.capitulos = soloNucleo ? todos.filter((c) => c.nucleo) : todos;
  if (!estado.capitulos.length) { mostrarError('No hay capítulos para mostrar.'); return; }

  estado.elementos = ui.renderizarCapitulos({
    main: dom.main,
    meta: estado.meta,
    secciones: estado.secciones,
    capitulos: estado.capitulos,
    cifras,
    alTocarPunto: (id, boton, idCapitulo) => abrirPunto(id, boton, idCapitulo),
  });
  ui.construirIndice({
    lista: dom.indiceLista,
    secciones: estado.secciones,
    capitulos: estado.capitulos,
    alElegir: (id) => { cerrarIndice(); irAId(id); },
  });
  ui.construirMarcas(dom.marcas, estado.capitulos);

  const nPendientes = ui.contarPendientes({ meta: estado.meta, capitulos: estado.capitulos, cifras });
  if (nPendientes) {
    dom.indicePendientes.hidden = false;
    dom.indicePendientes.textContent = `${nPendientes} ${nPendientes === 1 ? 'pendiente' : 'pendientes'}${limpio ? ' (ocultos)' : ''}`;
    console.info(`[presentacion] ${nPendientes} marcadores [PENDIENTE] en el contenido`);
  }

  try { await document.fonts?.ready; } catch { /* sin Font Loading API */ }
  estado.elementos.forEach((sec) => {
    ui.dividirLineas(sec.querySelector('.titular'));
    if (!movimientoReducido) ui.prepararEntrada(sec);
  });

  // Leer el deep link antes de crear los ScrollTrigger (al crearse activan la portada y reescriben el hash).
  const inicial = Math.max(0, estado.capitulos.findIndex((c) => c.id === decodeURIComponent(location.hash.slice(1))));
  vincularScroll();
  requestAnimationFrame(() => {
    irA(inicial, { instantaneo: true });
    window.ScrollTrigger?.refresh();
  });

  iniciarEscena();
}

// ---------- Eventos globales ----------
$('boton-indice').addEventListener('click', abrirIndice);
$('cerrar-indice').addEventListener('click', cerrarIndice);
$('boton-notas').addEventListener('click', abrirNotas);
dom.botonPantalla.addEventListener('click', alternarPantalla);
$('detalle-cerrar').addEventListener('click', () => ui.cerrarDetalle(dom.panel));
dom.indice.addEventListener('click', (e) => { if (e.target === dom.indice) cerrarIndice(); });
window.addEventListener('hashchange', () => irAId(decodeURIComponent(location.hash.slice(1))));
window.addEventListener('resize', alRedimensionar);
consultaMovimiento.addEventListener?.('change', (e) => { movimientoReducido = e.matches; });

// Impresión: abrir tarjetas de detalle y restaurarlas después.
let abiertasAntes = [];
window.addEventListener('beforeprint', () => {
  abiertasAntes = [...document.querySelectorAll('details.detalle')].map((d) => d.open);
  document.querySelectorAll('details.detalle').forEach((d) => { d.open = true; });
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('details.detalle').forEach((d, i) => { d.open = abiertasAntes[i] ?? false; });
});

iniciar();
