# Búsqueda amplia de alternativas

Ampliación pedida por Facundo el 30/09/2026, en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33), después de la comparación CatBoost + móvil. Incluye combinaciones de más de dos, otras columnas y datos sintéticos. **Todo es exploratorio; no se relee la prueba final ni se cambia la solución operativa.**

## Fuente, población y reproducción

- CSV vigente: SHA-256 `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`.
- Catálogo: SHA-256 `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`.
- Unidad VIN, entre auditados con actividad QLS, base ficticia. Se conservan la población y los filtros acordados, sin deduplicación nueva. La auditoría completa reconcilia 195.808 eventos y 59.681 VIN. Resultados de selección/comprobación se dan con sus propios denominadores.
- Código: [`busqueda.py`](../solucion/busqueda.py), [`columnas.py`](../solucion/columnas.py). Entorno en `requirements.txt` y Python 3.13. Semilla primaria 1; desempate 20261002; bootstrap 20261003, 2.000 remuestreos.

```sh
.venv/bin/python -m solucion.run --csv '<CSV>' --catalogo '<catálogo>' --cache '<carpeta fuera del repo>' --salida '<carpeta fuera del repo>' --piezas busqueda
.venv/bin/python -m solucion.pruebas
python3 research/test_audit_dataset.py
git diff --check
```

La caché externa conserva predicciones y etiquetas anteriores a Día 195; no se publica. La tabla de prueba sigue enmascarada. Se publica únicamente evidencia agregada.

## Catálogo del experimento

1. Todas las familias existentes sobre catálogo: logística, Naive Bayes, Random Forest, XGBoost, LightGBM, CatBoost y MLP. Modos fijo y reentrenado, código solo y atributos cuando el modelo los admite. Promedios y stacking existentes; tasas fija, móvil, mercado, jerárquica y decaimiento con sus parámetros acordados.
2. Las siete implementaciones existentes de historial: logística, árboles, riesgo por combinaciones, MIL promedio/atención y LambdaMART, con y sin historial. Escenarios A (todos los eventos hasta el Día del VIN) y B (hasta Día−5). LambdaMART entrega puntuaciones: se convierten a rangos diarios para mezclarlas; no se interpretan como probabilidades.
3. Todas las 37 columnas restantes del CSV, además del catálogo y sus atributos: cada una por separado con logística, grupos de tiempos/inspección/reparación, exclusión de cada grupo, conjunto completo, y subconjuntos top 5/10/20 elegidos por coeficientes de entrenamiento. El conjunto y subconjuntos compiten con logística, CatBoost y LightGBM; RF y XGBoost también prueban conjunto completo y base.
4. Aumento en entrenamiento: pesos por clase, bootstrap de positivos hasta balancear e interpolación de resúmenes numéricos entre positivos del mismo código. Las categorías se copian del donante; los conteos no se interpolan. Cada política se prueba con y sin corrección por el cambio de proporción de clases, usando logística, CatBoost y LightGBM.
5. Objetivo conjunto de OK o componente calibrado, mediante clasificación multiclase con logística, CatBoost y LightGBM. Para priorizar se usa `1 − P(OK)`. El componente es una etiqueta de entrenamiento, nunca un predictor. Esto evalúa una formulación conjunta concreta, no todas las redes multitarea posibles.
6. Todas las parejas de individuales, con pesos 10/90 a 90/10. Un representante por familia, elegido en selección, forma el pool para **todos** sus subconjuntos de dos o más: promedio de probabilidades/puntuaciones, promedio de rangos y mediana. Pesos en pasos de 25 %, hasta cuatro integrantes; búsqueda continua mediante evolución diferencial con dos semillas y presupuestos prefijados.
7. Meta-modelos temporales: stacking logístico con cuatro regularizaciones, RF y LightGBM; pesos convexos por log-loss y Brier. Sus doce entradas se fijan por nombre antes de elegir ganadores, evitando elegir features del meta con resultados futuros.

## Temporalidad y columnas

- Selección en 100–118, 119–137, 138–156 y 157–174; comprobación en 175–194. Ambos tramos ya vistos. Un tramo de predicciones fuera de entrenamiento, 70–94, permite arrancar los meta-modelos sin ajustarlos con los resultados que van a evaluar.
- Modelos de catálogo: ajuste interno del protocolo existente; predicción solo con resultados de Día ≤t−5. Modelos de campos: configuración prefijada y entrenamiento hasta inicio del bloque−6; no se ajustan mirando la comprobación. Meta-modelos: únicamente predicciones anteriores al inicio del bloque−6 y sus etiquetas ya disponibles.
- VIN es agrupación, no predictor. Resultado y componente de Auditoría Adicional son objetivos, no predictores. El catálogo entra como base. Estas exclusiones no son un descarte por rendimiento: protegen el experimento de identificar unidades o revelar la respuesta.
- Campos categóricos: frecuencias, nulos, distintos y conteos. Vocabulario aprendido solo en entrenamiento: hasta 50 valores por campo, con al menos 30 VIN de entrenamiento. Valores raros/nuevos no reciben su propio indicador, pero se conservan conteos y nulos. No se eliminan VIN por nulos.
- Fechas: resúmenes relativos al Día del VIN; horas: media, mínimo, máximo y amplitud. El Día del VIN sigue siendo aproximado; no se convierte en fecha acreditada de auditoría. Los escenarios A/B no prueban disponibilidad real al seleccionar.
- Sintéticos: solo se aumenta entrenamiento. Los tramos evaluados contienen exclusivamente VIN originales. Las etiquetas sintéticas se heredan de sus donantes: **no son nueva evidencia de calibración**, ni prueban plausibilidad física. La corrección de proporciones es una hipótesis de cambio de prior, especialmente débil cuando se interpolan campos.

## Interpretación fijada antes de leer resultados

El ganador se elige por aciertos en selección. El tramo posterior no elige pesos, columnas ni integrantes. Se comparan también todos los individuales y los mejores de cada método/tamaño; un máximo aislado no acredita superioridad. Los rangos pareados descriptivos se acompañan de una banda bootstrap simultánea, centrada, sobre el catálogo de mezclas evaluadas; es **condicional al pool seleccionado** y no corrige todas las decisiones previas sobre datos ya explorados.

## Resultados

Pendientes de completar con `solucion/resultados/busqueda.json`.

## Límites de la cobertura

La búsqueda es finita, explícita y reproducible. No agota todas las arquitecturas, derivaciones de campos, hiperparámetros o pesos continuos. Los pares cubren todas las variantes individuales; los conjuntos mayores cubren representantes por familia, no todos los subconjuntos de todas las variantes. Las columnas se prueban individualmente, por grupos, juntas y con selección aprendida; no todos los 2^37 subconjuntos posibles. La interpolación es sobre resúmenes del VIN, no un simulador del proceso ni un generador validado de eventos. No se fabrican nuevas etiquetas de planta.

No se puede demostrar mejora independiente buscando más sobre los mismos períodos. Un candidato prometedor requerirá períodos nuevos o evaluación en planta; la prueba final ya vista no se reutiliza para esta búsqueda.
