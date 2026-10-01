// Orquestación: carga contenido y cifras, crea la escena (o el modo respaldo),
// vincula scroll ↔ escena y maneja el teclado del modo presentación.
//
// Un toque = una pantalla completa:
//   - →/Espacio/PgDn/↓ van a la pantalla siguiente y ←/PgUp/↑ a la anterior; al
//     llegar (por teclado, scroll, índice o enlace) todo su contenido entra en
//     una cascada corta. No hay pasos.
//   - En la escena `linea` el vehículo recorre la línea solo al llegar y la
//     escena enfoca cada estación con callout al pasar por ella.
//   - Movimiento reducido e impresión: todo visible, sin animar.
//
// Parámetros de URL:
//   ?estatico=1      sin WebGL (diapositivas sobre fondo CSS)
//   ?nucleo=1        solo capítulos con `nucleo: true`
//   ?limpio=1        oculta los marcadores [PENDIENTE: …]
//   ?calidad=modo    alta | baja | auto (se pasa a la escena)
//   #id              pantalla de llegada (un «/N» final se ignora)
import * as ui from './ui.js';

const params = new URLSearchParams(location.search);
const forzarEstatico = params.get('estatico') === '1';
const soloNucleo = params.get('nucleo') === '1';
const limpio = params.get('limpio') === '1';
const CALIDADES = ['auto', 'alta', 'baja'];
const calidadInicial = CALIDADES.includes(params.get('calidad')) ? params.get('calidad') : 'auto';
const consultaMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
let movimientoReducido = consultaMovimiento.matches;

// Recorrido automático de la línea (s para t de 0 a 1) y rotación del foco (ms).
const DURACION_LINEA = 6;
const DURACION_ESCENA = 1.6;
const ROTACION_FOCO = 3000;

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
  tAuto: { t: 0 }, // progreso automático de la pantalla actual
  tweenAuto: null,
  rotacion: 0,
  foco: null, // punto enfocado en la pantalla actual
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
      calidad: estado.calidad,
    });
    if (raiz.classList.contains('estatico')) { escena?.destruir?.(); return; }
    estado.escena = escena;
    escena.alTocarPunto?.((id) => tocarPunto(id));
    if (estado.calidad !== 'auto') enEscena((e) => e.calidad?.(estado.calidad));
    const cap = estado.capitulos[estado.actual];
    if (cap) {
      enEscena((e) => {
        e.irA(cap.escena, { duracion: 0 });
        e.encuadrar?.(estado.elementos[estado.actual]?.classList.contains('lado-derecha') ? 'derecha' : 'izquierda', { duracion: 0 });
        e.mostrarPuntos(cap.puntos.map((p) => p.id));
      });
      arrancarAuto(cap); // ahora se conocen las estaciones reales
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

// ---------- Progreso de la escena: t = max(tScroll, tAuto) ----------
// Se aplica en cada cuadro, después de los tweens de GSAP: así manda sobre el
// avance propio de enfocarPunto en la línea.
function aplicarProgreso() {
  const i = estado.actual;
  const cap = estado.capitulos[i];
  if (!cap || !estado.escena) return;
  const t = Math.max(estado.tScroll[i] ?? 0, estado.tAuto.t);
  enEscena((e) => e.progreso(cap.escena, t));
}

function enfocar(id) {
  estado.foco = id ?? null;
  ui.marcarCallout(estado.elementos[estado.actual], estado.foco);
  enEscena((e) => e.enfocarPunto?.(estado.foco));
}

// Estaciones de la línea con callout en esta pantalla, en orden de recorrido.
function estacionesDe(cap) {
  const n = cap.puntos.length;
  return cap.puntos
    .map((p, k) => {
      const real = estado.escena?.progresoEstacion?.(p.id);
      // Sin escena todavía: reparto parejo (se recalcula cuando llega la escena).
      return { id: p.id, p: typeof real === 'number' ? real : (n > 1 ? k / (n - 1) : 1) };
    })
    .sort((a, b) => a.p - b.p);
}

function detenerAuto() {
  estado.tweenAuto?.kill();
  estado.tweenAuto = null;
  clearInterval(estado.rotacion);
  clearTimeout(estado.rotacion);
  estado.rotacion = 0;
}

// Al llegar a una pantalla: el vehículo recorre la línea (escena `linea`) o la
// escena avanza hasta su estado final; con varios puntos, el foco rota suave.
function arrancarAuto(cap) {
  detenerAuto();
  enfocar(null);
  const gsap = window.gsap;
  const linea = cap.escena === 'linea';
  const estaciones = linea ? estacionesDe(cap) : [];
  const meta = linea && estaciones.length ? estaciones.at(-1).p : 1;
  if (movimientoReducido || !gsap) {
    estado.tAuto.t = meta;
    aplicarProgreso();
    return;
  }
  estado.tAuto.t = 0;
  if (linea) {
    let siguiente = 0;
    estado.tweenAuto = gsap.to(estado.tAuto, {
      t: meta,
      duration: Math.max(2, DURACION_LINEA * meta),
      ease: 'power1.inOut',
      onUpdate: () => {
        while (siguiente < estaciones.length && estado.tAuto.t >= estaciones[siguiente].p - 0.004) {
          enfocar(estaciones[siguiente].id);
          siguiente += 1;
        }
      },
    });
    return;
  }
  estado.tweenAuto = gsap.to(estado.tAuto, { t: 1, duration: DURACION_ESCENA, ease: 'power2.inOut' });
  const ids = cap.puntos.map((p) => p.id);
  if (ids.length === 1) {
    estado.rotacion = setTimeout(() => enfocar(ids[0]), 1200);
  } else if (ids.length > 1) {
    let k = 0;
    estado.rotacion = setTimeout(() => {
      enfocar(ids[0]);
      estado.rotacion = setInterval(() => { k = (k + 1) % ids.length; enfocar(ids[k]); }, ROTACION_FOCO);
    }, 1200);
  }
}

// Click en un callout o en un punto 3D de la pantalla actual: enfocar ese punto.
function enfocarManual(id) {
  const cap = estado.capitulos[estado.actual];
  if (!cap) return;
  detenerAuto();
  const gsap = window.gsap;
  if (cap.escena === 'linea') {
    const p = estado.escena?.progresoEstacion?.(id);
    if (typeof p === 'number') {
      if (gsap && !movimientoReducido) estado.tweenAuto = gsap.to(estado.tAuto, { t: p, duration: 1.2, ease: 'power2.inOut' });
      else estado.tAuto.t = p;
    }
  } else if (estado.tAuto.t < 1) {
    estado.tAuto.t = 1;
  }
  enfocar(id);
  enviarEstado();
}

function tocarCallout(idCapitulo, punto) {
  const i = estado.capitulos.findIndex((c) => c.id === idCapitulo);
  if (i < 0) return;
  if (i === estado.actual) enfocarManual(punto);
  else irA(i);
}

function tocarPunto(punto) {
  const cap = estado.capitulos[estado.actual];
  if (cap?.puntos.some((p) => p.id === punto)) { enfocarManual(punto); return; }
  const i = estado.capitulos.findIndex((c) => c.puntos.some((p) => p.id === punto));
  if (i >= 0) irA(i);
}

// ---------- Pantalla activa ----------
function activar(i) {
  if (i === estado.actual || !estado.capitulos[i]) return;
  const anterior = estado.capitulos[estado.actual];
  const secAnterior = estado.elementos[estado.actual];
  if (secAnterior) ui.marcarCallout(secAnterior, null);
  estado.actual = i;
  const cap = estado.capitulos[i];
  const sec = estado.elementos[i];

  if (secAnterior) ui.animarSalida(secAnterior, { movimientoReducido });
  ui.animarEntrada(sec, { movimientoReducido });

  ui.actualizarPie({ numero: dom.pieNumero, seccion: dom.pieSeccion }, cap, estado.secciones, estado.total);
  ui.marcarIndice(dom.indiceLista, cap);
  ui.marcarProgreso(dom.marcas, i);
  raiz.classList.toggle('texto-derecha', sec.classList.contains('lado-derecha'));

  if (estado.orbita && !cap.orbita) alternarOrbita(false);
  if (!anterior || anterior.escena !== cap.escena) enEscena((e) => e.irA(cap.escena));
  enEscena((e) => e.encuadrar?.(sec.classList.contains('lado-derecha') ? 'derecha' : 'izquierda'));
  enEscena((e) => e.mostrarPuntos(cap.puntos.map((p) => p.id)));
  actualizarAyudaOrbita(cap);
  arrancarAuto(cap);
  actualizarHash();
  enviarEstado();
}

function actualizarHash() {
  const cap = estado.capitulos[estado.actual];
  if (!cap) return;
  const hash = `#${cap.id}`;
  if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
}

// «#id» (un «/N» heredado de los pasos se ignora).
function leerHash() {
  const id = decodeURIComponent(location.hash.slice(1)).split('/')[0];
  return estado.capitulos.findIndex((c) => c.id === id);
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

// Salto directo (sin desplazamiento suave): la pantalla nueva queda en su lugar
// al instante y su contenido entra en cascada, como una diapositiva. Durante
// un instante el scroll no activa pantallas (scrollend lo acorta).
function irA(i) {
  const n = estado.elementos.length;
  if (!n) return;
  const destino = Math.max(0, Math.min(n - 1, i));
  const el = estado.elementos[destino];
  estado.navegando = { destino, hasta: performance.now() + 300 };
  window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  el.focus({ preventScroll: true });
  if (destino === estado.actual) { ui.mostrarTodo(el); actualizarHash(); } else activar(destino);
}

function irAId(id) {
  const i = estado.capitulos.findIndex((c) => c.id === id);
  if (i >= 0) irA(i);
  return i >= 0;
}

const siguiente = () => irA(estado.actual + 1);
const anterior = () => irA(estado.actual - 1);

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
  if (i >= 0) irA(i);
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
  if (!cap) return;
  const sig = estado.capitulos[i + 1];
  canal.postMessage({
    tipo: 'estado',
    indice: i,
    total: estado.capitulos.length,
    posicion: `${cap.numeroPantalla} / ${estado.total}`,
    seccion: ui.tituloSeccion(cap.seccion, estado.secciones),
    numero: cap.seccion,
    titulo: ui.textoTitular(cap),
    notas: cap.notas ?? '',
    ampliacion: cap.ampliacion,
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
*{box-sizing:border-box}html,body{margin:0;background:var(--tw);color:#fff;font-family:"Ford F-1",Roboto,Arial,sans-serif;letter-spacing:-.02em}
body{padding:28px 36px;display:flex;flex-direction:column;min-height:100vh;gap:20px}
.fila{display:flex;align-items:center;gap:16px;font-size:14px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--w72)}
.reloj{margin-left:auto;font-size:40px;letter-spacing:-.03em;color:#fff;font-variant-numeric:tabular-nums}
h1{margin:0;font-size:36px;font-weight:500;line-height:1.1;letter-spacing:-.03em}
#notas{font-size:24px;line-height:1.5;white-space:pre-wrap;margin:0}
.respaldo{flex:1;border-top:1px solid var(--w16);padding-top:16px}
.respaldo h2{margin:0 0 12px;font-size:14px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--sky)}
.respaldo ol{margin:0;padding:0;list-style:none;display:grid;gap:12px}
.respaldo li{font-size:18px;line-height:1.45;color:var(--w72)}.respaldo b{display:block;color:#fff;font-weight:500;font-size:19px}
.respaldo[hidden]{display:none}
.sig{border-top:1px solid var(--w16);padding-top:16px;font-size:20px;color:var(--w72);margin:0}.sig b{color:#fff;font-weight:500}
.pendiente{display:inline-block;border:2px dashed var(--warn);border-radius:9999px;padding:0 10px;font-size:16px;color:#fff}
button{font:inherit;font-size:13px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:none;border:2px solid var(--sky);border-radius:9999px;height:40px;padding:0 16px;cursor:pointer}
button:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
</style></head><body>
<div class="fila"><span id="pos">—</span><span id="sec"></span><span class="reloj" id="reloj" aria-label="Tiempo transcurrido">00:00</span></div>
<h1 id="titulo">Esperando la presentación…</h1>
<p id="notas"></p>
<section class="respaldo" id="respaldo" hidden><h2>Si preguntan: respaldo</h2><ol id="ampliacion"></ol></section>
<p class="sig" id="sig"></p>
<div class="fila"><button type="button" id="ant">← Anterior</button><button type="button" id="prox">Siguiente →</button><button type="button" id="reiniciar">Reiniciar reloj</button></div>
<script>
const c=new BroadcastChannel('fordwardai-presentacion');let t0=Date.now();
const $=id=>document.getElementById(id);const re=/\\[PENDIENTE[^\\]]*\\]/g;
function rico(el,txt,limpio){el.textContent='';txt=String(txt||'');let u=0;for(const m of txt.matchAll(re)){el.append(txt.slice(u,m.index));if(!limpio){const s=document.createElement('span');s.className='pendiente';s.textContent=m[0].slice(1,-1);el.append(s);}u=m.index+m[0].length;}el.append(txt.slice(u));}
c.onmessage=({data:d})=>{if(!d||d.tipo!=='estado')return;$('pos').textContent=d.posicion||((d.indice+1)+' / '+d.total);$('sec').textContent=(/^\\d/.test(d.numero)?d.numero+' · ':'')+d.seccion;
rico($('titulo'),d.titulo,d.limpio);rico($('notas'),d.notas||'Sin notas para esta pantalla.',d.limpio);
const ol=$('ampliacion');ol.textContent='';for(const a of d.ampliacion||[]){const li=document.createElement('li');const b=document.createElement('b');rico(b,a.titulo,d.limpio);const s=document.createElement('span');rico(s,a.texto,d.limpio);li.append(b,s);ol.append(li);}
$('respaldo').hidden=!ol.childElementCount;
const sig=$('sig');sig.textContent='';if(d.siguiente){const b=document.createElement('b');rico(b,d.siguiente,d.limpio);sig.append('Pantalla siguiente: ',b);}else sig.textContent='Última pantalla';document.title=(d.posicion||d.indice+1)+' · Notas';};
const nav=a=>c.postMessage({tipo:'navegar',accion:a});$('ant').onclick=()=>nav('anterior');$('prox').onclick=()=>nav('siguiente');$('reiniciar').onclick=()=>{t0=Date.now();tick();};
addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();nav('siguiente');}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();nav('anterior');}});
function tick(){const s=Math.floor((Date.now()-t0)/1000);$('reloj').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
setInterval(tick,1000);c.postMessage({tipo:'pedir-estado'});
<\/script></body></html>`;

let ventanaNotas = null;
function abrirNotas() {
  if (!canal) { console.warn('[presentacion] BroadcastChannel no disponible: las notas no se sincronizan'); }
  if (ventanaNotas && !ventanaNotas.closed) { ventanaNotas.focus(); enviarEstado(); return; }
  ventanaNotas = window.open('', 'fordwardai-notas', 'popup,width=820,height=900');
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
    case 'PageDown':
      e.preventDefault(); siguiente(); break;
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault(); anterior(); break;
    case ' ':
      e.preventDefault();
      if (e.shiftKey) anterior(); else siguiente();
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!desplazarDentro(1)) siguiente();
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!desplazarDentro(-1)) anterior();
      break;
    case 'Home': e.preventDefault(); irA(0); break;
    case 'End': e.preventDefault(); irA(estado.elementos.length - 1); break;
    case 'i': case 'I': e.preventDefault(); abrirIndice(); break;
    case 'n': case 'N': e.preventDefault(); abrirNotas(); break;
    case 'f': case 'F': e.preventDefault(); alternarPantalla(); break;
    case 'o': case 'O': e.preventDefault(); alternarOrbita(); break;
    case 'l': case 'L': e.preventDefault(); alternarCalidad(); break;
    default:
      if (/^[0-9]$/.test(k)) { e.preventDefault(); irASeccion(k); }
  }
});

// ---------- Scroll ----------
function alScrollearAMano() { estado.navegando = null; }
window.addEventListener('wheel', alScrollearAMano, { passive: true });
window.addEventListener('touchstart', alScrollearAMano, { passive: true });
window.addEventListener('scrollend', () => {
  const n = estado.navegando;
  const el = n && estado.elementos[n.destino];
  if (el && Math.abs(window.scrollY - el.offsetTop) <= 2) n.hasta = Math.min(n.hasta, performance.now() + 120);
});

function activarPorScroll(i) {
  if (navegandoActivo()) return; // la navegación programática ya activó su destino
  activar(i);
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
        onUpdate: () => { estado.tScroll[i] = proxy.t; },
      });
    });
    gsap.ticker.add(aplicarProgreso);
    // Sin «lag smoothing»: si la escena 3D tarda en un cuadro, el texto igual
    // termina de entrar a tiempo (la cascada no se estira).
    gsap.ticker.lagSmoothing(0);
    return;
  }
  // Respaldo sin GSAP: IntersectionObserver para la pantalla activa.
  console.warn('[presentacion] GSAP/ScrollTrigger no disponible: navegación sin scrub');
  const io = new IntersectionObserver((entradas) => {
    for (const en of entradas) if (en.isIntersecting) activarPorScroll(Number(en.target.dataset.indice));
  }, { rootMargin: '-50% 0px -50% 0px' });
  estado.elementos.forEach((s) => io.observe(s));
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
      ui.ajustarDisposicion(sec);
      if (i !== estado.actual && !movimientoReducido) ui.prepararEntrada(sec);
    });
    window.ScrollTrigger?.refresh();
    const el = estado.elementos[estado.actual];
    if (el && !navegandoActivo()) window.scrollTo({ top: el.offsetTop, behavior: 'auto' });
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
    alTocarCallout: tocarCallout,
  });
  const elegir = (id) => { cerrarIndice(); irAId(id); };
  ui.construirIndice({ lista: dom.indiceLista, secciones: estado.secciones, capitulos: estado.capitulos, alElegir: elegir });
  ui.construirMarcas(dom.marcas, estado.capitulos, elegir);

  const nPendientes = ui.contarPendientes({ meta: estado.meta, capitulos: estado.capitulos, cifras });
  if (nPendientes) {
    dom.indicePendientes.hidden = false;
    dom.indicePendientes.textContent = `${nPendientes} ${nPendientes === 1 ? 'pendiente' : 'pendientes'}${limpio ? ' (ocultos)' : ''}`;
    console.info(`[presentacion] ${nPendientes} marcadores [PENDIENTE] en el contenido`);
  }

  try { await document.fonts?.ready; } catch { /* sin Font Loading API */ }
  estado.elementos.forEach((sec) => {
    ui.dividirLineas(sec.querySelector('.titular'));
    ui.ajustarDisposicion(sec);
    if (movimientoReducido) ui.mostrarTodo(sec);
    else ui.prepararEntrada(sec);
  });

  // Leer el deep link antes de crear los ScrollTrigger (al crearse activan la portada y reescriben el hash).
  const inicial = Math.max(0, leerHash());
  vincularScroll();
  requestAnimationFrame(() => {
    irA(inicial);
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
  const i = leerHash();
  if (i >= 0) irA(i);
});
window.addEventListener('resize', alRedimensionar);
// Impresión: el CSS deja todo visible; acá solo se terminan los conteos en curso.
window.addEventListener('beforeprint', () => ui.terminarConteos());
matchMedia('print').addEventListener?.('change', (e) => { if (e.matches) ui.terminarConteos(); });
consultaMovimiento.addEventListener?.('change', (e) => {
  movimientoReducido = e.matches;
  if (movimientoReducido) estado.elementos.forEach((sec) => ui.mostrarTodo(sec));
});

iniciar();
