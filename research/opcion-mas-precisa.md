# ¿Cuál es la opción más precisa? Evaluación de las vías posibles

Pedido de Facundo Lanusse el 01/10/2026, en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33): evaluar con criterio propio, sin limitarse a la solución planteada, qué opción da la mayor **precisión en el cupo**. **Exploratorio: solo Día < 195, períodos ya explorados; la prueba final no se releyó y los preregistros no cambian.** Código: [`opcion_precisa.py`](../solucion/experimentos/opcion_precisa.py). Agregados: [`opcion_precisa.json`](../solucion/experimentos/resultados/opcion_precisa.json). Unidad de análisis: VIN. Todas las cifras son **entre auditados con actividad QLS, base ficticia**.

## Conclusión

**Con la información de esta base no hay una «opción más precisa» que se pueda identificar.** Hay un grupo de estimadores por código que empatan. En Día 100–194 eligen entre 17 % y 19 % de CALIBRADA, de 1,5 a 1,9 veces el azar. El techo del código está 1 a 6 puntos más arriba, y la incertidumbre de cada lectura es de ±3 a 4 puntos.

1. **Elegir «la ganadora» por aciertos persigue ruido.** En las 54 alternativas de [`precision.json`](../solucion/resultados/precision.json), el orden en selección (100–174) no anticipa el de confirmación (175–194): la correlación de Spearman es −0,34 (p = 0,013). CatBoost, primera en selección (136/740), es la última de las diez primeras en confirmación (39/225). Cawley y Talbot (2010) describen este problema: sobreajustar el criterio de selección puede costar tanto como la diferencia entre algoritmos.
2. **Dos familias nuevas, elegidas sin mirar aciertos, caen en el mismo grupo.** Son el riesgo relativo estandarizado por día y la tasa con olvido hacia el mercado. Ninguna se distingue de las del equipo.
3. **Lo que sí importa es actualizar la tasa y contraerla hacia el mercado.** Alrededor del Día 100 la mezcla de códigos rota casi por completo. Con esa rotación, la tasa fija reajustada por bloque cae a 12,7 % contra 17–18 % de las secuenciales. La diferencia es +0,6 a +8,2 puntos para el riesgo estandarizado. Cuando la mezcla es estable (175–194), todas empatan.
4. **Tres palancas no suben la precisión:**
   - conocer los resultados más rápido;
   - elegir entre varios días de playa;
   - sumar el historial QLS del VIN, que **empeora**: el AUC dentro del día baja de 0,541 a 0,518.
5. **Subir de verdad exige información por VIN que la base no tiene.** El techo con el código es el oráculo: 20,2 % en validación y 22,8 % en selección, y es optimista. La vía para superarlo es la de [datos de proceso](datos-proceso.md).

**Elección por efectividad.** Facundo pidió elegir solo por efectividad, sin desempate por simplicidad. Con ese criterio, la opción elegida es **Random Forest con atributos del código, reentrenado cada 5 días**. Es la más consistente de las 54 alternativas, aunque no está probado que supere a sus parecidas ([detalle](#elección-por-efectividad)).

## Las vías evaluadas

| Vía | Qué podría ganar | Evidencia (Día < 195) | Veredicto |
| --- | --- | --- | --- |
| Mejor algoritmo sobre el código (9 familias de ML, ensembles, 458.098 configuraciones) | Hasta el techo del oráculo | [Búsqueda amplia](busqueda-amplia.md); el orden se invierte entre bloques | Empate; no hay ganadora estable |
| Mejor estimación de la tasa: contracción, actualización, estandarización | Hasta el techo del oráculo | Este informe: riesgo estandarizado y olvido hacia el mercado | Empate entre las secuenciales; superan a la tasa fija cuando rota la mezcla |
| Resultados más rápidos (margen de 1 a 10 días) | Seguir cambios de corto plazo | 17,3–18,4 % en 100–194, sin tendencia | No mejora |
| Elegir entre los vehículos de 1 a 3 días de playa | Más unidades de los códigos de mayor riesgo | 17,7–18,3 % en 100–194, sin tendencia | No mejora |
| Historial QLS del VIN (supuesto A) | Separar unidades del mismo código | AUC dentro del día: 0,485 solo; 0,518 sumado al código | No hay señal y empeora |
| Vincular el historial con el componente calibrado | Señal física dirigida | Los 44 componentes calibrados están anonimizados (V86, V44…) y no coinciden con ningún componente de inspección | No se puede con esta base |
| Exploración con etiquetas parciales (P5) | Mantener al día las tasas | [P5](../solucion/resultados/p5.json): 15,1–15,3 % con o sin exploración | No cambia la precisión |
| Datos de proceso por VIN (torque, metrología, lotes) | Superar el techo del código | [Sensibilidad](sensibilidad-candidatos.md) con señal inventada: ~36 % con señal moderada | Única vía con margen grande; no se puede cuantificar sin datos reales |

## Observaciones

### Cómo es la señal del código

| Días | VIN | Códigos | Tasa | Desvío entre códigos |
| --- | ---: | ---: | ---: | ---: |
| 1–49 | 9.968 | 51 | 13,5 % | 3,1 puntos |
| 50–99 | 10.486 | 60 | 12,8 % | 3,0 puntos |
| 100–149 | 10.825 | 45 | 11,8 % | 4,1 puntos |
| 155–194 | 8.038 | 43 | 9,6 % | 3,0 puntos |

- **Heterogeneidad:** desvío entre códigos del modelo beta-binomial, descontado el ruido de muestreo.
- **La tasa general baja de 13,5 % a 9,6 %.** Esa deriva global no cambia el orden dentro de un día, porque afecta a todos los códigos por igual.
- **La mezcla rota alrededor del Día 100.** Solo el 21 % de los VIN de 50–99 tiene un código que aparece en 100–149. En cambio, el 99,8 % de los VIN de la prueba final (200–260) tiene un código ya visto en 155–194. Son conteos sin etiqueta, permitidos por el plan.
- **El riesgo relativo de un código que persiste es estable.** Hay 22 códigos con 60 VIN o más en 100–149 y en 155–194. Su correlación observada es 0,62 y, descontado el ruido, 0,98. Entre 1–49 y 50–99 sale por encima de 1, un artefacto del estimador con pocos códigos.
- **El agrupamiento por día dentro del código es bajo:** φ = 1,22 en 2.928 celdas código × día (1 = binomial). Un resultado de hoy dice poco sobre mañana más allá de la tasa del código.

### Familias nuevas

- **Riesgo relativo estandarizado.** Modelo E[CALIBRADA] = n·g_día·RR_código, ajustado en forma iterativa y contraído hacia el RR del mercado con κ eventos esperados. Corrige el sesgo de la tasa fija: un código producido cuando la tasa general era alta parece más riesgoso de lo que es. Es la idea de Clayton y Kaldor (1987) aplicada a días en lugar de áreas.
- **Tasa con olvido exponencial hacia el mercado.**

Los parámetros se fijaron en [el protocolo](#método-y-reproducción) antes de leer validación. Se eligieron por **log-loss secuencial** de todos los VIN de Días 60–149, como propone Dawid (1984), nunca por aciertos en el cupo:

- riesgo estandarizado: vida media de 60 días, κ = 10 (log-loss 0,36758);
- olvido hacia el mercado: vida media de 30 días, κ = 40 (0,36761).

### Comparación

Cupo diario `max(1, N_d // 20)`, desempate y bootstrap del repo, 2.000 remuestreos por días. «AUC dentro del día» usa todos los VIN de cada día, no solo los elegidos. El evaluador reproduce las cifras publicadas por el equipo: tasa fija 59/391 y 94/740, móvil hacia el mercado 69/391.

| Alternativa | Validación 155–194 | Selección 100–174 | Confirmación 175–194 |
| --- | --- | --- | --- |
| Azar al mismo cupo | 9,9 % | 11,2 % | 8,8 % |
| Tasa fija (≤149 en validación; reajustada por bloque en los bloques) | 59/391 · 15,1 % · ×1,53 | 94/740 · 12,7 % · ×1,13 | 46/225 · 20,4 % · ×2,33 |
| Jerárquico 60 d, peso 20 (equipo) | 66/391 · 16,9 % · ×1,71 | 131/740 · 17,7 % · ×1,58 | 41/225 · 18,2 % · ×2,07 |
| Móvil 120 d hacia el mercado (equipo) | 69/391 · 17,6 % · ×1,79 | 126/740 · 17,0 % · ×1,52 | 46/225 · 20,4 % · ×2,33 |
| **Riesgo estandarizado, 60 d, κ 10 (nuevo)** | **73/391 · 18,7 % · ×1,89** | 127/740 · 17,2 % · ×1,53 | 44/225 · 19,6 % · ×2,23 |
| Olvido 30 d hacia el mercado, κ 40 (nuevo) | 69/391 · 17,6 % · ×1,79 | 133/740 · 18,0 % · ×1,60 | 40/225 · 17,8 % · ×2,02 |
| Oráculo: tasa real del tramo (no elegible, optimista) | 79/391 · 20,2 % · ×2,05 | 169/740 · 22,8 % · ×2,04 | 48/225 · 21,3 % · ×2,43 |

Denominadores: validación, 35 días y 8.038 VIN; selección, 67 días y 15.279 VIN; confirmación, 19 días y 4.626 VIN.

Diferencia pareada del riesgo estandarizado, rango del 95 % en puntos:

| Contra | Validación | Selección | Confirmación |
| --- | --- | --- | --- |
| Tasa fija | −0,3 a +7,5 | **+0,6 a +8,2** | −2,2 a 0,0 |
| Jerárquico 60 d | −1,3 a +5,1 | −2,5 a +1,4 | −2,6 a +5,8 |
| Móvil 120 d hacia el mercado | −0,8 a +3,5 | −1,8 a +2,0 | −2,5 a +0,9 |

- El AUC dentro del día de las cinco elegibles va de 0,521 a 0,539 en selección y de 0,538 a 0,541 en validación. En selección, el riesgo estandarizado también supera en AUC a la tasa fija reajustada (+0,001 a +0,031). Contra el jerárquico y la móvil hacia el mercado, ninguna diferencia de AUC excluye 0.
- Los modelos del equipo del mismo protocolo de bloques quedan en el mismo rango. Ejemplos de [`precision.json`](../solucion/resultados/precision.json):
  - RF con atributos: 135/740 y 46/225;
  - XGBoost reentrenado: 134 y 44;
  - CatBoost reentrenado: 136 y 39.

### Palancas operativas

Usan el riesgo estandarizado elegido.

| Margen para conocer resultados | 1 d | 2 d | 3 d | 5 d (vigente) | 10 d |
| --- | --- | --- | --- | --- | --- |
| Validación 155–194 (391 elegidos) | 18,2 % | 18,4 % | 19,2 % | 18,7 % | 18,4 % |
| 100–194 (965 elegidos) | 17,7 % | 18,3 % | 18,4 % | 17,7 % | 17,3 % |

Un margen menor que 5 días es optimista: el Día del VIN aproxima la auditoría, que puede ocurrir hasta 5 días después. Aun así, no aparece ganancia.

| Días de playa entre los que se elige | 0 (vigente) | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| 100–194, riesgo estandarizado (965 elegidos) | 17,7 % | 18,3 % | 18,2 % | 18,1 % |
| 100–194, azar | 10,8 % | 11,1 % | 11,6 % | 9,9 % |

El cupo de cada día sigue siendo el 5 % de lo que llega ese día. Cambia solo entre qué vehículos se elige. En validación, con 3 días se llega a 79/391 (20,2 %, rango 15,8–24,1), dentro del ruido; en 100–194 no hay tendencia.

### Señal por VIN

- **Modelo:** LightGBM con hiperparámetros fijos, una semilla y 253 variables:
  - el log-RR del código;
  - seis resúmenes del historial;
  - conteos de las 300 fichas más frecuentes de `datos.EVENTO_COLUMNAS`, nunca el resultado ni el componente de Auditoría Adicional.
- **Datos:** entrenamiento con los 10.825 VIN de 100–149; evaluación en los 8.038 VIN de validación. Se usa el supuesto A, todos los eventos del VIN.

| Variante | Elegidos CALIBRADA | AUC dentro del día (95 %) |
| --- | --- | --- |
| Solo código (riesgo estandarizado) | 73/391 · 18,7 % | 0,541 (0,516–0,567) |
| Código + historial QLS | 67/391 · 17,1 % | 0,518 (0,491–0,544) |
| Solo historial QLS | 33/391 · 8,4 % | 0,485 (0,464–0,507) |

Agregar el historial cambia el AUC entre −0,046 y +0,001, y la precisión entre −3,9 y +0,8 puntos. Coincide con el resultado negativo de [historial del VIN](historial-vin.md), ahora con una métrica que usa todos los VIN.

## Hipótesis

- La tasa fija falla con la rotación por dos motivos. Mezcla épocas de distinta tasa general y deja a los códigos nuevos o en arranque con la tasa general, sin contracción hacia su mercado. La próxima rotación (cambio de modelo o de mezcla) reproduciría la caída.
- El techo lo pone la información del código, no el algoritmo. Hay dos lecturas posibles y la base no permite elegir entre ellas:
  - la base ficticia se generó con señal solo en el código;
  - en planta, el historial QLS no se relaciona con la calibración.
- La demora y el tamaño de la playa no importan porque el riesgo relativo es estable y casi no hay agrupamiento por día. Con datos de proceso, una alarma de corto plazo podría cambiar esto.

## Elección por efectividad

**Criterio.** Lo pidió Facundo el 01/10: elegir solo por efectividad, sin desempate por simplicidad ni facilidad de explicación. Como el orden se invierte entre bloques, «el de más aciertos en un tramo» no sirve. Se elige la alternativa cuya **peor** lectura sea la más alta entre validación 155–194, selección 100–174 y confirmación 175–194. El criterio se fijó después de ver esos tramos: la elección es exploratoria.

**Elegida: Random Forest con atributos del código, reentrenado cada 5 días.** De las 54 alternativas elegibles de [`precision.json`](../solucion/resultados/precision.json), es la de mejor peor lectura: 17,7 %. La sigue XGBoost con atributos reentrenado, con 17,6 %.

| Opción | Validación 155–194 | Selección 100–174 | Confirmación 175–194 | Peor lectura |
| --- | --- | --- | --- | --- |
| **RF con atributos, reentrenado cada 5 d** | **73/391 · 18,7 %** | **131/740 · 17,7 %** | **45/225 · 20,0 %** | **17,7 %** |
| XGBoost con atributos, reentrenado cada 5 d | 69/391 · 17,6 % | 134/740 · 18,1 % | 44/225 · 19,6 % | 17,6 % |
| Riesgo estandarizado, 60 d, κ 10 (este informe) | 73/391 · 18,7 % | 127/740 · 17,2 % | 44/225 · 19,6 % | 17,2 % |
| Móvil 120 d hacia el mercado | 69/391 · 17,6 % | 126/740 · 17,0 % | 46/225 · 20,4 % | 17,0 % |
| CatBoost con atributos, reentrenado (2.ª lectura de la prueba final) | 63/391 · 16,1 % | 136/740 · 18,4 % | 39/225 · 17,3 % | 16,1 % |
| Tasa fija (≤149 en validación; reajustada por bloque) | 59/391 · 15,1 % | 94/740 · 12,7 % | 46/225 · 20,4 % | 12,7 % |

- **Qué es.** Un bosque de 200 árboles de decisión.
  - **Entradas:** el código y sus atributos (mercado, motor dominante, tracción, versión dominante y mercado × versión).
  - **Reentrenamiento:** cada 5 días, con las auditorías de resultado conocido (Día ≤ t − 5) y más peso para lo reciente. La vida media es de 15, 30 o 60 días, y ella y el ajuste del bosque se eligen por log-loss con los días previos.
  - **Salida:** una probabilidad por código, que entra en la hoja sin cambiarle el formato.
- **Por qué esta.** No cae en ninguna lectura. En la rotación de la mezcla supera a la tasa fija por +1,1 a +9,0 puntos en selección (rango del 95 %, pareado por días); en confirmación la diferencia va de −2,5 a +1,4. CatBoost, en cambio, gana en selección y es de las más débiles en validación y confirmación.
- **Lo que no prueba.** Su ventaja sobre XGBoost reentrenado, el riesgo estandarizado o la móvil hacia el mercado es de 5 a 10 aciertos sobre unos 1.000 elegidos, dentro del ruido. Su efectividad esperada es similar, alrededor de 18 % en validación.
- **Cifras sin prueba final.** RF reentrenado nunca se leyó en la prueba final: allí solo están la tasa fija (10,9 % contra 8,2 % al azar) y CatBoost (12,0 %, segunda lectura). El equipo acordó no hacer una tercera lectura. Sus cifras se rotulan «evaluado en validación; prueba final no releída».
- **Origen de las cifras.**
  - Modelos de ML: [`precision.json`](../solucion/resultados/precision.json). En los bloques se informa la corrida mediana de 5 semillas por precisión de selección (RF: semilla 4); validación 155–194 usa una corrida.
  - Riesgo estandarizado: [`opcion_precisa.json`](../solucion/experimentos/resultados/opcion_precisa.json).

## Recomendación

Es una propuesta de este análisis; no es una decisión del equipo.

1. **Trials Day.** Presentar RF con atributos reentrenado como la opción elegida por efectividad, con sus cifras de validación rotuladas. Las únicas cifras de prueba final son la tasa fija preregistrada (10,9 % contra 8,2 % al azar, ×1,32) y CatBoost (12,0 %, segunda lectura). No afirmar que RF le gana a las opciones parecidas. La inversión del orden entre bloques explica por qué se eligió por consistencia y no por el máximo de un tramo.
2. **Implementación.** Calcular la columna de tasa de la hoja con RF con atributos reentrenado cada 5 días, en lugar de la tasa fija: la tasa fija revisada cada tanto no basta en una rotación de mezcla. Si el equipo no quiere operar un modelo de ML, la móvil de 120 días hacia el mercado tiene una efectividad esperada similar. El detector de cambios sigue siendo útil para avisar entre reentrenamientos.
3. **Más precisión.** Pedir a Ford el piloto de [datos de proceso](datos-proceso.md): es la única vía que puede superar el techo del código. Mientras tanto, el techo esperable con la base actual es de unos 18–20 % en validación.

## Método y reproducción

```sh
.venv/bin/python -m solucion.experimentos.opcion_precisa \
  --csv '<CSV vigente>' --catalogo '<catálogo vigente>'
.venv/bin/python -m solucion.pruebas
```

- **Fuente:** CSV `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b` y catálogo `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`, verificados al cargar ([datos locales](../docs/datos-locales.md)). Las etiquetas de Día ≥ 200 quedan enmascaradas.
- **Código:** commit `e9a6559`. El sufijo `+cambios` del JSON es el propio archivo de resultados, sin seguimiento al correr. Dos corridas seguidas producen el mismo JSON byte a byte.
- **Protocolo fijado antes de leer validación:**
  - Grillas: riesgo estandarizado con vida media infinita, 120 o 60 días y κ de 5, 10, 20 o 40; olvido con vida media de 30, 60 o 120 días y κ de 10, 20 o 40.
  - Criterio: log-loss secuencial en 60–149.
  - Lectura: validación y bloques del equipo (100–118, 119–137, 138–156, 157–174; confirmación 175–194).
  - Palancas: margen de 1, 2, 3, 5 o 10 días; playa de 0 a 3 días.
- **Semillas:** desempate 20261002; bootstrap 20261003; LightGBM 20261001, en modo determinista con predicciones redondeadas a 6 decimales.
- **Pruebas sintéticas** ([`test_opcion_precisa.py`](../solucion/pruebas/test_opcion_precisa.py)). Fallan si:
  - el riesgo estandarizado confunde la deriva global con riesgo del código;
  - usa resultados posteriores a t − 5;
  - un código nuevo no toma el riesgo de su mercado;
  - la playa sin permanencia no reproduce la selección diaria.

## Límites

- **Períodos ya explorados.** Validación y bloques ya los vio el equipo. Este informe agrega dos familias, dos palancas y un control de señal. Una sola configuración por familia llegó a validación, pero la lectura sigue siendo exploratoria.
- **El oráculo es optimista.** Usa las etiquetas del mismo tramo que evalúa.
- **La playa simulada es un supuesto.** Supone que un vehículo sigue disponible D días y que se puede elegir cualquiera; la permanencia real no se conoce.
- **El margen corto es optimista**, porque el Día del VIN solo aproxima la auditoría.
- **El historial se probó con un solo modelo**, con una semilla y sin ajuste. Su disponibilidad desde la playa no está acreditada.
- **La base es ficticia** y reúne solo auditados con actividad QLS. No prueba impacto en planta.

## Decisiones acordadas

Ninguna. El informe no cambia la solución operativa, la hoja ni los preregistros, y no relee la prueba final. La elección de RF con atributos reentrenado es de este análisis, con el criterio de efectividad que pidió Facundo. Contradice la opción de tasa fija acordada el 30/09 en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33) y requiere acuerdo del equipo.

## Fuentes

- Cawley, G. C. y Talbot, N. L. C. (2010). On over-fitting in model selection and subsequent selection bias in performance evaluation. *Journal of Machine Learning Research*, 11(70), 2079–2107. <https://www.jmlr.org/papers/v11/cawley10a.html>. Según el resumen, sobreajustar el criterio de selección degrada el desempeño en una magnitud a menudo comparable a las diferencias entre algoritmos.
- Clayton, D. y Kaldor, J. (1987). Empirical Bayes estimates of age-standardized relative risks for use in disease mapping. *Biometrics*, 43(3), 671–681. <https://doi.org/10.2307/2532003>. Proponen estimar cada razón estandarizada como un compromiso entre la propia razón y la media del grupo, con un peso que depende de su fiabilidad.
- Dawid, A. P. (1984). Statistical theory: The prequential approach. *Journal of the Royal Statistical Society, Series A*, 147(2), 278–292. <https://doi.org/10.2307/2981683>. Propone evaluar los métodos por sus pronósticos secuenciales a medida que llegan los datos.
- Efron, B. y Morris, C. (1975). Data analysis using Stein's estimator and its generalizations. *Journal of the American Statistical Association*, 70(350), 311–319. <https://doi.org/10.1080/01621459.1975.10479864>. En sus aplicaciones, contraer hacia la media del grupo redujo el error cuadrático a menos de la mitad del de cada tasa por separado.
