# Sensibilidad de ML a datos de proceso hipotéticos

Ampliación explícitamente autorizada por Facundo tras la [evaluación documental](datos-proceso.md), para ilustrar qué podría pasar si se consiguen mediciones de proceso. Seguimiento [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33); publicación en [PR #50](https://github.com/FordwardAI/ford-predictive-quality/pull/50).

## Qué pregunta responde

Esta primera corrida usa tres estimadores genéricos. La [ampliación con los candidatos
priorizados](sensibilidad-candidatos.md) reproduce los controles originales de #48 y evalúa
sus extensiones concretas con los mismos escenarios. No mezclar las dos configuraciones
de RF como si fueran un único control.

**Cuánto cambia la precisión en el cupo bajo niveles impuestos de señal, ruido y cobertura.** No estima la señal que tendrán datos reales de Ford, no descubre causas de calibración ni demuestra beneficio de comprar sensores. Las etiquetas de la base ficticia se usan deliberadamente para generar las columnas de cada escenario, también las del período de evaluación. Es un análisis de sensibilidad condicionado a supuestos, no validación de variables observadas.

Esta autorización amplía el alcance anterior, que era solo documental. Se conservan el predictor operativo, el preregistro y la prueba final; no se adopta un modelo nuevo.

## Fuente, población y reproducción

- CSV vigente: SHA-256 `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`.
- Catálogo: SHA-256 `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`.
- Unidad: VIN entre auditados con actividad QLS de la base ficticia; misma población del estudio integrado, sin nuevos filtros de nulos o exclusiones. Día <195 únicamente; no se desbloquea la tabla ni se lee la prueba final.
- Entrenamiento por bloque con Día ≤ inicio−6. Bloques 100–118, 119–137, 138–156 y 157–174; comprobación 175–194. Son períodos ya explorados, no evaluación independiente.
- Selección acumulada: 15.279 VIN, 67 días, 1.702 CALIBRADA, 740 inspecciones. Comprobación: 4.626 VIN, 19 días, 408 CALIBRADA, 225 inspecciones. Cupo por día `max(1, N_d // 20)`, sin aumentarlo para sensores.
- Semillas 1–5 para generación y modelos; desempate 20261002; bootstrap por días 20261003, 2.000 remuestreos. Las semillas comparten VIN y etiquetas; no son muestras nuevas.
- Código: [sensibilidad_proceso.py](../solucion/experimentos/sensibilidad_proceso.py); entorno existente en `requirements.txt`, sin dependencias nuevas. Solo se guarda [JSON agregado](../solucion/experimentos/resultados/sensibilidad_proceso.json), sin columnas por VIN ni predicciones individuales.

```sh
.venv/bin/python -m solucion.experimentos.sensibilidad_proceso \
  --csv '<CSV vigente>' --catalogo '<catálogo vigente>' \
  --salida solucion/experimentos/resultados/sensibilidad_proceso.json
.venv/bin/python -m solucion.pruebas
python3 research/test_audit_dataset.py
git diff --check
```

## Hipótesis del generador

Se construyen cuatro latentes independientes por VIN, una para cada dimensión propuesta: físicas, línea, componentes y ambiente. Para etiqueta binaria `y`, cada latente tiene distribución normal con desvío estándar 1 y media `d·y/2`. Así, `d` es la separación euclídea impuesta entre las medias de las cuatro latentes; no es torque, grados, milímetros ni un efecto real medido.

Se observan 13 proxies: torque, ángulo, geometría, soldadura y adhesivo; permanencia, interrupciones, secuencia y turno; desviación de lote y uso de herramental; temperatura y humedad. Cada proxy es su latente de grupo más ruido normal independiente de desvío estándar `σ`. Sus nombres ilustran dominios; no son curvas de apriete, mediciones físicas con nominal/tolerancia ni códigos de lote o turnos reales. Compartir una latente genera correlación entre proxies de la misma dimensión, pero no modela exposición compartida entre VIN de un lote, estación, turno o nave.

La cobertura se impone por VIN, independiente de etiqueta, catálogo y tiempo (MCAR). Cuando falta la captura, todos los proxies se ponen en cero y se agrega un indicador de ausencia. No se excluyen esos VIN. Cero es aquí el centro de la escala inventada, no una regla de imputación para telemetría física real. Las mismas semillas mantienen los sorteos comparables entre escenarios.

| Escenario | Separación d | Ruido σ por proxy | Cobertura supuesta | Supuesto temporal |
| --- | ---: | ---: | ---: | --- |
| Sin señal | 0 | 0,5 | 100 % | Estable; columnas independientes de y |
| Débil | 0,5 | 0,5 | 100 % | Estable |
| Moderada | 1 | 0,5 | 100 % | Estable |
| Fuerte | 2 | 0,5 | 100 % | Estable |
| Fuerte degradada | 2 | 2 | 50 % | Estable; ruido y cobertura empeoran juntos |
| Fuerte invertida | 2 | 0,5 | 100 % | En Día ≥175, media de positivos pasa de +d/2 a −d/2 |

La degradación conjunta ilustra un paquete de menor calidad; no aísla cuánto corresponde a ruido y cuánto a cobertura. La inversión es un estrés adversarial del generador, no una predicción sobre cambios de Ford. No se supone que los 13 campos tengan señal real ni que los cuatro mecanismos contribuyan igual en planta.

## Comparadores y métricas

Se reutilizan tres estimadores de `columnas.py`, con parámetros congelados y sin búsqueda de hiperparámetros:

- Logística: escalado aprendido solo en entrenamiento, C = 0,1 y hasta 2.000 iteraciones.
- RF: 200 árboles, mínimo de hoja 50 y `max_features=sqrt`; 4 hilos.
- LightGBM: 150 árboles, tasa 0,05, 8 hojas, mínimo de hoja 50, fracción de columnas 0,5 y regularización 10.

Cada uno compara catálogo/atributos solamente con exactamente esa base más los proxies. Tasa fija con entrenamiento hasta inicio−6 es el control operativo; azar esperado usa el mismo cupo diario. Estos controles son del experimento, no se copian cifras de otra corrida de #48: representación/parámetros pueden producir números diferentes.

Mejora relativa = `precisión_con_proxies / precisión_catálogo_del_mismo_modelo − 1`. Se informa también frente a tasa fija y en puntos porcentuales. Las medias sobre cinco semillas pueden dar aciertos fraccionarios: no representan media unidad en una selección individual.

Los rangos del 95 % remuestrean los mismos días en la diferencia pareada entre los promedios de cinco semillas. Son descriptivos y condicionados al generador, los VIN, las etiquetas y esas realizaciones. No incluyen incertidumbre sobre la señal real ni ajuste por múltiples modelos/escenarios; excluir cero permite hablar de diferencia dentro de la simulación, no de mejora significativa acreditada en planta.

## Resultados

**En esta simulación, señal adicional moderada mejora los tres modelos; columnas sin señal no muestran una mejora clara.** Es consecuencia del generador supuesto, no evidencia de que los campos reales posean esa señal.

### Día 100–174: 740 inspecciones

Por celda: aciertos medios / cupo (precisión media); cinco semillas, mismos VIN.

| Escenario | Logística | RF | LightGBM |
| --- | ---: | ---: | ---: |
| Catálogo solamente | 112,0/740 (15,14 %) | 129,0/740 (17,43 %) | 134,0/740 (18,11 %) |
| Sin señal | 121,2/740 (16,38 %) | 113,6/740 (15,35 %) | 116,8/740 (15,78 %) |
| Débil | 172,4/740 (23,30 %) | 168,0/740 (22,70 %) | 172,4/740 (23,30 %) |
| Moderada | 295,0/740 (39,86 %) | 298,6/740 (40,35 %) | 301,6/740 (40,76 %) |
| Fuerte | 565,6/740 (76,43 %) | 565,0/740 (76,35 %) | 575,0/740 (77,70 %) |
| Fuerte degradada | 317,2/740 (42,86 %) | 325,6/740 (44,00 %) | 322,2/740 (43,54 %) |
| Fuerte invertida | 565,6/740 (76,43 %) | 565,0/740 (76,35 %) | 575,0/740 (77,70 %) |

### Día 175–194: 225 inspecciones

Por celda: aciertos medios / cupo (precisión media); cinco semillas, mismos VIN.

| Escenario | Logística | RF | LightGBM |
| --- | ---: | ---: | ---: |
| Catálogo solamente | 46,0/225 (20,44 %) | 43,4/225 (19,29 %) | 43,0/225 (19,11 %) |
| Sin señal | 44,0/225 (19,56 %) | 39,8/225 (17,69 %) | 42,6/225 (18,93 %) |
| Débil | 54,6/225 (24,27 %) | 45,2/225 (20,09 %) | 52,0/225 (23,11 %) |
| Moderada | 82,6/225 (36,71 %) | 77,6/225 (34,49 %) | 80,4/225 (35,73 %) |
| Fuerte | 160,0/225 (71,11 %) | 153,2/225 (68,09 %) | 155,8/225 (69,24 %) |
| Fuerte degradada | 88,2/225 (39,20 %) | 83,6/225 (37,16 %) | 84,2/225 (37,42 %) |
| Fuerte invertida | 0,4/225 (0,18 %) | 0,6/225 (0,27 %) | 0,4/225 (0,18 %) |

### Mejora relativa en el período posterior

Comparación con catálogo del **mismo modelo**, no contra azar.

| Escenario | Logística | RF | LightGBM |
| --- | ---: | ---: | ---: |
| Catálogo solamente | +0,0 % | +0,0 % | +0,0 % |
| Sin señal | -4,3 % | -8,3 % | -0,9 % |
| Débil | +18,7 % | +4,1 % | +20,9 % |
| Moderada | +79,6 % | +78,8 % | +87,0 % |
| Fuerte | +247,8 % | +253,0 % | +262,3 % |
| Fuerte degradada | +91,7 % | +92,6 % | +95,8 % |
| Fuerte invertida | -99,1 % | -98,6 % | -99,1 % |

En comprobación, tasa fija obtuvo 46/225 = 20,44 %, y azar esperado ≈19,77/225 = 8,78 %. Logística catálogo empata con tasa fija; RF catálogo promedia 43,4/225 y LightGBM 43/225. Las cifras RF de #48 eran de otro ajuste: no se mezclan con estos controles.

Con señal moderada, las diferencias pareadas del 95 % contra catálogo son: logística +12,57 a +20,18 puntos porcentuales; RF +9,80 a +20,55; LightGBM +11,46 a +21,49. Excluyen cero **dentro del escenario impuesto**. Para logística, 20,44 % → 36,71 % significa +16,27 puntos porcentuales y +79,6 % relativo; no significa 79,6 puntos ni 79,6 % de recupero.

Con señal débil, logística mejora +18,7 % relativo (rango de diferencia +1,02 a +6,73 puntos); RF +4,1 % con rango que incluye cero. El rango de LightGBM alcanza cero. No hay un beneficio concluyente común a todos los modelos en ese escenario. Con señal nula, los tres rangos incluyen cero y los promedios no mejoran.

El escenario fuerte conserva una ganancia bajo la degradación de cobertura/ruido ensayada, pero no permite concluir que tolerará cualquier patrón de faltantes. Al invertir la relación en comprobación, los tres modelos encuentran en promedio menos de una calibrada de las 225 elegidas: fallan a pesar de tener una señal inicial fuerte.

**No se elige el mejor modelo para planta con esta tabla.** El generador gaussiano aditivo favorece una frontera lineal y las columnas reciben señal por construcción. La señal fuerte es una ilustración de sensibilidad, no una expectativa ni un techo físico acreditado. No hay conversión validada de d = 1 a un desvío de torque, temperatura o tolerancia real.

### Texto utilizable en la propuesta

> Simulamos mediciones normalizadas con niveles supuestos de señal adicional. En un escenario estable de señal moderada, la precisión en el cupo aumentó aproximadamente 79–87 % frente al mismo modelo con catálogo, sobre el tramo posterior de la base ficticia. Sin señal no mejoró; una inversión temporal destruyó la ganancia. Estas cifras no estiman el efecto real de integrar telemetría: justifican un piloto para medir si la señal existe, llega a tiempo y se mantiene.

La propuesta concreta es conseguir primero una exportación trazable de una operación relevante, con nominal/tolerancia y tiempos reales. Comparar catálogo solo frente a catálogo + mediciones, conservando tasa fija como control y los mismos VIN/cupos. Elegir modelo y adquisición requiere datos observados nuevos y acuerdo de Ford.

### Verificación

Suite sintética del proyecto PASS; prueba específica de señal nula, desplazamiento impuesto, inversión, faltantes y límite Día <195 PASS; integración sintética de extremo a extremo conserva población/cupo y no publica filas. Regresión de auditoría PASS. La corrida completa terminó sus cinco bloques sin errores. El JSON conserva cada semilla, denominadores, cobertura y fuente/hash; se revisaron enlaces, consistencia aritmética y privacidad antes de publicación.

Código del generador en `7619979`; el registro de ejecución añade `+cambios` por la documentación de `solucion/README.md` entonces sin commitear. El SHA-256 del script se registra en el JSON y coincide con el archivo de ese commit. No se cambió código durante la corrida.

## Decisiones y límites

La decisión acordada es ejecutar la sensibilidad hipotética y publicar sus supuestos y agregados. No se acuerda adquirir sensores, adoptar un modelo, cambiar el cupo ni afirmar causalidad. No se infiere qué dimensión vale más: las cuatro recibieron señal por construcción. La distribución normal y el mecanismo aditivo pueden favorecer logística; la clasificación de modelos no se traslada a mediciones físicas reales.

Que entrenar más modelos mejore un escenario inventado no prueba utilidad real. El siguiente experimento con datos observados debe evaluar captura, nominal/tolerancia, trazabilidad, latencia, cobertura de todas las auditorías y transporte temporal, con el piloto descrito en [datos de proceso](datos-proceso.md). Los resultados de los VIN no auditados siguen desconocidos; esta simulación no resuelve el sesgo de población de QLS.

Para la propuesta a Ford, usar lenguaje condicional: «Si las mediciones anteriores a selección tienen una señal adicional de esta magnitud y mantienen esa cobertura, la simulación muestra este resultado». No usar «con IoT mejoramos X %» ni prometer una cifra como efecto esperado de la compra o integración.
