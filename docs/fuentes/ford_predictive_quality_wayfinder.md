# Ford Innovation Challenge — Predictive Quality

## Destination

Diseñar una solución de **Predictive Quality** que permita reemplazar la selección aleatoria actual de unidades para Auditoría Adicional por una selección basada en datos.

La solución debe utilizar únicamente información disponible **antes de la Auditoría Adicional** para asignar a cada vehículo un nivel de riesgo de requerir una calibración y priorizar las unidades que más se beneficiarían de esa inspección.

El objetivo final no es solamente obtener un buen modelo de Machine Learning, sino diseñar una solución:

- aplicable a planta;
- explicable;
- accionable;
- capaz de demostrar una mejora frente al proceso actual.

---

# Contexto del proceso

En Planta Pacheco, las unidades atraviesan distintos procesos productivos y controles hasta llegar a **Gate Release**.

Las unidades que llegan a esta instancia cumplen los estándares requeridos.

Actualmente, aproximadamente un **5% de esas unidades se selecciona de manera completamente aleatoria** para realizar una Auditoría Adicional de mayor precisión.

El resultado de esa auditoría puede ser:

- `OK`: la unidad fue auditada y no necesitó ninguna calibración adicional.
- `CALIBRADA`: la unidad fue auditada y se detectó la necesidad de realizar una calibración.

El desafío consiste en utilizar el historial productivo previo de cada vehículo para identificar qué unidades tienen mayor probabilidad de terminar como `CALIBRADA`.

---

# Benchmark actual

El benchmark principal no es otro modelo.

Es el proceso actual:

> **Selección aleatoria de aproximadamente el 5% de las unidades.**

La solución debería demostrar si una selección inteligente del mismo porcentaje permite encontrar una mayor cantidad de unidades que realmente requieren calibración.

---

# Dataset disponible

El dataset recibido contiene aproximadamente:

- **195.808 registros**
- **59.681 VIN únicos**
- **41 columnas**

## VIN

El `VIN` identifica de forma única a cada vehículo.

Una misma unidad puede aparecer en varias filas, porque cada fila representa un evento relacionado con defectos, inspecciones o reparaciones.

Por lo tanto:

```text
VIN = vehículo
Fila = evento asociado al vehículo
```

La predicción final debe realizarse a nivel vehículo/VIN y no considerando cada fila como un vehículo independiente.

---

# Información disponible en el dataset

El dataset contiene principalmente:

- VIN
- Inspector
- Fecha y hora de inspección
- Collection Point
- Sector, grupo y zona donde se detectó un defecto
- Componente inspeccionado
- Tipo de incidencia
- Posición del defecto
- Clasificaciones `CCC`, `VFG` y `VRT`
- Información de reparación
- Parte causal/reparada
- Reparador
- Fecha y hora de reparación
- Reemplazo de componentes
- Posible indicador de desensamble
- Código de catálogo del vehículo
- Resultado de Auditoría Adicional
- Componente calibrado durante la Auditoría Adicional

El dataset permite reconstruir parcialmente el **historial de calidad y reparaciones de cada VIN**.

---

# Target

La variable objetivo principal es:

`Auditoría Adicional`

con dos resultados:

- `OK`
- `CALIBRADA`

Aproximadamente el **10% de los VIN auditados** aparecen como `CALIBRADA`.

Este porcentaje corresponde a las unidades dentro de la muestra auditada, no al porcentaje total de producción que se inspecciona.

---

# Data leakage identificado

La variable:

`Componente Auditoría Adicional`

indica qué componente fue calibrado una vez realizada la auditoría.

Por lo tanto:

> **NO puede utilizarse para predecir `OK / CALIBRADA`.**

Se conoce después de realizar la Auditoría Adicional.

Sí puede utilizarse posteriormente para investigar si es posible anticipar qué componente o área debería recibir atención.

También debe investigarse si existe cualquier otra variable del dataset generada después de la Auditoría Adicional.

---

# Información mencionada en la documentación pero no encontrada claramente en el dataset

La documentación del desafío menciona información del QLS como:

- tiempos de permanencia en estación;
- tiempos de ciclo;
- parámetros operativos;
- instrumentales de medición;
- controles automáticos.

Esta información no aparece de manera explícita en el dataset analizado.

La documentación también indica que algunos parámetros e instrumentales serían entregados por separado.

Debe decidirse si necesitamos solicitar datasets adicionales antes de cerrar el diseño de la solución.

---

# Aspectos del dataset que todavía necesitan aclaración

## Semántica de variables

Necesitamos entender correctamente:

- `CCC`
- `VFG`
- `VRT`
- `PUL`
- `Código de Catálogo`
- `Rep Respuesta a Pregunta Desensamblar`

También sería útil obtener tablas de correspondencia de códigos si existen.

## Anomalía temporal

Se detectó que aproximadamente después de `DIA_260` dejan de aparecer VIN clasificados como `CALIBRADA`.

Debe investigarse si se debe a:

- construcción del dataset;
- corte temporal;
- información incompleta;
- cambio del proceso;
- otra razón.

No debe utilizarse esa señal sin entender primero su origen.

---

# Decisiones que Wayfinder debería ayudarnos a resolver

No convertir las siguientes preguntas directamente en tareas de implementación.

Usarlas como **áreas de decisión** y dividirlas en tickets cuando corresponda.

---

## 1. Datos disponibles

### Pregunta

> ¿Tenemos toda la información necesaria para construir el modelo o necesitamos solicitar fuentes adicionales a Ford?

Determinar especialmente si necesitamos:

- tiempos de ciclo;
- tiempos por estación;
- parámetros operativos;
- instrumentales;
- resultados de controles automáticos.

---

## 2. Momento exacto de predicción

### Pregunta

> ¿En qué punto exacto del proceso debe ejecutarse el modelo?

Definir qué información está disponible en ese instante.

Esto determinará qué variables pueden utilizarse sin generar data leakage.

---

## 3. Representación de un VIN

Cada VIN tiene múltiples eventos.

### Pregunta

> ¿Cuál es la mejor manera de representar el historial productivo de un vehículo?

Evaluar:

- agregaciones por VIN;
- secuencia temporal de eventos;
- combinación de ambas;
- otras representaciones.

No asumir todavía que necesariamente debe convertirse todo en una única fila por VIN.

---

## 4. Información predictiva relevante

### Pregunta

> ¿Qué aspectos del historial previo parecen relacionarse con una posterior calibración?

Investigar potencialmente:

- cantidad de defectos;
- diversidad de defectos;
- repetición de incidencias;
- componentes afectados;
- zonas productivas;
- reparaciones;
- reemplazos;
- desensambles;
- tiempos entre detección y reparación;
- secuencias de eventos;
- combinaciones de eventos;
- Código de Catálogo.

---

## 5. Validación

### Pregunta

> ¿Cómo debemos validar el modelo para garantizar que representa el uso real en planta?

Condiciones importantes:

- evitar que eventos pertenecientes al mismo VIN aparezcan simultáneamente en train y test;
- evaluar validación temporal;
- resolver antes la anomalía posterior a `DIA_260`.

---

## 6. Métrica de éxito

### Pregunta

> ¿Qué métrica representa mejor el valor operacional de la solución?

El proceso actual selecciona aproximadamente el 5% de manera aleatoria.

Evaluar métricas como:

- `Precision @ 5%`
- `Recall @ 5%`
- Lift frente a selección aleatoria
- PR-AUC
- otras métricas relevantes

El objetivo debería ser demostrar cuánto mejora la selección inteligente manteniendo una capacidad de inspección comparable.

---

## 7. Selección del modelo

### Pregunta

> ¿Qué familia de modelos ofrece el mejor equilibrio entre performance, generalización, interpretabilidad y aplicabilidad?

No elegir anticipadamente:

- XGBoost
- CatBoost
- Random Forest
- redes neuronales
- otro modelo

Comparar alternativas después de resolver representación, datos y validación.

---

## 8. Explicabilidad

### Pregunta

> ¿Qué información necesita una persona de Calidad para confiar y actuar sobre una predicción?

No limitar la explicación a métricas técnicas de Machine Learning.

Explorar explicaciones operacionales como:

- por qué esta unidad tiene alto riesgo;
- qué eventos contribuyeron;
- qué partes del historial fueron inusuales;
- qué área podría requerir atención.

---

# Innovación

La innovación no debería reducirse a simplemente **“usar IA”**.

Debemos explorar capacidades que agreguen valor operacional.

## Quality Risk Profile por VIN

En lugar de devolver únicamente:

`OK / CALIBRADA`

crear un perfil de riesgo por vehículo.

Ejemplo:

```text
VIN_XXXXX

Risk Score: 87%

Priority: High

Main Signals:
- múltiples incidencias relacionadas;
- repetición de eventos en determinada zona;
- reparación con reemplazo;
- comportamiento inusual respecto de vehículos comparables.
```

---

## Secuencia de eventos

Investigar si el **orden** de defectos y reparaciones contiene información predictiva.

Dos vehículos podrían tener la misma cantidad de defectos pero historias completamente diferentes.

---

## Comparación contra vehículos similares

En lugar de comparar un VIN solamente contra toda la producción, evaluar su comportamiento respecto de vehículos comparables.

Ejemplo:

```text
VIN
↓
Código de Catálogo / configuración comparable
↓
Vehículos similares
↓
¿Su historial es normal o anómalo dentro de ese grupo?
```

---

## Detección de anomalías

Complementar el modelo supervisado con una capa de **anomaly detection**.

Objetivo:

> detectar combinaciones de eventos poco frecuentes aunque individualmente ninguna variable parezca problemática.

---

## Predicción del componente

El modelo principal debe responder:

> ¿Qué VIN debería pasar por Auditoría Adicional?

Como posible segunda capa:

> Si este VIN tiene alto riesgo, ¿qué componente o área tendría mayor probabilidad de requerir calibración?

Para esto podría utilizarse históricamente `Componente Auditoría Adicional` como target secundario.

---

## Aprendizaje continuo

Cada nueva Auditoría Adicional genera nueva información real:

```text
Predicción
↓
Auditoría
↓
Resultado real
↓
Nuevo dato
```

Evaluar cómo incorporar periódicamente estos resultados para actualizar o recalibrar el sistema.

---

# Posible concepto de producto

## Predictive Quality Passport

Explorar una salida por VIN que contenga:

- Quality Risk Score
- Prioridad de Auditoría Adicional
- Principales factores de riesgo
- Historial resumido
- Posibles áreas/componentes de atención
- Nivel de confianza

Y a nivel general:

- ranking de VIN;
- capacidad de auditoría configurable;
- comparación contra selección aleatoria;
- performance histórica;
- insights del proceso.

Esta interfaz **no está definida todavía**.

Wayfinder debe ayudar a determinar qué información necesita realmente el usuario final.

---

# Restricciones y principios

1. Utilizar exclusivamente información disponible antes de la Auditoría Adicional para realizar la predicción principal.
2. Evitar cualquier forma de data leakage.
3. No utilizar el VIN como valor predictivo; utilizarlo como identificador del vehículo.
4. Mantener separados los VIN entre entrenamiento y evaluación.
5. No seleccionar un algoritmo antes de comprender correctamente los datos.
6. Priorizar impacto operacional por encima de accuracy aislada.
7. Comparar siempre la solución contra el proceso actual de selección aleatoria.
8. Mantener suficiente explicabilidad para que una persona de Calidad pueda comprender por qué una unidad fue priorizada.
9. Buscar innovación en la forma de analizar y utilizar los datos, no únicamente en la complejidad del algoritmo.

---

# Consultas pendientes para los mentores

1. ¿Existen datasets adicionales con tiempos de ciclo o permanencia en estación?
2. ¿Se van a entregar los parámetros operativos e instrumentales mencionados en la documentación?
3. ¿Existe un diccionario técnico para `CCC`, `VFG`, `VRT`, `PUL` y `Código de Catálogo`?
4. ¿Qué significa exactamente `Rep Respuesta a Pregunta Desensamblar`?
5. ¿Todas las variables de defectos y reparaciones estaban disponibles antes de realizar la Auditoría Adicional?
6. ¿Existe información de todas las estaciones o Collection Points por los que pasó un VIN aunque no haya presentado defectos?
7. ¿Por qué aproximadamente después de `DIA_260` dejan de aparecer unidades `CALIBRADA`?
8. ¿Existe una tabla que permita interpretar los códigos de `Componente Auditoría Adicional`?

---

# Resultado esperado de Wayfinder

Crear un mapa de las decisiones que deben resolverse para llegar desde el estado actual hasta una especificación clara de la solución.

Cada ticket debe representar una:

> **pregunta cuya resolución produzca una decisión.**

Evitar tickets de implementación como:

- Entrenar XGBoost
- Crear dashboard
- Hacer feature engineering

Preferir tickets como:

- ¿Qué información puede utilizar legítimamente el modelo antes de Auditoría Adicional?
- ¿Cómo debemos representar el historial de múltiples eventos de un VIN?
- ¿Qué métrica representa correctamente una mejora frente al muestreo aleatorio?
- ¿Qué información necesita Calidad para actuar sobre una predicción?
- ¿Necesitamos fuentes adicionales del QLS antes de definir la solución?

El mapa estará suficientemente resuelto cuando las decisiones tomadas puedan convertirse en una especificación concreta del sistema.
