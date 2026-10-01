// Cifras de la presentación 3D.
//
// Cada clave lee un campo de un agregado ya versionado en el repo (nunca VIN,
// nunca tasas por código de catálogo ni por mercado de destino). Si el fetch
// falla (por ejemplo, abriendo el sitio como file://), se usa el respaldo, que
// es el valor publicado en docs/entrega/ y se marca `respaldo: true`.
//
// Fuentes:
//   - solucion/resultados/prueba-final.json  corrida única de la prueba final
//     (corridas[0]: tasa fija, preregistro.json). Las corridas[1] y [2] son la
//     segunda lectura (CatBoost, preregistro-precision.json) y no se muestran.
//   - solucion/resultados/eleccion.json, p3.json, p5.json, p6.json, p8.json,
//     preparacion.json  validación 155–194 y preparación de los datos.
//   - research/audit-csv.json  auditoría del CSV vigente (SHA-256 a24860d8…c5a82b).
//   - research/catalog-groups.json  solo `cobertura.codigos_base`; no se pide
//     desde el navegador porque el archivo trae tasas por mercado (fijo: true).
//   - docs/entrega/03-factibilidad-economica.md  tiempos y precios públicos,
//     sin JSON (archivo: null).
//
// Regla de leyenda (guion de la presentación): toda cifra en pantalla lleva
// «entre auditados con actividad QLS, [tramo], base ficticia, n = …».
//
// prototipos/presentacion-3d/verificar_cifras.py compara cada respaldo con su
// campo en el JSON y falla si difieren. Mantener el formato de DEFINICIONES:
// un objeto por definición, con los campos clave, archivo, ruta, formato y
// respaldo en ese orden, `ruta` con puntos e índices ([0]) y, para cifras
// derivadas, `a/b` (cociente), `a-b` (diferencia), `a#largo` o `a#cuenta:campo`.

const RAIZ = '../../'; // relativo a prototipos/presentacion-3d/

// Tramos: texto de la leyenda y clave de la cifra que da su n.
const TRAMOS = {
  base: { texto: 'base completa (Día 1–284)', n: 'base.vin', unidad: 'VIN' },
  preparacion: { texto: 'primera inspección ≤ DIA_260', n: 'base.poblacion', unidad: 'VIN' },
  validacion: { texto: 'validación 155–194', n: 'validacion.n', unidad: 'VIN' },
  prueba: { texto: 'prueba final Día 200–284', n: 'prueba.n', unidad: 'VIN' },
  prueba260: { texto: 'prueba final Día 200–260', n: 'prueba.hasta260.n', unidad: 'VIN' },
  pruebaParcial: { texto: 'prueba final Día 200–284, etiquetas parciales', n: 'prueba.n', unidad: 'VIN' },
  dondeMirar: { texto: 'validación 155–194', n: 'dondeMirar.n', unidad: 'VIN CALIBRADA elegidos por la tasa fija' },
  dondeMirarPrueba: { texto: 'prueba final Día 200–284', n: 'dondeMirar.prueba.n', unidad: 'VIN CALIBRADA elegidos por la tasa fija' },
  hoja190: { texto: 'hoja de desarrollo del Día 190 (validación)', n: 'validacion.n', unidad: 'VIN en validación; unidades con identificadores ficticios' },
};

export const DEFINICIONES = [
  // --- La base -------------------------------------------------------------
  { clave: 'base.eventos', archivo: 'research/audit-csv.json', ruta: 'rows', formato: 'entero', respaldo: 195808,
    tramo: 'base', etiqueta: 'eventos de calidad en la base' },
  { clave: 'base.vin', archivo: 'research/audit-csv.json', ruta: 'vins', formato: 'entero', respaldo: 59681,
    tramo: 'base', etiqueta: 'VIN auditados con actividad QLS' },
  { clave: 'base.calibradas', archivo: 'research/audit-csv.json', ruta: 'vin_label_sets.CALIBRADA', formato: 'entero', respaldo: 6079,
    tramo: 'base', etiqueta: 'VIN con resultado CALIBRADA' },
  { clave: 'base.proporcion', archivo: 'research/audit-csv.json', ruta: 'vin_label_sets.CALIBRADA/vins', formato: 'pct1', respaldo: 0.1018582128315544,
    tramo: 'base', etiqueta: 'de cada 100 auditados se calibran hoy' },
  { clave: 'base.codigos', archivo: 'research/catalog-groups.json', ruta: 'cobertura.codigos_base', formato: 'entero', respaldo: 98, fijo: true,
    tramo: 'base', etiqueta: 'códigos de catálogo distintos' },
  { clave: 'base.duplicados', archivo: 'solucion/resultados/preparacion.json', ruta: 'eventos.duplicados_exactos_conservados', formato: 'entero', respaldo: 477,
    tramo: 'base', etiqueta: 'filas duplicadas exactas, conservadas y documentadas' },
  { clave: 'base.cohorte260', archivo: 'solucion/resultados/preparacion.json', ruta: 'control_particiones.cohorte_posterior_260.vins', formato: 'entero', respaldo: 4910,
    tramo: 'base', etiqueta: 'VIN con primera inspección después de DIA_260, todos OK: van aparte' },
  { clave: 'base.poblacion', archivo: 'solucion/resultados/preparacion.json', ruta: 'control_particiones.poblacion_principal.vins', formato: 'entero', respaldo: 54771,
    tramo: 'preparacion', etiqueta: 'VIN en la población principal' },

  // --- Validación 155–194 --------------------------------------------------
  { clave: 'validacion.n', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[1].vins', formato: 'entero', respaldo: 8038,
    tramo: 'validacion', etiqueta: 'VIN en validación' },
  { clave: 'validacion.elegidos', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[1].elegidos', formato: 'entero', respaldo: 391,
    tramo: 'validacion', etiqueta: 'elegidos con el cupo diario' },
  { clave: 'validacion.dias', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[1].dias', formato: 'entero', respaldo: 35,
    tramo: 'validacion', etiqueta: 'días con VIN' },
  { clave: 'validacion.precision', archivo: 'solucion/resultados/eleccion.json', ruta: 'ganadora.precision_cupo', formato: 'pct1', respaldo: 0.15089514066496162,
    tramo: 'validacion', etiqueta: 'de cada 100 elegidos por la tasa fija se calibran' },
  { clave: 'validacion.precisionRango', archivo: 'solucion/resultados/eleccion.json', ruta: 'ganadora.precision_rango95', formato: 'rangoPct1', respaldo: [0.11573925307055127, 0.1876652842676362],
    tramo: 'validacion', etiqueta: 'rango del 95 % de la precisión en el cupo' },
  { clave: 'validacion.azar', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[1].azar_mismo_cupo', formato: 'pct1', respaldo: 0.09877906979341364,
    tramo: 'validacion', etiqueta: 'de cada 100 elegidos al azar con el mismo cupo' },
  { clave: 'validacion.veces', archivo: 'solucion/resultados/eleccion.json', ruta: 'ganadora.veces_azar', formato: 'veces', respaldo: 1.5276023653648838,
    tramo: 'validacion', etiqueta: 'veces el azar' },
  { clave: 'validacion.vecesRango', archivo: 'solucion/resultados/eleccion.json', ruta: 'ganadora.veces_azar_rango95', formato: 'rangoVeces', respaldo: [1.175831221511182, 1.8955464017615562],
    tramo: 'validacion', etiqueta: 'rango del 95 % de las veces el azar' },
  { clave: 'validacion.alternativas', archivo: 'solucion/resultados/eleccion.json', ruta: 'comparacion#largo', formato: 'entero', respaldo: 31,
    tramo: 'validacion', etiqueta: 'alternativas elegibles comparadas (referencias y ML)' },
  { clave: 'validacion.empates', archivo: 'solucion/resultados/eleccion.json', ruta: 'comparacion#cuenta:empata', formato: 'entero', respaldo: 29,
    tramo: 'validacion', etiqueta: 'empatan con la de mayor precisión' },
  { clave: 'validacion.mejor', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[10].precision_cupo', formato: 'pct1', respaldo: 0.17647058823529413,
    tramo: 'validacion', etiqueta: 'la de mayor precisión (móvil 120 días hacia el mercado), en empate' },
  { clave: 'validacion.fuga', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[15].precision_cupo', formato: 'pct1', respaldo: 0.2225063938618926,
    tramo: 'validacion', etiqueta: 'la versión con fuga «gana»: usa resultados que no se conocen al elegir' },
  { clave: 'oraculo', archivo: 'solucion/resultados/p3.json', ruta: 'resultados[14].precision_cupo', formato: 'pct1', respaldo: 0.2020460358056266,
    tramo: 'validacion', etiqueta: 'techo con el código (oráculo, no elegible)' },

  // --- Prueba final (corrida única, tasa fija ≤194) -------------------------
  { clave: 'prueba.n', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.vins', formato: 'entero', respaldo: 13312,
    tramo: 'prueba', etiqueta: 'VIN en la prueba final' },
  { clave: 'prueba.elegidos', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.elegidos', formato: 'entero', respaldo: 652,
    tramo: 'prueba', etiqueta: 'elegidos con el cupo diario' },
  { clave: 'prueba.dias', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.dias', formato: 'entero', respaldo: 68,
    tramo: 'prueba', etiqueta: 'días con VIN' },
  { clave: 'prueba.calibradasElegidas', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.calibrada_elegidas', formato: 'entero', respaldo: 71,
    tramo: 'prueba', etiqueta: 'CALIBRADA entre los elegidos' },
  { clave: 'prueba.precision', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.precision_cupo', formato: 'pct1', respaldo: 0.10889570552147239,
    tramo: 'prueba', etiqueta: 'de cada 100 elegidos se calibran' },
  { clave: 'prueba.precisionRango', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.precision_rango95', formato: 'rangoPct1', respaldo: [0.08274629051053826, 0.13609099666968646],
    tramo: 'prueba', etiqueta: 'rango del 95 % de la precisión en el cupo' },
  { clave: 'prueba.azar', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.azar_mismo_cupo', formato: 'pct1', respaldo: 0.08228066604795758,
    tramo: 'prueba', etiqueta: 'de cada 100 elegidos al azar con el mismo cupo' },
  { clave: 'prueba.veces', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.veces_azar', formato: 'veces', respaldo: 1.3234665049745966,
    tramo: 'prueba', etiqueta: 'veces el azar' },
  { clave: 'prueba.vecesRango', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.veces_azar_rango95', formato: 'rangoVeces', respaldo: [1.0078349707617178, 1.6396184187210794],
    tramo: 'prueba', etiqueta: 'rango del 95 % de las veces el azar' },
  { clave: 'prueba.diferencia', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.precision_cupo-corridas[0].tramos[0].ganadora.azar_mismo_cupo', formato: 'puntos1', respaldo: 0.02661503947351481,
    tramo: 'prueba', etiqueta: 'calibraciones más cada 100 auditorías (no es un ahorro de planta)' },
  { clave: 'prueba.difMin', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[0].ganadora.diferencia_con_azar_rango95[0]', formato: 'puntos2', respaldo: 0.0006670068465509677,
    tramo: 'prueba', etiqueta: 'límite inferior de la diferencia con el azar: mejora, pero por poco' },
  { clave: 'prueba.hasta260.n', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[1].ganadora.vins', formato: 'entero', respaldo: 13135,
    tramo: 'prueba260', etiqueta: 'VIN en la prueba ≤260' },
  { clave: 'prueba.hasta260.precision', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[1].ganadora.precision_cupo', formato: 'pct1', respaldo: 0.1109350237717908,
    tramo: 'prueba260', etiqueta: 'de cada 100 elegidos se calibran (prueba ≤260)' },
  { clave: 'prueba.hasta260.azar', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].tramos[1].ganadora.azar_mismo_cupo', formato: 'pct1', respaldo: 0.08324409192158382,
    tramo: 'prueba260', etiqueta: 'al azar con el mismo cupo (prueba ≤260)' },

  // --- Valor diferencial ---------------------------------------------------
  { clave: 'dondeMirar.n', archivo: 'solucion/resultados/p6.json', ruta: 'componente.calibrada_elegidas_por_la_ganadora.calibrada_evaluadas', formato: 'entero', respaldo: 59,
    tramo: 'dondeMirar', etiqueta: 'CALIBRADA elegidas por la tasa fija en validación' },
  { clave: 'dondeMirar.codigo', archivo: 'solucion/resultados/p6.json', ruta: 'componente.calibrada_elegidas_por_la_ganadora.acierto_codigo', formato: 'pct1', respaldo: 0.6101694915254238,
    tramo: 'dondeMirar', etiqueta: 'aciertan mirando primero los 3 componentes de su código' },
  { clave: 'dondeMirar.general', archivo: 'solucion/resultados/p6.json', ruta: 'componente.calibrada_elegidas_por_la_ganadora.acierto_general', formato: 'pct1', respaldo: 0.3050847457627119,
    tramo: 'dondeMirar', etiqueta: 'aciertan con los 3 componentes más frecuentes en general' },
  { clave: 'dondeMirar.prueba.n', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].piezas.p6.resultado.componente.prueba_final.calibrada_elegidas_por_la_ganadora.calibrada_evaluadas', formato: 'entero', respaldo: 71,
    tramo: 'dondeMirarPrueba', etiqueta: 'CALIBRADA elegidas por la tasa fija en la prueba final' },
  { clave: 'dondeMirar.prueba.codigo', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].piezas.p6.resultado.componente.prueba_final.calibrada_elegidas_por_la_ganadora.acierto_codigo', formato: 'pct1', respaldo: 0.6338028169014085,
    tramo: 'dondeMirarPrueba', etiqueta: 'aciertan con los 3 componentes de su código (prueba final)' },
  { clave: 'dondeMirar.prueba.general', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].piezas.p6.resultado.componente.prueba_final.calibrada_elegidas_por_la_ganadora.acierto_general', formato: 'pct1', respaldo: 0.352112676056338,
    tramo: 'dondeMirarPrueba', etiqueta: 'aciertan con la lista general (prueba final)' },
  { clave: 'minimo.P', archivo: 'solucion/resultados/p5.json', ruta: 'minimo_por_codigo.P', formato: 'entero', respaldo: 40,
    tramo: 'validacion', etiqueta: 'días como máximo entre dos auditorías de un mismo código (mínimo por código)' },
  { clave: 'minimo.precision', archivo: 'solucion/resultados/p5.json', ruta: 'resultados[2].precision_cupo', formato: 'pct1', respaldo: 0.1534526854219949,
    tramo: 'validacion', etiqueta: 'de cada 100 elegidos se calibran con etiquetas parciales y mínimo por código' },
  { clave: 'minimo.epsilon20', archivo: 'solucion/resultados/p5.json', ruta: 'resultados[5].precision_cupo', formato: 'pct1', respaldo: 0.13810741687979539,
    tramo: 'validacion', etiqueta: 'si se reservara un 20 % del cupo al azar (referencia de costo)' },
  { clave: 'minimo.prueba', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].piezas.p5.resultado.resultados[0].precision_cupo', formato: 'pct1', respaldo: 0.1058282208588957,
    tramo: 'pruebaParcial', etiqueta: 'con mínimo por código en la prueba final: inconcluso' },
  { clave: 'detector.subeX2', archivo: 'solucion/resultados/p6.json', ruta: 'detector.potencia_validacion.sube_x2.deteccion', formato: 'pct1', respaldo: 0.9083333333333333,
    tramo: 'validacion', etiqueta: 'de los cambios sintéticos al doble se detectan' },
  { clave: 'detector.demora', archivo: 'solucion/resultados/p6.json', ruta: 'detector.potencia_validacion.sube_x2.demora_mediana_dia', formato: 'entero', respaldo: 10,
    tramo: 'validacion', etiqueta: 'días de demora mediana ante una suba al doble' },
  { clave: 'detector.bajaMitad', archivo: 'solucion/resultados/p6.json', ruta: 'detector.potencia_validacion.baja_a_la_mitad.deteccion', formato: 'pct1', respaldo: 0.6688888888888889,
    tramo: 'validacion', etiqueta: 'de las bajas sintéticas a la mitad se detectan' },
  { clave: 'detector.alarmas', archivo: 'solucion/resultados/p6.json', ruta: 'detector.etiquetas_reales_validacion.alarmas', formato: 'entero', respaldo: 7,
    tramo: 'validacion', etiqueta: 'alarmas con etiquetas reales en 40 días: observaciones, no causas' },
  { clave: 'detector.prueba.alarmas', archivo: 'solucion/resultados/prueba-final.json', ruta: 'corridas[0].piezas.p6.resultado.detector.alarmas', formato: 'entero', respaldo: 16,
    tramo: 'prueba', etiqueta: 'alarmas en 85 días de la prueba final: observaciones, no causas' },

  // --- La hoja (E3) --------------------------------------------------------
  { clave: 'hoja.unidades', archivo: 'solucion/resultados/p8.json', ruta: 'unidades_programadas', formato: 'entero', respaldo: 297,
    tramo: 'hoja190', etiqueta: 'unidades programadas en el Día 190' },
  { clave: 'hoja.codigos', archivo: 'solucion/resultados/p8.json', ruta: 'codigos_programados', formato: 'entero', respaldo: 28,
    tramo: 'hoja190', etiqueta: 'códigos programados' },
  { clave: 'hoja.cupo', archivo: 'solucion/resultados/p8.json', ruta: 'cupo', formato: 'entero', respaldo: 14,
    tramo: 'hoja190', etiqueta: 'unidades sugeridas para llenar el cupo del día' },
  { clave: 'hoja.vinEnSalidas', archivo: 'solucion/resultados/p8.json', ruta: 'vin_en_salidas', formato: 'entero', respaldo: 0,
    tramo: 'hoja190', etiqueta: 'VIN en las salidas' },

  // --- Factibilidad (sin JSON: docs/entrega/03) ------------------------------
  { clave: 'factibilidad.corrida', archivo: null, ruta: null, formato: 'segundos1', respaldo: 2.4,
    leyenda: 'corrida diaria en una notebook Apple M1 Pro, medida el 29/09/2026 (lectura del CSV 2,2 s + hoja 0,2 s)',
    fuente: 'docs/entrega/03-factibilidad-economica.md', etiqueta: 'por día para leer QLS y armar la hoja' },
  { clave: 'factibilidad.vmMes', archivo: null, ruta: null, formato: 'usd1', respaldo: 24.5,
    leyenda: 'techo de referencia: AWS t3.small en São Paulo encendida 730 h, precio público a demanda consultado el 29/09/2026, sin disco',
    fuente: 'docs/entrega/03-factibilidad-economica.md', etiqueta: 'por mes si se usara una VM de nube (no hace falta)' },
];

// --- Formato es-AR, sin depender de Intl (agrupa también los números de 4 cifras).
function numeroEsAR(x, decimales) {
  const [entero, fraccion] = Math.abs(x).toFixed(decimales).split('.');
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (x < 0 ? '−' : '') + conPuntos + (fraccion ? ',' + fraccion : '');
}

const NBSP = ' ';
const FORMATOS = {
  entero: (x) => numeroEsAR(x, 0),
  pct1: (x) => numeroEsAR(x * 100, 1) + NBSP + '%',
  rangoPct1: ([a, b]) => numeroEsAR(a * 100, 1) + '–' + numeroEsAR(b * 100, 1) + NBSP + '%',
  veces: (x) => numeroEsAR(x, 2) + NBSP + '×',
  rangoVeces: ([a, b]) => numeroEsAR(a, 2) + '–' + numeroEsAR(b, 2) + NBSP + '×',
  puntos1: (x) => numeroEsAR(x * 100, 1) + NBSP + 'puntos',
  puntos2: (x) => numeroEsAR(x * 100, 2) + NBSP + 'puntos',
  segundos1: (x) => numeroEsAR(x, 1) + NBSP + 's',
  usd1: (x) => 'USD' + NBSP + numeroEsAR(x, 1),
};

export function formatear(formato, valor) {
  const f = FORMATOS[formato];
  if (!f) throw new Error(`Formato desconocido: ${formato}`);
  return f(valor);
}

// --- Lectura de rutas del tipo 'a.b[0].c', 'x/y', 'x-y', 'x#largo', 'x#cuenta:campo'.
function leerRuta(objeto, ruta) {
  let valor = objeto;
  for (const parte of ruta.split('.')) {
    const m = parte.match(/^([^[\]]+)((?:\[\d+\])*)$/);
    if (!m) throw new Error(`Ruta inválida: ${ruta}`);
    valor = valor?.[m[1]];
    for (const indice of m[2].matchAll(/\[(\d+)\]/g)) valor = valor?.[Number(indice[1])];
    if (valor === undefined) throw new Error(`Campo ausente: ${ruta}`);
  }
  return valor;
}

export function resolver(objeto, ruta) {
  const [base, op] = ruta.split('#');
  if (op === 'largo') return leerRuta(objeto, base).length;
  if (op?.startsWith('cuenta:')) {
    const campo = op.slice('cuenta:'.length);
    return leerRuta(objeto, base).filter((x) => x[campo] === true).length;
  }
  if (base.includes('/')) {
    const [a, b] = base.split('/');
    return leerRuta(objeto, a) / leerRuta(objeto, b);
  }
  if (base.includes('-')) {
    const [a, b] = base.split('-');
    return leerRuta(objeto, a) - leerRuta(objeto, b);
  }
  return leerRuta(objeto, base);
}

function esNumeroValido(v) {
  if (Array.isArray(v)) return v.length === 2 && v.every((x) => typeof x === 'number' && Number.isFinite(x));
  return typeof v === 'number' && Number.isFinite(v);
}

// Exportada para figuras.js (cargarDatos), con la misma convención de rutas.
export async function leerJson(archivo) {
  const url = new URL(RAIZ + archivo, import.meta.url);
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`${archivo}: HTTP ${respuesta.status}`);
  return respuesta.json();
}

/**
 * Carga todas las cifras.
 * @returns {Promise<Map<string, {valor: string, numero: number|number[]|null, formato: string,
 *   etiqueta: string, leyenda: string, fuente: string, respaldo: boolean, pendiente: boolean}>>}
 */
export async function cargarCifras() {
  const archivos = [...new Set(DEFINICIONES.filter((d) => d.archivo && !d.fijo).map((d) => d.archivo))];
  const lecturas = await Promise.allSettled(archivos.map(leerJson));
  const jsons = new Map(archivos.map((a, i) => [a, lecturas[i].status === 'fulfilled' ? lecturas[i].value : null]));

  const numeros = new Map();
  const usoRespaldo = new Map();
  for (const d of DEFINICIONES) {
    let numero = d.respaldo;
    let respaldo = false;
    if (d.archivo && !d.fijo) {
      try {
        const json = jsons.get(d.archivo);
        if (!json) throw new Error('sin JSON');
        const leido = resolver(json, d.ruta);
        if (!esNumeroValido(leido)) throw new Error('valor no numérico');
        numero = leido;
      } catch (error) {
        respaldo = true;
        if (typeof location !== 'undefined' && /[?&]debug\b/.test(location.search)) {
          console.warn(`[cifras] ${d.clave}: uso el respaldo (${error.message})`);
        }
      }
    }
    numeros.set(d.clave, numero);
    usoRespaldo.set(d.clave, respaldo);
  }

  const cifras = new Map();
  for (const d of DEFINICIONES) {
    const numero = numeros.get(d.clave);
    const pendiente = numero === null || numero === undefined;
    let leyenda = d.leyenda ?? '';
    if (!leyenda && d.tramo) {
      const t = TRAMOS[d.tramo];
      const n = numeros.get(t.n);
      const nTexto = n === null || n === undefined ? '[PENDIENTE]' : formatear('entero', n);
      leyenda = `entre auditados con actividad QLS, ${t.texto}, base ficticia, n = ${nTexto} ${t.unidad}`;
    }
    cifras.set(d.clave, {
      valor: pendiente ? '[PENDIENTE]' : formatear(d.formato, numero),
      numero: pendiente ? null : numero,
      formato: d.formato, // para el conteo animado con el mismo formatear()
      etiqueta: d.etiqueta,
      leyenda,
      fuente: d.fuente ?? (d.ruta ? `${d.archivo} → ${d.ruta}` : d.archivo),
      respaldo: usoRespaldo.get(d.clave),
      pendiente,
    });
  }
  return cifras;
}
