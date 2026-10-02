// Contenido de la presentación 3D (FordwardAI, Trials Day 2/10/2026).
//
// Fuentes (no inventar contenido ni cifras; editar aquí y no en ui.js):
//   - docs/entrega/01 a 06 y 02-x: borradores del Informe (secciones del template).
//   - docs/entrega/preguntas-jurado.md, docs/entrega/figuras/README.md.
//   - docs/fuentes/documentation.md (ficha del desafío), docs/alcance-entrega.md,
//     CONTEXT.md (vocabulario).
//   - research/opcion-mas-precisa.md (1/10) y research/simulacion-evaluacion.md:
//     exploratorios (Día < 195); solo en ampliaciones y notas, rotulados.
//   - Solución elegida (decisión de Mateo Serebrinsky para la presentación):
//     CatBoost con atributos del código, reentrenado cada 5 días (vida media
//     15 días, semilla 1), elegido por precisión (precision.json). La cifra
//     oficial de la prueba final sigue siendo la lectura 1 (tasa fija); la de
//     CatBoost es la lectura 2 y la de Random Forest, la 3 (prueba-final.json).
//
// Las cifras no van escritas en titulares ni bajadas: se piden por clave a
// cifras.js, que les agrega la leyenda «entre inspeccionados con actividad QLS, …».
// Las notas del orador repiten las cifras de la frase permitida para poder
// decirlas en voz alta; salen de docs/entrega/02-1-resumen-ejecutivo.md.
//
// Reglas: «no cambia cuántas se inspeccionan, cambia cuáles»; nunca «probabilidad
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
    { nombre: 'Mateo Serebrinsky', carrera: 'Ingeniería Informática', universidad: 'Universidad Austral' },
    { nombre: 'Máximo Georgalos', carrera: 'Ingeniería Industrial', universidad: 'Universidad Austral' },
    { nombre: 'Facundo Lanusse', carrera: 'Ingeniería Informática', universidad: 'Universidad Austral' },
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

// Campos extra (opcionales para ui.js): `subseccion` (2.1…2.3), `minutos` (duración orientativa),
// `lado` ('derecha' | 'izquierda': de qué lado va el texto; si no, lo decide la sección), `centrado`
// (true: las tarjetas o la figura van al centro de su columna, un poco por encima del medio, aunque
// tapen parte del vehículo; ver styles.css), `continua` (true, solo en la escena `linea`: la pantalla
// arranca quieta donde terminó la pantalla anterior de la línea, sin recorrerla) y, en las
// pantallas de la escena `linea`, `recorrido` (segundos que tarda el vehículo en recorrerla; por
// defecto 6, ver main.js). La línea mide ≈ 162 unidades, así que 11 s ≈ 14 u/s.
//
// Pantallas: una diapositiva por capítulo, pensadas para proyector: un titular,
// pocas cifras (hasta 3), hasta 3 tarjetas cortas y, si hace falta, una figura.
//   - `puntos`: callouts cortos (la escena enfoca el punto). Sin `texto` solo se ve el título.
//   - `detalle`: tarjetas siempre visibles (título + una frase).
//   - `ampliacion`: [{ titulo, texto }] lo que no entra en la diapositiva (antes eran
//     tarjetas y pantallas de continuación). No se proyecta: va a las notas del orador.
//   - `figura`: { src, alt, pie } (SVG de matplotlib), { src, respaldo } (SVG a mano
//     con respaldo), { tipo: 'js', id, opciones, src } (figuras.js; `src` es el
//     respaldo) o { tipo: 'local', src: [candidatos], respaldo, pendiente }
//     (captura local fuera de Git; si falta se ve el respaldo con un chip).
//   - `disposicion: 'tarjetas-texto' | 'tarjetas-escena'`: dónde van las tarjetas.
export const capitulos = [
  // 0 · Portada --------------------------------------------------------------
  {
    id: 'portada',
    seccion: 'portada',
    escena: 'portada',
    nucleo: true,
    minutos: 0.3,
    antetitulo: 'Ford Innovation Challenge III — AI Edition — 2026',
    titulo: 'Mismas inspecciones, ', acento: 'mejor elegidas',
    bajada: 'Data-Driven Predictive Quality · FordwardAI',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [],
    ampliacion: [],
    notas: 'Nos presentamos: equipo FordwardAI, desafío Data-Driven Predictive Quality. El vehículo es ilustrativo: la base no dice qué modelo es. El reparto de diapositivas entre los tres lo decidimos al ensayar.',
    orbita: true,
  },

  // 1 · 01 El proceso ---------------------------------------------------------
  {
    id: 'proceso',
    seccion: '01',
    escena: 'linea',
    recorrido: 28, // s del vehículo por toda la línea (por defecto 6): se aprecia cada estación (≈ 6 u/s; antes ≈ 14)
    nucleo: true,
    minutos: 1.2,
    antetitulo: 'Descripción del desafío',
    titulo: 'Hoy el 5 % se elige ', acento: 'al azar',
    bajada: 'Después de Gate Release, los analistas eligen qué unidades van a Inspección Adicional.',
    cifras: [],
    puntos: [
      { id: 'carroceria', titulo: 'Carrocería' },
      { id: 'pintura', titulo: 'Pintura' },
      { id: 'montaje', titulo: 'Montaje' },
      { id: 'gate-release', titulo: 'Gate Release', texto: 'Define OK / NO OK.' },
      { id: 'playa-despacho', titulo: 'Playa de despacho', texto: 'Espera de 0 a 5 días. Acá se elige el cupo, cerca del 5 %.' },
      { id: 'inspeccion-adicional', titulo: 'Inspección Adicional', texto: 'CALIBRADA u OK.' },
    ],
    figura: null,
    detalle: [],
    ampliacion: [
      { titulo: 'Carrocería', texto: 'Primera etapa de la línea. Desde acá QLS (Quality Leadership System) documenta la trazabilidad y el historial de cada unidad.' },
      { titulo: 'Pintura', texto: 'QLS sigue registrando la trazabilidad de la unidad a lo largo del proceso productivo.' },
      { titulo: 'Montaje', texto: 'Al final del proceso, la verificación de calidad, por la que pasan todos los vehículos, registra incidencias y reparaciones en QLS: los eventos de calidad.' },
      { titulo: 'Gate Release', texto: 'Valida que el vehículo cumpla las especificaciones y define su condición (OK / NO OK). La base no marca cuándo ocurre.' },
      { titulo: 'Playa de despacho', texto: 'Las unidades liberadas esperan entre 0 y 5 días. En rondas de unas dos horas, el equipo de analistas elige al azar el cupo diario: cerca del 5 % de lo que aprueba Gate Release. Acá entra la hoja.' },
      { titulo: 'Inspección Adicional', texto: 'Inspección de alta precisión por muestreo. Decide si la unidad necesita una calibración fina (CALIBRADA) o no (OK). La ficha ubica acá la herramienta predictiva.' },
      { titulo: 'Cómo se elige hoy', texto: 'La elección es completamente aleatoria, sin criterio específico. El cupo es una cantidad fija por día que define Calidad de Planta según el programa de producción; Ford no busca ampliarlo, por costo y capacidad.' },
      { titulo: 'Qué dato está a la vista', texto: 'El código de catálogo figura en una etiqueta del parabrisas y hoy no se usa para elegir. Los códigos que se van a producir en el día se conocen de antemano.' },
      { titulo: 'Qué pide la ficha', texto: 'Anticipar qué unidades van a necesitar calibración fina en la Inspección Adicional, a partir del historial de QLS, con un reporte accionable de las unidades priorizadas.' },
    ],
    notas: 'Arrancamos por la operación, no por el modelo: dónde está la playa de despacho, quién elige y cada cuánto. Usamos el vocabulario del glosario: inspeccionados con actividad QLS, cupo diario, precisión en el cupo, veces el azar.',
    orbita: false,
  },

  // 2 · 01 La pregunta --------------------------------------------------------
  {
    id: 'pregunta',
    seccion: '01',
    escena: 'linea',
    continua: true, // arranca quieto donde terminó la pantalla anterior de la línea (`proceso`), sin recorrerla de nuevo
    nucleo: true,
    minutos: 1.0,
    antetitulo: 'Descripción del desafío',
    titulo: 'Mismo cupo, ¿más ', acento: 'calibraciones?',
    bajada: 'No cambia cuántas se inspeccionan: cambia cuáles.',
    cifras: ['base.proporcion'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Mismas inspecciones', texto: 'Cambia cuáles, no cuántas.' },
      { titulo: 'La referencia es el azar', texto: 'Es el método actual.' },
      { titulo: 'Sin costos de planta', texto: 'A cupo fijo, más CALIBRADA es mejor con cualquier costo.' },
    ],
    ampliacion: [
      { titulo: 'Mismas inspecciones', texto: 'La recomendación llena el cupo completo. Cambia qué unidades se eligen, no cuántas.' },
      { titulo: 'La referencia es el azar', texto: 'Porque es el método actual.' },
      { titulo: 'Sin costos de planta', texto: 'A cupo fijo, la alternativa que más CALIBRADA encuentra es la mejor para cualquier par de costos positivos. Por eso el desafío se resuelve sin los costos que Ford no puede dar.' },
      { titulo: 'La base', texto: 'Es ficticia y reúne solo inspeccionados con actividad QLS: unidades que pasaron por la Inspección Adicional y tuvieron al menos una incidencia en QLS.' },
      { titulo: 'Dónde se decide', texto: 'La recomendación llena el cupo completo con unidades que ya aprobaron Gate Release. Calidad de Planta sigue fijando cuántas; los analistas deciden cuáles.' },
      { titulo: 'Qué se mide', texto: 'La precisión en el cupo: de cada 100 elegidos, cuántos se calibran. Se informa junto a las veces el azar.' },
    ],
    notas: 'Dejamos tres cosas fijas desde el principio: mismas inspecciones, la referencia es el azar y medimos cuántas calibraciones hay entre los elegidos. Cifra de referencia: unos 10 de cada 100 inspeccionados se calibran hoy, entre inspeccionados con actividad QLS, base ficticia, n = 59.681 VIN.',
    orbita: false,
  },

  // 3 · 02 Por qué solo el código ---------------------------------------------
  {
    id: 'predictor',
    seccion: '02',
    subseccion: '2.2',
    escena: 'predictor',
    centrado: true, // las tarjetas van al centro de su columna, un poco por encima del medio (pueden tapar el vehículo)
    nucleo: true,
    minutos: 1.5,
    antetitulo: 'Especificaciones técnicas · El predictor',
    titulo: 'Lo seguro está ', acento: 'en el código',
    bajada: 'El código de catálogo es lo único que se conoce al elegir: se priorizan códigos, no vehículos.',
    cifras: ['base.codigos'],
    puntos: [
      { id: 'etiqueta-parabrisas', titulo: 'Código de catálogo', texto: 'Una tasa por código, nunca una probabilidad por unidad.' },
    ],
    figura: null,
    detalle: [
      { titulo: 'Nunca predictores', texto: 'El resultado y el componente de Inspección Adicional.' },
    ],
    ampliacion: [
      { titulo: 'Código de catálogo', texto: 'Está en la etiqueta del parabrisas y se conoce desde el programa de producción. Describe versión y mercado de destino. Todas las unidades de un código reciben la misma estimación: la tasa del código, nunca una probabilidad por unidad.' },
      { titulo: 'Tiempos de ciclo y parámetros de ajuste', texto: 'No están en la base. Se pidieron a Ford el 18/09; Ford respondió que el dataset entregado contiene lo necesario. No inventamos variables que no existen.' },
      { titulo: 'Historial de reparaciones', texto: 'Está, pero la base no marca Gate Release: no se puede probar que existiera al elegir. Se evaluó en un anexo rotulado «disponibilidad no probada»: solo, no se distingue del azar; sumado al código, empata con la tasa por código sola.' },
      { titulo: 'Interacciones entre variables', texto: 'Los modelos de ML sobre el código pueden capturarlas. En validación, con el código solo, ninguno superó a la tasa por código más allá del empate. Con los atributos del código (mercado, motor, tracción y versión) y elección por precisión en bloques de tiempo, la más precisa es CatBoost: la solución elegida, que calcula la tasa de cada código.' },
      { titulo: 'Resultado y componente de Inspección Adicional', texto: 'Son lo que se quiere anticipar: excluidos siempre como predictores.' },
      { titulo: 'La señal está en el mercado de destino', texto: 'La posición 3 del código fija el mercado de destino, el único atributo de la agrupación que sostiene la señal en validación.' },
      { titulo: 'De eventos a una fila por VIN', texto: 'Encabezados corregidos (se usan los nombres técnicos), la cohorte posterior a DIA_260 aparte (todos sus VIN son OK, sin asignarle causa) y el componente fuera por fuga. Las filas duplicadas exactas se conservan y se documentan; las 9 fechas «#N/A» se reconocen como nulos. Las etiquetas de la prueba final se enmascaran al cargar y solo se desbloquean con el preregistro.' },
    ],
    notas: 'Es el argumento central del bloque 02: respondemos en forma explícita a los tiempos de ciclo, parámetros de ajuste e interacciones del resumen del challenge. No están en la base, y el historial no tiene marca de Gate Release. La preparación de los datos documenta, no elige: la causa de duplicados, nulos y del patrón posterior a DIA_260 sigue sin conocerse.',
    orbita: true,
  },

  // 4 · 02 Validación sin fuga ------------------------------------------------
  {
    id: 'validacion',
    seccion: '02',
    subseccion: '2.2',
    escena: 'validacion',
    centrado: true, // la figura va al centro de su columna, un poco por encima del medio
    nucleo: true,
    minutos: 1.5,
    antetitulo: 'Especificaciones técnicas · Validación',
    titulo: 'Validar sin ', acento: 'mirar el futuro',
    bajada: 'Tiempo hacia adelante, 5 días de margen y una prueba final que solo se abre con preregistro.',
    cifras: ['validacion.n', 'prueba.n'],
    puntos: [],
    figura: { tipo: 'js', id: 'particiones', alt: 'Particiones por Día del VIN: entrenamiento, margen, validación, margen y prueba final', pie: 'Particiones por Día del VIN (1–284), con los márgenes de 5 días entre tramos.' },
    detalle: [],
    ampliacion: [
      { titulo: 'Particiones por Día del VIN', texto: 'Entrenamiento ≤149 · margen 150–154 · validación 155–194 · margen 195–199 · prueba final ≥200. En la prueba, CatBoost se reentrena cada 5 días con Día ≤ t − 5, también dentro de la prueba.' },
      { titulo: 'Margen de disponibilidad', texto: 'Un VIN del Día t solo usa resultados de VIN con Día ≤ t−5: es el máximo que informó Ford entre Gate Release y la inspección.' },
      { titulo: 'Cómo se simula el cupo', texto: 'Cada día se eligen max(1, floor(0,05 · N)) VIN, con empates al azar y semilla registrada. La referencia es la precisión esperada al azar con el mismo cupo diario.' },
      { titulo: 'Incertidumbre', texto: 'Rango del 95 % por bootstrap de días, con 2.000 remuestreos. Mejora si el rango de la diferencia con el azar queda entero por encima de cero.' },
      { titulo: 'Preregistro', texto: 'Antes de la corrida se fijan la opción, sus parámetros, las semillas y los hashes. Lo que no figura en el preregistro no se lee en la prueba final.' },
    ],
    notas: 'Explicamos que el Día del VIN aproxima el día de la inspección y que la partición es temporal porque la proporción CALIBRADA baja con el tiempo: un split mezclado inflaría el resultado.',
    orbita: false,
  },

  // 5 · 02 Comparación de alternativas ----------------------------------------
  {
    id: 'alternativas',
    seccion: '02',
    subseccion: '2.2',
    escena: 'validacion',
    nucleo: true,
    minutos: 2.0,
    antetitulo: 'Especificaciones técnicas · Elección del modelo',
    titulo: 'Elegimos por ', acento: 'precisión',
    bajada: 'Cinco bloques de tiempo y 54 alternativas, siempre entrenando con el pasado.',
    cifras: ['alternativas.n', 'catboost.seleccion', 'catboost.azarSeleccion'],
    puntos: [],
    // Sin respaldo de matplotlib: si figuras.js no puede dibujarla, la pantalla queda sin figura.
    figura: { tipo: 'js', id: 'seleccion', opciones: {}, alt: 'Precisión en el cupo de cada alternativa en la validación (bloques 1 a 4), con CatBoost destacado, el azar y el oráculo', pie: 'Validación, bloques 1 a 4 (Día 100–174). Cada punto es una alternativa; el oráculo (techo) no es elegible.' },
    detalle: [],
    ampliacion: [
      { titulo: 'Qué compitió', texto: '54 alternativas elegibles: tasas por código (móviles, suavizadas hacia el mercado, con decaimiento y sin actualizar), un suavizado jerárquico (código → mercado y versión → mercado → general) y modelos de ML (logística, Naive Bayes, Random Forest, XGBoost, LightGBM, CatBoost, MLP, promedio y stacking), con el código solo o con sus atributos, en modo fijo y reentrenado (precision.json).' },
      { titulo: 'La regla', texto: 'Gana la mayor precisión acumulada en los cuatro primeros bloques de la validación. Cinco bloques consecutivos, siempre entrenando con el pasado (Día ≤ t − 5): los bloques 1 a 4 (días 100–174, 740 elegidos por alternativa) deciden y el último bloque (días 175–194) no participa en la elección. Todo con Día < 195: la prueba final no se relee.' },
      { titulo: 'Por qué en bloques', texto: 'En la validación 155–194, con 391 elegidos, el rango de cada precisión mide unos ±3,4 a ±4,5 puntos: separa del azar, pero elegir ahí la más precisa sería casi un sorteo. Por eso se midió en cinco bloques de tiempo, con más días y con los atributos del código.' },
      { titulo: 'La versión con fuga «gana»', texto: 'Usa resultados que todavía no se conocen al elegir. Por eso no se usa, y por eso el margen de 5 días es obligatorio. Es la tasa móvil de 60 días sin los 5 días de margen: usa resultados de inspecciones que en planta todavía no se conocerían.' },
      { titulo: 'El oráculo', texto: 'La tasa real del tramo marca el techo con el código como predictor: 22,8 % en la validación (bloques 1 a 4). No es elegible: usa las etiquetas del mismo tramo que evalúa.' },
      { titulo: 'Exploratorio (1/10): ¿hay una opción más precisa?', texto: 'Exploratorio, solo Día < 195; prueba final no releída. Un grupo de estimadores por código empata y su orden se invierte entre bloques de tiempo (Spearman −0,34 entre los bloques 1 a 4 y el último bloque de la validación). Lo que sí importa es actualizar la tasa y contraerla hacia el mercado cuando rota la mezcla de códigos (research/opcion-mas-precisa.md).' },
    ],
    notas: 'Contamos cómo elegimos: por precisión, la que encuentra más calibraciones en el cupo. Como 35 días de validación no alcanzan para separar alternativas, se midió en cinco bloques de tiempo, siempre entrenando con el pasado, y compitieron 54 alternativas. En el gráfico cada punto es una alternativa: la más precisa es CatBoost con atributos del código, con 18,4 de cada 100 elegidos, contra 11,2 al azar; el techo con el código (oráculo) es 22,8. Cifra con calificador: entre inspeccionados con actividad QLS, validación bloques 1 a 4 (días 100–174), base ficticia, n = 15.279 VIN. Los primeros empatan: es una familia, no un modelo. La demostración de la fuga (versión «que gana» pero no elegible) queda para preguntas.',
    orbita: false,
  },

  // 6 · 02 La solución elegida: CatBoost con atributos del código ----------------
  // Fuentes: solucion/resultados/precision.json, prueba-final.json (corridas[1] y
  // [3]), docs/entrega/02-2 (apartado B, «Elección por precisión») y 06,
  // research/opcion-mas-precisa.md y research/simulacion-evaluacion.md.
  {
    id: 'solucion',
    seccion: '02',
    subseccion: '2.2',
    escena: 'predictor',
    centrado: true, // las tarjetas van al centro de su columna, un poco por encima del medio (pueden tapar el vehículo)
    nucleo: true,
    minutos: 2.5,
    antetitulo: 'Especificaciones técnicas · La solución elegida',
    titulo: 'La más precisa: ', acento: 'CatBoost',
    bajada: 'Usa el código y sus atributos: mercado, motor, tracción y versión.',
    cifras: ['catboost.seleccion', 'catboost.confirmacion', 'catboost.azarConfirmacion'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Se reentrena cada 5 días', texto: 'Con inspecciones ya conocidas (Día ≤ t − 5). Entrega una tasa por código: la hoja no cambia.' },
      { titulo: 'Elegida por precisión', texto: 'Entre los primeros, la diferencia es ruido: es una familia, no un modelo.' },
      { titulo: 'En el último bloque, más baja', texto: 'Con pocos elegidos, dentro del ruido.' },
    ],
    ampliacion: [
      { titulo: 'Qué es', texto: 'CatBoost (un modelo de árboles de decisión) sobre el código de catálogo y los atributos que se leen de él en la agrupación del catálogo: mercado de destino, motor, tracción, versión y el cruce mercado × versión. Nunca usa el resultado ni el componente de Inspección Adicional. Entrada: los resultados de inspección ya conocidos (Día ≤ t − 5), con más peso para lo reciente. Salida: una tasa por código, que entra en la hoja sin cambiarle el formato; nunca una probabilidad por unidad. Configuración preregistrada: reentrenado cada 5 días, vida media de 15 días, semilla 1 (la mediana de cinco semillas en los bloques 1 a 4 de la validación), l2_leaf_reg = 10; vida media y regularización se eligieron por log-loss dentro del entrenamiento (solucion/preregistro-precision.json).' },
      { titulo: 'Cómo se eligió', texto: 'Gana la mayor precisión acumulada. Cinco bloques consecutivos de la validación, siempre entrenando con el pasado: los bloques 1 a 4 (días 100–174) deciden y el último bloque (días 175–194) no participa en la elección. Compitieron 54 alternativas elegibles: las 31 de validación, un suavizado jerárquico y modelos de ML con los atributos del código. Por grupo, la mediana en los bloques 1 a 4 es 17,0 % para los modelos con atributos y para el jerárquico, contra 14,7 % de las tasas simples y 13,1 % del ML que usa solo el código (precision.json; 02-2, apartado B).' },
      { titulo: 'Una familia, no un modelo', texto: 'En los bloques 1 a 4 de la validación, CatBoost tiene 136 CALIBRADA de 740 elegidos (18,4 %), Random Forest con atributos 135 y XGBoost con atributos 134; el duodécimo del ranking tiene 127. Con unos ±3 a 4 puntos de incertidumbre por lectura, el orden entre ellos es ruido. Oráculo (techo con el código, no elegible): 22,8 %. Entre inspeccionados con actividad QLS, validación bloques 1 a 4 (días 100–174), base ficticia, n = 15.279 VIN.' },
      { titulo: 'Hipótesis (no probada por separado)', texto: 'Usar el mercado y la versión aporta unos 3 a 4 puntos porque un código con pocos resultados toma fuerza de los que se le parecen. Coincide con que la señal del código se explica sobre todo por el mercado de destino. No se probó por separado qué atributo aporta más.' },
      { titulo: 'Último bloque de la validación: más baja, dentro del ruido', texto: 'En el último bloque CatBoost tiene 17,3 % (39 de 225; rango del 95 %: 13,4–21,5) contra 8,8 % al azar con el mismo cupo. Con tan pocos elegidos el rango es de unos ±4 puntos e incluye la cifra de los bloques 1 a 4. Entre inspeccionados con actividad QLS, validación último bloque (días 175–194), base ficticia, n = 4.626 VIN.' },
      { titulo: 'Prueba final', texto: 'Lectura preregistrada de CatBoost (30/09): 12,0 % (9,2–14,8) contra 8,2 % al azar, 1,45 veces el azar (1,14–1,76). Va en la pantalla siguiente, con sus límites. Entre inspeccionados con actividad QLS, prueba final Día 200–284, base ficticia, n = 13.312 VIN.' },
      { titulo: 'Simulación con verdad conocida', texto: 'CatBoost contra Random Forest, pareado réplica por réplica en 24 réplicas: con la mezcla de códigos que rota, la diferencia no se distingue de cero; con la mezcla estable, CatBoost queda unos 0,7 puntos arriba en las 24. Es un mundo simulado, no evidencia de planta (research/simulacion-evaluacion.md).' },
      { titulo: 'Otro criterio', texto: 'Con el criterio de mejor peor lectura, el análisis exploratorio del 1/10 señala a Random Forest con atributos, sin acuerdo registrado del resto del equipo; su ventaja sobre las parecidas está dentro del ruido. La solución elegida es CatBoost, la de mayor precisión en los bloques 1 a 4 de la validación.' },
    ],
    notas: 'Presentamos la solución elegida: CatBoost con los atributos del código, reentrenado cada 5 días, vida media de 15 días, semilla 1. Decimos qué es en una frase: aprende la tasa de cada código con lo que ya se inspeccionó y, para un código con pocos resultados, se apoya en los que comparten mercado y versión. Entrega una tasa por código; la hoja no cambia. Cifras con calificador: entre inspeccionados con actividad QLS, validación bloques 1 a 4 (días 100–174), base ficticia, n = 15.279 VIN, de cada 100 elegidos se calibran 18,4 con CatBoost. En el último bloque de la validación (días 175–194, n = 4.626 VIN) baja a 17,3, contra 8,8 al azar: con 225 elegidos queda dentro del ruido. Y el límite, sin esconderlo: es la más precisa de una familia que empata.',
    orbita: false,
  },

  // 7 · 02 Resultado contra el azar — 2.1 Resumen ejecutivo ---------------------
  {
    id: 'resultado',
    seccion: '02',
    subseccion: '2.1',
    escena: 'resultado',
    nucleo: true,
    minutos: 1.5,
    antetitulo: 'Resumen ejecutivo · Prueba final',
    titulo: 'Mejora frente al azar', acento: ' en la prueba final',
    bajada: 'Preregistrada, entre inspeccionados con actividad QLS.',
    cifras: ['catboost.prueba.precision', 'catboost.prueba.azar', 'catboost.prueba.veces'],
    puntos: [],
    // La figura usa la primera corrida del preregistro de CatBoost (corridas[1]),
    // una fila por tramo. Sin respaldo: si no se puede dibujar, la pantalla queda sin figura.
    figura: { tipo: 'js', id: 'veces_azar_prueba_final', opciones: {}, alt: 'Veces el azar de CatBoost en la prueba final, por tramo, con su rango del 95 %', pie: 'Prueba final · CatBoost con atributos del código.' },
    // Dos tarjetas: en la columna de texto no entran en 1920×1080; van en la banda al pie.
    disposicion: 'tarjetas-escena',
    detalle: [
      { titulo: 'Lectura más débil', texto: 'Ya conocíamos otra lectura de la prueba final al acordarla.' },
      { titulo: 'No es una medición de planta', texto: 'Base ficticia; el tramo de prueba ya se había mirado.' },
    ],
    ampliacion: [
      { titulo: 'Límites fijos', texto: 'El tramo de prueba y la tasa por mercado ya se habían mirado; que los inspeccionados se eligen al azar es un supuesto de Ford; en planta solo se conocería el resultado de lo inspeccionado; el Día del VIN aproxima el día de la inspección. No es una medición de planta.' },
      { titulo: 'Validación y prueba', texto: 'En la validación, bloques 1 a 4 (100–174), CatBoost había dado 18,4 de cada 100 y en el último bloque, 17,3; en la prueba la cifra es más baja y el azar también (8,2). Puede haber optimismo por haberla elegido en la validación; no lo verificamos.' },
      { titulo: 'Rango', texto: 'Rango del 95 %: 9,2–14,8 de cada 100 elegidos; 1,14–1,76 veces el azar. El límite inferior de la diferencia con el azar es de 1,2 puntos. Entre inspeccionados con actividad QLS, prueba final Día 200–284, base ficticia, n = 13.312 VIN.' },
      { titulo: 'Prueba ≤260 y sensibilidad', texto: 'Con el tramo hasta DIA_260 da 12,2 contra 8,3 al azar (1,47 veces el azar); sumando la cohorte posterior a 260, 8,8 contra 6,0 (1,46 veces): también mejora.' },
      { titulo: 'Qué no afirmamos', texto: 'Impacto ni ahorro en planta, reducción de calibraciones, que el resultado valga para VIN no inspeccionados, ni causas.' },
      { titulo: 'Por qué es una lectura más débil', texto: 'El preregistro de CatBoost (30/09) se acordó cuando el equipo ya conocía otra lectura previa de la prueba final, y la ganadora se eligió con una diferencia casi arbitraria entre los 12 primeros de selección.' },
      // Único ítem con otras lecturas (respaldo del orador; no se proyecta). Texto fijo
      // verificado contra solucion/resultados/prueba-final.json, tramo «prueba completa»:
      // corridas[0] (10,9 % contra 8,2 %, 1,32 ×), corridas[1] (CatBoost) y corridas[3]
      // (11,8 %, 1,44 ×). No va a cifras, tarjetas ni figuras.
      { titulo: 'Si preguntan: otras lecturas de la prueba final', texto: 'prueba-final.json conserva otras dos lecturas del mismo tramo, con el mismo calificador y el mismo n. Una primera, con la tasa fija preregistrada antes: 10,9 % contra 8,2 % al azar, 1,32 veces el azar. Una tercera, con Random Forest con atributos del código (pedida el 01/10, sin acuerdo registrado del resto del equipo): 11,8 %, 1,44 veces el azar. La de CatBoost se acordó conociendo la primera, y por eso es más débil. Las tres superan al azar y sus rangos se superponen.' },
      { titulo: 'Dos corridas iguales', texto: 'La lectura de CatBoost se corrió dos veces (la primera falló al imprimir en la consola de Windows) y dio lo mismo; se usa la primera.' },
    ],
    notas: 'Decimos la frase permitida: «Sobre la base ficticia, entre inspeccionados con actividad QLS, en la prueba final, de cada 100 elegidos por CatBoost se calibrarían 12,0 (rango del 95 %: 9,2–14,8), contra 8,2 al azar con el mismo cupo: 1,45 veces el azar. El límite inferior de la diferencia es de 1,2 puntos». Y la advertencia, sin esconderla: es una lectura más débil, porque el equipo ya conocía otra lectura previa de la prueba final al acordarla. Después, los límites fijos en una línea. Si preguntan por otras lecturas, están en el respaldo.',
    orbita: false,
  },

  // 10 · 02 Seguridad y privacidad — 2.3 ---------------------------------------
  {
    id: 'seguridad',
    seccion: '02',
    subseccion: '2.3',
    escena: 'seguridad',
    nucleo: true,
    minutos: 0.8,
    antetitulo: 'Seguridad y privacidad',
    titulo: 'Fuera de la red ', acento: 'de planta',
    bajada: 'Sin nube, sin LLM, sin datos personales. Si falla, se vuelve al azar.',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Lee una exportación', texto: 'No toca la red de automatización.' },
      { titulo: 'Sin datos personales', texto: 'El VIN nunca aparece en las salidas.' },
      { titulo: 'Control humano', texto: 'Calidad fija cuántas; los analistas, cuáles.' },
    ],
    ampliacion: [
      { titulo: 'Normas de referencia', texto: 'ISO/IEC 27001:2022, NIST Cybersecurity Framework 2.0, ISA/IEC 62443 (zonas y conductos), Ley 25.326 de Protección de los Datos Personales y Resolución AAIP 47/2018. Es una investigación breve del equipo, no una opinión legal ni una certificación.' },
      { titulo: 'Qué datos usa', texto: 'Código de catálogo, resultado de la Inspección Adicional, Día del VIN, agrupación del catálogo, programa del día y cupo. El VIN solo se usa internamente para agrupar eventos y nunca aparece en las salidas. No usa los identificadores de inspectores ni reparadores.' },
      { titulo: 'Dónde corre', texto: 'Un script de Python en una notebook o un servidor de planta. No se conecta a controladores, robots ni a la red de automatización, y no escribe en QLS.' },
      { titulo: 'Riesgos principales', texto: 'Integridad de las entradas (el script verifica el SHA-256 antes de correr), confidencialidad de la hoja (documento interno de Calidad) y disponibilidad: la hoja es una recomendación, no un bloqueo.' },
      { titulo: 'Control humano', texto: 'Calidad de Planta fija cuántas se inspeccionan y los analistas deciden cuáles.' },
    ],
    notas: 'En el template no tiene separador propio: la ubicamos dentro del 02. Si el tiempo se acorta, sale y la respondemos en preguntas.',
    orbita: false,
  },

  // 11 · 03 Equipo existente y escala -------------------------------------
  {
    id: 'factibilidad',
    seccion: '03',
    escena: 'factibilidad',
    nucleo: true,
    minutos: 1.2,
    antetitulo: 'Factibilidad económica',
    titulo: 'Sin licencias ni ', acento: 'inspecciones extra',
    bajada: 'El costo es integrar los datos y capacitar; el beneficio, más calibraciones con el mismo cupo.',
    cifras: ['catboost.prueba.diferencia'],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Software abierto', texto: 'Una notebook o un servidor existente.' },
      { titulo: 'Lo que se presupuesta', texto: 'Horas internas de integración, capacitación y piloto.' },
      { titulo: 'Se confirma en el piloto', texto: 'Días de control con el mismo cupo.' },
    ],
    ampliacion: [
      { titulo: 'Qué se presupuesta', texto: 'Integración y datos (ingreso, resultado, despacho y catálogo), servicio de la plataforma (instalación, usuarios, permisos, comunicación cifrada y copias), modelo y hoja (configuración, validación y capacitación), infraestructura (equipo interno existente o recursos aprobados por IT) y piloto (días de control y análisis con el mismo cupo).' },
      { titulo: 'Costo del primer año', texto: 'Horas de integración, despliegue, capacitación y piloto por las tarifas internas de Ford, más infraestructura incremental y mantenimiento anual. No damos una cifra en dólares ni un plazo de recupero sin esas referencias: el software libre no elimina los costos de operación y soporte.' },
      { titulo: 'Beneficio', texto: 'A cupo fijo no se agregan inspecciones. Detecciones adicionales = inspecciones realizadas × diferencia de precisión entre días con hoja y días de control. Para monetizarlo, Ford asigna un valor a cada calibración adicional detectada y resta el costo total de propiedad.' },
      { titulo: 'La cifra', texto: 'En la prueba final, CatBoost encontró calibraciones en cerca de 12 de cada 100 elegidos; al azar, cerca de 8. Es la base ficticia: no es un ahorro medido en planta ni justifica reducir el cupo.' },
      { titulo: 'Cómputo', texto: 'La hoja del día con el predictor de la primera etapa tarda 2,4 s en una notebook (lectura del CSV 2,2 s + hoja 0,2 s). CatBoost suma reentrenar cada 5 días sobre unas decenas de miles de VIN, sin GPU; no se midió aparte.' },
      { titulo: 'Escala', texto: 'Una línea: una notebook de Calidad. Una planta: un servidor existente. Varias plantas: cada una con su catálogo y su cupo.' },
    ],
    notas: 'No hace falta comprar nada: software abierto y un equipo que Ford ya tiene. Lo que cuesta son horas internas de integración, capacitación y piloto, con las tarifas de Ford. A cambio, con el mismo cupo, unas 4 calibraciones más cada 100 inspecciones en la base ficticia; el piloto con días de control tiene que confirmarlo.',
    orbita: false,
  },

  // 12 · 05 Implementación: la hoja (captura de la aplicación) --------------------
  {
    id: 'plataforma-dia',
    seccion: '05',
    lado: 'derecha',
    escena: 'futuro',
    nucleo: true,
    minutos: 0.5,
    antetitulo: 'Implementación · 1 · Arranca el día',
    titulo: 'Entra Gate Release, ', acento: 'sale la hoja',
    bajada: 'Con la playa, el cupo y la versión vigente del modelo.',
    cifras: [],
    puntos: [],
    figura: { tipo: 'local', ampliar: true, src: [LOCAL + 'flujo-1-dia.png'], respaldo: ILUSTRACIONES + 'plataforma-mock.svg', alt: 'Día de planta: entradas del día, modelo vigente y hoja armada', pendiente: '[PENDIENTE: captura flujo-1-dia.png — herramientas/capturar_flujo.sh, salida local fuera de Git]' },
    detalle: [
    { titulo: 'La playa', texto: 'Unidades que esperan de 0 a 5 días.' },
    { titulo: 'El cupo', texto: 'Lo fija Calidad de Planta: por defecto, el 5 %.' },
    { titulo: 'Sin hoja, al azar', texto: 'Hasta que se arma, se elige como hoy.' },
    ],
    ampliacion: [
    { titulo: 'Qué entra', texto: 'Las unidades que pasaron Gate Release, con su código y su día (exportación diaria). Los resultados de Inspección Adicional vuelven por otra exportación de QLS. Cada importación es todo o nada: si una fila falla, no entra ninguna.' },
    { titulo: 'Qué se arma', texto: 'La hoja del día con la playa, el cupo y la versión vigente del modelo (CatBoost con atributos del código). El cupo por defecto es el 5 % de lo que pasó Gate Release ese día; Calidad puede fijar otro.' },
    { titulo: 'En la demo', texto: 'Fuente simulada sobre la base ficticia: un botón avanza al día siguiente con el mismo contrato de entradas. No hay integración con QLS ni con el programa de producción.' },
    ],
    notas: 'Primer paso del día: entra lo que pasó Gate Release, se ve qué espera en la playa y qué versión del modelo está vigente, y se arma la hoja. El cupo lo sigue fijando Calidad de Planta. Hasta que se arma la hoja, se elige al azar, como hoy.',
    orbita: false,
  },

  {
    id: 'hoja',
    seccion: '05',
    lado: 'derecha', // conserva el diseño que tenía en la sección 02: texto a la derecha, captura a la izquierda
    escena: 'predictor',
    nucleo: true,
    minutos: 1.0,
    antetitulo: 'Implementación · 2 · La hoja',
    titulo: 'Así la usa ', acento: 'el analista',
    bajada: 'Cada mañana: qué códigos buscar en la ronda y cuántas unidades de cada uno.',
    cifras: ['demo.cupo', 'demo.playa', 'demo.codigos'], // las de la captura (Día 166 de la demo)
    puntos: [
      { id: 'etiqueta-parabrisas', titulo: 'Se lee el código', texto: 'Se busca su fila y se derivan las unidades sugeridas.' },
    ],
    // Captura local (fuera de Git: muestra tasas por código). Sin ella, el mock
    // sin números con el chip de pendiente.
    figura: {
      tipo: 'local',
      ampliar: true,
      src: [LOCAL + 'flujo-2-hoja.png', LOCAL + 'captura-hoja-dia-260.png'],
      respaldo: ILUSTRACIONES + 'hoja-mock.svg',
      alt: 'La hoja de códigos prioritarios del día',
      pendiente: '[PENDIENTE: captura flujo-2-hoja.png — herramientas/capturar_flujo.sh, salida local fuera de Git]',
    },
    detalle: [],
    ampliacion: [
      { titulo: 'Se lee el código', texto: 'El analista lee el código en el parabrisas y busca su fila: cantidad sugerida, tasa del código con rango y n, veces la tasa general, acumulado y mercado de destino.' },
      { titulo: 'Si un código no llega', texto: 'La cantidad pendiente pasa a los códigos siguientes del ranking que sí llegaron. Solo se completa al azar si se agota el ranking.' },
      { titulo: 'Qué muestra', texto: 'Arriba, la frase permitida con su calificador y los límites. Después, la tabla de códigos (primero el código, porque es lo que se lee), las filas del mínimo por código aparte y el bloque «por qué este código». Nunca «probabilidad de la unidad» ni un puntaje por vehículo.' },
      { titulo: 'Formatos', texto: 'Planilla (CSV/XLSX) e imprimible de una página: formato adaptable a la operación.' },
      { titulo: 'Las cifras de la captura', texto: 'Son del Día 166 de la demo (fuente simulada sobre la base ficticia): cupo 13, 482 unidades en la playa y 3 códigos a auditar de 29 programados. No son un resultado del modelo.' },
      { titulo: 'Hoja de ensayo y hoja final', texto: 'La del Día 190 (validación) sirve de ensayo; la final es la del Día 260, ya generada. Las dos usan identificadores ficticios y ningún VIN.' },
      { titulo: 'En la plataforma', texto: 'La misma hoja, con el ranking completo en otra pestaña y el detalle del código en un panel lateral. Se sigue descargando en CSV, Excel e imprimible.' },
      { titulo: 'Diagrama de la solución', texto: 'Entradas (programa del día, cupo, resultados con Día ≤ t−5 y catálogo), tasa por código con mínimo por código y detector de cambios, y la hoja en planilla e imprimible. Ver assets/ilustraciones/solucion.svg.' },
      { titulo: 'Quién calcula la tasa', texto: 'La hoja entrega una tasa por código. En la solución elegida la calcula CatBoost con atributos del código, reentrenado cada 5 días. La hoja de ensayo del Día 190 se generó con el predictor de la primera etapa (solucion/resultados/p8.json): con CatBoost cambia la columna de tasa, no el formato.' },
    ],
    notas: 'La captura es del Día 166 de la demo: cupo de 13, 482 unidades en la playa y 3 códigos a buscar de los 29 programados. Llevamos la hoja impresa y en planilla. Recorremos una fila: código, cantidad sugerida, tasa con rango y n, veces la tasa general, mercado de destino. La tasa de cada código la calcula la solución elegida (CatBoost); la hoja no cambia de formato. Mostramos el traspaso cuando un código no llega. La hoja de ensayo del Día 190 se generó con el predictor de la primera etapa; con CatBoost cambia la columna de tasa, no el formato. Nunca decimos «probabilidad de la unidad». En la versión núcleo, la demo baja a un minuto. Si falla el equipo, usamos las capturas de respaldo.',
    orbita: false,
  },

  {
    id: 'plataforma-playa',
    seccion: '05',
    lado: 'derecha',
    escena: 'futuro',
    nucleo: true,
    minutos: 0.6,
    antetitulo: 'Implementación · 3 · En la playa',
    titulo: '¿La envío? ', acento: 'Lo dice el código',
    bajada: 'El analista escribe el código del parabrisas y la app responde: enviar o no enviar, con el motivo.',
    cifras: [],
    puntos: [],
    figura: { tipo: 'local', ampliar: true, src: [LOCAL + 'flujo-3b-respuesta.png', LOCAL + 'flujo-3-seleccion.png'], respaldo: ILUSTRACIONES + 'plataforma-mock.svg', alt: 'Selección en la playa: qué buscar, respuesta por código y enviadas del día', pendiente: '[PENDIENTE: captura flujo-3-seleccion.png — herramientas/capturar_flujo.sh, salida local fuera de Git]' },
    detalle: [
    { titulo: 'Por código', texto: 'Una unidad de un día anterior se decide igual.' },
    { titulo: 'Se puede deshacer', texto: 'Cada envío queda registrado con su ronda.' },
    { titulo: 'Escritorio, celular o tablet', texto: 'Se adapta a lo que use la planta.' },
    ],
    ampliacion: [
    { titulo: 'Enviar', texto: 'Registra una unidad de ese código que está en la playa, la más antigua primero, y guarda la tasa y el puesto que tenía al decidir.' },
    { titulo: 'Terminar ronda', texto: 'Cada ~2 h se cierra la ronda y se marca qué faltó de lo buscado: lo que faltó baja al siguiente código del ranking (la misma reasignación de la hoja).' },
    { titulo: 'Dispositivo', texto: 'Se muestra en escritorio. La interfaz se adapta a celular o tablet: el formato final depende de cómo trabaje el equipo de analistas en la playa.' },
    ],
    notas: 'Mostramos la decisión en la playa: se lee el código en el parabrisas, se escribe y la app responde enviar o no enviar con el motivo. Se decide por código, no por vehículo. Si un código no llega, lo que falta pasa al siguiente del ranking. La mostramos en escritorio; se adapta a celular o tablet según lo que necesite Ford.',
    orbita: false,
  },

  {
    id: 'plataforma-seguimiento',
    seccion: '05',
    lado: 'derecha',
    escena: 'futuro',
    nucleo: true,
    minutos: 0.4,
    antetitulo: 'Implementación · 4 · Seguimiento',
    titulo: 'El cupo, ', acento: 'ronda por ronda',
    bajada: 'Cuánto falta de cada código y qué se envió en cada ronda.',
    cifras: [],
    puntos: [],
    figura: { tipo: 'local', ampliar: true, src: [LOCAL + 'flujo-4-seguimiento.png'], respaldo: ILUSTRACIONES + 'plataforma-mock.svg', alt: 'Seguimiento del día por código y por ronda', pendiente: '[PENDIENTE: captura flujo-4-seguimiento.png — herramientas/capturar_flujo.sh, salida local fuera de Git]' },
    detalle: [
    { titulo: 'Mismo cupo', texto: 'Cambia cuáles, no cuántas.' },
    { titulo: 'Rondas de ~2 h', texto: 'Cada ronda queda registrada.' },
    ],
    ampliacion: [
    { titulo: 'Qué muestra', texto: 'Por código: cuántas sugería la hoja, cuántas se enviaron y cuántas faltan. Por ronda: qué se envió y qué no llegó.' },
    ],
    notas: 'Durante el día se ve el avance del cupo por código y por ronda. El cupo no cambia: la hoja solo cambia cuáles se eligen.',
    orbita: false,
  },

  {
    id: 'plataforma-resultados',
    seccion: '05',
    lado: 'derecha',
    escena: 'futuro',
    nucleo: true,
    minutos: 0.5,
    antetitulo: 'Implementación · 5 · Vuelve el resultado',
    titulo: '¿Fue ', acento: 'acertada?',
    bajada: 'Cuando vuelve el reporte de la Inspección Adicional, cada unidad enviada muestra su resultado.',
    cifras: [],
    puntos: [],
    figura: { tipo: 'local', ampliar: true, src: [LOCAL + 'flujo-5-resultados.png'], respaldo: ILUSTRACIONES + 'plataforma-mock.svg', alt: 'Resultados de la inspección por unidad enviada', pendiente: '[PENDIENTE: captura flujo-5-resultados.png — herramientas/capturar_flujo.sh, salida local fuera de Git]' },
    detalle: [
    { titulo: 'CALIBRADA = acierto', texto: 'Lo que la hoja buscaba encontrar.' },
    { titulo: 'Solo lo enviado', texto: 'Lo no inspeccionado nunca revela su resultado.' },
    ],
    ampliacion: [
    { titulo: 'De dónde viene', texto: 'La exportación de QLS con el resultado y el componente de Inspección Adicional. Solo se aceptan resultados de unidades enviadas. En la demo vuelven entre 1 y 5 días después del envío.' },
    { titulo: 'Para qué sirve', texto: 'Muestra el acierto por unidad y alimenta la próxima actualización del modelo, con el margen de 5 días. No es la medición de impacto: esa sale de los días de control.' },
    { titulo: 'Las cifras de la captura', texto: 'Son de la demo: fuente simulada sobre la base ficticia, días 155–166 de validación. No son un resultado del modelo ni se citan como tal.' },
    ],
    notas: 'El resultado vuelve con el reporte de la Inspección Adicional y se ve unidad por unidad: CALIBRADA es un acierto. Solo se conoce lo que se envió; por eso, para medir frente al azar, hacen falta los días de control. Las cifras de la captura son de la demo sobre la base ficticia: no las citamos como resultado.',
    orbita: false,
  },

  {
    id: 'plataforma-modelo',
    seccion: '05',
    lado: 'derecha',
    escena: 'futuro',
    nucleo: true,
    minutos: 0.5,
    antetitulo: 'Implementación · 6 · El modelo se actualiza',
    titulo: 'Cada 5 días, ', acento: 'sin decidir a mano',
    bajada: 'Una versión nueva con los resultados que ya volvieron: hasta 5 días antes de hoy (Día ≤ t − 5).',
    cifras: [],
    puntos: [],
    figura: { tipo: 'local', ampliar: true, src: [LOCAL + 'flujo-6-modelo.png'], respaldo: ILUSTRACIONES + 'plataforma-mock.svg', alt: 'Actualización del modelo: próxima versión, qué cambió e historial', pendiente: '[PENDIENTE: captura flujo-6-modelo.png — herramientas/capturar_flujo.sh, salida local fuera de Git]' },
    detalle: [
    { titulo: 'Calendario fijo', texto: 'Elegir el momento mirando resultados sobreajusta.' },
    { titulo: 'Qué cambió', texto: 'Cada versión muestra cómo se movió el ranking.' },
    ],
    ampliacion: [
    { titulo: 'Cómo funciona', texto: 'Cada versión es «el modelo con los resultados hasta el Día X». Entre versiones el orden no cambia aunque lleguen resultados. Es el mismo esquema que se evaluó en validación: CatBoost con atributos del código, reentrenado cada 5 días.' },
    { titulo: 'Por qué t − 5', texto: 'El día t el modelo aprende solo de unidades con Día del VIN ≤ t − 5. El resultado de la Inspección Adicional tarda en volver (en la demo, entre 1 y 5 días): los días más recientes todavía están incompletos y, si se usaran, el modelo aprendería de un recorte sesgado. Es el mismo margen de 5 días que separa los tramos en la validación. En la captura, el Día 166 rige la v3, armada el Día 165 con resultados hasta el Día 160.' },
    { titulo: 'Por qué nadie lo decide', texto: 'Elegir cuándo actualizar mirando los resultados es una forma de sobreajuste, y los resultados que vuelven son solo de lo que el modelo eligió. Por eso el calendario está fijo en el código, no en la pantalla.' },
    ],
    notas: 'El modelo se actualiza solo, cada 5 días, con los resultados ya conocidos: los de unidades de hasta 5 días antes de hoy, porque el resultado de la inspección tarda hasta 5 días en volver y los días más recientes están incompletos. En la captura, el Día 166 rige la v3, con resultados hasta el Día 160. Es el esquema que evaluamos: CatBoost reentrenado cada 5 días. Nadie elige cuándo: eso evita sobreajustar. La pantalla muestra qué cambió en el ranking y el historial.',
    orbita: false,
  },

  {
    id: 'plataforma-linea',
    seccion: '05',
    lado: 'derecha',
    escena: 'futuro',
    nucleo: true,
    minutos: 0.5,
    antetitulo: 'Implementación · 7 · Retorno a la línea',
    titulo: 'De la inspección ', acento: 'a producción',
    bajada: 'Lo inspeccionado vuelve a la línea: por código, versión, motor y mercado, y qué componentes se calibran más.',
    cifras: [],
    puntos: [],
    figura: { tipo: 'local', ampliar: true, src: [LOCAL + 'flujo-7-linea.png'], respaldo: ILUSTRACIONES + 'plataforma-mock.svg', alt: 'Reporte para la línea: tasa por código, componentes y tendencia', pendiente: '[PENDIENTE: captura flujo-7-linea.png — herramientas/capturar_flujo.sh, salida local fuera de Git]' },
    detalle: [
    { titulo: 'Solo agregados', texto: 'Se descarga en CSV, sin unidades.' },
    { titulo: 'Asociación, no causa', texto: 'Indica dónde mirar en producción.' },
    ],
    ampliacion: [
    { titulo: 'Qué muestra', texto: 'Entre lo inspeccionado: la tasa de calibración por código, versión, motor y mercado; los componentes más calibrados y la tendencia semanal.' },
    { titulo: 'El componente', texto: 'No se usa para predecir, porque es el resultado. Acá es información para mejorar la producción.' },
    ],
    notas: 'Cerramos el ciclo: lo que se aprende en la inspección vuelve a la línea, por código y por mercado, con los componentes más calibrados. Es asociación, no causa: indica dónde mirar.',
    orbita: false,
  },

  // 13 · 05 Implementación: la plataforma y los días de control ------------------------
  {
    id: 'futuro',
    seccion: '05',
    escena: 'futuro',
    nucleo: true,
    minutos: 1.2,
    antetitulo: 'Implementación · Trabajo futuro',
    titulo: 'Implementar ', acento: 'midiendo',
    bajada: 'Días de control alternados y resultados con y sin actividad QLS por separado.',
    cifras: [],
    puntos: [],
    figura: { src: ILUSTRACIONES + 'dias-control.svg', alt: 'Días de control: días con hoja y días al azar alternados, medidos por separado con y sin actividad QLS; después la hoja orienta todo el cupo' },
    detalle: [
      { titulo: 'Días con hoja y días al azar', texto: 'La referencia sale sin sesgo.' },
      { titulo: 'Para llegar a planta', texto: 'Conectar QLS y el programa del día.' },
      { titulo: 'Hoy se entrega la hoja', texto: 'La plataforma es una propuesta.' },
    ],
    ampliacion: [
      { titulo: 'Días de control', texto: 'En la etapa inicial se alternan días con hoja y días al azar: dan la referencia sin sesgo en las mismas condiciones de producción. Terminada la etapa, la hoja orienta todo el cupo.' },
      { titulo: 'Límites de una prueba en planta', texto: 'Solo se conoce el resultado de lo inspeccionado. La duración y el tamaño de la etapa con días de control no se fijan: sin datos reales no se puede calcular.' },
      { titulo: 'Replicabilidad', texto: 'Hace falta un código de catálogo visible en la unidad, resultados de inspección con fecha y código, un cupo diario y un histórico de inspecciones al azar para arrancar. Cada línea o planta corre su propia hoja.' },
      { titulo: 'Qué tasa usa la hoja en planta', texto: 'La de la solución elegida, CatBoost con atributos del código, reentrenado cada 5 días. Los días de control miden la hoja frente al azar en las mismas condiciones.' },
      { titulo: 'Historial y subcategorización', texto:'Si Ford prueba que el historial está disponible al elegir (por ejemplo, con una marca de Gate Release), se reabre. La subcategorización del catálogo entra como otro nivel de suavizado y compite con la misma regla.' },
      { titulo: 'Consulta operativa abierta', texto: 'Qué fracción de las unidades producidas tiene actividad QLS y si se puede consultar QLS desde la playa. Mientras no haya respuesta, se mantienen el supuesto y el límite declarados.' },
      { titulo: 'La plataforma · qué reúne', texto: 'Operación diaria (hoja y registro de cada ronda), códigos y mercado (tasa en el tiempo, «dónde mirar», alertas), evidencia del modelo e implementación (días de control, cupo y mínimo por código).' },
      { titulo: 'La plataforma · límites', texto: 'Usa la base ficticia y cifras de validación. No hay integración con QLS ni con el programa de producción: esa integración es el trabajo principal para llevarla a planta.' },
    ],
    notas: 'El esquema alterna día por día solo como ejemplo: la duración de la etapa con días de control no se fija, sin datos reales no se puede calcular. Lo que falta para llevarla a planta es conectar QLS y el programa del día (hoy la plataforma reproduce la base ficticia); es el primer paso de la lista de próximos pasos. Replicable: otras líneas y plantas, cada una con su hoja. Los pasos se ordenan por dependencias; el calendario lo decide Ford. Insistimos en que la plataforma es una propuesta de implementación: la hoja sigue siendo la salida operativa y el piso.',
    orbita: false,
  },

  // 14 · 06 Conclusiones ---------------------------------------------------------
  {
    id: 'conclusiones',
    seccion: '06',
    escena: 'resultado',
    nucleo: true,
    minutos: 1.0,
    antetitulo: 'Conclusiones',
    titulo: 'Resultado, valor y ', acento: 'próximos pasos',
    bajada: 'Mismas inspecciones, mejor elegidas. Falta medirlo en planta.',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [
      { titulo: 'Mejora frente al azar', texto: 'En la prueba final, sobre la base ficticia.' },
      { titulo: 'CatBoost con atributos del código', texto: 'La más precisa de un grupo que empata.' },
      { titulo: 'Siguiente: medir en planta', texto: 'Días de control y hoja diaria.' },
    ],
    ampliacion: [
      { titulo: 'Valor para Ford', texto: 'Mismas inspecciones, mejor elegidas. Usa el código del parabrisas y el programa del día. Explicable: cada prioridad es la tasa de una versión y un mercado. Sin riesgo operativo: si la hoja no está, se elige al azar como hoy. Sigue aprendiendo con el mínimo por código y avisa cambios con el detector.' },
      { titulo: 'Qué aprendimos', texto: 'Con el código como único predictor, el valor está en cómo se usa la tasa. El techo con el código (oráculo) queda por encima de lo logrado. El orden se invierte entre bloques de tiempo (Spearman −0,34 entre los bloques 1 a 4 y el último bloque de la validación, 54 alternativas): elegir «la ganadora» por aciertos persigue ruido. Los buenos estimadores empatan entre 17 % y 19 % en los días 100–194, cerca del techo. Cuando rota la mezcla de códigos, actualizar la tasa gana unos 5 puntos a una tasa por código sin actualizar (17–18 % contra 12,7 % en la validación, bloques 1 a 4 de los días 100–174, n = 15.279 VIN). Entre inspeccionados con actividad QLS, base ficticia, Día < 195 (research/opcion-mas-precisa.md).' },
      { titulo: 'Próximos pasos, por dependencias', texto: '1. Conectar las entradas (QLS y programa del día). 2. Cargar el histórico de inspecciones al azar. 3. Instalar el script y generar la primera hoja. 4. Capacitar al equipo de analistas. 5. Arrancar con días de control y mínimo por código. 6. Medir por separado con y sin actividad QLS. 7. Decidir con datos de planta si la hoja orienta todo el cupo. 8. Sumar la subcategorización cuando Ford la publique.' },
      { titulo: 'Qué no afirmamos', texto: 'Impacto ni ahorro en planta. Reducción de calibraciones. Que el resultado valga para VIN no inspeccionados. Causas. «Probabilidad de la unidad» o un puntaje por vehículo. Que CatBoost le gane a sus parecidas: es la más precisa de una familia que empata, y en el último bloque bajó, dentro del ruido.' },
    ],
    notas: 'Cerramos con tres ideas. Resultado: en la prueba final, sobre la base ficticia, CatBoost mejora frente al azar, 1,45 veces el azar, en una lectura más débil porque el equipo ya conocía otra lectura previa. Solución: CatBoost con los atributos del código, la más precisa de un grupo que empata. Siguiente paso: medirlo en planta con días de control, mínimo por código y la hoja diaria. Si preguntan qué aprendimos: el orden entre modelos se invierte entre bloques y lo que sí importa es actualizar la tasa cuando rota la mezcla. Cualquier cambio al predictor se evalúa solo en validación y se presenta como «evaluado en validación; prueba final no releída».',
    orbita: false,
  },

  // 15 · Cierre ------------------------------------------------------------------
  {
    id: 'cierre',
    seccion: 'cierre',
    escena: 'cierre',
    nucleo: true,
    minutos: 0.2,
    antetitulo: 'FordwardAI',
    titulo: 'Gracias. ', acento: '¿Preguntas?',
    bajada: 'Data-Driven Predictive Quality · Octubre 2026',
    cifras: [],
    puntos: [],
    figura: null,
    detalle: [],
    ampliacion: [],
    notas: 'Tenemos a mano las preguntas del jurado y las ideas descartadas (docs/entrega/). Llevamos todo en dos medios: notebook y pendrive o enlace.',
    orbita: false,
  },
];
