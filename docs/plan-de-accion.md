# Plan de acción para el Trials Day

Documento de [¿La especificación permite repartir el trabajo sin decisiones críticas pendientes?](https://github.com/FordwardAI/ford-predictive-quality/issues/13), el último ticket del [mapa de decisiones](https://github.com/FordwardAI/ford-predictive-quality/issues/1). Revisa el mapa, los datos, los templates y la consigna, y los convierte en trabajo ejecutable. **Estado: acordado el 29/09/2026 con Facundo-Lanusse, que cerró el ticket.** El trabajo se sigue en el issue [Construir la prueba de concepto y los entregables para el Trials Day](https://github.com/FordwardAI/ford-predictive-quality/issues/33).

El detalle de cada decisión vive en su ticket. Este documento no lo repite: dice qué quedó vigente, qué se enmendó, con qué números se trabaja y qué hay que construir.

## La fecha fija

**Trials Day: viernes 2 de octubre de 2026, Planta Pacheco, de 9:00 a 15:00** (correo de Ford a los equipos, registrado en el ticket).

- Cada equipo presenta unos **30 minutos** ante el jurado. La presentación tiene que estar lista desde el comienzo, ensayada y verificada antes de llegar.
- Después del almuerzo hay un par de horas para ajustar el proyecto con el feedback del jurado.
- **Los entregables se entregan al cierre, a las 15:00.**

No hay calendario interno: el equipo trabaja todo en paralelo, ordena el trabajo por dependencias y maneja sus fechas. No se asignan responsables por persona. Equipo: **FordwardAI**.

## Revisión del mapa

### Qué quedó vigente

| Decisión | Qué rige hoy | Enmiendas posteriores |
| --- | --- | --- |
| [Población y etiquetas](https://github.com/FordwardAI/ford-predictive-quality/issues/2) | Caracterización del CSV `a24860d8…c5a82b`: 59.681 VIN, 6.079 CALIBRADA. | La población son auditados **con actividad QLS** ([base QLS](https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478)). |
| [Consigna y fuentes](https://github.com/FordwardAI/ford-predictive-quality/issues/3) | La ficha técnica es la consigna. El documento de ideas es de propuestas. | — |
| [Momento de la decisión](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685) | Recomendación después de Gate Release, comparada con el azar al mismo cupo. | Se selecciona en la playa de despacho, en rondas ([operación](https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950)). |
| [Consultas a Ford](https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330) | Cerradas, con supuestos vigentes. | «Todos los auditados» pasa a «auditados con actividad QLS». |
| [Admisibilidad](https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804466671) | Unidad VIN. Población principal sin la cohorte posterior a DIA_260. **El código de catálogo es el único predictor.** El historial va fuera del análisis principal. | La agrupación del catálogo entra solo como suavizado hacia el mercado ([agrupación](https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581)). |
| [Validación](https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014) | Entrenamiento ≤149, validación 155–194 y prueba final ≥200, con 5 días de margen. Resultados de Día ≤ t−5. Prueba de un solo uso. Afirmaciones permitidas y límites fijos. | Sin mínimo de VIN por código ([alternativas](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998)). La tasa por mercado en la prueba ya se vio (este ticket). |
| [Mejora útil](https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323) | Precisión en el cupo y veces el azar, con rango del 95 %. Recupero en el cupo como cifra secundaria. Lectura mejora, inconcluso o peor, sin umbral. Sin costos de la planta. | Corte diario y bootstrap por días (alternativas). El cupo simulado es el 5 % de los auditados con actividad QLS de cada día (base QLS). |
| [Representación](https://github.com/FordwardAI/ford-predictive-quality/issues/9#issuecomment-5820084609) | Una fila por VIN. Tasa fija frente a tasa móvil por código. | Sin mínimo de VIN (alternativas). El suavizado hacia el mercado reabre el punto 4 solo para esa variante (agrupación). |
| [Alternativas y diferencial](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998) | Todas las alternativas y la regla de elección. Un solo predictor llega a la prueba. Componente, detector, subcategorización y anexo de historial. | El grupo de control del 20 % pasa a mínimo por código y días de control (base QLS). **Se hace todo, sin orden de recorte** (este ticket). |
| [Salida para Calidad](https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432) | Hoja estática diaria de códigos prioritarios con tasa, rango, n, veces la tasa general y acumulado. Nunca «probabilidad de la unidad». | La usa el equipo de analistas, con cantidad sugerida por código (operación). Columnas legibles, planilla e imprimible (agrupación). Suma una lista de unidades sugeridas (este ticket). |
| [Alcance de entrega](https://github.com/FordwardAI/ford-predictive-quality/issues/12#issuecomment-5823968413) | Informe (.docx), presentación (.pptx) y .zip. Secciones del template y partes obligatorias de la ficha. | Sin calendario, sin congelamiento el 29/09 y sin orden de recorte. Duración ~30 min y cierre a las 15:00 del 2/10 (este ticket). |
| [Agrupación recibida](https://github.com/FordwardAI/ford-predictive-quality/issues/26#issuecomment-5895626211) | La posición 2 fija motor, tracción y versión, y la 3 el mercado. Solo el mercado sostiene señal. | Esa lectura incluyó la prueba; se justifica solo con validación (este ticket). |
| [Operación de selección](https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950) | Analistas en la playa de despacho, en rondas de ~2 h. El cupo diario lo fija Calidad de Planta. Hoja al inicio del día. | Si un código no llega, la cantidad pendiente baja por el ranking; el azar solo si se agota (este ticket). |
| [Uso de la agrupación](https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581) | La señal se explica por mercado de destino. Código primero en la hoja. El suavizado hacia el mercado compite en validación. | Nada es recortable (este ticket). |
| [Base QLS](https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478) | Calificador «entre auditados con actividad QLS» en cada cifra. Hoja para todas las unidades. Sin azar permanente. | La prueba en planta pasa a ser la propuesta de implementación y escalado (este ticket). |

### Revisión de fuentes del 29/09

**Datos** (revisión de solo lectura; en la prueba final solo se contaron VIN y días sin etiqueta):

- El CSV (`a24860d8…c5a82b`) y el catálogo (`89e5a9d9…3e047`) coinciden con [datos locales](datos-locales.md). Las tres pruebas pasan. Las particiones y los agregados del catálogo se regeneran idénticos.
- `table.xlsx`, de la carpeta de Ford del 24/09, es la misma base en Excel: una hoja, los mismos 41 campos y 195.808 filas. No es una fuente nueva.
- **Cupo diario:** unos 265 VIN por día y k_d mediano de 13, contra ~26 códigos distintos por día.
  - Validación: 35 días con VIN y Σk_d = 391. El 1 % del cupo sale de días con menos de 20 VIN.
  - Prueba: 68 días y Σk_d = 652.
  - Los días sin VIN no siguen un patrón semanal.
- **Después de DIA_260:** 177 VIN. El 71 % de su cupo sale de días con menos de 20 VIN, así que esa lectura es solo descriptiva.
- **Códigos nuevos:** 3 códigos de validación (119 VIN) y 4 de prueba (79 VIN) no aparecen en ≤149. Un mercado no aparece ni en validación ni en prueba.
- **Componente (≤194):**
  - 44 valores distintos, ninguno faltante entre las CALIBRADA.
  - En validación, los 3 más frecuentes de ≤149 aciertan 261 de 780 (33,5 %). Es la referencia de «dónde mirar».
- **Concentración:** con una tasa móvil ilustrativa, el primer código llena todo el cupo en 7 de los 35 días de validación. En mediana, 3 códigos llenan el cupo.
- **La prueba por mercado ya se miró:** [`research/catalog-groups.json`](../research/catalog-groups.json) publica tasas por mercado dentro de la prueba final y el registro de la agrupación las cita.

**Templates** (fuera del repo):

- **Informe:**
  - Carátula con desafío, equipo, logo y tabla de integrantes (nombre, universidad, carrera y correo). El índice es un campo que hay que actualizar. A4, Palatino y número de página.
  - Resumen ejecutivo de media carilla como máximo.
  - Seguridad pide «justificar que la solución no introduce un riesgo». Factibilidad pide «justificar la inversión». Conclusiones pide «próximos pasos concretos». 2.2.1 pide los entregables adjuntables, como diagramas de flujo e imágenes.
- **Presentación:**
  - 16:9: portada, seis separadores (01 a 06, sin bloque de seguridad), cierre y 50 diapositivas genéricas para borrar.
  - No se modifican los logos. Las imágenes tienen que tener derechos de uso y los íconos salen de GEAR.
  - El nombre del archivo sigue el patrón `FIC_III_Desafio_AAA_Equipo_BBB.pptx`.
- La copia `docs/fuentes/documentation.md` es fiel al original, pero perdió el diagrama del proceso (Body → Pintura → Montaje → Calidad → Gate Release → Inspección Adicional, con la herramienta predictiva apuntando a la Inspección Adicional).
- El resumen de desafíos del challenge describe el desafío como un modelo de ML sobre «tiempos de ciclo, parámetros de ajuste e interacciones». Hay que defender en forma explícita por qué el predictor es solo el código.

### Incompatibilidades y cómo se resuelven

1. **Calendario vencido.** Se reemplaza por el orden de dependencias de este plan.
2. **Grupo de control del 20 %.** Lo reemplazan el mínimo por código y los días de control, simulados sobre la base y propuestos para la implementación.
3. **«Se hace todo» frente a la prueba de un solo uso.** Cada alternativa y cada pieza del diferencial se evalúa y se elige en validación. Lo que figura en el preregistro se lee en la prueba. Lo que no llega al preregistro se muestra solo con cifras de validación, rotulado así. Qué se muestra se decide después, con todos los resultados a la vista.
4. **La regla sobre la prueba estaba mal enunciada y ya se había roto.** Queda así: antes del preregistro, ninguna métrica ni tasa usa etiquetas de Día ≥200. Los conteos sin etiqueta están permitidos. Lo ya visto (el tramo que exploraron los experimentos y las tasas por mercado) se declara en el preregistro y en los límites.
5. **Suavizado hacia el mercado.** Se mantiene y se justifica solo con validación, donde el mercado también sostiene señal (χ² 56,1).
6. **Dos «mínimos por código».** El mínimo de VIN para estimar una tasa se descartó. El vigente es la rotación de auditorías. Con ~26 códigos por día y un cupo de ~13, la rotación tiene que abarcar varios días.
7. **La hoja necesita el programa del día y la base no lo trae.** El script recibe el programa y el cupo como entradas. En la entrega se simulan con los VIN de un día histórico.
8. **«Unidades priorizadas» y «variables de mayor impacto» de la ficha.** La hoja suma una lista de unidades sugeridas y un bloque «por qué este código» (mercado de destino y la comparación entre agrupaciones). El informe explica por qué la priorización es por código.
9. **La cifra principal y la hoja operativa no evalúan lo mismo.** La principal mide el ranking con etiquetas completas. La política de la hoja (con mínimo por código y conociendo solo lo auditado) se mide con etiquetas parciales. Se presentan las dos.
10. **Historial.** Tanto la ficha como el resumen del challenge hablan de tiempos e historial. El anexo de historial lo evalúa con la misma partición y la misma métrica, y el informe explica por qué queda fuera del predictor: no está probado que esté disponible al recomendar y los experimentos no le encontraron señal.
11. **Potencia de la validación.** Con 391 elegidos, el rango es de unos ±3 puntos: solo se distingue una mejora de ~1,3 veces el azar o más. Se esperan empates y, en ese caso, gana la alternativa más simple. El relato lo anticipa.
12. **Prueba en planta.** No habrá datos nuevos de Ford: toda la evaluación usa el CSV vigente. Los días de control y el mínimo por código pasan a la propuesta de implementación y escalado.

## Reglas que no cambian

- Unidad VIN. Etiqueta OK o CALIBRADA. **El código de catálogo es el único predictor del análisis principal.** El resultado y el componente de Auditoría Adicional nunca son predictores.
- Particiones, margen de 5 días y resultados de Día ≤ t−5, como en [validación](https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014). Los códigos sin historial usan la tasa general, o la de su mercado en la variante de mercado.
- Cupo diario k_d = max(1, floor(0,05·N_d)), con desempate al azar con semilla y bootstrap por días.
- Elección: la mayor precisión en el cupo en validación. Si hay empate (la diferencia pareada incluye 0), gana la más simple.
- **Corrida única de la prueba final.** Se hace antes de la entrega, en una sesión conjunta del equipo y sobre el preregistro commiteado. La opción final (predictor y configuración de cada pieza) **ya está elegida en validación antes de correr**. Después de la corrida solo se decide qué se muestra. Si aparece un bug, se corrige, se vuelve a correr y se informan las dos cifras.
- **Control técnico:** el código solo lee etiquetas de Día ≥200 con un flag explícito y el hash del preregistro. Las pruebas usan datos sintéticos.
- Cada cifra: «entre auditados con actividad QLS, [tramo], base ficticia, n = …». Se aplican las afirmaciones permitidas y prohibidas de validación.
- Al repo van el código, las pruebas sintéticas, los agregados revisados, los borradores y toda la información de trabajo. Quedan fuera los datos crudos, los VIN, los templates, los .docx y .pptx finales y los datos personales de la carátula.

## Parámetros

Se fijan antes de mirar la validación. Partimos de que un día tiene unos 265 VIN, un cupo de ~13 y ~26 códigos distintos, y de que en validación hay 43 códigos en 35 días.

| Qué | Valores | Por qué |
| --- | --- | --- |
| Ventanas de la tasa móvil | 30, 60 y 120 días | Ya acordadas en [alternativas](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998). |
| Suavizado hacia la tasa general | Peso 0 o 20 | Ya acordado. Peso 20 equivale a sumarle al código 20 vehículos con la tasa general: un código con 5 VIN y 2 calibradas no pasa del 40 % al primer puesto por casualidad, y uno con 500 conserva su tasa. |
| Suavizado hacia el mercado | 30, 60 y 120 días, peso 20 | Las mismas ventanas, así se compara directamente con las móviles. |
| Decaimiento exponencial | Vida media de 15, 30 o 60 días | La memoria media es 1,44 veces la vida media (22, 43 y 87 días): cubre el mismo rango que las ventanas. |
| Peso por antigüedad en ML reentrenado | Vida media de 15, 30 o 60, elegida en el ajuste interno (≤119 contra 125–149) | Así no se agrega otro número arbitrario. |
| Hiperparámetros de ML | Ajuste por log-loss dentro del entrenamiento y 5 semillas | Ya acordado. |
| Mínimo por código | 1 auditoría por código cada P días, con P de 10, 20 o 40. Si hay empate, el P más largo | Con ~43 códigos, la rotación usa unas 43/P auditorías por día: ~33 %, ~16 % u ~8 % del cupo. Con P = 5 se iría el 66 %. |
| Etiquetas parciales | Etiquetas completas hasta el Día 149. Desde el 155, solo las de lo elegido | Simula que la hoja se implementa el Día 150 con el histórico de auditorías al azar que Ford ya tiene. |
| Thompson | Parte de la tasa general con peso 20 | Si le gana a la rotación, asigna la exploración sin cambiar el formato de la hoja. |
| Detector de cambios | CUSUM de Bernoulli por código; a lo sumo 1 falsa alarma cada 30 DIA en todo el catálogo; umbral calibrado con ≤149; potencia con cambios sintéticos (×2 y ×½) en validación | Se calibra en ≤149 porque la validación tiene solo 40 días. |
| Componente | Distribución por código suavizada hacia la general con peso 20; acierto en los 3 primeros | La referencia es el 33,5 % de los 3 primeros generales en validación. |
| Anexo de historial | Cantidad de eventos, incidencias distintas, tiempo entre inspección y reparación (promedio y máximo), días entre el primer y el último evento, y las 20 incidencias más frecuentes. Logística y XGBoost | Responde a lo que piden la ficha y el resumen del challenge, con la etiqueta «disponibilidad no probada». |
| «Se sostiene» un código que casi no se calibra | Su rango de Wilson del 95 % en la prueba queda entero por debajo de la tasa general | Es la misma lógica que mejora / inconcluso / peor. |
| Bootstrap | 2.000 remuestreos por días, con semilla registrada | Alcanza para un rango estable con 35 días. |

## Contrato común

- **Código** en `solucion/`, ejecutable desde la raíz. Recibe las rutas del CSV y del catálogo y verifica sus hashes.
- **Tabla por VIN:** VIN (solo interno, nunca en salidas), código, posiciones del código, mercado de destino, Día del VIN, primera inspección, etiqueta y componente.
- **Resultado de cada evaluación**, en JSON agregado: alternativa, parámetros, tramo, días, elegidos, CALIBRADA elegidas, precisión en el cupo, veces el azar, recupero, rango del 95 %, semilla, hash de la fuente y versión del código.
- **Preregistro** en `solucion/preregistro.json`, commiteado y enlazado en el ticket antes de la corrida.
- **Borradores** de las secciones del informe y de la presentación en `docs/entrega/`, en Markdown. El armado final se hace sobre los templates, fuera del repo.

## Piezas de trabajo

Todas están comprometidas y no tienen dueño: quien empieza una pieza la marca en [Construir la prueba de concepto y los entregables para el Trials Day](https://github.com/FordwardAI/ford-predictive-quality/issues/33).

| | Pieza | Qué incluye | Terminada cuando |
| --- | --- | --- | --- |
| **P1** | Base común y preparación de datos | Tabla por VIN y evaluador del cupo diario. Reutiliza `research/`. Evidencia de preparación: encabezados 38–40, 477 duplicados, `#N/A`, cohorte posterior a DIA_260, códigos nuevos y el componente como fuga. | Las pruebas sintéticas fallan si cambian k_d, el desempate o el bootstrap. N y CALIBRADA por tramo coinciden con `research/validation-partitions.json`. |
| **P2** | Entorno y comando único | `requirements.txt` con versiones fijadas (scikit-learn, xgboost, lightgbm y catboost) y la versión de Python. Un comando que corre todo, con caché fuera del repo y el flag de la prueba. | Corre desde un clon limpio. |
| **P3** | Referencias | Azar, tasa fija, 6 móviles, decaimiento, suavizado hacia el mercado, oráculo y versión con fuga (didáctica). | Todas tienen precisión, veces el azar, recupero y rango en validación. |
| **P4** | ML sobre el código | Logística, NB, RF, XGBoost, LightGBM, CatBoost, MLP, promedio y stacking. Modos fijo y reentrenado. Maneja códigos nuevos. | Hay una configuración por familia y modo, con mediana y dispersión entre semillas. |
| **P5** | Etiquetas parciales y exploración | Sobre la ganadora de P3 y P4: ε = 0, mínimo por código, Thompson, ε = 20 % como referencia y azar. Simulación de días de control. | El P del mínimo y la política de exploración quedan elegidos en validación. |
| **P6** | Diferencial | Componente, detector de cambios, subcategorización (tabla descriptiva) y anexo de historial. | Cada pieza tiene su configuración y su resultado en validación. |
| **P7** | Preregistro y corrida única | Preregistro con la ganadora (reentrenada con ≤194), las configuraciones de P5 y P6, las semillas, los hashes y lo ya visto. En sesión conjunta: prueba completa, ≤260, >260 (descriptivo) y sensibilidad, más cada pieza con su regla. | Se corrió una vez y el resultado está pegado en el ticket. |
| **P8** | Hoja de códigos prioritarios (E3) | Entradas: CSV, programa del día y cupo. Salidas: planilla (CSV/XLSX) e imprimible de una página. Columnas de la [agrupación](https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581), con veces la tasa general. Filas de exploración aparte. Bloque «por qué este código». Componente y códigos que casi no se calibran, solo si se sostienen. Caja de evaluación con el calificador QLS. **Lista de unidades sugeridas** si el programa trae identificadores (en la demo, ficticios, nunca VIN). Si un código no llega, baja por el ranking. | Tiene prueba sintética de la cantidad sugerida y del traspaso por el ranking. No incluye ningún VIN. Una persona de Calidad podría usarla sin explicación técnica. Durante el desarrollo usa el Día 190; la E3 final usa el último día de la prueba ≤260, después de P7. |
| **P9** | Figuras, tablas y diagramas | Comparación de todas las alternativas, que justifica cada decisión del mapa. Diagrama del proceso con el punto donde entra la hoja. Diagrama de la solución (entradas, recálculo diario y salidas). | Se regeneran con el comando único. |
| **P10** | Borradores en el repo | Una sección del informe por archivo, más: seguridad y privacidad (normas y riesgos: datos que usa, dónde corre y quién accede), factibilidad, escalado, **las tres versiones del resultado** con sus límites fijos y el calificador QLS, las ideas descartadas y por qué (Passport, perfil de riesgo por VIN, plataforma web y secuencias) y las preguntas probables del jurado. | Cada afirmación tiene su fuente y separa observaciones, hipótesis y decisiones. |
| **P11** | Informe (E2), fuera del repo | El template con la carátula (FordwardAI y los tres integrantes), el índice actualizado y las secciones armadas desde P10. Resumen ejecutivo de media carilla como máximo. | Cubre todas las secciones del template y las cuatro partes de la ficha en 2.2. |
| **P12** | Presentación (E1), fuera del repo | Portada, separadores 01 a 06 y cierre, con las genéricas borradas y sin modificar logos. ~20 minutos de exposición y ~10 de preguntas, más una versión núcleo de 12 a 15 minutos. Demo con la hoja ya generada y capturas de respaldo. | Ensayada completa con cronómetro. |
| **P13** | .zip (E4) | Código, `requirements.txt`, README de reproducción, hoja completa y lo que no entre en el informe. Sin datos crudos. | Reproduce desde cero los números de E1 a E3. |

### Qué va en cada separador de la presentación

| Separador | Contenido |
| --- | --- |
| 01 Descripción del desafío | El proceso, la selección al azar del 5 % y la pregunta. |
| 02 Descripción de la solución | Datos y su preparación, por qué solo el código, validación sin fuga, comparación de alternativas, resultado contra el azar, la hoja (demo) y una diapositiva de seguridad y privacidad (el template no le da bloque propio). |
| 03 Factibilidad económica | Costos de implementación, operación y mantenimiento, escenarios de escala y justificación a cupo fijo. |
| 04 Valor diferencial e innovación | «Dónde mirar», la selección que aprende de sus auditorías (mínimo por código y días de control), el detector de cambios, la señal por mercado y la subcategorización. |
| 05 Trabajo futuro | Implementación con días de control, escalado y replicabilidad. |
| 06 Conclusiones | Resultado, valor y próximos pasos concretos. |

## Orden por dependencias

1. **Desde ya, sin esperar al código:** P10 (borradores), la estructura de P11 y P12 sobre los templates, y P8 con datos sintéticos.
2. **Primero en el código:** P1 y P2. Todo lo demás depende de ellos.
3. **Después de P1:** P3, P4, P6 y P8 en paralelo, todos en validación.
4. **Después de P3 y P4:** P5, porque necesita la ganadora.
5. **Cuando P3 a P6 tienen resultado en validación, y siempre antes de la entrega:** P7.
6. **Después de P7:** las cifras finales en P8 a P12, la elección de qué se muestra y P13.
7. **Para el 2/10:** se llega con todo terminado, como si la entrega fuera a las 9.

## Cómo se comunican los resultados

Las tres versiones del resumen ejecutivo y de la diapositiva de resultados se escriben **antes** de la corrida. Todas llevan el calificador QLS y los límites fijos: el tramo de prueba ya explorado, la tasa por mercado ya vista, la selección al azar de los auditados como supuesto de Ford, que en planta solo se conocería lo auditado, y el Día del VIN aproximado.

- **Mejora:** «Sobre la base ficticia, entre auditados con actividad QLS, de cada 100 elegidos se calibrarían X, contra Y al azar (rango del 95 %).» La base respalda implementar la hoja y medirla con días de control.
- **Inconcluso:** la base no permite distinguir el resultado del azar. Se declaran las dos causas posibles sin elegir ninguna: falta de señal en el código o etiquetas ficticias sin relación con él. La implementación con días de control es la forma de saberlo en planta.
- **Peor:** el rango completo queda por debajo del azar. No se propone reemplazar el azar. La propuesta pasa a ser medir con días de control antes de adoptar la hoja, y se conserva el diferencial que se haya sostenido (por ejemplo, «dónde mirar»).

Si gana una alternativa simple, se presenta como hallazgo: con el código como único predictor, el valor está en cómo se usa la tasa y no en el algoritmo. Los modelos que no ganaron son la evidencia de esa conclusión.

## Preparación para el feedback del 2/10

- **Todo se regenera con un comando** (P2 y P9). Cambiar la redacción, una figura o el formato de la hoja lleva minutos.
- **Cambios al predictor después del feedback:** se evalúan solo en validación y se presentan como «evaluado en validación; prueba final no releída». La cifra principal no cambia.
- Cualquier análisis nuevo que pida el jurado se rotula como exploratorio y va aparte.

## Factibilidad económica y escalado

La solución usa ML liviano sobre el código de catálogo: no usa LLM. Estructura de la sección, con los precios investigados y citados durante la construcción:

1. **Implementación:** integrar la entrada (programa del día desde producción y resultados desde QLS), puesta en marcha y capacitación de los analistas.
2. **Operación:** cómputo del recálculo diario (con el código como predictor, segundos en una notebook), almacenamiento e impresión o planilla.
3. **Mantenimiento:** revisar el modelo, atender las alertas del detector y actualizar el catálogo.
4. **Escenarios de escala:** una línea, una planta y varias plantas. Para cada uno: dónde corre (local o nube), cuánto cómputo necesita y qué cambia con un modelo más pesado.
5. **Justificación de la inversión:** a cupo fijo no hay auditorías extra. El beneficio es encontrar más calibraciones con las mismas auditorías. Se deja la fórmula para que Ford aplique su costo por calibración.

**Escalado para Ford (trabajo futuro):** hoja al inicio del día con el programa y el cupo de Calidad de Planta; recálculo diario; mínimo por código; días de control durante la implementación inicial, con duración y tamaño calculados con datos reales; resultados separados para unidades con y sin actividad QLS; replicabilidad en otras líneas o plantas; y la subcategorización del catálogo cuando Ford la publique.

## Pendientes con default

| Pendiente | Default si no se resuelve |
| --- | --- |
| Fracción de unidades con actividad QLS y si QLS se puede consultar desde la playa ([base QLS](https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478), punto 8) | Se mantienen el supuesto y el límite declarados. La hoja se propone para todas las unidades. |
| Público y jurado de la presentación | Jurado mixto, técnico y de planta. |
| Canal de entrega a las 15:00 | Llevar todo en dos medios (notebook y pendrive o enlace). |

## Qué se actualiza al cerrar el ticket

- `docs/alcance-entrega.md`: remite a este plan. Sin calendario, sin orden de recorte y sin el 20 %. Duración y cierre conocidos. E3 con cantidad sugerida, planilla, imprimible y lista de unidades.
- `README.md`: estado del mapa cerrado, sin reparto Informática A/B ni hitos. Enlaza a este plan.
- `CONTEXT.md`: recomendación, hoja, cupo, cupo diario y días de control según las decisiones vigentes.
- `docs/datos-locales.md`: registra `table.xlsx` como la misma base en Excel.
- `research/catalogo-agrupacion.md`: una nota al inicio sobre la prueba ya vista y sobre el congelamiento que no existió. El resto del informe histórico no se toca.
- `research/consigna-fuentes.md`: describe en texto el diagrama perdido de la ficha, sin modificar la copia de la fuente.
- Mapa: índice, notas (Trials Day), «Not yet specified» vacío y las síntesis desactualizadas.
