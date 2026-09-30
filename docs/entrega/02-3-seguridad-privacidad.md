# 2.3 Seguridad y privacidad

Borrador para la sección 2.3 del Informe (E2) y para la diapositiva de seguridad del separador 02 de la presentación, que no tiene bloque propio en el template ([alcance de entrega][alc]). El template pide justificar que la solución **no introduce un riesgo de ciberseguridad**, con normas y un análisis de riesgos.

Este apartado es una investigación breve hecha por el equipo. **No es una opinión legal ni una certificación.** La conformidad formal con cualquier norma la determina Ford con sus propios procesos.

## Normas de referencia

Fuentes oficiales consultadas el 29/09/2026.

| Norma | Qué es | Qué tomamos para este análisis | Fuente |
| --- | --- | --- | --- |
| **ISO/IEC 27001:2022** | Requisitos para establecer, implementar, mantener y mejorar un sistema de gestión de seguridad de la información, incluida la evaluación y el tratamiento de riesgos. Edición 3.0, publicada el 25/10/2022. | Tratar la hoja y sus entradas como activos de información: inventario, control de acceso, integridad y continuidad. | [IEC Webstore, ISO/IEC 27001:2022][iso27001] |
| **NIST Cybersecurity Framework (CSF) 2.0** | Marco para gestionar riesgos de ciberseguridad, publicado por NIST el 26/02/2024. Organiza el trabajo en seis funciones: Gobernar, Identificar, Proteger, Detectar, Responder y Recuperar. | Recorrer las seis funciones para la solución (tabla más abajo). | [NIST CSF][nist]; [anuncio de CSF 2.0][nist-news]; [CSWP 29][nist-doc] |
| **ISA/IEC 62443** | Serie de normas de ciberseguridad para sistemas de automatización y control industrial (IACS). IEC 62443-3-2:2020 exige dividir el sistema en **zonas y conductos**, evaluar el riesgo de cada uno y fijar su nivel de seguridad objetivo. | Ubicar la solución respecto de la red de automatización de planta: no se conecta a ella. | [ISA, serie ISA/IEC 62443][isa]; [IEC 62443-3-2][iec62443] |
| **Ley 25.326 de Protección de los Datos Personales** (Argentina) | Protección integral de los datos personales en archivos y bancos de datos. Define dato personal como «información de cualquier tipo referida a personas físicas o de existencia ideal determinadas o determinables» (art. 2). Exige que los datos sean «adecuados, pertinentes y no excesivos» para su finalidad (art. 4, inc. 1) y medidas técnicas y organizativas de seguridad (art. 9). | Minimizar datos: la solución no necesita datos de personas. | [Texto actualizado en InfoLEG][ley] |
| **Resolución AAIP 47/2018** | Medidas de seguridad recomendadas para el tratamiento de datos personales en medios informatizados, dictada por la autoridad de aplicación de la Ley 25.326. | Referencia, en caso de que Ford sumara datos personales en el futuro. | [Texto en argentina.gob.ar][aaip] |

## Qué datos usa la solución

### Observaciones

| Dato | Para qué | ¿Refiere a personas? |
| --- | --- | --- |
| Código de catálogo | Único predictor ([admisibilidad][adm], punto 3) | No: describe versión y mercado del vehículo |
| Resultado de la Auditoría Adicional (OK / CALIBRADA) y Día del VIN | Calcular la tasa reciente del código con 5 días de margen | No |
| Componente de la Auditoría Adicional | Solo para «dónde mirar», como lo que se predice | No |
| Agrupación del catálogo (mercado, versión, motor, tracción) | Columnas legibles y suavizado hacia el mercado | No |
| Programa de producción del día y cupo diario | Entradas de la hoja | No |
| VIN | Solo interno, para agrupar eventos en una fila por vehículo. **Nunca aparece en las salidas** ([plan][plan-contrato], «Tabla por VIN») | Identifica un vehículo. Ver hipótesis |

La base de Ford trae además identificadores anonimizados de inspectores y reparadores ([EDA][eda], sección 1). **La solución no los usa**: están en el historial, que queda fuera del predictor ([admisibilidad][adm], punto 4).

### Hipótesis

- Mientras el vehículo está en planta, el VIN no está asociado a un cliente. Después de la venta podría vincularse a una persona y volverse un dato «determinable» en el sentido del art. 2 de la Ley 25.326. La hoja se usa antes del despacho y trabaja por código, así que no necesita el VIN. La **lista de unidades sugeridas** usaría el identificador de unidad que Ford ya maneja en la playa; en la demo se usan identificadores ficticios ([plan][plan-piezas], P8).

### Decisiones acordadas

- Los datos crudos, los extractos por VIN y los datos personales quedan fuera del repositorio y de servicios externos ([AGENTS.md][agents], «Datos y evidencia»).
- Las salidas publicadas son agregados sin VIN ni tasas por código ([`solucion/README.md`][sol]).

## Dónde corre y quién accede

- **Dónde corre:** un script de Python que se ejecuta en una notebook o en un servidor de la planta. **No requiere nube, no llama a servicios externos y no usa modelos de lenguaje (LLM)** ([plan][plan-fact], «Factibilidad económica y escalado»). Las dependencias son paquetes de código abierto con versiones fijadas en `requirements.txt`; una vez instaladas, funciona sin conexión.
- **Qué no toca:** no se conecta a controladores, robots ni a la red de automatización de la línea. No escribe en QLS: lee una exportación. En los términos de IEC 62443, no forma parte de ninguna zona de control; si Ford la instala en un servidor de planta, ese servidor queda dentro de la zona de TI que Ford ya tenga definida.
- **Quién accede:**

| Rol | Qué hace | Qué ve |
| --- | --- | --- |
| Calidad de Planta | Carga el programa del día y el cupo | Entradas y hoja |
| Equipo de analistas | Usa la hoja en sus rondas | La hoja (impresa o planilla) |
| Responsable técnico que designe Ford | Corre y mantiene el script, recibe las alertas del detector de cambios | Código, entradas y salidas |

## Análisis de riesgos

Valoración cualitativa del equipo, no medida.

| Riesgo | Qué podría pasar | Control de la solución | Riesgo residual |
| --- | --- | --- | --- |
| **Confidencialidad** de la hoja | La hoja revela qué versiones y mercados se calibran más, información industrial interna | Contiene códigos y tasas, sin VIN ni personas. Se trata como documento interno de Calidad | Bajo |
| **Integridad de las entradas** | Una exportación equivocada o alterada produce una hoja equivocada | El código verifica el SHA-256 del CSV y del catálogo antes de correr ([`solucion/README.md`][sol]). En planta, cada exportación nueva tendría su propio control (trabajo futuro) | Bajo |
| **Integridad de la hoja** | Alguien edita la planilla a mano | La hoja se regenera en segundos desde las entradas; se puede comparar con la original | Bajo |
| **Fuga de información futura en el cálculo** | Usar resultados que todavía no se conocen | Margen de 5 días y control técnico: las etiquetas enmascaradas solo se leen con flag y hash ([plan][plan-reg]) | Bajo |
| **Disponibilidad** | El script falla o no hay hoja ese día | **La hoja es una recomendación, no un bloqueo.** Si no está, los analistas eligen al azar como hoy: la producción y la auditoría no se detienen | Bajo |
| **Caché local** | El script guarda la tabla por VIN ya preparada en una caché fuera del repo, en formato `pickle`, que ejecuta código al cargarse si alguien la reemplaza | La caché vive en la carpeta del usuario que corre el script ([`solucion/README.md`][sol]). En planta, esa carpeta queda sin acceso de terceros, o se desactiva la caché | Bajo |
| **Cadena de suministro de software** | Un paquete de terceros comprometido | Versiones exactas fijadas; se instala una vez y corre sin red. Como mejora, instalar con hashes verificados | Bajo a medio, igual que cualquier software de código abierto |
| **Datos personales** | Tratar datos de personas sin necesidad | No se usan identificadores de inspectores ni reparadores, ni el VIN en salidas (art. 4, inc. 1, Ley 25.326) | Bajo |
| **Decisión automática sin control humano** | Que la hoja decida sola | Calidad de Planta fija cuántos y los analistas deciden cuáles ([CONTEXT.md][ctx], «Recomendación de auditoría») | Bajo |

## Las seis funciones del NIST CSF 2.0, aplicadas

| Función | En esta solución |
| --- | --- |
| Gobernar | Ford designa quién mantiene el script y quién recibe las alertas |
| Identificar | Inventario corto: CSV de QLS, catálogo, programa del día, cupo, hoja |
| Proteger | Acceso limitado a Calidad y analistas; sin datos personales; dependencias fijadas |
| Detectar | Verificación de hash de las entradas: si no coincide, el script se detiene y no genera la hoja |
| Responder | Si hay una duda sobre la hoja, se vuelve a elegir al azar ese día |
| Recuperar | Todo se regenera con un comando desde el código versionado y las entradas del día |

## Conclusión para el informe

La solución no introduce un riesgo de ciberseguridad nuevo relevante: lee una exportación, corre fuera de la red de automatización, no usa nube ni LLM, no trata datos personales y, si falla, la planta vuelve al método actual sin interrumpir nada. Los controles que quedan del lado de Ford (acceso a la hoja, lugar donde corre y mantenimiento) son los de cualquier planilla interna de Calidad.

[alc]: ../alcance-entrega.md#qué-exigen-los-templates
[agents]: ../../AGENTS.md
[ctx]: ../../CONTEXT.md
[sol]: ../../solucion/README.md
[eda]: ../../research/eda-qls.md
[plan-contrato]: ../plan-de-accion.md#contrato-común
[plan-piezas]: ../plan-de-accion.md#piezas-de-trabajo
[plan-reg]: ../plan-de-accion.md#reglas-que-no-cambian
[plan-fact]: ../plan-de-accion.md#factibilidad-económica-y-escalado
[adm]: https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804466671
[iso27001]: https://webstore.iec.ch/publication/79694
[nist]: https://www.nist.gov/cyberframework
[nist-news]: https://www.nist.gov/news-events/news/2024/02/nist-releases-version-20-landmark-cybersecurity-framework
[nist-doc]: https://doi.org/10.6028/NIST.CSWP.29
[isa]: https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards
[iec62443]: https://webstore.iec.ch/en/publication/30727
[ley]: https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm
[aaip]: https://www.argentina.gob.ar/normativa/nacional/resolución-47-2018-312662/texto
