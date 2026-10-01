# Guion de la presentación

Borrador para la presentación (E1), que se arma fuera del repo sobre el template de Ford: 16:9, portada, separadores 01 a 06, cierre, sin modificar logos y con las diapositivas genéricas borradas ([alcance de entrega][alc]). El contenido de cada separador sigue el [plan][plan-sep].

- **Duración:** ~20 minutos de exposición y ~10 de preguntas, más una **versión núcleo de 12 a 15 minutos** por si el tiempo se acorta ([alcance de entrega][alc-ent], E1).
- **Presentan los tres integrantes.** El reparto de diapositivas lo decide el equipo al ensayar.
- **Regla para toda cifra en pantalla:** «entre auditados con actividad QLS, [tramo], base ficticia, n = …» ([base QLS][qls], punto 2).
- **Demo:** la hoja ya generada (planilla e imprimible), con capturas de respaldo por si falla el equipo ([plan][plan-piezas], P12).
- Las marcas «(núcleo)» indican las diapositivas de la versión corta.

## Diapositivas

| # | Separador | Diapositiva | Mensaje en una frase | Material | Min |
| --- | --- | --- | --- | --- | ---: |
| 0 | Portada | Desafío, equipo FordwardAI e integrantes | — | Template | 0,3 |
| 1 | **01** Descripción del desafío | El proceso (núcleo) | Hoy el 5 % se elige al azar en la playa de despacho, después de Gate Release | `figuras/diagrama_proceso.png`; `figuras/diagrama_solucion.png` para el 02 | 1,2 |
| 2 | 01 | La pregunta (núcleo) | Con el mismo cupo diario, ¿se encuentran más calibraciones que al azar? | Texto; cifra de referencia: ~10 de cada 100 auditados se calibran hoy, entre auditados con actividad QLS, base ficticia, n = 59.681 VIN | 1,0 |
| 3 | **02** Descripción de la solución | Los datos y su preparación | Una fila por VIN, encabezados corregidos, cohorte posterior a DIA_260 aparte, componente fuera por fuga | Tabla de [2.2 C](02-2-especificaciones-tecnicas.md#c-preparación-de-los-datos) | 1,5 |
| 4 | 02 | Por qué solo el código (núcleo) | Es lo único que se conoce seguro al elegir: está en el parabrisas. Tiempos de ciclo y parámetros no están en la base; el historial no tiene marca de Gate Release | Tabla de [2.2 B](02-2-especificaciones-tecnicas.md#por-qué-el-único-predictor-es-el-código-de-catálogo) | 1,5 |
| 5 | 02 | Validación sin fuga (núcleo) | Tiempo hacia adelante, 5 días de margen, cupo diario y una prueba final que se abre una sola vez | Línea de tiempo de las particiones | 1,5 |
| 6 | 02 | Comparación de alternativas (núcleo) | En validación todas las tasas por código superan al azar y casi todas empatan con la mejor; gana la más simple | `figuras/comparacion_alternativas.png`: 31 elegibles, 29 empatan, gana la tasa fija (15,1 % contra 9,9 % al azar, validación) | 2,0 |
| 7 | 02 | La fuga, a la vista | La versión con fuga «gana» (22,3 % en validación) y por eso no se usa | Misma figura, resaltada | 0,5 |
| 8 | 02 | Resultado contra el azar (núcleo) | La versión que corresponda del [resumen ejecutivo](02-1-resumen-ejecutivo.md), con su calificador y los límites fijos en una línea | `figuras/veces_azar_prueba_final.png` (la de validación, `veces_azar.png`, va de respaldo); prueba final: 10,9 % contra 8,2 % al azar, 1,32 veces (1,01–1,64), mejora | 1,5 |
| 9 | 02 | Demo: la hoja (núcleo) | Así la usa el analista en la ronda: código, cantidad sugerida, acumulado, por qué este código | Hoja generada y capturas; la del Día 190 sirve de ensayo, la final es la del Día 260, ya generada | 2,0 |
| 10 | 02 | Seguridad y privacidad | Lee una exportación, no toca la red de automatización, sin nube, sin LLM, sin datos personales; si falla, se vuelve al azar | [2.3](02-3-seguridad-privacidad.md) | 0,8 |
| 11 | **03** Factibilidad económica (núcleo) | Costos y escala | Sin licencias ni auditorías extra; corre en equipo existente; la VM de nube es solo un techo | [3](03-factibilidad-economica.md), tabla de escenarios | 1,2 |
| 12 | 03 | La fórmula para Ford | (precisión de la hoja − precisión al azar) × auditorías por día × costo evitado por calibración encontrada | [3](03-factibilidad-economica.md#5-justificación-de-la-inversión) | 0,6 |
| 13 | **04** Valor diferencial (núcleo) | Más que una lista | «Dónde mirar», selección que aprende de sus auditorías, detector de cambios, señal por mercado, subcategorización | `figuras/donde_mirar.png`, `figuras/etiquetas_parciales.png`, `figuras/detector_potencia.png`. Cifras de validación en [4](04-valor-diferencial.md) | 2,0 |
| 14 | **05** Trabajo futuro (núcleo) | Implementar midiendo | Días de control alternados, mínimo por código, resultados con y sin actividad QLS por separado, replicable en otras líneas | [5](05-trabajo-futuro.md) | 1,2 |
| 14b | 05 | La plataforma propuesta | Así se vería todo junto en planta: hoja, rondas, códigos, alertas y seguimiento de los días de control. Es una propuesta; hoy se entrega la hoja | Prototipo de pantallas: [`prototipos/plataforma-web/`](https://github.com/FordwardAI/ford-predictive-quality/tree/main/prototipos/plataforma-web) (capturas con `shoot.sh`) | 0,8 |
| 15 | **06** Conclusiones (núcleo) | Resultado, valor y próximos pasos | Una frase de resultado, tres de valor y los próximos pasos en orden | [6](06-conclusiones.md) | 1,0 |
| 16 | Cierre | Gracias y preguntas | — | Template | 0,2 |
| | | | | **Total** | **~21** |

La 14b (plataforma propuesta) suma ~0,8 min: para volver a ~20, se recorta la demo (9) o la fuga (7).

**Versión núcleo (12 a 15 minutos):** diapositivas 0, 1, 2, 4, 5, 6, 8, 9, 11, 13, 14, 15 y 16, recortando cada una a lo esencial. La demo baja a un minuto. Se omiten la preparación de datos (3), la fuga (7), seguridad (10) y la fórmula (12); se responden en preguntas.

## Notas para cada bloque

**01.** Arrancar por la operación, no por el modelo: dónde está la playa, quién elige y cada cuánto ([operación][ope]). Usar el vocabulario del [glosario][ctx]: auditados con actividad QLS, cupo diario, precisión en el cupo, veces el azar.

**02.** El argumento central es «por qué solo el código»: responde en forma explícita a los tiempos de ciclo, parámetros de ajuste e interacciones del resumen del challenge ([plan][plan-rev]). En la comparación, anticipar que se esperan empates por la potencia de la validación ([plan][plan-inc], incompatibilidad 11). En el resultado, decir la frase permitida y nada más ([validación][val], punto 8). Si gana lo simple, presentarlo como hallazgo ([plan][plan-com]).

**Demo.** Llevar la hoja impresa y en planilla. Recorrer una fila: código, cantidad sugerida, tasa con rango y n, veces la tasa general, mercado de destino. Mostrar el traspaso cuando un código no llega. Nunca decir «probabilidad de la unidad» ([salida para Calidad][sal], punto 2).

**03.** No dar cifras de ahorro. Si preguntan, remitir a la fórmula ([mejora útil][mej], punto 12).

**04.** Cada pieza con su estado: evaluada en validación, leída en la prueba si estaba en el preregistro, o «solo validación» rotulado así ([plan][plan-inc], incompatibilidad 3).

**05.** La duración de la etapa con días de control no se fija: sin datos reales no se puede calcular ([base QLS][qls], punto 7).

**Después del feedback del 2/10.** Cualquier cambio al predictor se evalúa solo en validación y se presenta como «evaluado en validación; prueba final no releída». La cifra principal no cambia ([plan][plan-feed]).

## Ensayo

- Ensayar completa con cronómetro, y la versión núcleo por separado ([plan][plan-piezas], P12).
- Tener a mano [preguntas del jurado](preguntas-jurado.md) e [ideas descartadas](ideas-descartadas.md).
- Llevar todo en dos medios: notebook y pendrive o enlace ([plan][plan-pend]).

[ctx]: ../../CONTEXT.md
[alc]: ../alcance-entrega.md#qué-exigen-los-templates
[alc-ent]: ../alcance-entrega.md#entregables
[plan-sep]: ../plan-de-accion.md#qué-va-en-cada-separador-de-la-presentación
[plan-piezas]: ../plan-de-accion.md#piezas-de-trabajo
[plan-rev]: ../plan-de-accion.md#revisión-de-fuentes-del-2909
[plan-inc]: ../plan-de-accion.md#incompatibilidades-y-cómo-se-resuelven
[plan-com]: ../plan-de-accion.md#cómo-se-comunican-los-resultados
[plan-feed]: ../plan-de-accion.md#preparación-para-el-feedback-del-210
[plan-pend]: ../plan-de-accion.md#pendientes-con-default
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[sal]: https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
