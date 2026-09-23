# Experimentos de modelado: Desafío QLS

**Estado:** aporte de evidencia para [¿Qué registros y variables son admisibles para el experimento?](https://github.com/FordwardAI/ford-predictive-quality/issues/6), también publicado [en el ticket](https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804115001). No es una decisión acordada. Autor: mateoserebrinsky.

## Alcance y límites

- **Observaciones:** las tablas de resultados de las secciones 1 a 4.
- **Hipótesis:** las explicaciones de cada resultado, por ejemplo que el margen hasta el techo se debe al drift o que el historial de defectos no tiene señal.
- **Propuestas, no decisiones acordadas:** el puntaje por tasa móvil de 60 días y la operación 80 % por ranking + 20 % al azar. La política de admisibilidad y el protocolo de modelado siguen abiertos en el mapa.
- **Fuente:** falta confirmar que es el CSV vigente (SHA-256 `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`, ver [datos locales](../docs/datos-locales.md)).
- **Unidad de análisis:** VIN. «Día» es el identificador DIA_n del CSV.
- **Reproducibilidad:** el código de los experimentos y el documento «EDA - Dataset QLS Inspeccion Adicional» todavía no están versionados, así que por ahora estos resultados no se pueden reproducir desde el repositorio.
- **Elecciones del experimento, no del protocolo:** el split (entrenamiento con días < 200, test con días 200–260), la métrica diaria y el margen de 5 días.
- **Límite de la base:** es ficticia y no prueba impacto en planta.


Pruebas de enfoques de modelado más allá del EDA. Los resultados del EDA, del modelo supervisado base y del aprendizaje no supervisado están en **EDA - Dataset QLS Inspeccion Adicional** (secciones 4 y 10).

**Resumen:** se probaron aprendizaje supervisado (7 algoritmos), no supervisado, por refuerzo, combinaciones de modelos y redes neuronales. Ninguno supera al modelo simple sobre el código de catálogo (AUC ≈ 0,56), que ya está cerca del techo teórico (0,589). El límite está en la información disponible, no en el algoritmo. **La única mejora concreta vino de feature engineering (sección 4): una tasa móvil de calibración por código, que se adapta al drift y mejora el top 5 % diario.**

---

## 1. Aprendizaje por refuerzo (bandido contextual)

### Planteo

Cada día llegan ~210 vehículos y la planta puede auditar un porcentaje fijo. Un agente decide cuáles auditar. Recibe recompensa 1 si el vehículo auditado necesitaba calibración y 0 si no. **Solo conoce el resultado de los vehículos que eligió auditar**, igual que en la planta real. Con eso actualiza su estimación de riesgo y decide mejor al día siguiente.

Es un **bandido contextual**: la forma de aprendizaje por refuerzo que corresponde a decisiones de un solo paso con información parcial. El "contexto" de cada vehículo es su código de catálogo, la única variable con señal según el EDA.

### Simulación

- Días 1–260 (VINs etiquetados), procesados en orden cronológico, día por día.
- Métrica: calibraciones encontradas cada 100 vehículos auditados.
- 10 repeticiones con distinta semilla aleatoria (se reporta media ± desvío).

Políticas comparadas:

| Política | Qué hace |
|---|---|
| Azar | Elige al azar. Es lo que se hace hoy según Ford. |
| Greedy | Siempre audita los códigos con mayor tasa estimada. No explora. |
| Epsilon-greedy | 80 % por mayor tasa estimada, 20 % al azar para seguir aprendiendo. |
| Thompson sampling | Muestrea de la distribución de probabilidad de cada código: explora más donde tiene más incertidumbre. Se probó por código completo (98 brazos) y por la posición 3 del código (9 brazos). |
| Referencia: supervisado con información completa | Conoce el resultado de **todos** los vehículos de días anteriores, no solo de los auditados. Es el techo de lo que puede lograr cualquier política con esta variable. |

### Resultados: presupuesto de auditoría del 5 % diario

| Política | Todo el período | Días 200–260 |
|---|---|---|
| Azar (situación actual) | 11,0 ± 0,9 | 8,5 ± 1,3 |
| Greedy | 13,4 ± 1,4 | 11,3 ± 2,2 |
| **Epsilon-greedy (20 % exploración)** | **13,5 ± 0,7** | **11,6 ± 1,7** |
| Thompson (98 códigos) | 13,5 ± 0,5 | 10,7 ± 0,4 |
| Thompson (posición 3) | 14,6 ± 1,2 | 11,0 ± 1,1 |
| Referencia: supervisado con info completa | 16,4 ± 0,2 | 12,1 ± 0,6 |

### Resultados: presupuesto de auditoría del 20 % diario

| Política | Todo el período | Días 200–260 |
|---|---|---|
| Azar | 11,2 ± 0,2 | 8,1 ± 0,4 |
| Greedy | 12,5 ± 0,4 | 10,0 ± 0,8 |
| Epsilon-greedy | 12,9 ± 0,2 | 10,5 ± 0,5 |
| Thompson (98 códigos) | 12,7 ± 0,3 | 10,1 ± 0,8 |
| Thompson (posición 3) | 12,1 ± 0,4 | 9,2 ± 0,6 |
| Referencia: supervisado con info completa | 13,5 ± 0,1 | 11,2 ± 0,1 |

### Lectura de los resultados

1. **El refuerzo supera al azar:** con 5 % de presupuesto encuentra ~13,5 calibraciones cada 100 auditados contra 11 al azar (+23 %). En los días 200–260, 11,6 contra 8,5 (+36 %).
2. **No supera al supervisado, y no puede.** La mejor política posible es auditar primero a los vehículos con mayor probabilidad de calibración, que es exactamente lo que estima el modelo supervisado. El refuerzo converge a esa misma decisión, pero aprendiendo con menos información (solo de lo que audita). Trabaja con las mismas columnas: no crea información nueva.
3. **Se acerca al techo usando solo el 5 % de las etiquetas.** Con apenas los resultados de lo que audita, llega a ~85–95 % del desempeño del supervisado con información completa.
4. **Las diferencias entre variantes de refuerzo no son significativas** (los desvíos se superponen). Epsilon-greedy es la más estable en el tramo final.

### Por qué igual es útil: la política de operación

El aporte del refuerzo no es subir la precisión sino **cómo operar el modelo en la planta una vez implementado**:

- **Evita el círculo vicioso.** Si la planta audita solo lo que el modelo marca como riesgoso, deja de conocer el resultado de los demás vehículos. El modelo ya no puede detectar si se equivoca con los de "bajo riesgo", ni aprender de versiones nuevas del catálogo.
- **Se adapta a cambios.** El EDA mostró drift (la tasa bajó de 14 % a 8 % en el período). Una política que sigue aprendiendo día a día se ajusta sola; un modelo entrenado una vez queda desactualizado.
- **Mide el impacto de forma continua.** La porción auditada al azar funciona como grupo de control permanente: permite medir cada semana cuánto mejor rinde el modelo que el azar.
- **Incorpora nuevas categorías.** Cuando Ford publique la subcategorización del catálogo, aparecerán categorías nuevas sin historial. La exploración les asigna auditorías hasta aprender su riesgo.

### Propuesta de operación

**80 % de las auditorías según el ranking del modelo + 20 % al azar**, con actualización periódica usando los resultados de ambas porciones. En la simulación, esta configuración (epsilon-greedy) rinde lo mismo que las alternativas más complejas y es la más fácil de explicar y auditar en planta.

---

## 2. Combinación de algoritmos (ensembles y stacking)

### Planteo

Se entrenaron varios algoritmos distintos y se combinaron sus predicciones, para ver si juntos superan al mejor individual. Validación out-of-time: entrenamiento días < 200, test días 200–260 (13.062 VINs).

### Modelos individuales

| Modelo | Variables | AUC |
|---|---|---|
| XGBoost | Catálogo | 0,563 |
| Naive Bayes | Catálogo | 0,563 |
| Random Forest | Catálogo | 0,562 |
| **Tasa histórica por código (sin ML: promedio de calibración de cada código en el pasado)** | Catálogo | **0,558** |
| Regresión logística | Catálogo | 0,557 |
| HistGradientBoosting | Catálogo + historial de defectos | 0,516 |
| XGBoost | Solo historial de defectos | 0,514 |

### Combinaciones

| Combinación | AUC |
|---|---|
| Promedio de los 5 modelos de catálogo | 0,563 |
| Promedio de los 7 modelos | 0,561 |
| Catálogo + historial de defectos (50/50) | 0,553 |
| Stacking (meta-modelo que aprende cómo pesar a los demás) | 0,558 |

En el stacking, el meta-modelo asignó **peso negativo (−0,46) al modelo de historial de defectos**: por su cuenta decidió que esa información resta en lugar de sumar.

### Techo teórico con el catálogo

Se calculó un "oráculo" que conoce la tasa de calibración **real** de cada código en el período de test (información imposible de tener en la práctica). Es el máximo que cualquier modelo o combinación podría lograr usando el catálogo:

| | AUC |
|---|---|
| Mejor modelo real | 0,563 |
| **Oráculo (techo absoluto con catálogo)** | **0,589** |

### Lectura de los resultados

1. **Todos los algoritmos llegan al mismo lugar.** Cinco métodos muy distintos (árboles, probabilísticos, lineales) dan entre 0,557 y 0,563. Incluso un promedio simple por código, sin machine learning, da 0,558.
2. **Combinarlos no suma.** Los ensembles funcionan cuando cada modelo acierta en casos distintos. Acá todos aprendieron lo mismo (una tabla de "tasa por código de catálogo"), así que sus errores coinciden y promediarlos no corrige nada.
3. **El margen que queda es mínimo y no depende del algoritmo.** Entre el mejor modelo (0,563) y el oráculo (0,589) hay 0,026 de AUC. Esa diferencia se explica porque las tasas de cada código cambian con el tiempo (drift), no por falta de un algoritmo mejor.

### Implicancia para la propuesta

- **Elegir el modelo más simple que alcance el techo.** Una tabla de tasas por código rinde casi igual que XGBoost.
- **Justificación del modelo ante el jurado** (criterio explícito de la ficha técnica): se compararon siete algoritmos y cuatro formas de combinarlos; ninguno supera al modelo simple, y se calculó el techo teórico para demostrar que no hay margen algorítmico que explotar.
- **El único camino para subir el techo es información nueva**: la subcategorización del catálogo que está preparando Ford.

---

## 3. Redes neuronales

### Planteo

Se entrenaron redes neuronales (perceptrón multicapa) de distinto tamaño, con distintas representaciones de los datos. Misma validación out-of-time; 3 corridas por configuración, porque las redes varían según la inicialización.

| Red | Datos de entrada | AUC |
|---|---|---|
| Chica (32 neuronas) | Catálogo | 0,532 ± 0,014 |
| Profunda (128-64-32) | Catálogo | 0,542 ± 0,023 |
| Chica (64 neuronas) | Historial de defectos completo (1.000+ variables) | 0,501 ± 0,003 |
| Profunda (128-64-32) | Historial de defectos comprimido (50 dimensiones) | 0,515 ± 0,003 |
| Profunda (128-64-32) | Catálogo + historial completo | 0,545 ± 0,012 |
| *Referencia: XGBoost sobre catálogo* | | *0,563* |
| *Techo teórico con catálogo* | | *0,589* |

### Lectura de los resultados

1. **Las redes rinden peor que XGBoost** (0,53–0,545 contra 0,563) y son **menos estables**: el resultado cambia hasta ±0,02 entre corridas.
2. **Con el historial de defectos solo dan azar** (0,50), igual que todos los demás métodos. Confirma que el historial no contiene la señal.
3. **Por qué no mejoran:**
   - Las redes neuronales se destacan con datos donde hay patrones complejos por descubrir: imágenes, texto, audio, señales de sensores. En datos en tabla con variables categóricas, los modelos de árboles como XGBoost suelen igualarlas o superarlas.
   - Una red más compleja puede aprender relaciones más complicadas, pero solo si existen. Acá la relación es simple (una tasa por código) y no hay nada más para descubrir.
   - Con tanto ruido, la capacidad extra de la red se usa para memorizar casos del entrenamiento que no se repiten en el futuro.
4. **Son más difíciles de explicar.** La ficha técnica pide visibilizar "las variables de mayor impacto en el resultado". Con XGBoost es directo (SHAP); con una red es mucho más costoso y menos claro.

### Implicancia

No se justifica usar redes neuronales en esta solución: rinden menos, varían más y se explican peor. Quedan documentadas como alternativa evaluada y descartada, lo que suma a la justificación de la elección del modelo.

---

## 4. Feature engineering: crear una columna nueva con la relación más fuerte

### Planteo

Crear columnas nuevas a partir de la relación más potente encontrada (código de catálogo → tasa de calibración) y usarlas para priorizar. Se probaron tres tipos de columna:

- **Tasa fija por código:** porcentaje de calibración de cada código, calculado una sola vez con los días de entrenamiento.
- **Tasa móvil por código:** porcentaje de calibración de cada código en los últimos N días (30, 60 o 120), recalculado cada día. Solo usa resultados ya conocidos: se deja un margen de 5 días, porque según Ford entre el Gate Release y la Inspección Adicional pasan hasta 5 días.
- **Riesgo relativo:** tasa móvil del código dividida por la tasa móvil de toda la planta.

### Métrica operativa: top 5 % diario

A partir de esta sección se usa una métrica más realista que la de las secciones anteriores: **cada día por separado** se auditan los vehículos del 5 % superior del ranking de ese día, y se cuentan cuántos necesitaban calibración. Es exactamente cómo operaría la planta.

> **Nota:** el "12,6 de cada 100" reportado en el EDA (sección 4) ordenaba todo el período de test junto, no día por día. Con la métrica diaria, el modelo de catálogo fijo rinde algo menos (≈ 10,3–10,8). Tasa base del período de test: 8,3 %.

### Resultados (test días 200–260)

| Columna / modelo | AUC | Calibraciones cada 100 (top 5 % diario) |
|---|---|---|
| Azar (tasa base) | 0,500 | 8,3 |
| XGBoost con catálogo (referencia anterior) | 0,557 | 10,8 |
| Tasa fija por código (sin modelo) | 0,558 | 10,8 |
| Tasa móvil 30 días (sin modelo) | 0,557 | **13,2** |
| **Tasa móvil 60 días (sin modelo)** | 0,561 | **13,2** |
| Tasa móvil 120 días (sin modelo) | 0,568 | 12,1 |
| Riesgo relativo 60 días (sin modelo) | 0,557 | 13,2 |
| Catálogo + tasas móviles dentro de XGBoost | 0,517 | 10,3 |
| Catálogo + tasas móviles + riesgo relativo en XGBoost | 0,510 | 9,9 |
| ⚠️ Tasa por código calculada con TODOS los datos (trampa) | 0,576 | 13,8 |

### Robustez (bootstrap por días, 2.000 remuestreos)

Comparación tasa móvil 60 días vs. tasa fija:

| Presupuesto de auditoría | Móvil | Fija | Diferencia (IC 95 %) | Prob. de que la móvil sea mejor |
|---|---|---|---|---|
| **5 %** | **12,7** | **10,3** | **[+0,3 ; +4,6]** | **99 %** |
| 10 % | 11,6 | 10,9 | [−0,9 ; +2,2] | 78 % |
| 20 % | 10,9 | 11,2 | [−0,9 ; +0,4] | 21 % |

Sensibilidad a la ventana y al margen de días (top 5 % diario): los resultados van de 11,1 a 13,8 según la combinación. Ventanas de 30–60 días con margen de 5–10 días dan 12,6–13,8.

### Lectura de los resultados

1. **La tasa móvil mejora el top 5 %: de ~10,5 a ~13 calibraciones cada 100 auditados**, contra 8,3 al azar (lift ≈ 1,55x). La mejora es estadísticamente sólida con presupuesto del 5 %, que es el que usa la planta.
2. **Por qué funciona:** no agrega información nueva. Usa la misma relación (código → calibración) pero **actualizada**: como las tasas de cada código cambian con el tiempo (drift), mirar solo los últimos 30–60 días refleja mejor el riesgo actual que un promedio fijo del pasado.
3. **No sube el techo general.** El AUC sigue en 0,56–0,57 y con presupuestos del 10–20 % la ventaja desaparece. La mejora está concentrada en los vehículos de mayor riesgo, que son justamente los que se auditan.
4. **Meter las columnas nuevas dentro de XGBoost empeora** (0,51). El modelo aprende relaciones del período de entrenamiento que no se repiten después. La columna usada directamente como puntaje funciona mejor que el modelo complejo.
5. **⚠️ La versión con trampa es la que "mejor" da (13,8), y es falsa.** Calcular la tasa por código con todos los datos incluye resultados del período de test, que en la práctica no se conocen al momento de decidir. Es un ejemplo de **leakage**: parece el mejor resultado y no funcionaría en la planta. La versión honesta (móvil con margen de 5 días) llega a 13,2, muy cerca, sin hacer trampa.

### Implicancia para la propuesta

**El puntaje de prioridad recomendado es la tasa de calibración de cada código de catálogo en los últimos 60 días**, actualizada diariamente y con 5 días de margen. Ventajas:

- Rinde igual o mejor que todos los modelos probados en la métrica que importa (top 5 % diario).
- Se adapta solo a los cambios del proceso.
- Es completamente explicable: "este vehículo tiene prioridad alta porque su versión/mercado se calibró un X % en los últimos dos meses".
- Se combina naturalmente con la política de operación de la sección 1 (80 % por ranking + 20 % al azar), que es la que alimenta las tasas móviles con resultados nuevos.
