# Simulación de un mundo con verdad conocida: ¿qué opción es mejor?

Responde a la pregunta del 01/10: si no se puede distinguir 77 de 71 aciertos en la prueba final, ¿se pueden evaluar mejor las opciones con datos sintéticos? **Es una simulación: no es evidencia sobre la planta. Solo Día < 195; la prueba final no se leyó; no es elegible ni entra al preregistro.** Código: [`simulacion.py`](../solucion/experimentos/simulacion.py). Agregados: [`simulacion.json`](../solucion/experimentos/resultados/simulacion.json). Fuente: CSV `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b` y catálogo `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`. Unidad de análisis: VIN.

## Método

- **El mundo.** Se ajusta solo con Día ≤ 194: nivel de la tasa general por día (suavizado a 31 días), riesgo relativo por mercado y desvío del riesgo de un código alrededor del de su mercado (0,215 en logaritmo, descontado el ruido de muestreo). Cada réplica sortea el riesgo de cada código, calcula la probabilidad verdadera de cada VIN y simula su etiqueta. Los días y los códigos de cada VIN son los reales.
- **El protocolo.** Sobre cada mundo se corren las mismas alternativas del repo con los mismos bloques que `precision.py` (selección 100–174 en cuatro bloques, confirmación 175–194), cupo del 5 % y margen de 5 días. Son 965 elegidos por réplica.
- **Opciones comparadas, con la configuración fija de los preregistros y sin ajuste por bloque:** tasa fija reajustada por bloque, jerárquico de 60 días, móvil de 120 días hacia el mercado, riesgo estandarizado, logística con atributos, Random Forest con atributos (semilla 4, vida 15 días) y CatBoost con atributos (semilla 1, vida 15 días).
- **Dos medidas por réplica.** La **precisión verdadera** es la suma de las probabilidades verdaderas de lo elegido, sin ruido de etiquetas. La **precisión realizada** cuenta las etiquetas simuladas, como en una prueba con datos reales. Se compara cada opción con la **mejor selección posible**, que conoce la probabilidad de cada VIN.
- **Seis escenarios, 24 réplicas cada uno,** para lo que no se conoce: mezcla de códigos real (rota) o estable, heterogeneidad entre códigos (×0,5, ×1, ×2) y deriva del riesgo de cada código.
- **Calibración.** Se probaron cinco amplitudes de la señal para acercar el mundo a las opciones sin ML reales en la selección; el menor error (0,57 puntos) fue con la amplitud 1,0, es decir, el mundo estimado tal cual.

## Observaciones

**Fidelidad.** En selección (100–174) y en el total, la cifra real de cada opción cae dentro del rango simulado (por ejemplo, jerárquico: 17,7 % real contra 16,8 % simulado, rango 14,1–21,1). En confirmación, la tasa fija y la móvil hacia el mercado salen del rango simulado por arriba (20,4 % real contra 15,0 % simulado, rango 8,5–19,9, y 20,4 % contra 15,1 %, rango 7,8–19,9); las demás opciones quedan dentro. Es un solo bloque de 225 elegidos.

**Mundo base (la mezcla de códigos real, que rota).** Entre las 24 réplicas, azar 10,9 %, mejor selección posible 17,7 %.

| Opción | Precisión verdadera | Fracción de la mejor posible | Diferencia verdadera con la tasa fija (rango entre réplicas) | Se ve mejor en los datos |
| --- | ---: | ---: | --- | ---: |
| Tasa fija | 14,1 % | 0,80 | — | — |
| Jerárquico 60 d | 16,3 % | 0,92 | +2,19 (+1,20 a +3,37) | 96 % |
| Móvil 120 d hacia el mercado | 16,6 % | 0,94 | +2,47 (+1,42 a +3,30) | 96 % |
| **Riesgo estandarizado** | **16,8 %** | **0,95** | **+2,71 (+1,71 a +3,75)** | 100 % |
| Logística con atributos | 15,9 % | 0,90 | +1,82 (+0,88 a +2,99) | 96 % |
| **Random Forest con atributos** | **15,7 %** | **0,89** | **+1,58 (+0,71 a +2,66)** | **83 %** |
| CatBoost con atributos | 16,0 % | 0,90 | +1,91 (+0,61 a +3,30) | 96 % |

- **Todas las opciones adaptativas superan a la tasa fija en las 24 réplicas.** Random Forest es la de menor ganancia de las seis (+1,6 puntos) y queda unos 1,1 puntos debajo del riesgo estandarizado.
- **Las opciones simples (riesgo estandarizado, móvil hacia el mercado, jerárquico) están por encima de los modelos de ML** en precisión verdadera en este escenario.

**Mezcla estable.** La tasa fija ya alcanza el 96 % de la mejor posible (18,3 %).

| Opción | Precisión verdadera | Diferencia verdadera con la tasa fija | Es mejor que la tasa fija |
| --- | ---: | --- | ---: |
| Móvil 120 d hacia el mercado | 18,5 % | +0,22 (−0,17 a +0,61) | 96 % de las réplicas |
| Riesgo estandarizado | 18,7 % | +0,41 (−0,25 a +0,89) | 92 % |
| Logística con atributos | 18,4 % | +0,06 (−0,54 a +0,48) | 58 % |
| Jerárquico 60 d | 18,0 % | −0,33 (−1,21 a +0,42) | 21 % |
| CatBoost con atributos | 17,9 % | −0,44 (−1,37 a +0,02) | 4 % |
| **Random Forest con atributos** | **17,2 %** | **−1,11 (−1,88 a −0,44)** | **0 %** |

- **Con la mezcla estable, ningún modelo supera de forma relevante a la tasa fija, y Random Forest queda por debajo en las 24 réplicas.**

**Los otros escenarios** (diferencia verdadera con la tasa fija, en puntos; precisión verdadera de la tasa fija entre paréntesis):

| Escenario | Jerárquico | Móvil hacia mercado | Riesgo estandarizado | Logística | Random Forest | CatBoost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Heterogeneidad alta (19,6 %) | +2,21 | +2,51 | +2,27 | +1,98 | +1,64 | +1,66 |
| Heterogeneidad baja (12,6 %) | +2,10 | +2,39 | +2,74 | +1,94 | +1,67 | +1,98 |
| Riesgo con deriva (18,9 %) | +2,91 | +3,07 | +2,96 | +2,51 | +2,32 | +2,52 |
| Mezcla estable con deriva (24,1 %) | +1,06 | +0,71 | +0,80 | +0,92 | +0,51 | +0,80 |

- **Random Forest queda de último entre las seis opciones adaptativas en los seis escenarios.** La ganancia de cada una sobre la tasa fija cambia mucho según el escenario; su orden relativo, poco.
- **La deriva del riesgo de los códigos aumenta la ganancia** de actualizar (de +1,6 a +2,3 para Random Forest) y la mezcla estable la reduce.

**Cuánto ruido hay en lo que se ve en los datos.** En el mundo base, el desvío de la diferencia *realizada* entre cada opción y la tasa fija es de 1,2 a 1,4 puntos con 965 elegidos. Escalado a los 652 de la prueba final, serían unos 1,4 a 1,7 puntos. La diferencia observada entre Random Forest y la tasa fija en la prueba es 0,9 puntos (77 contra 71 aciertos): menos de un desvío. En el mundo base, donde Random Forest es mejor de verdad, se ve mejor en los datos solo el 83 % de las veces; en el mundo de mezcla estable, donde es peor de verdad, se ve mejor el 12 %.

**Comparación directa entre CatBoost y Random Forest.** Corrida aparte ([`simulacion_pares.json`](../solucion/experimentos/resultados/simulacion_pares.json)): los mismos mundos de los escenarios base y mezcla estable (misma semilla), 24 réplicas, solo estas dos opciones y la tasa fija de referencia. Diferencia **pareada réplica por réplica**, CatBoost menos Random Forest, en la precisión verdadera del tramo 100–194 (965 elegidos):

| Escenario | Diferencia (rango entre réplicas) | CatBoost es mejor en | Se ve mejor en los datos |
| --- | --- | ---: | ---: |
| Base | +0,34 puntos (−0,29 a +0,88) | 75 % de las réplicas | 71 % |
| Mezcla estable | +0,68 puntos (+0,18 a +1,18) | 100 % de las réplicas (24 de 24) | 79 % |

- **Con la mezcla que rota la diferencia no se distingue de cero** (el rango incluye 0). **Con la mezcla estable, CatBoost queda por encima en las 24 réplicas, por unos 0,7 puntos.** La ventaja es chica pero consistente en ese escenario.
- **Aun cuando existe, casi no se ve en los datos.** El desvío de la diferencia realizada es de 0,9 a 1,2 puntos con 965 elegidos, y una diferencia de 0,3 a 0,7 puntos se ve a favor de CatBoost solo en el 71 % al 79 % de las veces. Con los 652 elegidos de la prueba final hay menos información: 78 contra 77 aciertos es lo esperable si la diferencia verdadera es de esa magnitud.
- Límites propios de esta comparación: dos escenarios, una sola semilla por modelo (CatBoost 1, Random Forest 4) y configuración fija.

## Hipótesis

- **Cuando la mezcla de códigos rota, actualizar la tasa y contraerla hacia el mercado gana unos 1,5 a 3 puntos; cuando es estable, la tasa fija es casi tan buena.** Coincide con lo que encontró el análisis de la [opción más precisa](opcion-mas-precisa.md) en los datos reales. Si la mezcla de la prueba final se parece al escenario estable (el 99,8 % de sus VIN tiene un código ya visto en 155–194), la tasa fija es una referencia fuerte. No se probó cuál escenario describe el futuro.
- **Los modelos de ML no agregan sobre las estimaciones simples.** Con un solo predictor categórico, un modelo flexible aprende una tabla de tasas con más ruido que una estimación que la contrae hacia su mercado. Es compatible con la conclusión de los experimentos anteriores, pero esta simulación no lo demuestra para la planta.

## Decisiones acordadas

Ninguna. La simulación no cambia la solución, la hoja ni los preregistros, y no relee la prueba final. Queda como evidencia para la elección entre Random Forest, la tasa fija y las opciones simples; esa elección requiere acuerdo del equipo.

## Límites

- **El mundo es lo que se supone.** Tiene la forma que le di (efecto de mercado más efecto del código, log-normal, mezcla y días reales). «Gana en el mundo simulado» no es «gana en la planta». Un mundo ajustado con estos datos no puede traer información que estos datos no tengan.
- **Ventaja de local para el riesgo estandarizado.** Su modelo (esperados = casos × nivel del día × riesgo del código, contraído hacia el mercado) tiene la misma forma que el generador. Su primer puesto está en parte construido. No se puede decir lo mismo de la móvil hacia el mercado o del jerárquico, que también ganan a los modelos de ML.
- **Los modelos de ML corren con configuración fija**, la de los preregistros, sin el ajuste por bloque con log-loss que hace el pipeline real. Eso puede perjudicarlos; la fidelidad en selección sugiere que la distorsión es chica, pero no se midió por separado.
- **Pocas réplicas.** 24 por escenario: los rangos son entre réplicas, no intervalos de confianza, y no hay corrección por comparaciones múltiples.
- **Confirmación.** Para dos de las ocho opciones, la realidad cae por encima del rango simulado en ese bloque de 225 elegidos; el mundo no reproduce bien ese tramo.
- **El cupo simulado** es el 5 % de los VIN de la base de cada día, como en el resto del repo. No es el cupo de planta.
- **Rotulado:** simulación, base ficticia, entre auditados con actividad QLS, Día < 195.

## Reproducción

```sh
.venv/bin/python -m solucion.experimentos.simulacion --csv '<CSV vigente>' --catalogo '<catálogo vigente>' --replicas 24 --catboost
.venv/bin/python -m solucion.pruebas
```

Unos 85 minutos. El JSON registra el commit del código (`16350a9`), la semilla (20261005) y la calibración. Las pruebas sintéticas ([`test_simulacion.py`](../solucion/pruebas/test_simulacion.py)) verifican, entre otras cosas, que el mundo no admita Día ≥ 195, que en un mundo sin señal toda opción empate con la mejor selección y que ninguna opción supere a la mejor posible.
