// Orquestación: carga contenido y cifras, crea la escena (o el modo respaldo),
// vincula scroll ↔ escena y maneja el teclado del modo presentación.
//
// Modo híbrido scroll + diapositivas:
//   - Llegada a una pantalla por scroll: todos sus pasos se revelan en cascada.
//   - Llegada por teclado hacia adelante: entra la cabecera y cada →/Espacio/PgDn
//     revela un paso; ← los deshace y, en 0, vuelve a la pantalla anterior completa.
//   - Shift+→/← salta de pantalla. Movimiento reducido e impresión: todo visible.
//
// Parámetros de URL:
//   ?estatico=1      sin WebGL (diapositivas sobre fondo CSS)
//   ?nucleo=1        solo capítulos con `nucleo: true` (las continuaciones heredan)
//   ?limpio=1        oculta los marcadores [PENDIENTE: …]
//   ?calidad=modo    alta | baja | auto (se pasa a la escena)
//   #id/paso         pantalla y paso de llegada (sin paso: pantalla completa)
import * as ui from './ui.js';

const params = new URLSearchParams(location.search);
const forzarEstatico = params.get('estatico') === '1';
const soloNucleo = params.get('nucleo') === '1';
const limpio = params.get('limpio') === '1';
const CALIDADES = ['auto', 'alta', 'baja'];
const calidadInicial = CALIDADES.includes(params.get('calidad')) ? params.get('calidad') : 'auto';
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
  pieNumero: $('pie-numero'),
  pieSeccion: $('pie-seccion'),
  piePasos: $('pie-pasos'),
  relleno: $('progreso-relleno'),
  marcas: $('progreso-marcas'),
  ayudaOrbita: $('ayuda-orbita'),
  ayudaOrbitaTexto: $('ayuda-orbita-texto'),
  botonPantalla: $('boton-pantalla'),
  aviso: $('aviso'),
};

const estado = {
  meta: {},
  secciones: [],
  capitulos: [],
  elementos: [],
  total: '00',
  actual: -1,
  navegando: null, // { destino, hasta }: desplazamiento programático en curso
  escena: null,
  orbita: false,
  calidad: calidadInicial,
  tScroll: [], // progreso de la escena por scroll, por pantalla
  tPaso: { t: 0 }, // progreso por paso de la pantalla actual (se interpola)
};

if (limpio) raiz.classList.add('limpio');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const sinPasos = () => movimientoReducido;

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
      calidad: estado.calidad,
    });
    if (raiz.classList.contains('estatico')) { escena?.destruir?.(); return; }
    estado.escena = escena;
    escena.alTocarPunto?.((id) => irAPunto(id));
    if (estado.calidad !== 'auto') enEscena((e) => e.calidad?.(estado.calidad));
    const cap = estado.capitulos[estado.actual];
    if (cap) {
      enEscena((e) => {
        e.irA(cap.escena, { duracion: 0 });
        e.encuadrar?.(estado.elementos[estado.actual]?.classList.contains('lado-derecha') ? 'derecha' : 'izquierda', { duracion: 0 });
        e.mostrarPuntos((cap.puntos ?? []).map((p) => p.id));
      });
      sincronizarEscenaConPaso({ instantaneo: true });
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

// ---------- Progreso de la escena: t = max(tScroll, tPaso) ----------
function aplicarProgreso() {
  const i = estado.actual;
  const cap = estado.capitulos[i];
  if (!cap) return;
  const t = Math.max(estado.tScroll[i] ?? 0, estado.tPaso.t);
  enEscena((e) => e.progreso(cap.escena, t));
}

// Objetivo de progreso según el paso: en `linea` con callouts, la estación del
// último callout revelado (k / (n − 1)); en el resto, la fracción de pasos.
function objetivoPaso(sec, cap) {
  const pasos = sec._pasos ?? [];
  const paso = sec._paso ?? 0;
  if (!pasos.length) return 0;
  const callouts = pasos.filter((p) => p.tipo === 'callout');
  if (cap.escena === 'linea' && callouts.length) {
    const revelados = pasos.slice(0, paso).filter((p) => p.tipo === 'callout');
    if (!revelados.length) return 0;
    const k = revelados.at(-1).indiceCallout;
    return callouts.length > 1 ? k / (callouts.length - 1) : 1;
  }
  return paso / pasos.length;
}

function sincronizarEscenaConPaso({ instantaneo = false, duracion = 0.9 } = {}) {
  const i = estado.actual;
  const sec = estado.elementos[i];
  const cap = estado.capitulos[i];
  if (!sec || !cap) return;
  const paso = sec._pasos?.[(sec._paso ?? 0) - 1];
  const todo = (sec._paso ?? 0) === (sec._pasos?.length ?? 0);
  // Foco: el callout del paso actual; con todo revelado (o sin callout), ninguno.
  enEscena((e) => e.enfocarPunto?.(paso?.tipo === 'callout' && !(todo && sec._llegada === 'cascada') ? paso.punto : null));
  const meta = objetivoPaso(sec, cap);
  const gsap = window.gsap;
  gsap?.killTweensOf(estado.tPaso);
  if (instantaneo || movimientoReducido || !gsap) { estado.tPaso.t = meta; aplicarProgreso(); return; }
  gsap.to(estado.tPaso, { t: meta, duration: duracion, ease: 'power2.inOut', onUpdate: aplicarProgreso });
}

// ---------- Pantalla activa ----------
// llegada: { modo: 'pasos', paso } | { modo: 'completo' } | { modo: 'cascada' }
function activar(i, llegada = { modo: 'cascada' }) {
  if (i === estado.actual || !estado.capitulos[i]) return;
  const anterior = estado.capitulos[estado.actual];
  const secAnterior = estado.elementos[estado.actual];
  estado.actual = i;
  const cap = estado.capitulos[i];
  const sec = estado.elementos[i];

  if (secAnterior) ui.animarSalida(secAnterior, { movimientoReducido });
  ui.animarEntrada(sec, { movimientoReducido });
  aplicarLlegada(sec, llegada);

  ui.actualizarPie({ numero: dom.pieNumero, seccion: dom.pieSeccion, pasos: dom.piePasos }, cap, estado.secciones, estado.total);
  ui.marcarIndice(dom.indiceLista, cap);
  ui.marcarProgreso(dom.marcas, i);
  raiz.classList.toggle('texto-derecha', sec.classList.contains('lado-derecha'));

  if (estado.orbita && !cap.orbita) alternarOrbita(false);
  if (!anterior || anterior.escena !== cap.escena) enEscena((e) => e.irA(cap.escena));
  enEscena((e) => e.encuadrar?.(sec.classList.contains('lado-derecha') ? 'derecha' : 'izquierda'));
  enEscena((e) => e.mostrarPuntos((cap.puntos ?? []).map((p) => p.id)));
  actualizarAyudaOrbita(cap);
  estado.tPaso.t = 0;
  despuesDePaso({ duracion: llegada.modo === 'cascada' ? 1.6 : 0.9 });
}

function aplicarLlegada(sec, { modo, paso = 0 }) {
  sec._llegada = modo;
  if (sinPasos()) { ui.mostrarTodo(sec, { instantaneo: true }); return; }
  ui.prepararPasos(sec);
  if (modo === 'pasos') {
    const k = Math.max(0, Math.min(sec._pasos.length, paso));
    for (let j = 1; j <= k; j++) ui.mostrarPaso(sec, j, { instantaneo: true });
  } else {
    ui.mostrarTodo(sec, { retraso: modo === 'completo' ? 0.15 : 0.35 });
  }
}

// Tras cada cambio de paso: escena, pie, URL y notas.
function despuesDePaso(opciones) {
  const sec = estado.elementos[estado.actual];
  if (!sec) return;
  ui.marcarPasosPie(dom.piePasos, sec._paso ?? 0, sec._pasos?.length ?? 0);
  sincronizarEscenaConPaso(opciones);
  actualizarHash();
  enviarEstado();
}

function actualizarHash() {
  const cap = estado.capitulos[estado.actual];
  const sec = estado.elementos[estado.actual];
  if (!cap || !sec) return;
  const total = sec._pasos?.length ?? 0;
  const paso = sec._paso ?? total;
  const hash = `#${cap.id}${paso < total ? `/${paso}` : ''}`;
  if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
}

function leerHash() {
  const [id, paso] = decodeURIComponent(location.hash.slice(1)).split('/');
  const i = estado.capitulos.findIndex((c) => c.id === id);
  const n = Number.parseInt(paso, 10);
  return { i, llegada: Number.isFinite(n) ? { modo: 'pasos', paso: n } : { modo: 'completo' } };
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
const navegandoActivo = () => Boolean(estado.navegando && performance.now() < estado.navegando.hasta);

function irA(i, { llegada = { modo: 'completo' }, instantaneo = false } = {}) {
  const n = estado.elementos.length;
  if (!n) return;
  const destino = Math.max(0, Math.min(n - 1, i));
  const el = estado.elementos[destino];
  const suave = !(instantaneo || movimientoReducido);
  estado.navegando = { destino, hasta: performance.now() + (suave ? 1600 : 300) };
  window.scrollTo({ top: el.offsetTop, behavior: suave ? 'smooth' : 'auto' });
  el.focus({ preventScroll: true });
  if (destino === estado.actual) {
    aplicarLlegada(el, llegada);
    despuesDePaso();
  } else {
    activar(destino, llegada);
  }
}

function irAId(id, opciones) {
  const i = estado.capitulos.findIndex((c) => c.id === id);
  if (i >= 0) irA(i, opciones);
  return i >= 0;
}

function siguiente() {
  const i = estado.actual;
  const sec = estado.elementos[i];
  if (!sec) return;
  if (!sinPasos() && sec._paso < sec._pasos.length) {
    ui.mostrarPaso(sec, sec._paso + 1);
    despuesDePaso();
    return;
  }
  if (i < estado.elementos.length - 1) irA(i + 1, { llegada: { modo: 'pasos', paso: 0 } });
}

function anterior() {
  const i = estado.actual;
  const sec = estado.elementos[i];
  if (!sec) return;
  if (!sinPasos() && sec._paso > 0) {
    ui.ocultarPaso(sec, sec._paso);
    despuesDePaso();
    return;
  }
  if (i > 0) irA(i - 1, { llegada: { modo: 'completo' } });
}

const saltarPantalla = (dir) => irA(estado.actual + dir, { llegada: { modo: 'completo' } });

// Fija el paso k de la pantalla actual (callout tocado, punto 3D, notas).
function fijarPaso(k) {
  const sec = estado.elementos[estado.actual];
  if (!sec) return;
  if (sinPasos()) {
    const paso = sec._pasos[k - 1];
    sec.querySelectorAll('.callout.activo').forEach((li) => li.classList.remove('activo'));
    if (paso?.tipo === 'callout') paso.elementos[0].classList.add('activo');
    enEscena((e) => e.enfocarPunto?.(paso?.tipo === 'callout' ? paso.punto : null));
    return;
  }
  sec._llegada = 'pasos';
  while (sec._paso > k) ui.ocultarPaso(sec, sec._paso);
  while (sec._paso < k) ui.mostrarPaso(sec, sec._paso + 1);
  sec.querySelectorAll('.callout.activo').forEach((li) => li.classList.remove('activo'));
  const paso = sec._pasos[k - 1];
  if (paso?.tipo === 'callout') paso.elementos[0].classList.add('activo');
  despuesDePaso();
}

function pasoDelPunto(sec, punto) {
  return (sec?._pasos ?? []).findIndex((p) => p.tipo === 'callout' && p.punto === punto) + 1;
}

function irACallout(idCapitulo, punto) {
  const i = estado.capitulos.findIndex((c) => c.id === idCapitulo);
  if (i < 0) return;
  const k = pasoDelPunto(estado.elementos[i], punto);
  if (i === estado.actual) fijarPaso(k);
  else irA(i, { llegada: { modo: 'pasos', paso: k } });
}

// Click en un punto 3D: ir a ese paso (en esta pantalla o en la que lo tenga).
function irAPunto(punto) {
  const sec = estado.elementos[estado.actual];
  if (pasoDelPunto(sec, punto)) { fijarPaso(pasoDelPunto(sec, punto)); return; }
  const cap = estado.capitulos.find((c) => c.puntos?.some((p) => p.id === punto));
  if (cap) irACallout(cap.id, punto);
}

// ↓/↑: si la pantalla es más alta que la ventana, primero recorrerla.
function desplazarDentro(direccion) {
  if (navegandoActivo()) return false;
  const el = estado.elementos[estado.actual];
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
  if (i >= 0) irA(i, { llegada: { modo: 'pasos', paso: 0 } });
}

// ---------- Calidad de la escena (L) ----------
let temporizadorAviso = 0;
function avisar(texto) {
  dom.aviso.textContent = texto;
  dom.aviso.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { dom.aviso.hidden = true; }, 1800);
}

function alternarCalidad() {
  const orden = ['alta', 'baja', 'auto'];
  estado.calidad = orden[(orden.indexOf(estado.calidad) + 1) % orden.length];
  let efectiva = estado.calidad;
  enEscena((e) => { efectiva = e.calidad?.(estado.calidad) ?? estado.calidad; });
  const nombres = { alta: 'alta', baja: 'bajo consumo', auto: 'automática' };
  avisar(estado.escena ? `Calidad ${nombres[estado.calidad]}${estado.calidad === 'auto' && efectiva !== 'auto' ? ` (${efectiva})` : ''}` : 'Sin escena 3D (modo estático)');
}

// ---------- Índice ----------
function abrirIndice() {
  if (dom.indice.open) return;
  dom.indice.showModal();
  enEscena((e) => e.pausar?.(true));
  const actual = dom.indiceLista.querySelector('[aria-current="true"]') ?? dom.indiceLista.querySelector('button');
  actual?.focus();
}
function cerrarIndice() {
  if (dom.indice.open) dom.indice.close();
}
dom.indice.addEventListener('close', () => enEscena((e) => e.pausar?.(false)));

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
  const sec = estado.elementos[i];
  if (!cap || !sec) return;
  const sig = estado.capitulos[i + 1];
  const totalPasos = sec._pasos?.length ?? 0;
  const paso = sec._paso ?? totalPasos;
  canal.postMessage({
    tipo: 'estado',
    indice: i,
    total: estado.capitulos.length,
    posicion: `${cap.numeroPantalla} / ${estado.total}`,
    seccion: ui.tituloSeccion(cap.seccion, estado.secciones),
    numero: cap.seccion,
    titulo: ui.textoTitular(cap),
    notas: cap.notas ?? '',
    paso,
    totalPasos,
    siguientePaso: paso < totalPasos ? sec._pasos[paso].rotulo : '',
    siguiente: sig ? ui.textoTitular(sig) + (sig.padre ? ' (continúa)' : '') : '',
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
.paso{font-size:20px;margin:0;color:#fff}.paso b{color:var(--sky);font-weight:500}
.sig{border-top:1px solid var(--w16);padding-top:16px;font-size:20px;color:var(--w72);margin:0}
.pendiente{display:inline-block;border:2px dashed var(--warn);border-radius:9999px;padding:0 10px;font-size:16px;color:#fff}
button{font:inherit;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:none;border:2px solid var(--sky);border-radius:9999px;height:40px;padding:0 16px;cursor:pointer}
button:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
</style></head><body>
<div class="fila"><span id="pos">—</span><span id="sec"></span><span class="reloj" id="reloj" aria-label="Tiempo transcurrido">00:00</span></div>
<h1 id="titulo">Esperando la presentación…</h1>
<p id="notas"></p>
<p class="paso" id="paso"></p>
<p class="sig" id="sig"></p>
<div class="fila"><button type="button" id="ant">← Anterior</button><button type="button" id="prox">Siguiente →</button><button type="button" id="reiniciar">Reiniciar reloj</button></div>
<script>
const c=new BroadcastChannel('fordwardai-presentacion');let t0=Date.now();
const $=id=>document.getElementById(id);const re=/\\[PENDIENTE[^\\]]*\\]/g;
function rico(el,txt,limpio){el.textContent='';let u=0;for(const m of String(txt||'').matchAll(re)){el.append(txt.slice(u,m.index));if(!limpio){const s=document.createElement('span');s.className='pendiente';s.textContent=m[0].slice(1,-1);el.append(s);}u=m.index+m[0].length;}el.append(String(txt||'').slice(u));}
c.onmessage=({data:d})=>{if(!d||d.tipo!=='estado')return;$('pos').textContent=d.posicion||((d.indice+1)+' / '+d.total);$('sec').textContent=(/^\\d/.test(d.numero)?d.numero+' · ':'')+d.seccion;
rico($('titulo'),d.titulo,d.limpio);rico($('notas'),d.notas||'Sin notas para este capítulo.',d.limpio);
const p=$('paso');p.textContent='';if(d.totalPasos){const b=document.createElement('b');b.textContent='Paso '+d.paso+' / '+d.totalPasos;p.append(b);if(d.siguientePaso)p.append(' · Próximo paso: '+d.siguientePaso);}
$('sig').textContent=d.siguiente?'Pantalla siguiente: '+d.siguiente:'Última pantalla';document.title=(d.posicion||d.indice+1)+' · Notas';};
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
  return t instanceof Element && Boolean(t.closest('button, a[href], input, textarea, select, [contenteditable="true"]'));
}

document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const k = e.key;

  if (dom.indice.open) {
    if (k === 'i' || k === 'I') { e.preventDefault(); cerrarIndice(); }
    return; // Esc lo cierra el <dialog>
  }

  if (k === 'Escape') { e.preventDefault(); abrirIndice(); return; }
  if ((k === ' ' || k === 'Enter') && enControlInteractivo(e.target)) return;

  switch (k) {
    case 'ArrowRight':
      e.preventDefault();
      if (e.shiftKey) saltarPantalla(1); else siguiente();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (e.shiftKey) saltarPantalla(-1); else anterior();
      break;
    case 'PageDown':
      e.preventDefault(); siguiente(); break;
    case 'PageUp':
      e.preventDefault(); anterior(); break;
    case ' ':
      e.preventDefault();
      if (e.shiftKey) anterior(); else siguiente();
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (e.shiftKey) saltarPantalla(1); else if (!desplazarDentro(1)) siguiente();
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (e.shiftKey) saltarPantalla(-1); else if (!desplazarDentro(-1)) anterior();
      break;
    case 'Home': e.preventDefault(); irA(0); break;
    case 'End': e.preventDefault(); irA(estado.elementos.length - 1); break;
    case 'i': case 'I': e.preventDefault(); abrirIndice(); break;
    case 'n': case 'N': e.preventDefault(); abrirNotas(); break;
    case 'f': case 'F': e.preventDefault(); alternarPantalla(); break;
    case 'o': case 'O': e.preventDefault(); alternarOrbita(); break;
    case 'l': case 'L': e.preventDefault(); alternarCalidad(); break;
    default:
      if (/^[0-6]$/.test(k)) { e.preventDefault(); irASeccion(k); }
  }
});

// ---------- Scroll ----------
function alScrollearAMano() { estado.navegando = null; }
window.addEventListener('wheel', alScrollearAMano, { passive: true });
window.addEventListener('touchstart', alScrollearAMano, { passive: true });
window.addEventListener('scrollend', () => { if (estado.navegando) estado.navegando.hasta = Math.min(estado.navegando.hasta, performance.now() + 120); });

function activarPorScroll(i) {
  if (navegandoActivo()) return; // la navegación programática ya activó su destino
  activar(i, { modo: 'cascada' });
}

function vincularScroll() {
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    estado.elementos.forEach((sec, i) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => { if (self.isActive) activarPorScroll(i); },
      });
      const proxy = { t: 0 };
      gsap.to(proxy, {
        t: 1,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: movimientoReducido ? true : 0.6 },
        onUpdate: () => { estado.tScroll[i] = proxy.t; if (i === estado.actual) aplicarProgreso(); },
      });
    });
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => { dom.relleno.style.transform = `scaleY(${self.progress.toFixed(4)})`; },
    });
    return;
  }
  // Respaldo sin GSAP: IntersectionObserver para la pantalla activa.
  console.warn('[presentacion] GSAP/ScrollTrigger no disponible: navegación sin scrub');
  const io = new IntersectionObserver((entradas) => {
    for (const en of entradas) if (en.isIntersecting) activarPorScroll(Number(en.target.dataset.indice));
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
  let formatear = null;
  let leerJson;
  try {
    const modCifras = await import('./cifras.js');
    formatear = modCifras.formatear;
    leerJson = modCifras.leerJson;
    cifras = await modCifras.cargarCifras();
  } catch (err) {
    console.error('[presentacion] no se pudieron cargar las cifras', err);
  }
  // Figuras de datos (figuras.js): si falla, cada figura usa su SVG de respaldo.
  let figuras = null;
  let datos = {};
  try {
    figuras = await import('./figuras.js');
    datos = (await figuras.cargarDatos?.(leerJson)) ?? {};
  } catch (err) {
    console.warn('[presentacion] figuras.js no disponible: se usan los SVG de respaldo', err);
  }
  return { contenido, cifras, datos, formatear, figuras };
}

let temporizadorResize = 0;
function alRedimensionar() {
  clearTimeout(temporizadorResize);
  temporizadorResize = setTimeout(() => {
    estado.elementos.forEach((sec, i) => {
      ui.dividirLineas(sec.querySelector('.titular'));
      if (i !== estado.actual && !movimientoReducido) ui.prepararEntrada(sec);
    });
    window.ScrollTrigger?.refresh();
  }, 200);
}

async function iniciar() {
  let mods;
  try {
    mods = await cargarModulos();
  } catch (err) {
    console.error(err);
    mostrarError('No se pudo cargar el contenido de la presentación (contenido.js).');
    return;
  }
  const { contenido, cifras, datos, formatear, figuras } = mods;

  estado.meta = contenido.meta ?? {};
  estado.secciones = contenido.secciones ?? [];
  const todos = ui.normalizarCapitulos(contenido.capitulos ?? []);
  estado.capitulos = soloNucleo ? todos.filter((c) => c.nucleo) : todos;
  if (!estado.capitulos.length) { mostrarError('No hay capítulos para mostrar.'); return; }
  estado.total = ui.numerarCapitulos(estado.capitulos);

  estado.elementos = ui.renderizarCapitulos({
    main: dom.main,
    meta: estado.meta,
    secciones: estado.secciones,
    capitulos: estado.capitulos,
    cifras,
    datos,
    figuras,
    formatearCifra: formatear,
    alTocarCallout: (idCapitulo, punto) => irACallout(idCapitulo, punto),
  });
  ui.construirIndice({
    lista: dom.indiceLista,
    secciones: estado.secciones,
    capitulos: estado.capitulos,
    alElegir: (id) => { cerrarIndice(); irAId(id, { llegada: { modo: 'pasos', paso: 0 } }); },
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
    if (movimientoReducido) ui.mostrarTodo(sec, { instantaneo: true });
    else { ui.prepararEntrada(sec); ui.prepararPasos(sec); }
  });

  // Leer el deep link antes de crear los ScrollTrigger (al crearse activan la portada y reescriben el hash).
  const { i: desdeHash, llegada } = leerHash();
  const inicial = Math.max(0, desdeHash);
  vincularScroll();
  requestAnimationFrame(() => {
    irA(inicial, { instantaneo: true, llegada: desdeHash >= 0 ? llegada : { modo: 'pasos', paso: 0 } });
    window.ScrollTrigger?.refresh();
  });

  iniciarEscena();
}

// ---------- Eventos globales ----------
$('boton-indice').addEventListener('click', abrirIndice);
$('cerrar-indice').addEventListener('click', cerrarIndice);
$('boton-notas').addEventListener('click', abrirNotas);
dom.botonPantalla.addEventListener('click', alternarPantalla);
dom.indice.addEventListener('click', (e) => { if (e.target === dom.indice) cerrarIndice(); });
window.addEventListener('hashchange', () => {
  const { i, llegada } = leerHash();
  if (i >= 0) irA(i, { llegada });
});
window.addEventListener('resize', alRedimensionar);
// Impresión: el CSS deja todo visible; acá solo se terminan los conteos en curso.
window.addEventListener('beforeprint', () => ui.terminarConteos());
consultaMovimiento.addEventListener?.('change', (e) => {
  movimientoReducido = e.matches;
  if (movimientoReducido) estado.elementos.forEach((sec) => ui.mostrarTodo(sec, { instantaneo: true }));
});

iniciar();
