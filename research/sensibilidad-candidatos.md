# Sensibilidad de los candidatos priorizados a señales de proceso hipotéticas

> **Nota del 02/10/2026.** La solución presentada es **CatBoost con atributos del código, reentrenado cada 5 días**, y la prueba final se leyó tres veces: tasa fija, CatBoost y Random Forest ([cómo se iteró la solución](../docs/entrega/02-2-especificaciones-tecnicas.md#cómo-se-iteró-la-solución)). Este informe conserva su análisis original; donde dice «solución vigente» o «tasa fija acordada», se refiere a la primera etapa.

Ampliación pedida por Facundo para completar la [primera sensibilidad](sensibilidad-proceso.md) con los candidatos recomendados en [#48](https://github.com/FordwardAI/ford-predictive-quality/pull/48). Seguimiento en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33); publicación en [#50](https://github.com/FordwardAI/ford-predictive-quality/pull/50). No cambia el predictor operativo ni el preregistro.

## Qué se compara

La primera sensibilidad usó estimadores genéricos de logística, RF y LightGBM. Esta ampliación conserva los **controles originales** de RF con atributos, CatBoost con objetivo conjunto, stacking, tasa jerárquica y mezcla 60/40. La tasa fija es control operativo. Reproduce las cinco semillas del estudio integrado antes de interpretar diferencias; cualquier discrepancia de población, cupo o aciertos de un candidato/semilla frena la publicación.

| Candidato | Control original | Extensión que recibe proxies |
| --- | --- | --- |
| RF con atributos | Configuración por bloque publicada en `semillas_busqueda.json`, 200 árboles y hoja elegida en el ajuste original; misma codificación y orden de filas | Añadir proxies por VIN; conservar parámetros, clase de estimador y codificación originales. El mayor número de columnas afecta `max_features=sqrt`; el escenario nulo ayuda a observar ese efecto |
| CatBoost conjunto | Clasificar OK o componente; 200 iteraciones, profundidad 4, tasa 0,05, regularización 10; `1−P(OK)` para priorizar | Mismo objetivo, parámetros y entradas de catálogo más proxies. El componente es etiqueta, nunca predictor |
| Stacking | Siete bases de catálogo con sus configuraciones originales; meta logístico original ajustado en tramo interno | Mantener bases, coeficientes e intercepto originales; añadir una corrección lineal regularizada de los logits usando proxies, aprendida en ese tramo interno |
| Ensemble 60/40 | 60 % stacking original + 40 % jerárquico de 60 días/peso 20 | 60 % stacking extendido + 40 % jerárquico original; no volver a elegir pesos |
| Jerárquico y tasa fija | Métodos por código, con parámetros originales | Permanecen intactos en todos los escenarios: no usan mediciones individuales |

**Añadir variables produce candidatos extendidos**, no transforma las configuraciones históricas en modelos ya validados con sensores. En particular, el ensemble recibe los proxies en la capa final del stacking: no se reentrenan sus siete bases con nuevas columnas ni se vuelve a buscar otro ensemble. Así se evalúa una extensión concreta, conservando la evidencia original, sin atribuirle el alcance de todas las arquitecturas posibles.

## Protocolo y supuestos

Se reutiliza el mismo [generador](../solucion/experimentos/sensibilidad_proceso.py): 13 proxies normalizados en cuatro dimensiones, latentes gaussianas condicionadas deliberadamente a etiquetas, incluso en evaluación. Se mantienen seis escenarios (señal nula, débil, moderada, fuerte, fuerte degradada por ruido/cobertura y fuerte invertida), semillas 1–5 y el cupo diario. Las columnas no son mediciones de torque, geometría, lotes ni ambiente observadas; sus nombres ilustran mecanismos. No se inventan valores físicos de planta ni nuevas etiquetas.

Fuente: CSV SHA-256 `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`; catálogo `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`. Unidad: VIN entre auditados con actividad QLS de la base ficticia, misma población, sin exclusiones nuevas. No se desbloquea la tabla ni se lee Día ≥195. No resuelve las etiquetas ausentes de no auditados ni la cobertura de auditados sin QLS.

Bloques iniciales 100–118, 119–137, 138–156 y 157–174; comprobación 175–194. RF/CatBoost entrenan hasta inicio−6. Selección acumula 15.279 VIN, 1.702 CALIBRADA, 67 días y 740 inspecciones; comprobación 4.626 VIN, 408 CALIBRADA, 19 días y 225 inspecciones. Los períodos ya se habían explorado: no son evaluación nueva independiente.

El RF extendido respeta el orden original por código/día/etiqueta con el que el control expande conteos a filas VIN. La correspondencia a proxies se hace internamente con el VIN, nunca se exporta. CatBoost conserva la representación original de catálogo/atributos. No se buscan nuevos hiperparámetros sobre las señales inventadas.

La corrección del stacking es `sigmoid(logit(p_original) + X·γ)`. Se aprende γ minimizando log-loss más penalización `||γ||²/2` (C = 1) sin modificar el intercepto original. Para un bloque que empieza en a, sus bases internas se entrenan hasta a−36; γ usa los VIN entre a−30 y a−6. Las señales y etiquetas de evaluación no intervienen en ese ajuste. El meta original ya se ajustó en ese tramo: es una ampliación del mismo ajuste interno, no una nueva validación independiente.

La tasa jerárquica se calcula con pasado permitido cada día y se comparte entre VIN del mismo código. Mantenerla fija frente a proxies no prueba inutilidad de sensores; responde a la definición del método. Convertirla en una tasa por intervalos de sensores sería otro modelo, no ensayado aquí.

Bootstrap pareado por días: semilla 20261003 y 2.000 remuestreos; desempate 20261002. Las medias combinan las cinco semillas, mismos VIN. Los rangos son descriptivos, condicionados al generador y sin ajuste por múltiples comparaciones. Una diferencia que excluye cero no demuestra una ganancia real de telemetría.

## Resultados

**Los controles reprodujeron los aciertos originales en cada semilla. Con señal moderada impuesta, los tres candidatos principales mejoran respecto de su propio control y terminan cerca de 36 % de precisión.** CatBoost tiene la mayor mejora relativa porque parte de una precisión menor; no alcanza la mayor precisión absoluta del escenario moderado.

### Día 100–174: 740 inspecciones

Cada celda: aciertos medios / cupo (precisión media), cinco semillas sobre los mismos VIN.

| Escenario | RF recomendado | Ensemble 60/40 | CatBoost conjunto | Stacking |
| --- | ---: | ---: | ---: | ---: |
| Control original | 133,8/740 (18,08 %) | 131,8/740 (17,81 %) | 133,2/740 (18,00 %) | 98,0/740 (13,24 %) |
| Sin señal | 115,6/740 (15,62 %) | 126,8/740 (17,14 %) | 117,4/740 (15,86 %) | 94,0/740 (12,70 %) |
| Débil | 171,4/740 (23,16 %) | 184,0/740 (24,86 %) | 175,2/740 (23,68 %) | 171,4/740 (23,16 %) |
| Moderada | 296,0/740 (40,00 %) | 303,2/740 (40,97 %) | 307,6/740 (41,57 %) | 299,6/740 (40,49 %) |
| Fuerte | 563,2/740 (76,11 %) | 576,0/740 (77,84 %) | 573,2/740 (77,46 %) | 573,2/740 (77,46 %) |
| Fuerte degradada | 319,6/740 (43,19 %) | 328,6/740 (44,41 %) | 321,6/740 (43,46 %) | 326,2/740 (44,08 %) |
| Fuerte invertida | 563,2/740 (76,11 %) | 576,0/740 (77,84 %) | 573,2/740 (77,46 %) | 573,2/740 (77,46 %) |

### Día 175–194: 225 inspecciones

Cada celda: aciertos medios / cupo (precisión media), cinco semillas sobre los mismos VIN.

| Escenario | RF recomendado | Ensemble 60/40 | CatBoost conjunto | Stacking |
| --- | ---: | ---: | ---: | ---: |
| Control original | 46,0/225 (20,44 %) | 45,0/225 (20,00 %) | 40,0/225 (17,78 %) | 43,2/225 (19,20 %) |
| Sin señal | 39,4/225 (17,51 %) | 41,6/225 (18,49 %) | 38,6/225 (17,16 %) | 38,2/225 (16,98 %) |
| Débil | 50,8/225 (22,58 %) | 52,8/225 (23,47 %) | 54,2/225 (24,09 %) | 47,2/225 (20,98 %) |
| Moderada | 82,2/225 (36,53 %) | 80,8/225 (35,91 %) | 81,8/225 (36,36 %) | 81,6/225 (36,27 %) |
| Fuerte | 158,8/225 (70,58 %) | 157,8/225 (70,13 %) | 159,6/225 (70,93 %) | 160,4/225 (71,29 %) |
| Fuerte degradada | 85,0/225 (37,78 %) | 88,0/225 (39,11 %) | 84,0/225 (37,33 %) | 87,0/225 (38,67 %) |
| Fuerte invertida | 0,4/225 (0,18 %) | 1,0/225 (0,44 %) | 0,4/225 (0,18 %) | 0,4/225 (0,18 %) |

### Comparación principal: señal moderada en comprobación

| Candidato | Control original | Con proxies | Diferencia | Mejora relativa | Rango 95 % de la diferencia |
| --- | ---: | ---: | ---: | ---: | ---: |
| RF recomendado | 20,44 % | 36,53 % | +16,09 puntos | +78,70 % | +11,33 a +20,78 puntos |
| Ensemble 60/40 extendido | 20,00 % | 35,91 % | +15,91 puntos | +79,56 % | +12,69 a +19,49 puntos |
| CatBoost conjunto | 17,78 % | 36,36 % | +18,58 puntos | +104,50 % | +14,13 a +22,72 puntos |
| Stacking extendido | 19,20 % | 36,27 % | +17,07 puntos | +88,89 % | +12,76 a +21,90 puntos |

Las cuatro diferencias excluyen cero **bajo este generador**; no acreditan una mejora de sensores reales. Los tres candidatos principales encuentran entre 80,8 y 82,2 calibradas de las 225 elegidas, en promedio. Esa cercanía descriptiva no permite declarar ganador de planta. No se calculó aquí un contraste pareado completo entre todas las variantes extendidas: los rangos de la tabla comparan cada una con su propio control.

### Controles por código

| Control | Selección: aciertos / 740 | Comprobación: aciertos / 225 | Cambios con proxies |
| --- | ---: | ---: | --- |
| Tasa fija | 94 (12,70 %) | 46 (20,44 %) | Ninguno: no consumen proxies |
| Jerárquico 60 días/peso 20 | 131 (17,70 %) | 41 (18,22 %) | Ninguno: no consumen proxies |

Azar esperado posterior: ≈19,77/225 = 8,78 % con el mismo cupo. La mejora relativa principal se calcula contra el candidato original, no contra azar ni contra el control genérico de la primera sensibilidad.

### Lectura de los demás escenarios

- **Sin señal:** todos los candidatos extendidos bajan en promedio; sus rangos de diferencia con control incluyen cero. Agregar columnas no garantiza mejora.
- **Débil:** CatBoost conjunto +35,5 % relativo y ensemble +17,33 %; sus rangos excluyen cero dentro del generador. RF +10,43 % y stacking +9,26 % tienen rangos que incluyen cero.
- **Fuerte:** los tres candidatos principales alcanzan aproximadamente 70–71 %. Son efectos impuestos, no expectativas para Ford.
- **Fuerte degradada:** RF 37,78 %, ensemble 39,11 % y CatBoost 37,33 % con ruido alto y 50 % de cobertura MCAR. No se extrapola a faltantes relacionados con calidad, lote o estación.
- **Invertida:** RF y CatBoost caen a 0,18 %, ensemble a 0,44 %. La relación aprendida deja de ser útil; un modelo que rindió bien inicialmente puede fallar con cambios de proceso.

### Conclusión para la propuesta

La sensibilidad ahora cubre los candidatos priorizados con controles reproducidos. Bajo señal moderada estable, las variantes principales ganan aproximadamente **79–105 % relativo** frente a su propia referencia, pero sus precisiones absolutas son próximas: **35,91–36,53 %**. La corrección en stacking es una extensión concreta del ensemble, no un reentrenamiento con sensores de sus siete bases.

Para Ford: «Si las mediciones anteriores a selección aportan señal estable y trazable, los candidatos actuales pueden aprovecharla. La simulación ilustra aumentos condicionados a esa señal; el piloto debe medir si existe y se sostiene». Mantener tasa fija como control, conseguir una exportación de una operación pertinente y decidir entre modelos con datos observados nuevos. No afirmar que CatBoost es mejor por su porcentaje relativo, que el ensemble siempre gana o que IoT producirá esta ganancia.

### Evidencia conservada

[JSON completo](../solucion/experimentos/resultados/sensibilidad_candidatos.json): 420 registros por candidato/escenario/semilla/tramo, 84 resúmenes y 25 ajustes de bloque/semilla. La verificación reconcilia población, cupo y aciertos de los cinco controles históricos para cada semilla y ambos tramos. Tasa fija también coincide con 94/740 y 46/225 de la referencia publicada.

Código publicado en `4f2537d`; el registro de ejecución añade `+cambios` porque la documentación seguía sin commitear. El SHA del script queda en el JSON. La pequeña refactorización del resumen permite escenarios/semillas explícitos y devuelve nulo cuando una mejora relativa no está definida por falta de aciertos del control; los controles de la fuente completa son todos positivos.

## Reproducción y verificación

```sh
.venv/bin/python -m solucion.experimentos.sensibilidad_candidatos \
  --csv '<CSV vigente>' --catalogo '<catálogo vigente>' \
  --historico solucion/experimentos/resultados/semillas_busqueda.json \
  --salida solucion/experimentos/resultados/sensibilidad_candidatos.json
.venv/bin/python -m solucion.pruebas
python3 research/test_audit_dataset.py
git diff --check
```

Código: [sensibilidad_candidatos.py](../solucion/experimentos/sensibilidad_candidatos.py); generación y resumen se reutilizan de [sensibilidad_proceso.py](../solucion/experimentos/sensibilidad_proceso.py). Sin nuevas dependencias. El JSON guarda ajustes, semillas, agregados e identificación de fuente/código; no publica VIN, valores por unidad ni predicciones.

Pruebas: corrección nula reproduce el puntaje original, corrección aprendida identifica señal sintética conocida y una discrepancia con los aciertos históricos se rechaza. Una integración con datos sintéticos comprueba margen de entrenamiento, cupo, población, controles que permanecen intactos y ausencia de VIN en resultados. La reproducción sobre la fuente completa se verifica antes de guardar el JSON.

## Interpretación y decisión pendiente

Este experimento completa la comparación con los candidatos priorizados; no elige un modelo para planta. Una corrección lineal puede ser favorecida por el generador gaussiano aditivo. El escenario invertido es un estrés supuesto, no evidencia de que Ford sufrirá ese cambio.

La siguiente decisión requiere exportaciones reales anteriores a selección, trazables por VIN y con nominal/tolerancia, cobertura y latencia comprobadas. Mantener tasa fija como control y comparar incrementos en períodos nuevos. No usar ganancias hipotéticas como presupuesto de retorno, demostración causal o promesa de precisión de sensores.
