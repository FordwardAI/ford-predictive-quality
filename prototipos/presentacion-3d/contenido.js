// Contenido de la presentación 3D (FordwardAI, Trials Day 2/10/2026).
//
// Fuentes (no inventar contenido ni cifras; editar aquí y no en ui.js):
//   - docs/entrega/guion-presentacion.md: 17 diapositivas, mensaje de cada una,
//     versión núcleo (0, 1, 2, 4, 5, 6, 8, 9, 11, 13, 14, 15, 16) y notas por bloque.
//   - docs/entrega/01 a 06 y 02-x: borradores del Informe (secciones del template).
//   - docs/entrega/preguntas-jurado.md, docs/entrega/figuras/README.md.
//   - docs/fuentes/documentation.md (ficha del desafío), docs/alcance-entrega.md,
//     CONTEXT.md (vocabulario).
//   - research/opcion-mas-precisa.md (1/10): exploratorio; solo una tarjeta de
//     detalle en «comparación de alternativas», sin cifra de prueba final.
//
// Las cifras no van escritas en titulares ni bajadas: se piden por clave a
// cifras.js, que les agrega la leyenda «entre auditados con actividad QLS, …».
// Las notas del orador repiten las cifras de la frase permitida para poder
// decirlas en voz alta; salen de docs/entrega/02-1-resumen-ejecutivo.md.
//
// Reglas: «no cambia cuántas se auditan, cambia cuáles»; nunca «probabilidad
// de la unidad»; sin cifras de ahorro; el vehículo es ilustrativo.
// Lo que falta se marca «[PENDIENTE: qué falta — fuente esperada]» y se lista
// en README.md, sección «Pendientes para completar».

const FIGURAS = '../../docs/entrega/figuras/';
const ILUSTRACIONES = 'assets/ilustraciones/'; // SVG a mano, versionados
const LOCAL = 'assets/local/'; // capturas locales: no se versionan (ver README)

export const meta = {
  evento: 'Ford Innovation Challenge III — AI Edition — 2026',
  desafio: 'Data-Driven Predictive Quality',
  equipo: 'FordwardAI',
  integrantes: [
    { nombre: '[PENDIENTE: Apellido, Nombre — carátula del Informe]', universidad: '[PENDIENTE: Universidad — carátula del Informe]', carrera: '[PENDIENTE: Carrera (informática) — carátula del Informe]' },
    { nombre: '[PENDIENTE: Apellido, Nombre — carátula del Informe]', universidad: '[PENDIENTE: Universidad — carátula del Informe]', carrera: '[PENDIENTE: Carrera (informática) — carátula del Informe]' },
    { nombre: '[PENDIENTE: Apellido, Nombre — carátula del Informe]', universidad: '[PENDIENTE: Universidad — carátula del Informe]', carrera: '[PENDIENTE: Carrera (industrial) — carátula del Informe]' },
  ],
  fecha: 'Octubre 2026',
};

// Secciones del template del Informe. La presentación usa los separadores
// 01 a 06; 2.3 (seguridad) no tiene separador propio y va dentro del 02.
export const secciones = [
  { numero: '01', titulo: 'Descripción del desafío' },
  {
    numero: '02',
    titulo: 'Descripción de la solución',
    subsecciones: [
      { numero: '2.1', titulo: 'Resumen ejecutivo' },
      { numero: '2.2', titulo: 'Especificaciones técnicas' },
      { numero: '2.2.1', titulo: 'Información complementaria' },
      { numero: '2.3', titulo: 'Seguridad y privacidad' },
    ],
  },
  { numero: '03', titulo: 'Factibilidad económica' },
  { numero: '04', titulo: 'Valor diferencial e innovación' },
  { numero: '05', titulo: 'Trabajo futuro' },
  { numero: '06', titulo: 'Conclusiones' },
];

// Campos extra (opcionales para ui.js): `subseccion` (2.1…2.3), `diapositiva`
// (número en el guion) y `minutos` (duración del guion).
//
// Pantallas y pasos (modo híbrido scroll + diapositivas):
//   - Cada capítulo es una pantalla. `puntos` se muestran como callouts (un paso
//     cada uno; al revelarse, la escena enfoca ese punto) y `detalle` como
//     tarjetas siempre visibles.
//   - `continuacion: '<id del padre>'`: pantalla que sigue a la anterior. Hereda
//     seccion, subseccion, escena, nucleo, orbita, antetitulo, titular y notas
//     del padre; no entra en el índice y se numera «9b». `subtitulo` es el rótulo
//     del bloque que se movió a la continuación.
//   - `pasos: { cifras, callouts, tarjetas }` con 'uno' | 'pares' | 'todos'.
//     Por defecto: cifras 'uno' si son ≤3 (si no 'todos'), callouts 'uno',
//     tarjetas 'uno' si son ≤4 (si no 'pares').
//   - `lista: []`: pasos numerados (un paso cada uno).
//   - `figura`: { src, alt, pie } (SVG de matplotlib), { src, respaldo } (SVG a
//     mano con respaldo), { tipo: 'js', id, opciones, src } (figuras.js; `src`
//     es el respaldo) o { tipo: 'local', src: [candidatos], respaldo, pendiente }
//     (captura local fuera de Git; si falta se ve el respaldo con un chip).
//   - `disposicion: 'tarjetas-texto' | 'tarjetas-escena'`: dónde van las tarjetas.
//     Por defecto, con figura van en la columna de texto; sin figura, en la
//     columna opuesta (sobre la escena, en vidrio).
export const capitulos = [
  // 0 · Portada --------------------------------------------------------------
  {
    id: 'portada',
    seccion: 'portada',
    escena: 'portada',
    nucleo: true,
    diapositiva: '0',
    minutos: 0.3,
    antetitulo: 'Ford Innovation Challenge III — AI Edition — 2026',
    titulo: 'Mismas auditorías, ', acento: 'mejor elegidas',
    bajada: 'Data-Driven Predictive Quality. Equipo FordwardAI.',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [],
    notas: 'Nos presentamos: equipo FordwardAI, desafío Data-Driven Predictive Quality. El vehículo es ilustrativo: la base no dice qué modelo es. El reparto de diapositivas entre los tres lo decidimos al ensayar.',
    orbita: true,
  },

  // 1 · 01 El proceso (núcleo) ----------------------------------------------
  {
    id: 'proceso',
    seccion: '01',
    escena: 'linea',
    nucleo: true,
    diapositiva: '1',
    minutos: 1.2,
    antetitulo: 'Descripción del desafío',
    titulo: 'Hoy el 5 % se elige ', acento: 'al azar',
    bajada: 'En la playa de despacho, después de Gate Release, un equipo de analistas elige qué unidades van a Auditoría Adicional.',
    cifras: [],
    puntos: [
      { id: 'carroceria', titulo: 'Carrocería', texto: 'Primera etapa de la línea. Desde acá QLS (Quality Leadership System) documenta la trazabilidad y el historial de cada unidad.' },
      { id: 'pintura', titulo: 'Pintura', texto: 'QLS sigue registrando la trazabilidad de la unidad a lo largo del proceso productivo.' },
      { id: 'montaje', titulo: 'Montaje', texto: 'Al final del proceso, la verificación de calidad, por la que pasan todos los vehículos, registra incidencias y reparaciones en QLS: los eventos de calidad.' },
      { id: 'gate-release', titulo: 'Gate Release', texto: 'Valida que el vehículo cumpla las especificaciones y define su condición (OK / NO OK). La base no marca cuándo ocurre.' },
      { id: 'playa-despacho', titulo: 'Playa de despacho', texto: 'Las unidades liberadas esperan entre 0 y 5 días. En rondas de unas dos horas, el equipo de analistas elige al azar el cupo diario: cerca del 5 % de lo que aprueba Gate Release. Acá entra la hoja.' },
      { id: 'inspeccion-adicional', titulo: 'Auditoría Adicional', texto: 'Inspección de alta precisión por muestreo. Decide si la unidad necesita una calibración fina (CALIBRADA) o no (OK). La ficha ubica acá la herramienta predictiva.' },
    ],
    figura: null,
    detalle: [],
    notas: 'Arrancamos por la operación, no por el modelo: dónde está la playa de despacho, quién elige y cada cuánto. Usamos el vocabulario del glosario: auditados con actividad QLS, cupo diario, precisión en el cupo, veces el azar.',
    orbita: false,
  },
  {
    id: 'proceso-b',
    continuacion: 'proceso',
    cifras: [],
    puntos: [],
    figura: { src: ILUSTRACIONES + 'proceso.svg', respaldo: FIGURAS + 'diagrama_proceso.svg', alt: 'Diagrama del proceso: Body, Pintura, Montaje, Calidad, Gate Release y Auditoría Adicional, con la hoja en la playa de despacho', pie: 'La hoja de códigos prioritarios entra en la playa de despacho, donde se elige leyendo el código del parabrisas. Fuente: docs/entrega/figuras.' },
    detalle: [
      { titulo: 'Cómo se elige hoy', texto: 'La elección es completamente aleatoria, sin criterio específico. El cupo es una cantidad fija por día que define Calidad de Planta según el programa de producción; Ford no busca ampliarlo, por costo y capacidad.' },
      { titulo: 'Qué dato está a la vista', texto: 'El código de catálogo figura en una etiqueta del parabrisas y hoy no se usa para elegir. Los códigos que se van a producir en el día se conocen de antemano.' },
      { titulo: 'Qué pide la ficha', texto: 'Anticipar qué unidades van a necesitar calibración fina en la Auditoría Adicional, a partir del historial de QLS, con un reporte accionable de las unidades priorizadas.' },
    ],
  },

  // 2 · 01 La pregunta (núcleo) ---------------------------------------------
  {
    id: 'pregunta',
    seccion: '01',
    escena: 'linea',
    nucleo: true,
    diapositiva: '2',
    minutos: 1.0,
    antetitulo: 'Descripción del desafío',
    titulo: 'Mismo cupo, ¿más ', acento: 'calibraciones?',
    bajada: 'Con el mismo cupo diario, ¿se encuentran más calibraciones que eligiendo al azar? No cambia cuántas se auditan: cambia cuáles.',
    cifras: ['base.proporcion'],
    puntos: [
      { id: 'playa-despacho', titulo: 'Dónde se decide', texto: 'La recomendación llena el cupo completo con unidades que ya aprobaron Gate Release. Calidad de Planta sigue fijando cuántas; los analistas deciden cuáles.' },
      { id: 'inspeccion-adicional', titulo: 'Qué se mide', texto: 'La precisión en el cupo: de cada 100 elegidos, cuántos se calibran. Se informa junto a las veces el azar.' },
    ],
    figura: null,
    detalle: [
      { titulo: 'Mismas auditorías', texto: 'La recomendación llena el cupo completo. Cambia qué unidades se eligen, no cuántas.' },
      { titulo: 'La referencia es el azar', texto: 'Porque es el método actual.' },
      { titulo: 'Sin costos de planta', texto: 'A cupo fijo, la alternativa que más CALIBRADA encuentra es la mejor para cualquier par de costos positivos. Por eso el desafío se resuelve sin los costos que Ford no puede dar.' },
      { titulo: 'La base', texto: 'Es ficticia y reúne solo auditados con actividad QLS: unidades que pasaron por la Auditoría Adicional y tuvieron al menos una incidencia en QLS.' },
    ],
    notas: 'Dejamos tres cosas fijas desde el principio: mismas auditorías, la referencia es el azar y medimos cuántas calibraciones hay entre los elegidos. Cifra de referencia: unos 10 de cada 100 auditados se calibran hoy, entre auditados con actividad QLS, base ficticia, n = 59.681 VIN.',
    orbita: false,
  },

  // 3 · 02 Los datos y su preparación ----------------------------------------
  {
    id: 'datos',
    seccion: '02',
    subseccion: '2.2',
    escena: 'datos',
    nucleo: false,
    diapositiva: '3',
    minutos: 1.5,
    antetitulo: 'Especificaciones técnicas · Preparación de los datos',
    titulo: 'De eventos a ', acento: 'una fila por VIN',
    bajada: 'Encabezados corregidos, la cohorte posterior a DIA_260 aparte y el componente fuera, por fuga.',
    cifras: ['base.eventos', 'base.vin', 'base.calibradas', 'base.cohorte260'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Encabezados desalineados', texto: 'Las descripciones de las posiciones 38 a 40 no coinciden con los nombres técnicos. Se usan los nombres técnicos: el resultado es «Auditoría Adicional», columna 40.' },
      { titulo: 'De eventos a VIN', texto: 'La etiqueta es constante dentro de cada VIN: una fila por VIN, con código, Día del VIN y etiqueta.' },
      { titulo: 'Duplicados y faltantes', texto: 'Las filas duplicadas exactas se conservan y se documentan: con una fila por VIN no cambian nada. Las 9 fechas de reparación «#N/A» se reconocen como nulos.' },
      { titulo: 'Cohorte posterior a DIA_260', texto: 'Todos sus VIN son OK. Quedan fuera de la población principal, sin asignarle causa, y se suman en una sensibilidad de la prueba final.' },
      { titulo: 'Componente como fuga', texto: 'El componente de Auditoría Adicional solo existe cuando la unidad es CALIBRADA. Nunca es predictor; solo se usa como lo que se predice en «dónde mirar».' },
      { titulo: 'Etiquetas de la prueba final', texto: 'Se enmascaran al cargar y solo se desbloquean con el preregistro.' },
    ],
    notas: 'Si el tiempo se acorta, esta diapositiva sale y la respondemos en preguntas. Mostramos que la preparación documenta, no elige: la causa de duplicados, nulos y del patrón posterior a DIA_260 sigue sin conocerse.',
    orbita: false,
  },

  // 4 · 02 Por qué solo el código (núcleo) -----------------------------------
  {
    id: 'predictor',
    seccion: '02',
    subseccion: '2.2',
    escena: 'predictor',
    nucleo: true,
    diapositiva: '4',
    minutos: 1.5,
    antetitulo: 'Especificaciones técnicas · El predictor',
    titulo: 'Lo seguro está ', acento: 'en el parabrisas',
    bajada: 'El código de catálogo es lo único que se conoce con certeza al elegir. Por eso se priorizan códigos, no vehículos.',
    cifras: ['base.codigos'],
    puntos: [
      { id: 'etiqueta-parabrisas', titulo: 'Código de catálogo', texto: 'Está en la etiqueta del parabrisas y se conoce desde el programa de producción. Describe versión y mercado de destino. Todas las unidades de un código reciben la misma estimación: la tasa del código, nunca una probabilidad por unidad.' },
    ],
    figura: null,
    detalle: [
      { titulo: 'Tiempos de ciclo y parámetros de ajuste', texto: 'No están en la base. Se pidieron a Ford el 18/09; Ford respondió que el dataset entregado contiene lo necesario. No inventamos variables que no existen.' },
      { titulo: 'Historial de reparaciones', texto: 'Está, pero la base no marca Gate Release: no se puede probar que existiera al elegir. Se evaluó en un anexo rotulado «disponibilidad no probada»: solo, no se distingue del azar; sumado al código, empata con la tasa fija.' },
      { titulo: 'Interacciones entre variables', texto: 'Los modelos de ML sobre el código pueden capturarlas. Compitieron en validación y ninguno superó a la tasa fija más allá del empate.' },
      { titulo: 'Resultado y componente de Auditoría Adicional', texto: 'Son lo que se quiere anticipar: excluidos siempre como predictores.' },
      { titulo: 'La señal está en el mercado de destino', texto: 'La posición 3 del código fija el mercado de destino, el único atributo de la agrupación que sostiene la señal en validación.' },
    ],
    notas: 'Es el argumento central del bloque 02: respondemos en forma explícita a los tiempos de ciclo, parámetros de ajuste e interacciones del resumen del challenge. No están en la base, y el historial no tiene marca de Gate Release.',
    orbita: true,
  },

  // 5 · 02 Validación sin fuga (núcleo) --------------------------------------
  {
    id: 'validacion',
    seccion: '02',
    subseccion: '2.2',
    escena: 'validacion',
    nucleo: true,
    diapositiva: '5',
    minutos: 1.5,
    antetitulo: 'Especificaciones técnicas · Validación',
    titulo: 'Validar sin ', acento: 'mirar el futuro',
    bajada: 'Tiempo hacia adelante, 5 días de margen, cupo diario y una prueba final que se abre una sola vez.',
    cifras: ['validacion.n', 'prueba.n'],
    puntos: [],
    figura: { tipo: 'js', id: 'particiones', alt: 'Particiones por Día del VIN: entrenamiento, margen, validación, margen y prueba final', pie: 'Particiones por Día del VIN (1–284), con los márgenes de 5 días entre tramos.' },
    detalle: [],
    notas: 'Explicamos que el Día del VIN aproxima el día de la auditoría y que la partición es temporal porque la proporción CALIBRADA baja con el tiempo: un split mezclado inflaría el resultado.',
    orbita: false,
  },
  {
    id: 'validacion-b',
    continuacion: 'validacion',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Particiones por Día del VIN', texto: 'Entrenamiento ≤149 · margen 150–154 · validación 155–194 · margen 195–199 · prueba final ≥200. La opción elegida se reentrena con ≤194 antes de la prueba.' },
      { titulo: 'Margen de disponibilidad', texto: 'Un VIN del Día t solo usa resultados de VIN con Día ≤ t−5: es el máximo que informó Ford entre Gate Release y la auditoría.' },
      { titulo: 'Cómo se simula el cupo', texto: 'Cada día se eligen max(1, floor(0,05 · N)) VIN, con empates al azar y semilla registrada. La referencia es la precisión esperada al azar con el mismo cupo diario.' },
      { titulo: 'Incertidumbre', texto: 'Rango del 95 % por bootstrap de días, con 2.000 remuestreos. Mejora si el rango de la diferencia con el azar queda entero por encima de cero.' },
      { titulo: 'Preregistro', texto: 'Antes de la corrida se fijan la opción, sus parámetros, las semillas y los hashes. Lo que no figura en el preregistro no se lee en la prueba final.' },
    ],
  },

  // 6 · 02 Comparación de alternativas (núcleo) ------------------------------
  {
    id: 'alternativas',
    seccion: '02',
    subseccion: '2.2',
    escena: 'validacion',
    nucleo: true,
    diapositiva: '6',
    minutos: 2.0,
    antetitulo: 'Especificaciones técnicas · Elección del modelo',
    titulo: 'Ganó la ', acento: 'más simple',
    bajada: 'En validación todas las tasas por código superan al azar y casi todas empatan con la mejor. Gana la tasa fija: es un hallazgo, no una renuncia.',
    cifras: ['validacion.alternativas', 'validacion.empates', 'validacion.precision', 'validacion.azar', 'validacion.veces'],
    puntos: [],
    figura: { tipo: 'js', id: 'comparacion', opciones: {}, src: FIGURAS + 'comparacion_alternativas.svg', alt: 'Precisión en el cupo de cada alternativa con su rango del 95 %, frente al azar al mismo cupo', pie: 'Validación 155–194. La línea vertical es el azar al mismo cupo; el oráculo (techo) y la versión con fuga no son elegibles.' },
    detalle: [],
    notas: 'Anticipamos que se esperan empates por la potencia de la validación. Si gana lo simple, lo presentamos como hallazgo: con el código como único predictor, el valor está en cómo se usa la tasa, no en el algoritmo. Los modelos que no ganaron son la evidencia.',
    orbita: false,
  },
  {
    id: 'alternativas-b',
    continuacion: 'alternativas',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Qué compitió', texto: 'Referencias (tasa fija, móviles, suavizado hacia el mercado, decaimiento) y nueve familias de ML sobre el código (logística, Naive Bayes, Random Forest, XGBoost, LightGBM, CatBoost, MLP, promedio y stacking), en modo fijo y reentrenado. Parámetros fijados antes de mirar la validación.' },
      { titulo: 'La regla', texto: 'Gana la mayor precisión en el cupo. Si la diferencia pareada por días con la mejor incluye 0, hay empate y gana la más simple.' },
      { titulo: 'Por qué empatan', texto: 'Con un único predictor, todo modelo estima la misma tabla de tasas por código. Con 391 elegidos, el rango de cada precisión mide unos ±3,4 a ±4,5 puntos: la validación separa del azar, pero casi no separa a las alternativas entre sí.' },
      { titulo: 'Exploratorio (1/10): ¿hay una opción más precisa?', texto: 'Exploratorio, solo Día < 195; prueba final no releída. Con esta base no aparece una opción más precisa identificable: un grupo de estimadores por código empata y su orden se invierte entre bloques de tiempo. Lo que sí importa es actualizar la tasa y contraerla hacia el mercado cuando rota la mezcla de códigos. El análisis propone Random Forest con atributos del código como opción por efectividad; contradice la tasa fija acordada el 30/09 y es una decisión pendiente del equipo (research/opcion-mas-precisa.md).' },
    ],
  },

  // 7 · 02 La fuga, a la vista ------------------------------------------------
  {
    id: 'fuga',
    seccion: '02',
    subseccion: '2.2',
    escena: 'validacion',
    nucleo: false,
    diapositiva: '7',
    minutos: 0.5,
    antetitulo: 'Especificaciones técnicas · Sin fuga',
    titulo: 'La versión con fuga ', acento: '«gana»',
    bajada: 'Usa resultados que todavía no se conocen al elegir. Por eso no se usa, y por eso el margen de 5 días es obligatorio.',
    cifras: ['validacion.fuga', 'oraculo', 'validacion.precision'],
    puntos: [],
    figura: { tipo: 'js', id: 'comparacion', opciones: { resaltar: 'fuga' }, src: FIGURAS + 'comparacion_alternativas.svg', alt: 'Comparación de alternativas con la versión con fuga por encima del oráculo', pie: 'Misma figura: la versión con fuga (móvil 60 días sin margen) queda incluso por encima del techo con el código.' },
    detalle: [
      { titulo: 'Qué hace distinto', texto: 'Es la tasa móvil de 60 días sin los 5 días de margen: usa resultados de auditorías que en planta todavía no se conocerían.' },
      { titulo: 'El oráculo', texto: 'La tasa real del tramo marca el techo con el código como predictor. No es elegible: usa las etiquetas del mismo tramo que evalúa.' },
    ],
    notas: 'Es una demostración didáctica: mostramos la fuga a propósito para que se vea por qué el margen importa. Si el tiempo se acorta, sale y la respondemos en preguntas.',
    orbita: false,
  },

  // 8 · 02 Resultado contra el azar (núcleo) — 2.1 Resumen ejecutivo ----------
  {
    id: 'resultado',
    seccion: '02',
    subseccion: '2.1',
    escena: 'resultado',
    nucleo: true,
    diapositiva: '8',
    minutos: 1.5,
    antetitulo: 'Resumen ejecutivo · Prueba final',
    titulo: 'Mejora frente al azar, ', acento: 'por poco',
    bajada: 'En la prueba final, abierta una sola vez, la hoja encuentra más calibraciones que el azar con el mismo cupo. El límite inferior de la diferencia es apenas positivo.',
    cifras: ['prueba.precision', 'prueba.azar', 'prueba.veces'],
    puntos: [],
    figura: { tipo: 'js', id: 'veces_azar_prueba_final', opciones: {}, src: FIGURAS + 'veces_azar_prueba_final.svg', alt: 'Veces el azar de la tasa fija en la prueba final, por tramo, con su rango del 95 %', pie: 'Prueba completa, prueba ≤260 y sensibilidad con la cohorte posterior a 260. La figura de validación (veces_azar.svg) queda de respaldo.' },
    detalle: [],
    notas: 'Decimos la frase permitida y nada más: «Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final, de cada 100 elegidos se calibrarían 10,9 (rango del 95 %: 8,3–13,6), contra 8,2 al azar con el mismo cupo: 1,32 veces el azar. Es mejora, pero por poco: el límite inferior de la diferencia es de 0,07 puntos». Después, los límites fijos en una línea.',
    orbita: false,
  },
  {
    id: 'resultado-b',
    continuacion: 'resultado',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Límites fijos', texto: 'El tramo de prueba y la tasa por mercado ya se habían mirado; que los auditados se eligen al azar es un supuesto de Ford; en planta solo se conocería el resultado de lo auditado; el Día del VIN aproxima el día de la auditoría. No es una medición de planta.' },
      { titulo: 'Validación y prueba', texto: 'En validación la misma opción había dado 15,1 de cada 100; en la prueba la cifra es más baja y el azar también (8,2 contra 9,9). Puede haber optimismo por haberla elegido en validación; no lo verificamos.' },
      { titulo: 'Rango', texto: 'Rango del 95 %: 8,3–13,6 de cada 100 elegidos; 1,01–1,64 veces el azar. El límite inferior de la diferencia con el azar es de 0,07 puntos: mejora, pero por poco. Entre auditados con actividad QLS, prueba final Día 200–284, base ficticia, n = 13.312 VIN.' },
      { titulo: 'Prueba ≤260', texto: 'Con el tramo hasta DIA_260 da 11,1 contra 8,3 al azar: también mejora.' },
      { titulo: 'Qué no afirmamos', texto: 'Impacto ni ahorro en planta, reducción de calibraciones, que el resultado valga para VIN no auditados, ni causas.' },
    ],
  },

  // 9 · 02 Demo: la hoja (núcleo) — 2.2.1 Información complementaria ----------
  {
    id: 'hoja',
    seccion: '02',
    subseccion: '2.2.1',
    escena: 'predictor',
    nucleo: true,
    diapositiva: '9',
    minutos: 2.0,
    antetitulo: 'Información complementaria · La hoja',
    titulo: 'Así la usa ', acento: 'el analista',
    bajada: 'Cada mañana, la hoja de códigos prioritarios dice qué códigos buscar en la ronda y cuántas unidades de cada uno derivar.',
    cifras: ['hoja.unidades', 'hoja.codigos', 'hoja.cupo', 'hoja.vinEnSalidas'],
    puntos: [
      { id: 'etiqueta-parabrisas', titulo: 'Se lee el código', texto: 'El analista lee el código en el parabrisas y busca su fila: cantidad sugerida, tasa del código con rango y n, veces la tasa general, acumulado y mercado de destino.' },
      { id: 'playa-despacho', titulo: 'Si un código no llega', texto: 'La cantidad pendiente pasa a los códigos siguientes del ranking que sí llegaron. Solo se completa al azar si se agota el ranking.' },
    ],
    // Captura local (fuera de Git: muestra tasas por código). Sin ella, el mock
    // sin números con el chip de pendiente.
    figura: {
      tipo: 'local',
      src: [LOCAL + 'captura-hoja-dia-260.png', LOCAL + 'd-hoja.png'],
      respaldo: ILUSTRACIONES + 'hoja-mock.svg',
      alt: 'La hoja de códigos prioritarios del día',
      pendiente: '[PENDIENTE: captura de la hoja del Día 260 (captura-hoja-dia-260.png) — salida local fuera de Git; no se versiona porque muestra tasas por código]',
    },
    detalle: [],
    notas: 'Llevamos la hoja impresa y en planilla. Recorremos una fila: código, cantidad sugerida, tasa con rango y n, veces la tasa general, mercado de destino. Mostramos el traspaso cuando un código no llega. Nunca decimos «probabilidad de la unidad». En la versión núcleo, la demo baja a un minuto. Si falla el equipo, usamos las capturas de respaldo.',
    orbita: false,
  },
  {
    id: 'hoja-b',
    continuacion: 'hoja',
    cifras: [],
    puntos: [],
    figura: { src: ILUSTRACIONES + 'solucion.svg', respaldo: FIGURAS + 'diagrama_solucion.svg', alt: 'Diagrama de la solución: entradas, recálculo de la tasa por código y salidas', pie: 'Entradas (programa del día, cupo, resultados con Día ≤ t−5 y catálogo), tasa por código con mínimo por código y detector de cambios, y la hoja en planilla e imprimible.' },
    detalle: [
      { titulo: 'Qué muestra', texto: 'Arriba, la frase permitida con su calificador y los límites. Después, la tabla de códigos (primero el código, porque es lo que se lee), las filas del mínimo por código aparte y el bloque «por qué este código». Nunca «probabilidad de la unidad» ni un puntaje por vehículo.' },
      { titulo: 'Formatos', texto: 'Planilla (CSV/XLSX) e imprimible de una página: formato adaptable a la operación.' },
      { titulo: 'Hoja de ensayo y hoja final', texto: 'La del Día 190 (validación) sirve de ensayo; la final es la del Día 260, ya generada. Las dos usan identificadores ficticios y ningún VIN.' },
    ],
  },

  // 10 · 02 Seguridad y privacidad — 2.3 --------------------------------------
  {
    id: 'seguridad',
    seccion: '02',
    subseccion: '2.3',
    escena: 'seguridad',
    nucleo: false,
    diapositiva: '10',
    minutos: 0.8,
    antetitulo: 'Seguridad y privacidad',
    titulo: 'Fuera de la red ', acento: 'de planta',
    bajada: 'Lee una exportación, no toca la red de automatización, sin nube, sin LLM y sin datos personales. Si falla, se vuelve al azar.',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Normas de referencia', texto: 'ISO/IEC 27001:2022, NIST Cybersecurity Framework 2.0, ISA/IEC 62443 (zonas y conductos), Ley 25.326 de Protección de los Datos Personales y Resolución AAIP 47/2018. Es una investigación breve del equipo, no una opinión legal ni una certificación.' },
      { titulo: 'Qué datos usa', texto: 'Código de catálogo, resultado de la Auditoría Adicional, Día del VIN, agrupación del catálogo, programa del día y cupo. El VIN solo se usa internamente para agrupar eventos y nunca aparece en las salidas. No usa los identificadores de inspectores ni reparadores.' },
      { titulo: 'Dónde corre', texto: 'Un script de Python en una notebook o un servidor de planta. No se conecta a controladores, robots ni a la red de automatización, y no escribe en QLS.' },
      { titulo: 'Riesgos principales', texto: 'Integridad de las entradas (el script verifica el SHA-256 antes de correr), confidencialidad de la hoja (documento interno de Calidad) y disponibilidad: la hoja es una recomendación, no un bloqueo.' },
      { titulo: 'Control humano', texto: 'Calidad de Planta fija cuántas se auditan y los analistas deciden cuáles.' },
    ],
    notas: 'En el template no tiene separador propio: la ubicamos dentro del 02. Si el tiempo se acorta, sale y la respondemos en preguntas.',
    orbita: false,
  },

  // 11 · 03 Costos y escala (núcleo) ------------------------------------------
  {
    id: 'factibilidad',
    seccion: '03',
    escena: 'factibilidad',
    nucleo: true,
    diapositiva: '11',
    minutos: 1.2,
    antetitulo: 'Factibilidad económica',
    titulo: 'Sin licencias ni ', acento: 'auditorías extra',
    bajada: 'Corre en equipo existente, con bibliotecas de código abierto. La VM de nube es solo un techo de referencia.',
    cifras: ['factibilidad.corrida', 'factibilidad.vmMes'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Implementación', texto: 'Automatizar la exportación diaria de QLS y el programa del día, instalar el script y capacitar a los analistas. Son horas internas de Ford, que no estimamos: dependen de sus sistemas.' },
      { titulo: 'Operación', texto: 'Una corrida por día y una hoja de una página. Ninguna auditoría adicional: el cupo lo sigue fijando Calidad de Planta.' },
      { titulo: 'Mantenimiento', texto: 'Revisar periódicamente la opción elegida, atender las alertas del detector de cambios y actualizar el catálogo y las dependencias de forma controlada.' },
      { titulo: 'Escenarios de escala', texto: 'Una línea: una notebook de Calidad. Una planta: un servidor existente o una VM chica. Varias plantas: cada una con su catálogo y su cupo; sigue siendo una tabla de tasas por código por planta.' },
    ],
    notas: 'No damos cifras de ahorro. Si preguntan, remitimos a la fórmula de la diapositiva siguiente.',
    orbita: false,
  },

  // 12 · 03 La fórmula para Ford ----------------------------------------------
  {
    id: 'formula',
    seccion: '03',
    escena: 'factibilidad',
    nucleo: false,
    diapositiva: '12',
    minutos: 0.6,
    antetitulo: 'Factibilidad económica · Justificación',
    titulo: 'La fórmula ', acento: 'la completa Ford',
    bajada: '(precisión de la hoja − precisión al azar) × auditorías por día × costo evitado por calibración encontrada.',
    cifras: ['prueba.diferencia'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Precisiones', texto: 'En planta se miden con los días de control, no con la base.' },
      { titulo: 'Auditorías por día', texto: 'El cupo diario que ya fija Calidad de Planta.' },
      { titulo: 'Costo evitado', texto: 'Lo define Ford: lo que vale encontrar en la auditoría una unidad que necesitaba calibración, en lugar de que salga sin ella.' },
      { titulo: 'No es un ahorro', texto: 'La diferencia sobre la base ficticia equivale a calibraciones más cada 100 auditorías, entre auditados con actividad QLS. No es un ahorro de planta.' },
    ],
    notas: 'No damos cifras de ahorro: Ford no pudo dar costos y la base es ficticia. Dejamos la fórmula para que Ford aplique sus propios valores.',
    orbita: false,
  },

  // 13 · 04 Valor diferencial: dónde mirar (núcleo) ---------------------------
  {
    id: 'donde-mirar',
    seccion: '04',
    escena: 'donde-mirar',
    nucleo: true,
    diapositiva: '13',
    minutos: 1.0,
    antetitulo: 'Valor diferencial e innovación',
    titulo: 'Además de cuál, ', acento: 'dónde mirar',
    bajada: 'Para cada código, los tres componentes que más se calibraron en sus auditorías anteriores. Es lo que se predice, nunca un predictor.',
    cifras: ['dondeMirar.prueba.codigo', 'dondeMirar.prueba.general'],
    puntos: [
      { id: 'componente-1', titulo: 'Zona ilustrativa 1', texto: 'Zona genérica, solo para ilustrar. Los componentes de Auditoría Adicional están anonimizados en la base: la hoja sugeriría los 3 más calibrados en el código, sin ubicarlos en la unidad.' },
      { id: 'componente-2', titulo: 'Zona ilustrativa 2', texto: 'Zona genérica, solo para ilustrar. La lista sale de auditorías del código con resultado ya conocido (Día ≤ t−5), suavizada hacia la distribución general.' },
      { id: 'componente-3', titulo: 'Zona ilustrativa 3', texto: 'Zona genérica, solo para ilustrar. «Asociación, no causa»: indica por dónde empezar la revisión, no por qué se calibra.' },
    ],
    figura: null,
    detalle: [],
    notas: 'Cada pieza la decimos con su estado: evaluada en validación, leída en la prueba si estaba en el preregistro, o «solo validación» rotulado así. Las zonas del vehículo son ilustrativas: los componentes reales están anonimizados.',
    orbita: true,
  },
  {
    id: 'donde-mirar-b',
    continuacion: 'donde-mirar',
    cifras: [],
    puntos: [],
    figura: { tipo: 'js', id: 'donde_mirar', opciones: {}, src: FIGURAS + 'donde_mirar.svg', alt: 'Acierto de los 3 primeros componentes por código frente a los 3 más frecuentes en general', pie: 'Validación 155–194, sobre todas las CALIBRADA y sobre las que eligió la tasa fija.' },
    detalle: [
      { titulo: 'Cinco piezas, cada una con su estado', texto: '«Dónde mirar»: mejora en validación y en la prueba final. Selección que aprende de sus auditorías: elegida en validación. Detector de cambios: calibrado en validación. Señal por mercado de destino: evaluada en validación. Insumo para la subcategorización: no se sostiene en validación.' },
      { titulo: 'En validación', texto: 'Sobre las 59 CALIBRADA que eligió la tasa fija, los 3 primeros del código acertaron 61,0 % contra 30,5 % de la lista general; sobre todas (n = 780), 40,0 % contra 33,5 %. Entre auditados con actividad QLS, validación 155–194, base ficticia.' },
      { titulo: 'Por qué', texto: 'Los mentores señalaron que la clave está en qué componente presentó la falla. Lo usamos como lo que se predice dentro de la unidad elegida.' },
    ],
  },

  // 14 · 04 Una selección que aprende (núcleo) --------------------------------
  {
    id: 'aprende',
    seccion: '04',
    escena: 'linea',
    nucleo: true,
    diapositiva: '13',
    minutos: 1.0,
    antetitulo: 'Valor diferencial e innovación',
    titulo: 'Aprende de ', acento: 'sus propias auditorías',
    bajada: 'Un mínimo por código mantiene al día las tasas sin reservar cupo al azar, y un detector avisa cuando un código cambia.',
    cifras: ['minimo.precision', 'detector.subeX2', 'detector.alarmas'],
    puntos: [
      { id: 'inspeccion-adicional', titulo: 'El resultado vuelve', texto: 'Cada resultado de auditoría alimenta, con 5 días de margen, la siguiente revisión de la tasa de su código.' },
    ],
    figura: { tipo: 'js', id: 'etiquetas_parciales', opciones: {}, src: FIGURAS + 'etiquetas_parciales.svg', alt: 'Precisión en el cupo de cada política de exploración con etiquetas parciales', pie: 'Validación 155–194, conociendo solo lo auditado desde el Día 155. El detector se muestra en detector_potencia.svg.' },
    detalle: [
      { titulo: 'El problema', texto: 'Si la hoja orienta todo el cupo, en planta solo se conoce lo que la hoja eligió: los códigos que nunca se eligen dejan de tener datos nuevos.' },
      { titulo: 'Mínimo por código', texto: 'Cada código que se produce recibe, por rotación, al menos una auditoría cada 40 días (elegido en validación). Con etiquetas parciales conserva la precisión del ranking puro; reservar un 20 % al azar la baja.' },
    ],
    notas: 'Seguimos con el estado de cada pieza. En la prueba final, el mínimo por código dio inconcluso: lo decimos así si preguntan.',
    orbita: false,
  },
  {
    id: 'aprende-b',
    continuacion: 'aprende',
    cifras: [],
    puntos: [],
    figura: { tipo: 'js', id: 'detector', opciones: {}, src: FIGURAS + 'detector_potencia.svg', alt: 'Potencia del detector de cambios ante cambios sintéticos en validación', pie: 'Validación 155–194, con cambios sintéticos en la tasa de un código.' },
    detalle: [
      { titulo: 'Detector de cambios', texto: 'Un CUSUM de Bernoulli por código, calibrado para no superar una falsa alarma cada 30 días en todo el catálogo. Sus alarmas son observaciones, no causas, y no modifican al predictor.' },
      { titulo: 'Señal por mercado de destino', texto: 'La hoja explica cada prioridad por el mercado de destino, en el bloque «por qué este código». No prueba que el mercado cause calibraciones.' },
      { titulo: 'Subcategorización', texto: 'Agrupar códigos por perfil de fallas no da un orden estable en validación. Queda la herramienta para cuando Ford publique su subcategorización.' },
    ],
  },

  // 15 · 05 Implementar midiendo (núcleo) -------------------------------------
  {
    id: 'futuro',
    seccion: '05',
    escena: 'futuro',
    nucleo: true,
    diapositiva: '14',
    minutos: 1.2,
    antetitulo: 'Trabajo futuro',
    titulo: 'Implementar ', acento: 'midiendo',
    bajada: 'Días de control alternados, mínimo por código y resultados con y sin actividad QLS por separado. Replicable en otras líneas y plantas.',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Días de control', texto: 'En la etapa inicial se alternan días con hoja y días al azar: dan la referencia sin sesgo en las mismas condiciones de producción. Terminada la etapa, la hoja orienta todo el cupo.' },
      { titulo: 'Límites de una prueba en planta', texto: 'Solo se conoce el resultado de lo auditado. La duración y el tamaño de la etapa con días de control no se fijan: sin datos reales no se puede calcular.' },
      { titulo: 'Replicabilidad', texto: 'Hace falta un código de catálogo visible en la unidad, resultados de auditoría con fecha y código, un cupo diario y un histórico de auditorías al azar para arrancar. Cada línea o planta corre su propia hoja.' },
      { titulo: 'Historial y subcategorización', texto: 'Si Ford prueba que el historial está disponible al elegir (por ejemplo, con una marca de Gate Release), se reabre. La subcategorización del catálogo entra como otro nivel de suavizado y compite con la misma regla.' },
      { titulo: 'Consulta operativa abierta', texto: 'Qué fracción de las unidades producidas tiene actividad QLS y si se puede consultar QLS desde la playa. Mientras no haya respuesta, se mantienen el supuesto y el límite declarados.' },
    ],
    notas: 'La duración de la etapa con días de control no se fija: sin datos reales no se puede calcular. Los pasos se ordenan por dependencias; el calendario lo decide Ford.',
    orbita: false,
  },

  // 16 · 05 La plataforma propuesta -------------------------------------------
  {
    id: 'plataforma',
    seccion: '05',
    escena: 'futuro',
    nucleo: false,
    diapositiva: '14b',
    minutos: 0.8,
    antetitulo: 'Trabajo futuro · Propuesta',
    titulo: 'Así se vería ', acento: 'todo junto',
    bajada: 'Hoja, rondas, códigos, alertas y seguimiento de los días de control en un solo lugar. Es una propuesta: hoy se entrega la hoja.',
    cifras: [],
    puntos: [],
    // Capturas locales del prototipo (no se versionan); si faltan, el mock sin números.
    figura: {
      tipo: 'local',
      src: [LOCAL + 'd-inicio.png'],
      respaldo: ILUSTRACIONES + 'plataforma-mock.svg',
      alt: 'Prototipo de la plataforma: hoja, rondas, códigos y alertas',
      pendiente: '[PENDIENTE: capturas del prototipo de plataforma — prototipos/plataforma-web/ (shoot.sh, se generan localmente y no se versionan)]',
    },
    detalle: [
      { titulo: 'Qué reúne', texto: 'Operación diaria (hoja y registro de cada ronda), códigos y mercado (tasa en el tiempo, «dónde mirar», alertas), evidencia del modelo e implementación (días de control, cupo y mínimo por código).' },
      { titulo: 'Límites', texto: 'Usa la base ficticia y cifras de validación. No hay integración con QLS ni con el programa de producción: esa integración es el trabajo principal para llevarla a planta.' },
    ],
    notas: 'Si hace falta volver a unos 20 minutos, recortamos la demo o la fuga, no esta. Insistimos en que es una propuesta de implementación: la hoja sigue siendo la salida operativa y el piso.',
    orbita: false,
  },

  // 17 · 06 Conclusiones (núcleo) ---------------------------------------------
  {
    id: 'conclusiones',
    seccion: '06',
    escena: 'resultado',
    nucleo: true,
    diapositiva: '15',
    minutos: 1.0,
    antetitulo: 'Conclusiones',
    titulo: 'Resultado, valor y ', acento: 'próximos pasos',
    bajada: 'Mejora sobre la base ficticia, por poco. Usa lo que ya está a la vista, sin riesgo operativo. El próximo paso es medir en planta.',
    cifras: ['prueba.precision', 'prueba.azar', 'prueba.veces'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Valor para Ford', texto: 'Mismas auditorías, mejor elegidas. Usa el código del parabrisas y el programa del día. Explicable: cada prioridad es la tasa de una versión y un mercado. Sin riesgo operativo: si la hoja no está, se elige al azar como hoy. Sigue aprendiendo con el mínimo por código y avisa cambios con el detector.' },
      { titulo: 'Qué aprendimos', texto: 'En validación ganó la más simple entre alternativas que empatan. Con el código como único predictor, el valor está en cómo se usa la tasa. El techo con el código (oráculo) queda por encima de lo logrado.' },
    ],
    notas: 'Una frase de resultado, tres de valor y los próximos pasos en orden. Después del feedback del 2/10, cualquier cambio al predictor se evalúa solo en validación y se presenta como «evaluado en validación; prueba final no releída». La cifra principal no cambia.',
    orbita: false,
  },
  {
    id: 'conclusiones-b',
    continuacion: 'conclusiones',
    subtitulo: 'Próximos pasos, por dependencias',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [],
    lista: [
      'Conectar las entradas (QLS y programa del día).',
      'Cargar el histórico de auditorías al azar.',
      'Instalar el script y generar la primera hoja.',
      'Capacitar al equipo de analistas.',
      'Arrancar con días de control y mínimo por código.',
      'Medir por separado con y sin actividad QLS.',
      'Decidir con datos de planta si la hoja orienta todo el cupo.',
      'Sumar la subcategorización cuando Ford la publique.',
    ],
  },

  // 18 · Cierre ---------------------------------------------------------------
  {
    id: 'cierre',
    seccion: 'cierre',
    escena: 'cierre',
    nucleo: true,
    diapositiva: '16',
    minutos: 0.2,
    antetitulo: 'FordwardAI',
    titulo: 'Gracias. ', acento: '¿Preguntas?',
    bajada: 'Data-Driven Predictive Quality. Octubre 2026.',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [],
    notas: 'Tenemos a mano las preguntas del jurado y las ideas descartadas (docs/entrega/). Llevamos todo en dos medios: notebook y pendrive o enlace.',
    orbita: false,
  },
];
