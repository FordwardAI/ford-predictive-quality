# EDA — Dataset QLS Inspección Adicional (Desafío 3: Data-Driven Predictive Quality)

**Estado:** análisis exploratorio de mateoserebrinsky, versionado como evidencia de [¿Qué registros y variables son admisibles para el experimento?](https://github.com/FordwardAI/ford-predictive-quality/issues/6). No es una decisión acordada. Las decisiones vigentes están en la [resolución del ticket](https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804466671). Los experimentos posteriores están en [experimentos de modelado](experimentos-modelado.md).

## Alcance y límites

- **Fuente:** el CSV vigente (ver [datos locales](../docs/datos-locales.md)), según declaró el autor el 23/09. El hash no se recalculó sobre el archivo usado. Los agregados coinciden con la [auditoría del CSV](audit-csv.json): 195.808 filas, 41 columnas, 59.681 VIN, 6.079 VIN CALIBRADA, 4.910 VIN con primer evento después de DIA_260, y 14.601 filas con inspección desde DIA_261, de las cuales 50 son CALIBRADA y pertenecen a 3 VIN.
- **Unidad de análisis:** VIN. «Día» es el identificador DIA_n del CSV, no una fecha de calendario.
- **Observaciones:** las tablas y los conteos.
- **Hipótesis:** las interpretaciones. Algunas son causales: por ejemplo, que los VIN posteriores a DIA_260 «no fueron auditados», o que la selección aleatoria vuelve insesgadas las etiquetas.
- **Atribuciones a Ford:** son la versión del equipo sobre la reunión del 22/09. La fuente registrada es el [ticket de consultas a Ford](https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330).
- **Reproducibilidad:** el código del análisis todavía no está versionado.
- **Omisiones:** se quitó del texto original un ejemplo con el identificador y el historial de un VIN individual, porque el repo no admite extractos por VIN.
- **Límite de la base:** es ficticia y no prueba impacto en planta.

## Diferencias con la resolución de admisibilidad

- **Causa del corte en DIA_260.** El EDA concluye que esos VIN son «unidades sin auditar». La resolución los excluye de la población principal, con una sensibilidad aparte, pero no les asigna causa. Además, Ford indicó que la base reúne VIN que fueron a Auditoría Adicional, con OK = auditado sin calibración.
- **Historial de reparaciones.** El EDA lo considera usable porque es anterior a la Inspección Adicional. La resolución lo deja fuera del análisis principal: sin marca de Gate Release no se puede probar que estuviera disponible al momento de recomendar. Las dos coinciden en que no aporta señal.
- **Día de cada VIN.** El EDA usa el día de primera inspección («día de entrada»), tanto para filtrar la población como para ordenar. La resolución usa la primera fecha para filtrar la población, pero define el **Día del VIN** como la última fecha de evento, como aproximación del día de auditoría.
- **Muestreo y etiquetas (secciones 8 y 9).** El EDA dice que la selección aleatoria vuelve insesgadas las etiquetas, pero en la sección 8 deja abierta la pregunta sobre el muestreo del 5 %. La cobertura de la base sigue en revisión en el mapa.

---

Análisis exploratorio sobre `Dataset QLS_InspecciónAdicional` (195.808 filas × 41 columnas, 59.681 VINs, 283 días de producción). Dataset declarado como **ficticio** por Ford en la ficha técnica. El significado de cada columna está en el documento **Diccionario de datos - Dataset QLS**.

**Confirmado por el equipo (22/09):** este CSV es el único dataset del desafío. No hay un archivo aparte de parámetros de proceso.

## 1. Estructura y target

- El CSV trae **dos filas de encabezado**: la fila 0 del cuerpo contiene los nombres cortos reales (`VIN`, `CP`, `Componente Inspección`, etc.). Hay que renombrar columnas con esa fila y descartarla.
- Datos anonimizados: `VIN_n`, `DIA_n` (1–284), `USER_n` (130 inspectores), `REPA_n` (182 reparadores).
- **Target = `Auditoría Adicional`** (OK / CALIBRADA). Coincide exactamente con lo que pide la ficha técnica: predecir qué unidades requerirán calibración fina en la Inspección Adicional.

### Hallazgo crítico: el target es una propiedad del VEHÍCULO, no del defecto

De los 59.681 VINs, **los 59.681 tienen target constante** en todas sus filas. Cero VINs con filas mixtas OK/CALIBRADA.

→ El problema es de **clasificación a nivel VIN**, no a nivel fila de defecto. Hay que agregar las ~3,3 filas promedio por vehículo en un vector de features por VIN.

- Tasa de positivos: **10,19 % de los VINs** (6.079 de 59.681); 10,63 % a nivel fila.

### Leakage identificado

- `Componente Auditoría Adicional` es no-nulo **exactamente** cuando el target es CALIBRADA (20.817 / 20.817). Es parte del resultado de la auditoría → **descartar**.
- Las columnas de reparación (`Código de Reparador`, `Rep Parte Causal`, `Fecha/Hora Reparación`, etc.) son posteriores al defecto pero **anteriores** a la Inspección Adicional, así que son usables — con la salvedad de que empíricamente no aportan señal (ver sección 4).

### Ventana temporal del problema

Ford confirmó que **entre el Gate Release y la Inspección Adicional pasan entre 0 y 5 días**. Ese es el margen operativo con el que trabajaría el modelo: la predicción se genera con todo lo registrado hasta el Gate Release y sirve para priorizar la auditoría de los días siguientes.

## 2. Censura temporal: las unidades que entran desde el día 261 no fueron auditadas

> **Confirmado por Ford:** están analizando una posible medida de corte tomada en la planta alrededor del día 260. Coincide exactamente con lo detectado en los datos.

> **Precisión importante sobre el corte:** el análisis se hace por **día de primera inspección del VIN** (la fecha en que la unidad entra al circuito), no por la fecha de cada fila individual. Un vehículo que entró el día 255 y arrastró reparaciones hasta el día 271 cuenta como día 255. Confundir ambos criterios lleva a conclusiones erróneas.

Agrupando VINs por su día de entrada, la tasa de CALIBRADA cae de 14,18 % (días 0–29) a **0,00 % para toda unidad que entra el día 261 o después**.

| Bloque (día de entrada) | Tasa CALIBRADA | VINs |
|---|---|---|
| 0–29 | 14,18 % | 5.979 |
| 30–59 | 13,41 % | 6.214 |
| 120–149 | 10,07 % | 7.074 |
| 210–239 | 8,31 % | 5.884 |
| 240–269 | 5,38 % | 6.300 |
| 270+ | **0,00 %** | 3.334 |

**Total: 4.910 VINs con entrada ≥ día 261, ninguno auditado.**

### Verificación del corte (chequeo manual del equipo)

Un chequeo a mano encontró filas con `Fecha Inspección = DIA_263` marcadas CALIBRADA. Verificado en detalle:

- Filas con fecha de inspección ≥ 261: **14.601**
- De esas, CALIBRADA: **50**
- Esas 50 filas pertenecen a **solo 3 VINs**
- Los 3 entraron **antes** del corte: días 254, 255 y 258

Ejemplo: una de esas unidades entró antes del corte con un problema eléctrico y acumuló reparaciones hasta el día 271. Es una unidad pre-corte, correctamente etiquetada. (Se omite su identificador y el detalle de su historial.)

La auditoría registró esas 50 calibraciones tardías de unidades ya en proceso. Lo que se cortó es la auditoría de las unidades **nuevas**.

### Justificación estadística

Tasa en la ventana previa (días 230–260): **7,35 %** sobre 6.569 VINs.

Si esa tasa se mantuviera, la probabilidad de observar cero positivos en 4.910 unidades es:

P = (1 − 0,0735)^4910 = **1,4 × 10⁻¹⁶³**

Usando incluso la tasa diaria más baja jamás observada antes del corte (3,44 %, día 260): P = 2,9 × 10⁻⁷⁵.

Controles adicionales:

- **El volumen de producción no cae**: se mantiene en ~250–290 VINs por día durante todo el período.
- **El corte es un acantilado, no una pendiente**: día 258 → 29 calibradas, día 259 → 13, día 260 → 9, día 261 → 0, y se queda en 0 durante 24 días consecutivos sin una sola recuperación.

**Conclusión:** esos 4.910 VINs no son negativos, son unidades sin auditar. Incluirlos como clase 0 envenena el entrenamiento. Se excluyen del entrenamiento → quedan **54.771 VINs etiquetados, tasa 11,10 %**. Esos 4.910 VINs son, a su vez, el conjunto natural sobre el cual aplicar el modelo (ver sección 9).

Queda además una tendencia decreciente gradual antes del corte (14 % → 8 %), que puede ser mejora real de proceso o parte de cómo se generaron los datos. Pregunta abierta para los mentores.

## 3. Señales por dimensión (nivel VIN, tasa base 10,19 %)

**Código de Catálogo del vehículo — la señal más fuerte.** Ford confirmó que el código representa **la versión y los features del vehículo, combinados con el mercado de destino** (ej.: Limited Brasil, XLS Chile), y que **están trabajando en una subcategorización de estos códigos para lograr mayor nivel de detalle**. 98 códigos, χ² = 674,2 (p ≈ 3e-87). El código tiene estructura `A + [letra] + [D/B/F/…] + [5/6/A]`:

| Posición 3 | Tasa | VINs | | Posición 4 | Tasa | VINs |
|---|---|---|---|---|---|---|
| F | **20,50 %** | 1.615 | | 5 | **13,65 %** | 20.373 |
| B | 11,74 % | 20.394 | | A | 9,99 % | 15.471 |
| D | 10,42 % | 26.220 | | 6 | 9,27 % | 18.926 |
| J | 5,59 % | 143 | | | | |

Descomponer el código en sus caracteres es feature engineering que vale la pena: la posición 3 sola separa un grupo con el doble de la tasa base. **La subcategorización en la que Ford ya está trabajando apunta exactamente a la variable que concentra toda la señal predictiva** (ver secciones 4 y 9).

**Resto de las dimensiones — señal débil (lift 1,2–1,8x) y concentrada en categorías de bajo volumen:**

- Zona: rango 9,80 % (P-PINTURA) a 13,25 % (AUDITORIA FCPA) — prácticamente plano.
- Componente: LUNETA 17,30 % (318 VINs) hasta GRILLE SHUTTER 5,29 % (227 VINs).
- Incidencia: EXCESO SELLADOR 13,94 % hasta PINT MANCHADA 6,89 %.
- Área de la falla (VRT, 12 valores): lift entre 0,89x y 1,20x. El más alto es RET (13,3 %).
- Grupo funcional (VFG, 40 con volumen suficiente): lift entre 0,64x y 1,59x.
- Código de falla (CCC, 101 con volumen suficiente): lift entre 0,64x y 1,83x.
- Carga de defectos: 10,84 % (1 defecto) → 12,85 % (11+ defectos). Monotónica pero muy suave.
- Hora de inspección y tiempo de reparación: **sin señal** (10,0–11,4 % en todos los deciles).

## 4. Verificación: ¿cuánta señal es aprendible?

Baseline XGBoost a nivel VIN, 114 features (agregados + conteos pivoteados de zona/componente/incidencia/CP + código de catálogo), split estratificado 75/25:

- **ROC-AUC = 0,571** | PR-AUC = 0,139 (base 0,111) | lift en top 20 % = **1,36x**
- Control con target permutado: AUC = 0,488 → **la señal es real, pero chica**.

### Ablación — de dónde viene la señal

| Features | ROC-AUC | Lift @20% |
|---|---|---|
| Solo código de catálogo | **0,578** | **1,48x** |
| Solo día (drift temporal) | 0,560 | 1,26x |
| Todas | 0,571 | 1,36x |
| Sin día | 0,555 | 1,42x |
| **Solo conteos de defectos** | **0,499** | 1,00x |
| **Solo agregados numéricos** | **0,494** | 1,00x |

**El historial de defectos y reparaciones — que es el 95 % del dataset — tiene poder predictivo nulo sobre el resultado de la auditoría.** Toda la señal real está en el código de catálogo del vehículo. El día aporta AUC pero es drift, no mecanismo.

### Validación out-of-time (train días < 200, test días 200–260)

| Features | ROC-AUC | Lift @20% |
|---|---|---|
| Solo catálogo | **0,561** | **1,44x** |
| Sin día | 0,533 | 1,19x |
| Todas | 0,516 | 1,09x |

Incluir `dia` **empeora** el desempeño fuera de ventana temporal (0,516 vs 0,561): el modelo aprende la tendencia decreciente y la extrapola mal. Solo el catálogo se sostiene.

### Curva de aprendizaje: ¿faltan datos?

Mismo test out-of-time, entrenando con fracciones crecientes del train:

| Train | Solo catálogo | Solo historial de defectos |
|---|---|---|
| 10 % (4.171 VINs) | 0,565 | 0,484 |
| 25 % | 0,558 | 0,491 |
| 50 % | 0,561 | 0,501 |
| 100 % (41.709 VINs) | 0,562 | 0,513 |

La curva es plana: con el 10 % de los datos el modelo ya aprendió todo lo que hay. **El límite no es el volumen de datos sino la información que contienen.**

### Desempeño operativo (out-of-time, modelo solo catálogo)

Test: 13.062 VINs, tasa base 8,27 %.

| % inspeccionado | Precisión | Recall | Lift |
|---|---|---|---|
| **5 % (equivalente al muestreo actual)** | **12,6 %** | 7,6 % | **1,52x** |
| 10 % | 12,6 % | 15,2 % | 1,52x |
| 20 % | 11,9 % | 28,9 % | 1,44x |
| 50 % | 9,4 % | 56,9 % | 1,14x |

Traducción operativa: inspeccionando las mismas 653 unidades del 5 % actual, el modelo encuentra **82 unidades que requieren calibración en lugar de 54**.

**La precisión está acotada por tasa base × lift.** Con base 8–11 % y lift 1,5x, el techo es ~13–17 %. Ningún cambio de algoritmo mueve eso: es limitación de las features, no del modelo.

## 5. Conclusiones accionables

1. **Modelar a nivel VIN**, agregando las filas de defectos por vehículo. El target es constante dentro del VIN.
2. **Excluir los VINs cuya primera inspección es ≥ día 261** del entrenamiento (no auditados). Cortar por día de entrada del VIN, no por fecha de fila.
3. **Excluir `Componente Auditoría Adicional`** (leakage puro).
4. **Descomponer el `Código de Catálogo`** en sus caracteres: es la única familia de features con señal sostenida.
5. **No usar `dia` como feature** en el modelo final: mejora la validación aleatoria pero degrada la out-of-time.
6. **Validar siempre out-of-time**, no con split aleatorio: el dataset tiene drift fuerte y un split aleatorio infla las métricas.
7. **Techo de desempeño con este dataset: AUC ≈ 0,58 / precisión ≈ 12,6 % / lift ≈ 1,5x.** Como no hay datos adicionales, este es el techo real del desafío con la información disponible.

## 6. Respuestas de los mentores de Ford (22–23/09/2026)

1. **Datos:** los parámetros del desafío corresponden al dataset del Drive → **confirmado: es este mismo CSV.** No hay archivo de parámetros de proceso aparte.
2. **Pista para resolver el desafío:** "La clave está en detectar qué componente presentó la falla y a qué área está asociado dicho componente." Los códigos estandarizan esa información: **VRT** (Variable Reduction Team, equipo funcional) → **VFG** (Vehicle Function Group, subconjunto) → **CCC** (Customer Concern Code, falla única). Son confidenciales.
3. **Código de Catálogo** = versión + features del vehículo + mercado de destino. **Ford está trabajando en una subcategorización de estos códigos para mayor nivel de detalle.**
4. **PUL** = equipo de trabajo que realiza la reparación.
5. **Corte del día 260:** Ford está analizando una posible medida de corte tomada en la planta alrededor de ese día.
6. **Ventana Gate Release → Inspección Adicional:** entre 0 y 5 días.
7. **Selección de unidades para la Inspección Adicional: completamente aleatoria, sin criterio específico.**
8. **Templates de presentaciones anteriores:** disponibles en el Drive compartido.

## 7. Verificación de la pista de los mentores

Se probó directamente la hipótesis "componente + área asociada" como predictor del resultado de la auditoría.

**Jerarquía confirmada en los datos:** 12 VRT → 50 VFG → 227 CCC. Cada CCC pertenece a un único VFG y cada VFG a un único VRT (pureza 100 %).

**Modelos a nivel VIN con esa información** (validación out-of-time, train días < 200, test 200–260). Cada vehículo se representa con la presencia de cada componente, área y combinación en su historial:

| Features | N° features | AUC reg. logística | AUC XGBoost |
|---|---|---|---|
| Componente | 384 | 0,504 | 0,507 |
| Área (VRT + VFG + CCC) | 221 | 0,499 | 0,499 |
| Combinaciones componente × área (VRT, zona de detección, equipo de reparación) | 1.614 | 0,510 | 0,508 |
| Todo lo anterior | 2.219 | 0,510 | 0,510 |
| Todo + código de catálogo | — | — | 0,533 |

**Resultado:** ni el componente, ni su área, ni sus combinaciones distinguen a los vehículos que terminan calibrados (AUC ≈ 0,51, prácticamente azar). Se usaron dos algoritmos distintos para descartar que fuera un problema del modelo.

**Búsqueda de combinaciones de riesgo.** Se evaluaron todos los pares entre 12 columnas (componente, zona, CP, grupo, PUL, VRT, VFG, CCC, incidencia, catálogo, parte reparada). La combinación más fuerte alcanza 27 % de calibración (2,5x la base) con solo 147 VINs, y **las 7 más fuertes involucran al mismo código de catálogo (AND5)**. No aparece ninguna regla oculta del tipo "falla en X detectada en área Y ⇒ calibración".

**¿Lo que se calibra está relacionado con lo que falló?** El componente calibrado en la auditoría usa códigos con formato VFG. Para cada vehículo calibrado se comparó el área (VRT) del componente calibrado con las áreas de sus fallas en producción:

- Coinciden en el **20,0 %** de los casos.
- Con asignación al azar coincidirían en el **21,2 %**.

**Lo que se calibra no tiene relación con lo que falló durante la producción.** En cambio, el componente calibrado sí depende fuertemente del código de catálogo (χ², p ≈ 5 × 10⁻¹⁹³): cada versión/mercado tiende a calibrar componentes específicos.

**Conclusión:** con el dataset del desafío, la pista de los mentores no produce señal predictiva sobre *si* un vehículo se calibra. Puede que se refiera a otra forma de plantear el problema (por ejemplo, predecir **qué** componente o área se va a calibrar). Conviene aclararlo con ellos.

## 8. Preguntas abiertas para los mentores

Resueltas:
- ~~¿El dataset del Drive es el mismo CSV?~~ → Sí.
- ~~¿Las unidades desde el día 261 son no auditadas?~~ → Sí; Ford está analizando una medida de corte tomada en planta cerca del día 260.
- ~~¿Qué codifica el Código de Catálogo?~~ → Versión + features + mercado. Ford está subcategorizándolo.

Pendientes:
1. **¿Qué relación esperan entre el componente con falla y el resultado de la auditoría?** En los datos, el área de lo que se calibra no coincide con el área de lo que falló más de lo que coincidiría por azar.
2. **¿El objetivo es predecir si una unidad se calibra, o también qué componente/área se va a calibrar?**
3. **Muestreo vs. datos.** La ficha técnica indica que la Inspección Adicional se hace por muestreo al 5 % y Ford confirma que la selección es completamente aleatoria. Sin embargo, todas las unidades anteriores al día 261 tienen resultado registrado y el 11 % figura como CALIBRADA. ¿En esta base ficticia se auditaron todas las unidades, o "OK" incluye unidades que nunca pasaron por la auditoría?
4. **¿Cuándo estará disponible la subcategorización del Código de Catálogo?** Es la variable que concentra la señal del modelo.
5. **¿La caída de 14 % a 8 % entre los días 0 y 260** corresponde a una mejora de proceso real o a la forma en que se generaron los datos?

## 9. Implicancias para la solución

**La selección aleatoria confirma el valor del proyecto.** Ford aclara que hoy los vehículos que pasan por la Inspección Adicional se eligen **completamente al azar, sin ningún criterio**. Eso significa que el modelo no compite contra un sistema de priorización existente: compite contra el azar. La línea base a superar es exactamente la tasa base (8–11 %), y cualquier mejora sostenida es ganancia neta.

**La selección aleatoria también valida las etiquetas.** Como la elección no depende del estado del vehículo, no hay sesgo de selección: la tasa de calibración observada en las unidades auditadas es un estimador insesgado de la propensión real de toda la flota. El modelo aprende sobre una muestra representativa.

**El camino de mejora es la subcategorización del catálogo, no más datos.** Nuestro análisis, hecho antes de conocer este dato, encontró que el código de catálogo es la única variable con poder predictivo sostenido, y que el historial de fallas no aporta nada. Ford ya está trabajando en subcategorizar esos códigos para tener más detalle. Esa línea de trabajo y nuestro hallazgo apuntan al mismo lugar: **un catálogo más granular (versión, features, mercado por separado) debería elevar el techo del modelo de forma directa**, mientras que sumar más registros de fallas no lo movería.

**El caso de uso real ya está en los datos.** Los 4.910 VINs posteriores al corte son exactamente las unidades sobre las que la planta tendría que decidir a cuáles auditar. El modelo entrenado con los días 1–260 genera el ranking de prioridad para esas unidades: es la demostración natural para el dashboard que pide la ficha técnica.

**Techo actual:** ≈ 13 calibraciones encontradas cada 100 inspecciones, contra 8 al azar. Es una mejora del 50 % sin sumar inspectores, y es honesta de presentar.

## 10. Aprendizaje no supervisado: ¿encuentra patrones que el supervisado no vio?

Se probó si técnicas no supervisadas (que buscan estructura sin mirar el resultado de la auditoría) encuentran grupos ocultos. Cada vehículo se representó por su perfil completo de fallas: componentes, VRT, VFG, CCC, zona, incidencia y equipo de reparación (TF-IDF reducido a 30 dimensiones con SVD).

**1. Clustering de vehículos por perfil de fallas (K-Means)**

| N° de grupos | Tasa de calibración del grupo más bajo | Del grupo más alto |
|---|---|---|
| 5 | 10,6 % | 11,5 % |
| 10 | 9,2 % | 12,7 % |
| 20 | 9,1 % | 13,2 % |

Los grupos existen (hay vehículos con perfiles de fallas distintos), pero **todos se calibran casi igual**, alrededor del 11 % promedio. Para comparar: el catálogo solo ya separa un grupo con 20,5 %.

**2. Detección de anomalías (Isolation Forest).** Hipótesis: los vehículos con historial de fallas "raro" se calibran más. Resultado: la tasa es 10–11,5 % en todos los deciles de rareza, y el AUC de la rareza como predictor es **0,494 (azar)**.

**3. Usar lo encontrado como features adicionales (out-of-time)**

| Modelo | AUC |
|---|---|
| Solo catálogo | **0,563** |
| Catálogo + cluster | 0,529 |
| Catálogo + score de anomalía | 0,534 |
| Catálogo + 30 componentes latentes | 0,534 |

Agregar lo que encontró el no supervisado **empeora** el modelo: son variables sin relación con la calibración, y el modelo termina aprendiendo ruido.

**4. Agrupar los códigos de catálogo por su perfil de fallas.** En lugar de agrupar vehículos, se agruparon los 98 códigos según qué fallas tienen sus vehículos:

| Grupo de códigos | Códigos | VINs | Tasa de calibración |
|---|---|---|---|
| 3 | 24 | 19.489 | **13,7 %** |
| 0 | 33 | 2.524 | 11,2 % |
| 1 | 23 | 32.669 | 9,6 % |
| 2, 4, 5 | 18 | 89 | 0–7 % (volumen mínimo) |

Los códigos que "fallan parecido" también se calibran parecido. No supera al catálogo completo (es una versión agrupada de la misma información), pero **es un aporte concreto a la subcategorización en la que trabaja Ford**: una forma basada en datos de agrupar versiones/mercados por comportamiento de calidad.

**Conclusión:** el aprendizaje no supervisado no puede crear información que los datos no tienen. Encuentra estructura en el historial de fallas, pero esa estructura no está relacionada con la calibración. Su uso valioso en este proyecto es **descriptivo** (perfiles de vehículos y agrupación de catálogos para el dashboard y la subcategorización), no para subir la precisión.
