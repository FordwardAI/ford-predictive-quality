// Plataforma FordwardAI: cinco vistas sobre la API local (servidor.py). Sin dependencias.
import { icono } from './iconos.js';
import { lineas } from './grafico.js';

const VISTAS = [
  { id: 'preparar', nombre: 'Preparar el día', icono: 'preparar' },
  { id: 'hoja', nombre: 'Hoja del día', icono: 'hoja' },
  { id: 'audito', nombre: '¿Lo audito?', icono: 'audito' },
  { id: 'ronda', nombre: 'Ronda', icono: 'ronda' },
  { id: 'simulacion', nombre: 'Simulación', icono: 'simulacion' },
];
const LECTURA = { mejora: 'mejor que el azar', inconcluso: 'no se distingue del azar', peor: 'peor que el azar' };
const S = { meta: null, hoja: null, estado: null, sim: null, simModelo: null, simIdx: 0, timer: null, decision: null };
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const vista = $('#vista');

// --- Formato --------------------------------------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const entero = (n) => Math.round(n).toLocaleString('es-AR');
const pct = (x, d = 1) => (x == null ? '—' : `${(100 * x).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })} %`);
const dec = (x, d = 2) => (x == null ? '—' : x.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const rango = (r, f = pct) => (r ? `${f(r[0])} a ${f(r[1])}` : '—');
const modelo = (clave) => S.meta.modelos.find((m) => m.clave === clave);

async function api(ruta, cuerpo) {
  const r = await fetch(`/api/${ruta}`, cuerpo === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const datos = await r.json();
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

function error(e) {
  return `<div class="error" role="alert">${icono('info')}<div><b>No se pudo completar.</b><p>${esc(e.message || e)}</p></div></div>`;
}

function cabeza(ojo, titulo, texto, acciones = '') {
  return `<header class="cabeza"><div><span class="ojo">${esc(ojo)}</span><h1>${titulo}</h1>${texto ? `<p>${texto}</p>` : ''}</div>
    ${acciones ? `<div class="acciones">${acciones}</div>` : ''}</header>`;
}

function sinHoja() {
  return `<section class="banda texto"><h2>Todavía no hay hoja para hoy</h2>
    <p style="margin:16px 0 24px">Calidad de Planta arma la hoja al inicio del día con el programa de producción y el cupo.</p>
    <a class="btn cta" href="#preparar">Preparar el día</a></section>`;
}

// --- Navegación -----------------------------------------------------------------------------------------------
function menu(actual) {
  $('#menu').innerHTML = VISTAS.map((v) => `<li><a href="#${v.id}"${v.id === actual ? ' aria-current="page"' : ''}>
    ${icono(v.icono)}<span>${v.nombre}</span></a></li>`).join('');
  $('#menu [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function pie() {
  const f = S.meta.fuente;
  $('#pie').innerHTML = `<p>Propuesta de plataforma de FordwardAI: no es un sistema de Ford.</p>
    <p>Base ficticia, entre auditados con actividad QLS · solo días de validación ${S.meta.validacion[0]}–${S.meta.validacion[1]} ·
    fuente ${esc(f.csv)} · catálogo ${esc(f.catalogo)} · ningún VIN sale del servidor.</p>`;
}

async function ir() {
  clearInterval(S.timer);
  S.timer = null;
  const id = (location.hash.slice(1) || (S.hoja ? 'hoja' : 'preparar'));
  const v = VISTAS.find((x) => x.id === id) ? id : 'preparar';
  menu(v);
  document.title = `${VISTAS.find((x) => x.id === v).nombre} · Plataforma FordwardAI`;
  try {
    await ({ preparar, hoja, audito, ronda, simulacion })[v]();
  } catch (e) {
    vista.innerHTML = error(e);
  }
  window.scrollTo(0, 0);
  vista.focus({ preventScroll: true });
}

// --- 1. Preparar el día ---------------------------------------------------------------------------------------
async function preparar() {
  const m = S.meta;
  if (!S.sim?.lista) S.sim = await api('simulacion').catch(() => null);
  const dias = m.dias.map((d) => `<option value="${d.dia}" data-cupo="${d.cupo}"${d.dia === (S.hoja?.dia ?? m.dia_inicial) ? ' selected' : ''}>
    Día ${d.dia} · ${entero(d.unidades)} unidades</option>`).join('');
  const modelos = m.modelos.map((x) => {
    const val = S.sim?.lista ? S.sim.modelos[x.clave].metricas : null;
    const elegido = (S.hoja?.modelo ?? m.modelos.find((y) => y.por_defecto).clave) === x.clave;
    return `<label class="opcion"><input type="radio" name="modelo" value="${x.clave}"${elegido ? ' checked' : ''}>
      <h3>${esc(x.nombre)}</h3><p>${esc(x.detalle)}</p>
      ${val ? `<p><b>En validación: ${val.calibrada_elegidas} de ${val.elegidos} elegidas se calibraron (${pct(val.precision_cupo)}), ${dec(val.veces_azar)} veces el azar.</b></p>` : ''}
      <p class="nota">${esc(x.origen)} ${esc(x.advertencia)}</p>
      <span class="marca-elegida">${icono('check')} Elegido</span></label>`;
  }).join('');
  vista.innerHTML = cabeza('Calidad de Planta · inicio del día', 'Preparar el <span class="acento">día</span>',
    'Con el programa de producción y el cupo, la plataforma ordena los códigos y reparte las auditorías. Usa solo resultados ya conocidos (Día ≤ t − 5).') +
    `<form id="form" class="columnas" novalidate>
      <div class="c4 campo"><span>Día del VIN</span><select name="dia">${dias}
        <optgroup label="Prueba final (Día 200 en adelante): registrada, no se relee" disabled></optgroup></select>
        <small>Solo días de validación de la base ficticia.</small></div>
      <div class="c4 campo"><span>Cupo del día</span><input type="number" name="cupo" min="1" step="1" inputmode="numeric">
        <small id="cupo-ayuda"></small></div>
      <fieldset class="c12 campo" style="border:0;padding:0;margin:0"><legend class="campo"><span>Programa de producción</span></legend>
        <div class="opciones">
          <label class="opcion"><input type="radio" name="fuente" value="simulado" checked><h3>Simular con la base</h3>
            <p>Las unidades de ese día en la base, con ids ficticios (U-0001…). Permite revelar el resultado al cerrar el día.</p>
            <span class="marca-elegida">${icono('check')} Elegido</span></label>
          <label class="opcion"><input type="radio" name="fuente" value="archivo"><h3>Subir el programa</h3>
            <p>Archivo CSV con las columnas <b>unidad,codigo</b>, una fila por unidad. No lleva VIN.</p>
            <span class="marca-elegida">${icono('check')} Elegido</span></label>
        </div>
        <input type="file" name="archivo" accept=".csv,text/csv" hidden aria-label="Archivo del programa"></fieldset>
      <fieldset class="c12 campo" style="border:0;padding:0;margin:0"><legend class="campo"><span>Modelo que ordena los códigos</span></legend>
        <div class="opciones">${modelos}</div></fieldset>
      <div class="c12 acciones"><button class="btn cta" type="submit">${icono('hoja')} Armar la hoja</button></div>
      <div class="c12" id="form-error"></div>
    </form>`;
  const form = $('#form');
  const ayuda = () => {
    const o = form.dia.selectedOptions[0];
    form.cupo.placeholder = o.dataset.cupo;
    $('#cupo-ayuda').textContent = `Lo fija Calidad de Planta. Vacío: el 5 % del programa (${o.dataset.cupo}).`;
  };
  ayuda();
  form.dia.addEventListener('change', ayuda);
  form.addEventListener('change', (e) => { if (e.target.name === 'fuente') form.archivo.hidden = form.fuente.value !== 'archivo'; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const boton = form.querySelector('[type=submit]');
    boton.disabled = true;
    $('#form-error').innerHTML = '';
    try {
      let programa = null;
      if (form.fuente.value === 'archivo') {
        if (!form.archivo.files[0]) throw new Error('Elegí el archivo del programa (unidad,codigo).');
        programa = await form.archivo.files[0].text();
      }
      const r = await api('dia', { dia: +form.dia.value, cupo: form.cupo.value ? +form.cupo.value : null, modelo: form.modelo.value, programa });
      Object.assign(S, { hoja: r.hoja, estado: r.estado });
      location.hash = '#hoja';
    } catch (err) {
      $('#form-error').innerHTML = error(err);
      boton.disabled = false;
    }
  });
}

// --- 2. Hoja --------------------------------------------------------------------------------------------------
async function hoja() {
  const h = S.hoja;
  if (!h) { vista.innerHTML = cabeza('Hoja del día', 'Códigos <span class="acento">prioritarios</span>', '') + sinHoja(); return; }
  const ultimo = h.filas.map((f) => f.sugerida > 0 || f.minimo).lastIndexOf(true);
  const filas = h.filas.map((f, i) => {
    const fila = `<tr${i > ultimo ? ' class="fuera"' : ''}><td class="num">${i + 1}</td><td><b>${esc(f.codigo)}</b></td>
      <td class="num">${f.sugerida ? `<b>${f.sugerida}</b>` : ''}${f.minimo ? ` <span class="chip borde">+1 mínimo</span>` : ''}</td>
      <td class="num"><b>${pct(f.tasa)}</b></td>
      <td class="num">${f.n ? `${pct(f.cal / f.n)}<span class="rango">(${rango(f.rango)})</span>` : 'sin resultados propios'}</td>
      <td class="num">${entero(f.n)}</td><td class="num">${dec(f.veces)}</td><td class="num">${f.programadas}</td><td class="num">${f.acumulado}</td>
      <td>${esc(f.mercado)}</td><td>${esc(f.version)}</td><td>${esc(f.motor)}</td><td>${esc(f.traccion)}</td></tr>`;
    const linea = i === ultimo ? `<tr class="linea"><td colspan="13">Hasta acá se llena el cupo del día (${h.cupo}${h.exploracion.length ? `, con ${h.exploracion.length} del mínimo por código` : ''}). Más abajo: sin cantidad.</td></tr>` : '';
    return fila + linea;
  }).join('');
  const descargas = ['csv', 'xlsx', 'html'].map((f) => `<a class="btn outline" href="/api/descarga?formato=${f}">${icono('descarga')} ${{ csv: 'CSV', xlsx: 'Excel', html: 'Imprimible' }[f]}</a>`).join('');
  const conCantidad = h.filas.filter((f) => f.sugerida || f.minimo).length;
  vista.innerHTML = cabeza(`Hoja del día · Día ${h.dia}`, 'Códigos <span class="acento">prioritarios</span>',
    'Prioriza códigos, no vehículos: dentro de un código cualquier unidad sirve. El código está en la etiqueta del parabrisas.', descargas) +
    `<div class="cifras">
      <div class="cifra"><span>Unidades programadas</span><b>${entero(h.programadas)}</b></div>
      <div class="cifra"><span>Cupo del día</span><b class="grande-acento">${h.cupo}</b></div>
      <div class="cifra"><span>Códigos con cantidad</span><b>${conCantidad}</b><span>de ${h.filas.length} programados</span></div>
      <div class="cifra"><span>Modelo</span><b style="font-size:24px">${esc(modelo(h.modelo).nombre)}</b></div>
    </div>
    <section class="seccion banda texto"><p><b>Evaluación.</b> ${esc(h.textos.evaluacion)}</p><p class="nota" style="margin-top:8px">${esc(h.textos.corte)}</p></section>
    <section class="seccion"><h2>Ranking del día</h2><div class="tabla-marco"><table>
      <thead><tr><th class="num">#</th><th>Código</th><th class="num">Cantidad sugerida</th><th class="num">Tasa estimada</th><th class="num">Observada (rango 95 %)</th><th class="num">n</th>
      <th class="num">Veces la general</th><th class="num">Programadas</th><th class="num">Acumulado</th><th>Mercado de destino</th><th>Versión</th><th>Motor</th><th>Tracción</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
      <p class="texto nota" style="margin-top:16px">Tasa estimada: la que ordena, calculada por ${esc(modelo(h.modelo).nombre)} con resultados de Día ≤ ${h.dia - 5}. Observada: calibradas sobre auditadas del código con resultado conocido, n y rango del 95 %. ${esc(h.textos.tasa)}${h.programa_simulado ? ' Programa simulado con las unidades del día en la base (ids ficticios).' : ''}</p></section>
    <section class="seccion columnas">
      <div class="c6"><h2>Por qué este código</h2><ul class="lista" style="margin-top:16px">${h.por_que.map((p) => `<li>${esc(p.texto)}</li>`).join('')}</ul>
        <p class="nota" style="margin-top:16px">${esc(h.agrupaciones)}</p></div>
      <div class="c6"><h2>Unidades sugeridas</h2>${h.sin_cubrir ? `<p><b>El programa no alcanza para el cupo: faltan ${h.sin_cubrir}; completar al azar.</b></p>` : ''}
        <ul class="lista" style="margin-top:16px">${h.unidades.map((u) => `<li><b>${esc(u.codigo)}</b> · ${esc(u.motivo.toLowerCase())}: ${u.ids.map(esc).join(', ')}</li>`).join('')}</ul></div>
      <div class="c6"><h2>Mínimo por código</h2><p style="margin-top:16px">${esc(h.textos.minimo)}</p>
        <ul class="lista" style="margin-top:8px">${h.exploracion.map((x) => `<li><b>${esc(x.codigo)}</b>: último resultado conocido ${x.ultimo == null ? 'ninguno' : `Día ${x.ultimo}`}</li>`).join('') || '<li>Hoy ningún código programado está vencido.</li>'}</ul></div>
      <div class="c6"><h2>Cómo se usa</h2><ol class="lista" style="margin-top:16px">${h.textos.uso.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <div class="acciones" style="margin-top:24px"><a class="btn cta" href="#audito">${icono('audito')} Ir a la playa</a></div></div>
    </section>
    <section class="seccion banda"><h2>Límites</h2><ul class="lista" style="margin-top:16px">${h.limites.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
}

// --- 3. ¿Lo audito? -------------------------------------------------------------------------------------------
function contador(e) {
  const p = Math.min(100, (100 * e.tomadas) / Math.max(1, e.cupo));
  return `<div class="contador"><b>${e.tomadas}</b><span>de ${e.cupo} auditorías del día</span></div>
    <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="${e.cupo}" aria-valuenow="${e.tomadas}" aria-label="Cupo cubierto"><i style="width:${p}%"></i></div>`;
}

function respuesta(d) {
  if (!d) return `<div class="respuesta vacia" aria-live="polite"><div class="titular">${icono('audito', 40)} Escribí o tocá un código</div>
    <p>La respuesta aparece acá: auditar o no auditar, con el motivo.</p></div>`;
  const pos = d.posicion ? ` · puesto ${d.posicion} del ranking` : '';
  if (d.decision === 'auditar') {
    return `<div class="respuesta auditar" aria-live="polite"><div class="titular">${icono('check', 40)} Auditar ${esc(d.codigo)}</div>
      <p>Quedan <b>${d.quedan}</b> de este código hoy${pos}. Motivo: ${esc(d.motivo.toLowerCase())}.</p>
      <div class="acciones"><button class="btn cta" id="tomar">${icono('check')} Tomar esta unidad</button></div></div>`;
  }
  const ic = d.decision === 'no_auditar' ? 'menos' : 'fuera';
  const titulo = d.decision === 'no_auditar' ? `No auditar ${esc(d.codigo)}` : `${esc(d.codigo || 'Código')} fuera del programa`;
  return `<div class="respuesta ${d.decision}" aria-live="polite"><div class="titular">${icono(ic, 40)} ${titulo}</div>
    <p>${esc(d.motivo)}${pos}.</p></div>`;
}

async function audito() {
  if (!S.hoja) { vista.innerHTML = cabeza('Equipo de analistas · playa de despacho', '¿Lo <span class="acento">audito</span>?', '') + sinHoja(); return; }
  S.estado = await api('estado');
  const pintar = () => {
    const e = S.estado;
    $('#cont').innerHTML = contador(e);
    $('#chips').innerHTML = e.pendientes.map((p) => `<button class="btn compacto" data-c="${esc(p.codigo)}" aria-pressed="${S.decision?.codigo === p.codigo}">${esc(p.codigo)} · ${p.pendiente}</button>`).join('')
      || '<p><b>Cupo del día cubierto.</b> No queda nada pendiente.</p>';
    $('#resp').innerHTML = respuesta(S.decision);
    $('#tomar')?.addEventListener('click', tomar);
  };
  const consultar = async (codigo) => {
    // El estado puede cambiar desde otro dispositivo (otra tablet, la ronda): se trae junto con la decisión.
    [S.decision, S.estado] = await Promise.all([codigo.trim() ? api('decidir', { codigo }) : null, api('estado')]);
    pintar();
  };
  const tomar = async () => {
    const r = await api('tomar', { codigo: S.decision.codigo });
    S.estado = r.estado;
    S.decision = { ...r.decision, tomada: r.unidad };
    pintar();
    $('#ultima').textContent = `Registrada la unidad ${r.unidad} (${r.decision.codigo}).`;
  };
  vista.innerHTML = `<div class="audito">${cabeza(`Equipo de analistas · Día ${S.hoja.dia}`, '¿Lo <span class="acento">audito</span>?', 'Leé el código en la etiqueta del parabrisas.')}
    <div id="cont"></div>
    <form class="buscador campo" id="buscar" style="margin-top:32px"><span>Código de la etiqueta</span>
      <input type="text" name="codigo" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABF6" aria-describedby="ultima"></form>
    <div class="acciones" id="chips" style="margin-top:16px" aria-label="Códigos con cantidad pendiente"></div>
    <div id="resp"></div><p id="ultima" class="nota" style="margin-top:16px" aria-live="polite"></p></div>`;
  pintar();
  const form = $('#buscar');
  let espera;
  form.codigo.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => consultar(form.codigo.value), 200); });
  form.addEventListener('submit', (e) => { e.preventDefault(); consultar(form.codigo.value); });
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]');
    if (b) { form.codigo.value = b.dataset.c; consultar(b.dataset.c); }
  });
  form.codigo.focus();
}

// --- 4. Ronda -------------------------------------------------------------------------------------------------
async function ronda() {
  if (!S.hoja) { vista.innerHTML = cabeza('Equipo de analistas', 'Ronda en la <span class="acento">playa</span>', '') + sinHoja(); return; }
  S.estado = await api('estado');
  const e = S.estado;
  const pend = e.pendientes.reduce((a, p) => a + p.pendiente, 0);
  const filas = e.pendientes.map((p) => `<tr><td><b>${esc(p.codigo)}</b></td><td>${esc(p.motivo)}</td><td class="num">${p.posicion}</td>
    <td class="num"><b>${p.pendiente}</b></td><td class="num">${p.tomadas.length}</td>
    <td><input type="number" min="0" step="1" name="${esc(p.codigo)}" value="${Math.max(0, p.programadas - p.tomadas.length)}" aria-label="Unidades de ${esc(p.codigo)} en la playa" style="width:96px"></td>
    <td><button type="button" class="btn compacto" data-tomar="${esc(p.codigo)}">Tomar 1</button></td></tr>`).join('');
  const historial = e.rondas.slice().reverse().map((r) => `<li><b>Ronda ${r.numero}</b> · ${r.tomadas} tomadas.
    ${r.cambios.length ? r.cambios.map((c) => `${esc(c.codigo)}: ${c.antes} → ${c.despues}${c.despues > c.antes ? ' (baja por el ranking)' : ' (llegó con menos)'}`).join(' · ') : 'Sin cambios en lo pendiente.'}
    ${r.azar ? ` · <b>${r.azar} al azar</b>: se agotó el ranking.` : ''}</li>`).join('');
  vista.innerHTML = cabeza(`Equipo de analistas · Día ${S.hoja.dia}`, 'Ronda en la <span class="acento">playa</span>',
    'Cada 2 h, aprox.: marcá cuántas unidades de cada código hay en la playa. Si un código no llegó, lo pendiente pasa a los códigos siguientes del ranking que sí llegaron; solo si se agota, al azar.') +
    `<div class="cifras">
      <div class="cifra"><span>Próxima ronda</span><b>${e.rondas.length + 1}</b></div>
      <div class="cifra"><span>Auditorías tomadas</span><b class="grande-acento">${e.tomadas}</b><span>de ${e.cupo}</span></div>
      <div class="cifra"><span>Pendientes</span><b>${pend}</b></div>
      <div class="cifra"><span>A completar al azar</span><b>${e.azar}</b></div></div>
    <form id="ronda" class="seccion">
      ${filas ? `<div class="tabla-marco"><table><thead><tr><th>Código</th><th>Motivo</th><th class="num">Puesto</th><th class="num">Pendiente</th><th class="num">Tomadas</th><th>En la playa ahora</th><th>Registrar</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
      <div class="acciones" style="margin-top:24px"><button class="btn cta" type="submit">${icono('ronda')} Registrar la ronda</button></div>`
      : '<section class="banda"><h2>Cupo del día cubierto</h2><p style="margin-top:8px">No queda nada pendiente. Ya se puede cerrar el día.</p></section>'}
      <div id="ronda-error"></div></form>
    ${historial ? `<section class="seccion"><h2>Rondas registradas</h2><ul class="lista" style="margin-top:16px">${historial}</ul></section>` : ''}
    <section class="seccion banda"><h2>Cierre del día</h2>
      <p class="texto" style="margin:8px 0 24px">Solo en esta demo: el día es de validación y su resultado ya se conoce. Se revela en agregado, nunca por unidad.</p>
      <button class="btn outline" id="cerrar">${icono('check')} Ver el resultado de lo auditado</button><div id="cierre"></div></section>`;
  const form = $('#ronda');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      const en_playa = Object.fromEntries([...form.querySelectorAll('input[type=number]')].map((i) => [i.name, +i.value]));
      await api('ronda', { en_playa });
      ronda();
    } catch (err) { $('#ronda-error').innerHTML = error(err); }
  });
  form.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-tomar]');
    if (!b) return;
    try { await api('tomar', { codigo: b.dataset.tomar }); ronda(); } catch (err) { $('#ronda-error').innerHTML = error(err); }
  });
  $('#cerrar').addEventListener('click', async () => {
    const c = await api('cierre');
    $('#cierre').innerHTML = !c.disponible ? `<p style="margin-top:16px"><b>${esc(c.motivo)}</b></p>` :
      `<div class="cifras" style="margin-top:24px">
        <div class="cifra"><span>Auditadas</span><b>${c.tomadas}</b><span>de un cupo de ${c.cupo}</span></div>
        <div class="cifra"><span>Se calibraron</span><b class="grande-acento">${c.calibradas}</b><span>${pct(c.tomadas ? c.calibradas / c.tomadas : null)} de las auditadas</span></div>
        <div class="cifra"><span>Esperado al azar</span><b>${dec(c.esperado_azar, 1)}</b><span>${pct(c.tasa_dia)} del día · ${entero(c.unidades_dia)} unidades</span></div></div>
      <p class="nota texto" style="margin-top:16px">${esc(c.aclaracion)} Un solo día dice poco: la comparación con incertidumbre está en Simulación.</p>`;
  });
}

// --- 5. Simulación --------------------------------------------------------------------------------------------
async function simulacion() {
  S.sim = await api('simulacion');
  if (!S.sim.lista) {
    vista.innerHTML = cabeza('Evaluación sobre la base', '¿Le gana al <span class="acento">azar</span>?', '') +
      `<section class="banda texto"><h2>Calculando la simulación</h2><p style="margin-top:8px">Se reentrenan los modelos día por día con las cinco semillas. Tarda alrededor de un minuto.</p></section>`;
    S.timer = setInterval(async () => { const s = await api('simulacion'); if (s.lista) { clearInterval(S.timer); simulacion(); } }, 2000);
    return;
  }
  S.simModelo ??= S.hoja?.modelo ?? S.meta.modelos.find((m) => m.por_defecto).clave;
  const sim = S.sim, dias = sim.modelos.azar.serie.map((x) => x.dia);
  if (S.simIdx <= 0 || S.simIdx > dias.length - 1) S.simIdx = dias.length - 1;
  const claves = S.simModelo === 'todos' ? ['rf', 'catboost', 'tasa_fija'] : [S.simModelo];
  const acumular = (serie, campo) => { let a = 0; return serie.map((x) => (a += x[campo])); };
  const estilos = ['principal', 'segunda', 'tercera'];
  const series = claves.map((c, i) => ({ nombre: modelo(c).corto, valores: acumular(sim.modelos[c].serie, 'encontradas'), estilo: estilos[i] }));
  series.push({ nombre: 'Azar (esperado)', valores: acumular(sim.modelos[claves[0]].serie, 'esperado_azar'), estilo: 'azar' });
  const botones = [...S.meta.modelos.map((m) => [m.clave, m.nombre]), ['todos', 'Comparar los tres']]
    .map(([c, n]) => `<button class="btn compacto" data-m="${c}" aria-pressed="${S.simModelo === c}">${esc(n)}</button>`).join('');

  vista.innerHTML = cabeza('Evaluación sobre la base', '¿Le gana al <span class="acento">azar</span>?',
    'Cada día de validación, el modelo llena el cupo diario del 5 % con lo que se sabía cinco días antes, y se cuenta cuántas de las elegidas se calibraron. Se compara con el azar al mismo cupo.') +
    `<div class="acciones" aria-label="Modelo">${botones}</div>
    <div class="acciones" style="margin-top:24px">
      <button class="btn cta" id="play">${icono('play')} Reproducir</button>
      <button class="btn outline" id="paso">${icono('paso')} Un día</button>
      <button class="btn outline" id="todo">${icono('simulacion')} Ver todo</button>
      <label class="campo"><span class="nota">Velocidad</span><select id="vel"><option value="600">Lenta</option><option value="250" selected>Normal</option><option value="80">Rápida</option></select></label>
    </div>
    <div class="cifras seccion" id="kpis"></div>
    <figure class="grafico seccion" id="graf"></figure>
    <p class="nota texto" style="margin-top:8px">${esc(sim.calificador)}. Rango del 95 %: remuestreo de días (2.000 réplicas, semilla registrada).</p>
    <section class="seccion columnas" id="abajo"></section>`;

  const pintar = () => {
    const i = S.simIdx, fin = i === dias.length - 1;
    const c0 = claves[0], m = sim.modelos[c0];
    const enc = series[0].valores[i], esp = series.at(-1).valores[i];
    const k = m.serie.slice(0, i + 1).reduce((a, x) => a + x.cupo, 0);
    $('#kpis').innerHTML = `
      <div class="cifra"><span>Hasta el día</span><b>${dias[i]}</b><span>${i + 1} de ${dias.length} días · ${entero(k)} auditadas</span></div>
      <div class="cifra"><span>Se calibraron (${esc(modelo(c0).nombre)})</span><b class="grande-acento">${enc}</b><span>${pct(enc / k)} de las elegidas</span></div>
      <div class="cifra"><span>Al azar, esperado</span><b>${dec(esp, 1)}</b><span>${pct(esp / k)} de las elegidas</span></div>
      <div class="cifra"><span>Veces el azar</span><b>${dec(enc / esp)}</b><span>${fin ? `rango ${rango(m.metricas.veces_azar_rango95, dec)} · ${LECTURA[m.metricas.lectura]}` : 'el rango aparece al final'}</span></div>`;
    $('#graf').innerHTML = lineas({ dias, series, hasta: i, titulo: 'CALIBRADA encontradas, acumulado', ejeY: 'CALIBRADA encontradas (acumulado)' });
    const tabla = claves.map((c) => {
      const mm = sim.modelos[c].metricas, sem = sim.modelos[c].semillas, pf = modelo(c).prueba_final;
      return `<tr><td><b>${esc(modelo(c).nombre)}</b></td><td class="num">${mm.calibrada_elegidas} de ${mm.elegidos}</td><td class="num">${pct(mm.precision_cupo)}</td>
        <td class="num">${rango(mm.precision_rango95)}</td><td class="num">${dec(mm.veces_azar)}</td><td>${LECTURA[mm.lectura]}</td>
        <td class="num">${sem ? `${sem.min}–${sem.max} (${sem.n} semillas)` : 'no aplica'}</td>
        <td>${pf ? `${pct(pf.precision)} contra ${pct(pf.azar)} al azar (×${dec(pf.veces_azar)}), Días ${pf.dias[0]}–${pf.dias[1]}` : 'sin lectura: no se relee'}</td></tr>`;
    }).join('');
    $('#abajo').innerHTML = `<div class="c12"><h2>Resultado de la validación completa</h2><div class="tabla-marco" style="margin-top:16px"><table class="envolver">
      <thead><tr><th>Modelo</th><th class="num">Calibradas / elegidas</th><th class="num">Precisión en el cupo</th><th class="num">Rango 95 %</th>
      <th class="num">Veces el azar</th><th>Lectura</th><th class="num">Aciertos entre semillas</th><th>Prueba final ya registrada</th></tr></thead><tbody>${tabla}</tbody></table></div>
      <p class="nota texto" style="margin-top:16px">Azar simulado (sorteo con semilla): ${sim.modelos.azar.metricas.calibrada_elegidas} de ${sim.modelos.azar.metricas.elegidos}.
      ${esc(modelo(c0).advertencia)} La prueba final se leyó una sola vez por modelo y no se recalcula acá.</p></div>`;
  };
  const parar = () => { clearInterval(S.timer); S.timer = null; $('#play').innerHTML = `${icono('play')} Reproducir`; };
  $('#play').addEventListener('click', () => {
    if (S.timer) return parar();
    if (S.simIdx >= dias.length - 1) S.simIdx = 0;
    $('#play').innerHTML = `${icono('pausa')} Pausa`;
    S.timer = setInterval(() => { S.simIdx++; pintar(); if (S.simIdx >= dias.length - 1) parar(); }, +$('#vel').value);
  });
  $('#paso').addEventListener('click', () => { parar(); S.simIdx = S.simIdx >= dias.length - 1 ? 0 : S.simIdx + 1; pintar(); });
  $('#todo').addEventListener('click', () => { parar(); S.simIdx = dias.length - 1; pintar(); });
  vista.querySelector('[aria-label=Modelo]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (b) { parar(); S.simModelo = b.dataset.m; simulacion(); }
  });
  pintar();
}

// --- Inicio ---------------------------------------------------------------------------------------------------
(async () => {
  try {
    S.meta = await api('meta');
    const r = await api('hoja');
    Object.assign(S, { hoja: r.hoja, estado: r.estado });
    pie();
    window.addEventListener('hashchange', ir);
    ir();
  } catch (e) {
    vista.innerHTML = error(e);
  }
})();
