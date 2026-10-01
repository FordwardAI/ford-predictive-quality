# Speech de la presentación · Data-Driven Predictive Quality

Guion hablado para la presentación (E1) del equipo **FordwardAI**. Acompaña la presentación 3D de [`prototipos/presentacion-3d/`](../../prototipos/presentacion-3d/) (16 pantallas) y reemplaza al speech original, que estaba pensado para el pptx de Ford y quedó cortado en la factibilidad. Las cifras salen de `solucion/resultados/*.json`, `research/*.md` y `docs/entrega/*.md`; la [tabla de cifras y fuentes](#tabla-de-cifras-y-fuentes) cubre cada número. **La base es ficticia**: ninguna cifra prueba impacto en planta.

## Cómo usar este guion

- **Duración:** unos 29 minutos de exposición sobre 30 (3.752 palabras habladas; a 130 por minuto, 28:52), con casi 1 minuto de margen. Ritmo de unas 130 palabras por minuto. Cada pantalla indica su duración objetivo y sus palabras habladas; si una se pasa, se recorta en la siguiente del mismo orador con lo marcado «Si falta tiempo».
- **Oradores:** tres, de unos 10 minutos cada uno (Integrante 1, 2 y 3). Cada cambio de orador tiene su frase de pase.
- **Convenciones:** el texto entre comillas «» se dice; lo que está en *cursiva* es indicación de escena y no se lee; **Si preguntan** es respaldo para preguntas y no se lee en la exposición; [COMPLETAR: nombre de integrante] es el único dato que falta.
- **La pantalla:** una flecha muestra todo el contenido de la pantalla de una vez. El texto en pantalla es mínimo y grande; la historia la lleva el speech. No leer la pantalla: decir lo que no está escrito.
- **Cifras:** la primera vez que aparece un número, decir «en la base que nos dieron» o «sobre la base ficticia». Las cifras exploratorias (exploración inicial: días 200–260 y otra métrica) se dicen rotuladas y nunca mezcladas con las de validación. La cifra de resultado se dice con la frase permitida: «Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final, de cada 100 elegidos se calibrarían X, contra Y al azar (rango del 95 %): mejora / inconcluso / peor».
- **Nunca decir:** impacto o ahorro en planta, reducción de calibraciones, que el resultado vale para unidades no auditadas, causas, «probabilidad de la unidad» o «score de riesgo por VIN».
- **Solución y resultado:** CatBoost con atributos del código, reentrenado cada 5 días (vida media 15 días, semilla 1), elegido por la regla de precisión aprobada el 30/09. Es la única solución y el único resultado que se dicen y se ven. La pantalla 8 dice en voz alta que el equipo ya conocía otra lectura previa de la prueba final; las cifras de esas otras lecturas son respaldo del orador («Si preguntan» de la pantalla 8). «Predictor de la primera etapa» es el que ganó la primera etapa de validación, antes del cambio de regla del 30/09; con él se midieron la hoja de ensayo, «dónde mirar», el mínimo por código, el detector y los 2,4 s. Ver [decisiones del equipo](#decisiones-del-equipo-antes-de-ensayar).

## Esqueleto y tiempos

| # | Pantalla | Orador | Duración | Palabras | Qué se ve |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | portada · «Mismas auditorías, mejor elegidas» | Integrante 1 | 0:45 | 92 | Título, desafío y FordwardAI; vehículo ilustrativo |
| 2 | proceso · «Hoy el 5 % se elige al azar» | Integrante 1 | 1:30 | 189 | Línea Carrocería → Auditoría Adicional |
| 3 | pregunta · «Mismo cupo, ¿más calibraciones?» | Integrante 1 | 1:50 | 241 | 10,2 % y tres tarjetas |
| 4 | predictor · «Lo seguro está en el parabrisas» | Integrante 1 | 2:45 | 357 | Etiqueta del parabrisas, 98 códigos, tres tarjetas |
| 5 | validacion · «Validar sin mirar el futuro» | Integrante 1 | 2:45 | 356 | Figura de particiones por Día del VIN |
| 6 | alternativas · «Elegimos por precisión» | Integrante 2 | 2:30 | 324 | 54 alternativas en cinco bloques; puntos con CatBoost destacado (18,4 %, azar 11,2 %, oráculo 22,8 %); «los primeros empatan: es una familia» |
| 7 | solucion · «La más precisa: CatBoost» | Integrante 2 | 3:55 | 489 | Tres tarjetas; selección 18,4 % contra 11,2 %; confirmación 17,3 % contra 8,8 % |
| 8 | resultado · «Mejora frente al azar en la prueba final» | Integrante 2 | 1:55 | 248 | CatBoost 12,0 % contra 8,2 %, 1,45× (1,14–1,76), por tramos; «Lectura más débil» y «No es una medición de planta» |
| 9 | hoja · «Así la usa el analista» | Integrante 2 | 1:40 | 215 | La hoja del día; 297 unidades, 28 códigos, cupo 14 |
| 10 | donde-mirar · «Además de cuál, dónde mirar» | Integrante 3 | 1:05 | 148 | Tres zonas ilustrativas; 63,4 % contra 35,2 % |
| 11 | aprende · «Aprende de sus propias auditorías» | Integrante 3 | 1:40 | 216 | Resultado que vuelve; mínimo por código y detector |
| 12 | seguridad · «Fuera de la red de planta» | Integrante 3 | 1:15 | 157 | Tres tarjetas: exportación, sin datos personales, control humano |
| 13 | factibilidad · «Sin licencias ni auditorías extra» | Integrante 3 | 2:05 | 275 | 2,4 s, USD 24,5/mes y la fórmula del valor |
| 14 | futuro · «Implementar midiendo» | Integrante 3 | 1:35 | 202 | Días de control y prototipo de plataforma |
| 15 | conclusiones · «Resultado, valor y próximos pasos» | Integrante 3 | 1:40 | 220 | Tres tarjetas: «Mejora frente al azar», «CatBoost con atributos del código», «Siguiente: medir en planta» |
| 16 | cierre · «Gracias. ¿Preguntas?» | Integrante 3 | 0:10 | 23 | Cierre |
| | **Total** | | **29:05** | **3.752** | 0:55 de margen |

**Reparto (palabras habladas, contando los pases, a 130 por minuto; se cuenta cada palabra o número del texto entre «» y de los pases, sin signos sueltos):** Integrante 1, 1.235 palabras (9:30); Integrante 2, 1.276 (9:49); Integrante 3, 1.241 (9:33). Si el jurado da menos tiempo, se recorta primero lo marcado «Si falta tiempo» en las pantallas 4, 6 y 7, y después la pantalla 12 entera (se responde en preguntas).

---

## Pantalla 1 · portada (0:45 · Integrante 1)

**Qué se ve:** el título «Mismas auditorías, mejor elegidas», el desafío Data-Driven Predictive Quality y el equipo FordwardAI. El vehículo gira; es ilustrativo, la base no dice qué modelo es.

«Buenos días. Somos FordwardAI, de la Universidad Austral: [COMPLETAR: nombre de integrante], [COMPLETAR: nombre de integrante] y [COMPLETAR: nombre de integrante]. Trabajamos el desafío de Calidad, Data-Driven Predictive Quality.

Nuestra propuesta entra en una frase: mismas auditorías, mejor elegidas. No pedimos auditar más ni cambiar cómo se audita; proponemos elegir mejor cuáles unidades se auditan.

Les queremos contar qué proponemos y cómo llegamos. Comparamos más de 458.000 configuraciones antes de quedarnos con una, y buena parte de lo que aprendimos está en lo que descartamos y por qué. Arranco por el proceso.»

**Si preguntan:** el vehículo es ilustrativo; no usamos logos de Ford.

---

## Pantalla 2 · proceso (1:30 · Integrante 1)

**Qué se ve:** la línea Carrocería → Pintura → Montaje → Gate Release → Playa de despacho → Auditoría Adicional, con los tres últimos puntos explicados («Define OK / NO OK», «Espera de 0 a 5 días», «CALIBRADA u OK»).

«En Planta Pacheco, el QLS registra la trazabilidad de cada unidad en Carrocería, Pintura y Montaje: qué incidencias se levantaron en la verificación de calidad y cómo se repararon. Al final, el Gate Release valida que el vehículo cumpla las especificaciones.

Después, las unidades esperan en la playa de despacho entre cero y cinco días. Ahí, en rondas de unas dos horas, los analistas eligen cuáles van a la Auditoría Adicional. Esa auditoría revisa alrededor del 5 % y no busca defectos: busca micro-desviaciones respecto del estándar, para una calibración fina. Si la encuentra, la unidad queda CALIBRADA; si no, queda OK.

Hoy ese 5 % se elige completamente al azar, y Ford nos confirmó que el cupo no se va a ampliar, por costo y capacidad. Elegir al azar tiene una consecuencia directa: de cada 100 unidades auditadas se calibran, en promedio, tantas como la proporción general. Ni más ni menos.

Un detalle que importa para todo lo que sigue: en una etiqueta del parabrisas está el código de catálogo, que describe la versión y el mercado de destino. Está a la vista y hoy no se usa para elegir.»

**Si preguntan:** la elección al azar y el cupo fijo los confirmó Ford en la reunión del 22/09.

---

## Pantalla 3 · pregunta (1:50 · Integrante 1)

**Qué se ve:** «Mismo cupo, ¿más calibraciones?», la cifra 10,2 % con su leyenda y tres tarjetas: «Mismas auditorías», «La referencia es el azar», «Sin costos de planta».

«En la base que nos dieron, que es ficticia, hay 195.808 eventos de calidad del QLS, de 59.681 unidades auditadas. De esas, 6.079, un 10,2 %, terminaron CALIBRADA. También recibimos la agrupación del catálogo: 98 códigos, con su motor, tracción, versión y mercado.

Un aviso que vamos a repetir: la base solo tiene unidades auditadas que además tuvieron alguna incidencia en QLS. Por eso decimos cada cifra «entre auditados con actividad QLS». No representa toda la planta.

Lo primero que hicimos fue reformular la pregunta. Todas las unidades que llegan a la playa son OK y la capacidad es fija. Entonces no se trata de separar unidades buenas de malas, sino de asignar un cupo escaso: cada día, unas 13 auditorías sobre unos 265 vehículos, y hay que elegir las que más chances tienen de terminar CALIBRADA.

Eso define cómo medimos. No usamos la exactitud global: con nueve de cada diez unidades OK, un modelo que dice siempre «OK» acierta el 90 % y no sirve. Medimos la precisión en el cupo: de cada 100 elegidas, cuántas se calibran, siempre contra el azar con el mismo cupo, que es el método actual. Y a cupo fijo no necesitamos los costos que Ford no puede darnos: cualquier par de costos positivos ordena igual a las alternativas. Gana la que encuentra más calibraciones. Esa es la pregunta de un supervisor de calidad: de las unidades que mando hoy a auditar, ¿cuántas van a necesitar ajuste?»

**Si preguntan:** el cupo de la simulación es max(1, floor(0,05 · N)) VIN por día, el 5 % de lo que hay en la base; el azar es la precisión esperada con ese mismo cupo diario, no un sorteo.

---

## Pantalla 4 · predictor (2:45 · Integrante 1)

**Qué se ve:** «Lo seguro está en el parabrisas», la etiqueta del parabrisas resaltada («Una tasa por código, nunca una probabilidad por unidad»), la cifra 98 códigos y tres tarjetas: «Sin tiempos de ciclo», «Historial: no probado», «Nunca predictores».

«¿Qué sabemos de una unidad en el momento de elegirla? Esa pregunta ordenó toda la búsqueda.

La consigna menciona tiempos de ciclo, parámetros de ajuste e interacciones. No están en la base: los pedimos a Ford el 18 de septiembre y la respuesta fue que el dataset entregado tiene lo necesario. No inventamos variables que no existen. Y el resultado y el componente de la Auditoría Adicional nunca pueden ser predictores: son justamente lo que queremos anticipar. El componente, de hecho, aparece en todas las filas CALIBRADA y en ninguna OK: es una fuga directa.

Quedaban dos fuentes: el historial de incidencias del QLS, que es casi todo el dataset, y el código de catálogo. En una exploración inicial probamos de todo. Aclaro que estas cifras son exploratorias: usaron los días 200 a 260 y una medida llamada AUC, que va de 0,5, el azar, a 1, un orden perfecto.

El historial de defectos, que era nuestra primera intuición, dio alrededor de 0,51: prácticamente azar, y combinado con otros modelos restaba. En cambio, cuatro algoritmos distintos sobre el código dieron entre 0,557 y 0,563, y una simple tabla con la tasa histórica de cada código, sin machine learning, dio 0,558. Un oráculo que hace trampa con la tasa real futura de cada código llegó a 0,589. Las redes neuronales dieron peor, entre 0,53 y 0,545, e inestables. Y la única mejora concreta vino de actualizar la tasa en el tiempo: una tasa móvil eligió 13,2 calibradas cada 100, contra 10,8 de una tasa que no se actualiza y 8,3 del azar.

Después reabrimos el historial con siete modelos nuevos, cada uno contra su par sin historial. Ninguno aportó. Y hay un problema de fondo: la base no marca el Gate Release, así que no podemos probar que ese historial exista al elegir. Con el supuesto conservador, entre el 89 % y el 95 % de las unidades no tiene ningún evento disponible.

Conclusión: lo único seguro al elegir es el código del parabrisas. Por eso priorizamos códigos, no vehículos: todas las unidades de un código reciben la misma estimación, la tasa de calibración de esa versión y ese mercado.»

**Si falta tiempo:** se omite la frase de las redes neuronales y la del oráculo (−35 palabras).

**Si preguntan:** la pista de los mentores (componente y área) se probó: el área de lo que se calibra coincide con el área de lo que falló en el 20,0 % de los casos, contra 21,2 % esperado por azar. La señal del código se explica sobre todo por el mercado de destino: en validación es el único atributo que la sostiene (χ² 56,1, n = 8.038 VIN).

---

## Pantalla 5 · validacion (2:45 · Integrante 1)

**Qué se ve:** «Validar sin mirar el futuro» y la figura de particiones por Día del VIN: entrenamiento ≤149, margen 150–154, validación 155–194, margen 195–199, prueba final ≥200; las cifras 8.038 VIN en validación y 13.312 en la prueba final.

«Con tan poca señal es muy fácil engañarse: si uno prueba suficientes modelos, alguno parece bueno por casualidad. Por eso, antes de comparar nada, fijamos las reglas.

Primero, la unidad de análisis es el vehículo: los casi 196.000 eventos se consolidan en una fila por VIN. Segundo, el tiempo: la proporción CALIBRADA baja a lo largo de la base, de 14,5 % en los primeros días a 7,4 % hacia el final. Con ese cambio, mezclar unidades al azar entre entrenamiento y evaluación inflaría el resultado. Validamos siempre hacia adelante: entrenamos con el pasado y evaluamos en el futuro.

Acá se ve la partición. Entrenamiento hasta el día 149; validación, del 155 al 194, para comparar y elegir; y una prueba final desde el día 200, que se abre una sola vez. Entre tramos dejamos cinco días de margen, porque entre el Gate Release y la auditoría pasan hasta cinco días: el día que elegimos solo conocemos resultados de cinco días antes.

Para simular la operación, cada día elegimos el 5 % de las unidades de ese día y contamos cuántas resultaron CALIBRADA. La comparamos con lo que daría el azar con exactamente el mismo cupo diario, y la incertidumbre la medimos remuestreando días: si todo el rango de la diferencia con el azar queda por encima de cero, decimos «mejora»; si incluye el cero, «inconcluso».

Tercero, el preregistro: antes de abrir la prueba final dejamos escrita y versionada la opción elegida, sus parámetros, las semillas y los hashes de los datos. Lo que no está en el preregistro no se lee.

Para mostrar por qué el margen importa, armamos a propósito una versión con trampa: la misma tasa, pero sin los cinco días de margen. En validación «gana» con 22,3 %, por encima incluso del oráculo, que da 20,2 %. Parece excelente y no funcionaría en planta, porque usa resultados que todavía no se conocen.

Y una advertencia honesta: los experimentos exploratorios ya habían mirado parte de esos días de prueba. Lo declaramos en el preregistro: la cifra final puede ser algo optimista.»

**Transición:** «Con estas reglas, le paso a [COMPLETAR: nombre de integrante], que cuenta cómo elegimos y qué ganó.»

**Si preguntan:** los 4.910 VIN con primera inspección después de DIA_260 son todos OK; quedan fuera de la población principal (54.771 VIN), sin asignarles causa, y entran en una sensibilidad. El oráculo no es un techo estricto: cuenta como aciertos los VIN con los que armó la tasa.

---

## Pantalla 6 · alternativas (2:30 · Integrante 2)

**Qué se ve:** «Elegimos por precisión», 54 alternativas en cinco bloques de tiempo y el gráfico de puntos (cada punto es una alternativa, precisión en selección 100–174) con CatBoost destacado: 18,4 % en selección, azar 11,2 % y oráculo 22,8 % (no elegible); la nota «los primeros empatan: es una familia».

«¿Cómo elegimos? En una primera etapa, la regla desempataba por simplicidad. El 30 de septiembre el equipo decidió elegir solo por precisión: gana la que encuentra más calibraciones en el cupo. Con un solo tramo de validación eso sería casi un sorteo, así que medimos en cinco bloques de tiempo: cuatro de selección, del día 100 al 174, y uno de confirmación, del 175 al 194, que no participa en la elección. Todo antes de la prueba final y siempre entrenando con el pasado.

Compitieron 54 alternativas: tasas por código móviles o suavizadas hacia el mercado, y nueve familias de machine learning, desde regresión logística hasta CatBoost, redes y stacking, con el código solo o con sus atributos: mercado, motor, tracción y versión.

Cada punto es una alternativa. La más precisa fue CatBoost con atributos del código: en selección eligió 136 calibradas sobre 740, un 18,4 %, contra 11,2 % del azar. El oráculo, que hace trampa con la tasa real del tramo, llega a 22,8 %: el margen que queda es chico.

Pero miren la nota: los primeros empatan. Random Forest con atributos encontró 135 y XGBoost 134; entre los diez primeros hay apenas ocho aciertos de diferencia. Es una familia, no un modelo ganador. Lo leemos como un hallazgo: con un solo predictor, todos terminan estimando la misma tabla de tasas por código. El valor no está en el algoritmo, sino en cómo se usa esa tasa.

Igual buscamos a fondo: 238 pipelines individuales y, contando combinaciones y meta-modelos, 458.098 configuraciones. Probamos cada una de las 37 columnas restantes, solas y juntas: agregarlas empeoró a los modelos. Las mezclas que ganaban en un tramo caían en el siguiente.

También simulamos datos de proceso por unidad, como torque o metrología. Es un escenario con señal inventada a partir de las propias etiquetas, no una medición: con señal moderada, la precisión sube unos 16 puntos. Es la única vía con margen grande, y la retomamos al final.»

**Si falta tiempo:** se omite el párrafo de la simulación de datos de proceso (−50 palabras); se retoma en la pantalla 14.

**Si preguntan:**
- **La primera etapa:** en validación (155–194) compitieron 31 alternativas con la regla «gana la mayor precisión; si la diferencia con la mejor no es significativa, gana la más simple». 29 de 31 empataron. Su ganadora es el «predictor de la primera etapa»; cuál es y su lectura de la prueba final están en el ítem «Si preguntan: otras lecturas de la prueba final» de la pantalla 8.
- **Incertidumbre:** con 740 elegidos, el rango del 95 % de CatBoost en selección va de 15,6 % a 21,2 %. Entre los diez primeros, 136 a 128 aciertos sobre 740.
- **Los 458.098** cuentan combinaciones que comparten predicciones: expresan cobertura, no hipótesis independientes. Los 16 puntos son la logística en el bloque 175–194, de 20,4 % a 36,7 %, con columnas generadas a partir de las etiquetas.
- **El oráculo** no es elegible y no es un techo estricto: cuenta como aciertos los VIN con los que armó la tasa.

---

## Pantalla 7 · solucion (3:55 · Integrante 2)

**Qué se ve:** «La más precisa: CatBoost», la bajada «Usa el código y sus atributos: mercado, motor, tracción y versión», las cifras de selección (18,4 % contra 11,2 % del azar) y de confirmación (17,3 % contra 8,8 %), y tres tarjetas: «Se reentrena cada 5 días», «Elegida por precisión» y la del último bloque (bajó, con solo 225 elegidos, dentro de un rango de unos ±5 puntos).

«Esta es la solución que proponemos: CatBoost con los atributos del código. CatBoost es un modelo de árboles de decisión. Recibe el código de catálogo y lo que se lee de él: mercado de destino, motor, tracción y versión. Nunca usa el resultado ni el componente de la Auditoría Adicional.

Primera tarjeta: se reentrena cada cinco días. Cada vez aprende solo de auditorías cuyo resultado ya se conoce, con el margen de cinco días, y le da más peso a lo reciente: un resultado de hace 15 días pesa la mitad que uno de hoy. Ese peso y la regularización se eligieron dentro del entrenamiento, sin mirar los bloques de evaluación. Su salida es una tasa por código, que entra a la hoja sin cambiarle el formato. Para el analista no cambia nada: lee el código, busca su fila y ve la tasa. Nunca una probabilidad por unidad.

Segunda tarjeta: la elegimos por precisión. En selección encontró 136 calibradas sobre 740, un 18,4 %, contra 11,2 % del azar, y quedó por encima del azar en cada uno de los cuatro bloques.

¿Por qué ganan las que se actualizan? Porque cerca del día 100 rotó la producción: solo el 21 % de las unidades de los días 50 a 99 tenía un código que siguiera apareciendo entre el 100 y el 149. Una tasa que no se actualiza queda describiendo una mezcla que ya no existe. Las estimaciones que se actualizan, y que con los atributos aprenden de códigos parecidos, se sostienen en 17 a 18 %. Eso vale para toda la familia, no solo para CatBoost. Nuestra hipótesis, que no probamos por separado, es que un código con pocos resultados toma fuerza de los que se le parecen, sobre todo de su mercado.

Tercera tarjeta, y ahora los límites, de frente. En el bloque de confirmación, el que no participó en la elección, CatBoost bajó: encontró 39 calibradas sobre 225, un 17,3 %, contra 8,8 % del azar. Sigue arriba del azar, pero con solo 225 elegidas el rango va de 13,4 a 21,5. Y en ese bloque, con la mezcla de códigos ya estable, casi todas las alternativas encontraron más que CatBoost, con diferencias de hasta siete aciertos, en el límite de lo que se distingue del ruido.

Hay algo más de fondo: entre las 54 alternativas, el orden en un tramo no anticipa el del siguiente. La correlación es incluso negativa, menos 0,34. CatBoost, primera en selección, quedó última entre las diez primeras cuando las miramos en confirmación. Elegir a la que mejor salió en un tramo es, en parte, perseguir ruido.

Por eso no decimos que CatBoost sea el mejor algoritmo. Decimos tres cosas más modestas. Que es la más precisa de una familia que empata. Que lo que sí importa es actualizar la tasa y apoyarse en el mercado cuando la mezcla rota. Y que, si algo falla, la hoja no frena nada: se vuelve al muestreo aleatorio de hoy.»

**Si falta tiempo:** se omite la frase del peso y la regularización (−14 palabras) y la de la hipótesis de los códigos parecidos (−24 palabras).

**Si preguntan:**
- **CatBoost en las tres lecturas de Día < 195:** validación 155–194, 63 de 391 (16,1 %); selección 136 de 740 (18,4 %; rango 15,6–21,2); confirmación 39 de 225 (17,3 %; rango 13,4–21,5), 1,97 veces el azar (1,54–2,46). Por bloque de selección: 17,8 %, 17,2 %, 22,1 % y 15,7 %.
- **¿Quiénes quedaron arriba en confirmación?** 51 de las 54 alternativas tuvieron más aciertos que CatBoost (39); doce llegaron a 46 de 225 (20,4 %), entre ellas Random Forest, MLP, tasas móviles de 120 días y la opción de la primera etapa (ver pantalla 8). Con la mezcla estable, todas empatan.
- **Mejor peor lectura:** si en lugar del mejor tramo se mira la peor de las tres lecturas, el criterio señala a Random Forest con atributos, reentrenado: 17,7 % (validación 18,7 %, selección 17,7 %, confirmación 20,0 %). Es exploratorio: el criterio se fijó después de ver esos tramos, y su ventaja está dentro del ruido.
- **Simulación con verdad conocida (no es evidencia de planta):** diferencia pareada CatBoost menos Random Forest, +0,34 puntos (−0,29 a +0,88) con la mezcla que rota y +0,68 (+0,18 a +1,18; mejor en 24 de 24 réplicas) con la mezcla estable.
- **Configuración preregistrada:** reentrenado cada 5 días, vida media 15 días, semilla 1 (la mediana de cinco semillas en selección), l2_leaf_reg = 10; vida media y regularización por log-loss dentro del entrenamiento (`solucion/preregistro-precision.json`).
- **Hipótesis no probada por separado:** mercado y versión aportan unos 3 a 4 puntos porque un código con pocos resultados toma fuerza de los parecidos.

---

## Pantalla 8 · resultado (1:55 · Integrante 2)

**Qué se ve:** «Mejora frente al azar en la prueba final» y solo la lectura de CatBoost: 12,0 % contra 8,2 % al azar, 1,45 veces el azar (rango 1,14–1,76), por tramos; dos tarjetas: «Lectura más débil: el equipo ya conocía otra lectura previa de la prueba final al acordar esta» y «No es una medición de planta».

«Y llegamos a la prueba final: días 200 a 284, 13.312 unidades y 652 elegidas en 68 días. La configuración de CatBoost quedó preregistrada antes de leerla.

Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final, de cada 100 elegidos se calibrarían 12,0, con un rango del 95 % de 9,2 a 14,8, contra 8,2 al azar con el mismo cupo: 1,45 veces el azar, con un rango de 1,14 a 1,76. Son 78 calibradas sobre 652. Dicho en concreto: con el mismo cupo, el azar habría encontrado unas 54; CatBoost encontró 78. Es mejora: todo el rango de la diferencia con el azar queda por encima de cero, desde 1,2 puntos.

Por tramos se sostiene: hasta el día 260, 12,2 contra 8,3. Después del 260 quedan solo 21 elegidas, y eso no alcanza para leerlo.

Ahora, por qué esta lectura vale menos de lo que parece. Primero, es más débil: cuando el equipo la acordó, ya conocía otra lectura previa de la prueba final. Segundo, los experimentos exploratorios ya habían mirado parte de esos días. Y tercero, cae desde selección, de 18,4 a 12,0: en parte porque el azar también bajó, de 11,2 a 8,2; el resto no lo verificamos.

Lo que no afirmamos: no es una medición de planta, no es un ahorro y no dice nada de las unidades no auditadas ni de causas. Dice que, sobre esta base, priorizar por código encuentra más calibraciones que el azar con las mismas auditorías.»

**Si preguntan:**
- **Rangos y tramos de CatBoost:** prueba completa, 78 de 652, 12,0 % (9,2–14,8), 1,45 veces (1,14–1,76); diferencia con el azar de +1,2 a +6,3 puntos. Prueba ≤260: 77 de 631, 12,2 % (9,4–15,3) contra 8,3 %, 1,47 veces (1,16–1,81). Tramo >260: 21 elegidos, solo descriptivo. Con la cohorte posterior a DIA_260 sumada (n = 18.222): 8,8 % contra 6,0 %.
- **Si preguntan: otras lecturas de la prueba final** (respaldo del orador; no se dice salvo que pregunten). Hubo otras dos lecturas, y se informan juntas. La primera, preregistrada el 30/09 antes de la de CatBoost, fue la de la tasa fija por código, la ganadora de la primera etapa: 71 de 652, 10,9 % (8,3–13,6) contra 8,2 %, 1,32 veces el azar (1,01–1,64), mejora por poco (límite inferior de la diferencia, +0,07 puntos). Después, Random Forest con atributos (preregistro de efectividad, 01/10, sin acuerdo explícito de todo el equipo): 77 de 652, 11,8 % (9,2–14,6), 1,44 veces (1,13–1,76). Las tres superan al azar y sus rangos se superponen: confirman que priorizar por código funciona sobre esta base, no cuál modelo es mejor. La de CatBoost se acordó conociendo la primera; la de Random Forest, conociendo las dos. Esa tasa fija es el «predictor de la primera etapa» con el que se midieron la hoja de ensayo, «dónde mirar», el mínimo por código, el detector y los 2,4 s. La corrida repetida de CatBoost en `prueba-final.json` es la misma lectura (la anterior falló al imprimir en la consola de Windows) y da lo mismo.
- **La caída desde selección:** puede haber optimismo por haber elegido la mejor en selección; no verificamos cuánto pesa cada causa.

---

## Pantalla 9 · hoja (1:40 · Integrante 2)

**Qué se ve:** «Así la usa el analista», la hoja del día (captura local o el mock sin números) con la etiqueta del parabrisas; las cifras 297 unidades, 28 códigos y cupo de 14 (hoja de ensayo del Día 190).

«¿Cómo se usa todo esto en la playa? Con una hoja de códigos prioritarios. Cada mañana ordena los códigos que se van a producir según su tasa e indica cuántas unidades de cada uno derivar para llenar el cupo del día.

El analista lee el código en el parabrisas, busca su fila y ve la cantidad sugerida, la tasa del código con su rango y la cantidad de auditorías en que se basa, y el mercado de destino, que es el porqué de la prioridad. Nunca muestra un puntaje por vehículo: dos unidades del mismo código son indistinguibles.

Si un código sugerido no llega a la playa, lo pendiente baja a los siguientes códigos del ranking que sí llegaron. Solo si se agota el ranking se completa al azar.

Esta es la hoja de ensayo del día 190: 297 unidades de 28 códigos, cupo de 14, con dos filas aparte para el mínimo por código, que explicamos enseguida, y ningún VIN en la salida. Se arma en segundos, en planilla o impresa. Esta hoja de ensayo se generó con el predictor de la primera etapa; con CatBoost cambia la columna de la tasa, no el formato.»

**Transición:** «Le paso a [COMPLETAR: nombre de integrante], que cuenta qué aporta además de elegir, cuánto cuesta y cómo seguir.»

**Si preguntan:** la hoja final es la del Día 260, ya generada fuera de Git porque muestra tasas por código; también se generó con el predictor de la primera etapa, no con CatBoost (cuál es: ítem «otras lecturas de la prueba final» de la pantalla 8; ver decisiones). Usa identificadores ficticios y ningún VIN.

---

## Pantalla 10 · donde-mirar (1:05 · Integrante 3)

**Qué se ve:** «Además de cuál, dónde mirar», el vehículo con tres zonas ilustrativas («Componente 1, 2, 3») y las cifras 63,4 % y 35,2 % de la prueba final.

«Con el código como único predictor, todos los modelos estiman la misma tabla. Nuestra innovación está en cómo se usa esa tabla. La primera pieza responde a algo que nos dijeron los mentores: la clave está en qué componente presentó la falla.

Además de cuál unidad auditar, la hoja sugiere dónde mirar primero: los tres componentes que más se calibraron en ese código en auditorías anteriores. Acá el componente es lo que se predice, nunca un predictor.

Evaluado con el predictor de la primera etapa, en la prueba final, sobre las 71 unidades CALIBRADA que eligió, mirar primero los tres componentes de su código acertó en el 63,4 %, contra 35,2 % de la lista general. Es el efecto más grande que medimos: le indica al auditor por dónde empezar la revisión. Las zonas del vehículo son ilustrativas, porque los componentes están anonimizados, y es una asociación, no una causa.»

**Si preguntan:** en validación, sobre las 59 CALIBRADA que eligió el mismo predictor, 61,0 % contra 30,5 %. Se midió sobre la selección del predictor de la primera etapa, que es el que estaba en su preregistro (cuál es: ítem «otras lecturas de la prueba final» de la pantalla 8); con CatBoost no se midió.

---

## Pantalla 11 · aprende (1:40 · Integrante 3)

**Qué se ve:** «Aprende de sus propias auditorías», la línea con el resultado que vuelve desde la Auditoría Adicional y las cifras 15,3 % (mínimo por código), 90,8 % (detector) y 7 alarmas.

«La segunda pieza resuelve un problema que aparece en cuanto la hoja funciona. En la exploración simulamos un agente de refuerzo que elige qué auditar y solo aprende de lo que audita, como la planta. Nos dejó una lección: si la planta audita solo lo que la hoja marca, deja de conocer el resultado del resto, y un código que empeora podría pasar sin verse.

Estas piezas las evaluamos con el predictor de la primera etapa. La primera idea fue reservar para siempre un 20 % del cupo al azar. La descartamos: en validación bajaba la precisión de 15,1 % a 13,8 %. En su lugar, el mínimo por código: cada código que se produce recibe al menos una auditoría cada 40 días. En validación conserva la precisión del ranking: 15,3 %. En la prueba final dio inconcluso, y así lo decimos.

La tercera pieza es un detector de cambios por código. Acumula la diferencia entre lo observado y la tasa esperada y avisa si pasa un umbral, calibrado a una falsa alarma cada 30 días en todo el catálogo. Con cambios sintéticos detectó el 90,8 % de las duplicaciones de tasa, con una demora mediana de 10 días. Sus alarmas son observaciones, no causas.

Con CatBoost ese aprendizaje es literal: cada cinco días se reentrena con lo que se auditó.»

**Si falta tiempo:** se omite la frase del agente de refuerzo y se arranca por «Si la planta audita solo lo que la hoja marca…» (−30 palabras).

**Si preguntan:** el mínimo por código y el detector se evaluaron con el predictor de la primera etapa, no con CatBoost (cuál es: ítem «otras lecturas de la prueba final» de la pantalla 8); el mínimo, con etiquetas parciales (solo se conoce lo elegido desde el Día 155). En la prueba final: 10,6 % (8,0–13,3), 1,29 veces el azar, inconcluso. El detector detecta el 66,9 % de las bajas a la mitad (16 días de demora mediana); con etiquetas reales dio 7 alarmas en 40 días de validación y 16 en 85 días de prueba.

---

## Pantalla 12 · seguridad (1:15 · Integrante 3)

**Qué se ve:** «Fuera de la red de planta» y tres tarjetas: «Lee una exportación», «Sin datos personales», «Control humano».

«Una solución así no debería agregar riesgos. La diseñamos con minimización de datos: usa el código de catálogo y sus atributos, el resultado de la auditoría con su día, el programa del día y el cupo. No usa identificadores de inspectores ni de reparadores, y el VIN nunca aparece en las salidas.

La revisamos contra cuatro marcos. ISO/IEC 27001, para tratar la hoja y sus entradas como activos: acceso, integridad, continuidad. IEC 62443, para la red industrial: el script lee una exportación, no se conecta a controladores ni a la red de automatización y no escribe en QLS. La Ley 25.326 de datos personales: no tratamos datos de personas. Y el NIST Cybersecurity Framework 2.0, para detectar y recuperarse: el script verifica el hash de sus entradas antes de correr y, si algo falla, se vuelve al muestreo al azar de hoy, sin frenar la operación. La hoja recomienda: Calidad fija cuántas y los analistas deciden cuáles.»

**Si falta tiempo:** la pantalla entera pasa a preguntas.

**Si preguntan:** también se revisó la Resolución AAIP 47/2018, como referencia si Ford sumara datos personales. Es una investigación breve del equipo, no una opinión legal ni una certificación.

---

## Pantalla 13 · factibilidad (2:05 · Integrante 3)

**Qué se ve:** «Sin licencias ni auditorías extra», las cifras 2,4 s por día y USD 24,5 por mes (techo de referencia), y dos tarjetas: la fórmula y «No es un ahorro».

«Lo primero: no hay que comprar nada. Es un script de Python con bibliotecas abiertas, entre ellas CatBoost, con versiones fijadas: sin licencias, sin nube, sin GPU y sin servicios pagos. Los datos ya existen: la exportación del QLS, los resultados de la Auditoría Adicional y el programa del día.

En una notebook, leer la base completa y armar la hoja lleva unos 2,4 segundos, medido con el predictor de la primera etapa. CatBoost suma reentrenar cada cinco días sobre unas decenas de miles de unidades, también sin GPU: como referencia, evaluar 18 modelos con ocho reentrenamientos cada uno nos llevó unos 50 segundos. Si Ford prefiriera la nube, una máquina virtual chica cuesta unos 24,5 dólares por mes encendida todo el tiempo, y alcanzaría con prenderla minutos por día. Es solo un techo: la solución no necesita nube. Y escala igual: una línea, una notebook de Calidad; una planta, un servidor existente; varias plantas, cada una con su catálogo y su cupo.

Y no agrega auditorías: el cupo lo sigue fijando Calidad de Planta. La implementación son horas internas de Ford —integrar la exportación, instalar el script y una capacitación corta— que no estimamos, porque dependen de sus sistemas.

El valor lo completa Ford con una fórmula: beneficio diario igual a la precisión de la hoja menos la del azar, por las auditorías del día, por el costo evitado por cada calibración encontrada. Sobre la base ficticia, en la prueba final, la diferencia de CatBoost con el azar equivale a unas 3,7 calibraciones más cada 100 auditorías. No es un ahorro de planta: en planta, esa diferencia se mide con los días de control.»

**Si preguntan:** la VM de referencia es una AWS t3.small en São Paulo (USD 0,0336 por hora, 730 horas, sin disco, precio público consultado el 29/09/2026); una VM chica cuesta del orden de USD 0,02 a 0,07 por hora según tamaño y región. El rango del 95 % de la diferencia de CatBoost con el azar es de 1,2 a 6,3 puntos. El tiempo de 2,4 s se midió con el predictor de la primera etapa (cuál es: ítem «otras lecturas de la prueba final» de la pantalla 8); el de un reentrenamiento de CatBoost en planta no está medido por separado.

---

## Pantalla 14 · futuro (1:35 · Integrante 3)

**Qué se ve:** «Implementar midiendo», el prototipo de la plataforma (captura local o mock) y tres tarjetas: «Días con hoja y días al azar», «Replicable», «Hoy se entrega la hoja».

«¿Cómo seguir? Implementar midiendo. Toda nuestra evidencia viene de una base ficticia; la única forma de saber qué pasa en planta es medir en planta.

Primero, conectar las entradas y arrancar las tasas con el histórico de auditorías al azar que Ford ya tiene. Después, una etapa inicial con días de control: días con hoja alternados con días al azar, como hoy, en las mismas condiciones de producción. Los días al azar dan la referencia sin sesgo. Su duración no la fijamos: sin datos reales no se puede calcular. Y los resultados se analizan por separado para unidades con y sin actividad QLS.

Es replicable: otra línea u otra planta necesita un código visible en la unidad, resultados de auditoría con fecha y código, un cupo diario y un histórico de auditorías al azar para arrancar. Cada una corre su propia hoja con el mismo protocolo de evaluación.

La vía con más margen son los datos de proceso por unidad: torque, metrología del mecanismo calibrado, lotes, estaciones. Proponemos un piloto para medir si esa señal existe.

Y a futuro, una plataforma que reúne la hoja, las rondas, las tasas en el tiempo y las alertas. Es una propuesta: hoy entregamos la hoja.»

**Si falta tiempo:** se omite el párrafo de la plataforma (−25 palabras).

**Si preguntan:** simulados en validación, los días de control (días pares con hoja, impares al azar) estiman 1,35 veces el azar con un rango de 0,75 a 2,47: el rango es ancho porque usa la mitad de los días. Si Ford prueba que el historial está disponible al elegir (por ejemplo, con una marca de Gate Release), se reabre.

---

## Pantalla 15 · conclusiones (1:40 · Integrante 3)

**Qué se ve:** «Resultado, valor y próximos pasos» y tres tarjetas: «Mejora frente al azar», «CatBoost con atributos del código» y «Siguiente: medir en planta».

«Cerramos con tres cosas: resultado, solución y próximo paso.

Mejora frente al azar: sobre la base ficticia, entre auditados con actividad QLS, en la prueba final, de cada 100 elegidos se calibrarían 12,0 con CatBoost, contra 8,2 al azar: 1,45 veces el azar, en una lectura que, como dijimos, es más débil.

CatBoost con atributos del código: con esta base, el código de catálogo es la única información admisible con señal, y el valor está en cómo se usa su tasa: actualizarla y apoyarse en el mercado cuando la mezcla rota. CatBoost es la más precisa de una familia que empata.

Y el valor: mismas auditorías, mejor elegidas. Se explica con una frase: esta versión, para este mercado, se calibró tanto en el último período. Suma dónde mirar, aprende de sus auditorías y avisa cambios. Y no tiene riesgo operativo: si algo falla, se vuelve al muestreo aleatorio de hoy.

Lo que no afirmamos: impacto ni ahorro en planta, que valga para unidades no auditadas, ni causas. Mostramos que el método funciona sobre esta base; lo que pasa en planta se mide en planta.

Siguiente: medir en planta. Conectar las entradas, instalar el script, capacitar a los analistas, arrancar con días de control y mínimo por código, y decidir con datos de planta si la hoja orienta todo el cupo.»

**Si preguntan:** los ocho próximos pasos completos, por dependencias, están en [06-conclusiones.md](06-conclusiones.md); las fechas las define Ford.

---

## Pantalla 16 · cierre (0:10 · Integrante 3)

**Qué se ve:** «Gracias. ¿Preguntas?», Data-Driven Predictive Quality, octubre 2026.

«Muchas gracias. Somos FordwardAI. Quedamos atentos a sus preguntas; tenemos a mano la hoja impresa y el detalle de todo lo que descartamos.»

*Tener a mano [preguntas del jurado](preguntas-jurado.md) e [ideas descartadas](ideas-descartadas.md); llevar todo en notebook y pendrive o enlace.*

---

## Cambios respecto del speech original

1. **Estructura.** El original seguía el pptx de Ford (portada, agenda y seis divisores 01 a 06 con layouts del template). Este guion sigue las 16 pantallas de la presentación 3D: no hay agenda ni divisores, y la seguridad va después del valor diferencial, como en la presentación. Las etapas 1 a 4 se reparten en las pantallas 4 a 7 y el aprendizaje del refuerzo en la 11.
2. **Bloque financiero (pantalla 13).** El original afirmaba 160 horas de integración, 80 de piloto, 16 de capacitación y 4 por mes de mantenimiento; 20 dólares la hora; unos 6.000 dólares el primer año y menos de 1.000 después; 2.500 inspecciones por año; «1.900 inspecciones en lugar de 2.500»; «600 inspecciones liberadas»; 18 dólares por inspección; «11.000 dólares por año» y «7 meses de recupero». **Se quitó**, por tres razones: (a) [03-factibilidad-economica.md](03-factibilidad-economica.md) dice que las horas internas de Ford no se estiman y que no se afirman ahorros, y la presentación dice «No es un ahorro»; (b) ninguna de esas cifras está en el repositorio; (c) «liberar inspecciones» contradice la propuesta (el cupo no cambia: mismas auditorías, mejor elegidas) y equivale a afirmar un ahorro en planta. Se reemplazó por lo que sí dice el repo: sin licencias ni auditorías extra, equipo existente, VM de referencia como techo, fórmula para que Ford la complete y la diferencia sobre la base ficticia en calibraciones cada 100 auditorías. **Opción de restaurarlo:** si el equipo acepta presentarlo como supuesto ilustrativo, debería ir rotulado en voz y en pantalla («supuesto ilustrativo del equipo, no estimado con datos de Ford ni de la base»), expresado a cupo fijo (calibraciones más encontradas, no inspecciones liberadas) y con la decisión registrada en #33.
3. **«13,8 % con trampa» → 22,3 % contra 20,2 % del oráculo.** El 13,8 es una cifra exploratoria (días 200–260, otra métrica; `research/experimentos-modelado.md`) y en el original aparecía dentro del protocolo, mezclada con las de validación. La versión con fuga del protocolo (móvil de 60 días sin margen) da 22,3 % en validación, por encima del oráculo (20,2 %) (`p3.json`).
4. **«Siete algoritmos sobre el código, entre 0,557 y 0,563» → cuatro algoritmos** (XGBoost, Naive Bayes, Random Forest y regresión logística) más la tabla de tasas (0,558). «Siete» corresponde al total de algoritmos supervisados probados, incluidos los de historial (`research/experimentos-modelado.md`).
5. **Historial «0,51» → «alrededor de 0,51»** (XGBoost solo con historial: 0,514; con catálogo: 0,516).
6. **«Mínimo de 40 auditorías por código» → una auditoría por código cada 40 días** (P = 40, `p5.json`). El original invertía la regla.
7. **Etapas 1 y 2 rotuladas.** Las cifras de AUC y el 13,2 / 10,8 / 8,3 se dicen como exploratorias (días 200–260; en la pantalla 4, «exploración inicial», para no confundirla con la «primera etapa» de validación de la pantalla 6); las de validación y prueba final no se mezclan con ellas.
8. **Criterio de elección.** El original elegía por «mejor peor lectura», que en el repo señala a Random Forest. La solución elegida es CatBoost por la regla de precisión (aprobada el 30/09; `preregistro-precision.json`). Las pantallas 6 y 7 cuentan: primera etapa con desempate por simplicidad → regla de precisión del 30/09 → 54 alternativas en cinco bloques → CatBoost, la más precisa de una familia que empata, que bajó en el último bloque. La mejor peor lectura (Random Forest) y la simulación quedan en «Si preguntan» de la pantalla 7.
9. **Rotación de la mezcla.** «Solo el 21 % de las unidades tenía un código que ya había aparecido antes» → «solo el 21 % de los VIN de los días 50 a 99 tiene un código que aparece en 100–149» (`research/opcion-mas-precisa.md`).
10. **Búsqueda amplia.** «Agregar todas las columnas empeoró a todos los modelos» → «empeoró a los modelos»; «los sintéticos nunca superaron al catálogo» → «no lideraron de forma estable»; «238 pipelines de nueve familias» → «238 pipelines individuales» (`research/busqueda-amplia.md`).
11. **Sensibilidad de datos de proceso.** Se dice explícitamente que es un escenario con señal inventada a partir de las etiquetas, no una medición (logística, 20,4 % → 36,7 % en 175–194; `research/sensibilidad-proceso.md`).
12. **Partición.** «Selección y validación entre el 100 y el 194» → validación 155–194 en la figura; los bloques 100–174 y 175–194 se presentan en las pantallas 6 y 7.
13. **Seguridad.** Se completaron los datos de entrada desde [02-3](02-3-seguridad-privacidad.md). «Red corporativa, sin conexión a PLC ni a internet» y «modelos versionados» → «no se conecta a controladores ni a la red de automatización, no escribe en QLS, verifica el hash de sus entradas».
14. **Frases prohibidas.** La guía del bloque 2D decía «estima la probabilidad de calibración y manda el 5 % con mayor riesgo»; se reemplazó por «tasa por código».
15. **Factibilidad.** «Python y scikit-learn» → bibliotecas abiertas con versiones fijadas, entre ellas CatBoost (`requirements.txt`). Se quitó «la salida entra en la planilla de selección que ya se usa»: hoy la elección es al azar y el repo no registra una planilla existente.
16. **Agregados.** Bloques nuevos: elección por precisión y solución (pantallas 6 y 7), resultado de la prueba final (8), hoja (9), dónde mirar y aprende (10 y 11), trabajo futuro (14), conclusiones y cierre (15 y 16). Se sumó la caída de la proporción CALIBRADA (14,5 % → 7,4 %) para justificar la validación temporal.
17. **Universidad.** Se mantiene «de la Universidad Austral» del original; la presentación tiene la universidad de cada integrante como pendiente (ver decisiones).
18. **CatBoost como única solución y único resultado (ronda 4, 01/10; pedido del usuario: «Dejá solo como solución y resultado el CatBoost, no pongas nada de la tasa fija; las slides que ahora mismo dicen tasa fija reemplazalas correspondientemente por CatBoost»).** Se quitó la tasa fija y la numeración «lectura 1 / oficial / tercera lectura Random Forest» del texto hablado y de «Qué se ve». Reemplazos: pantalla 4 (exploratorio: «10,8 de la tasa fija» → «10,8 de una tasa que no se actualiza»); pantalla 6 («Ganó la más simple», 31 alternativas, 15,1 % contra 9,9 % → «Elegimos por precisión», 54 alternativas en cinco bloques, CatBoost 18,4 % contra 11,2 %, oráculo 22,8 %, «es una familia»); pantalla 7 (sin 12,7 % ni 20,4 % de la tasa fija; confirmación 17,3 % contra 8,8 % del azar, rango 13,4–21,5; sin el respaldo «tasa fija»: si algo falla, se vuelve al muestreo aleatorio de hoy); pantalla 8 (tres lecturas → solo CatBoost, 12,0 % contra 8,2 %, 1,45 veces, por tramos); pantalla 9 (hoja de ensayo «generada con la tasa fija» → «con el predictor de la primera etapa»); pantallas 10, 11 y 13 («dónde mirar», mínimo por código, detector y 2,4 s: «evaluado con el predictor de la primera etapa»; 2,7 calibraciones de la tasa fija → solo las 3,7 de CatBoost); pantalla 15 (10,9 % y «respaldo simple» → 12,0 % de CatBoost, más débil); respuestas cortas («¿Cuál es la cifra oficial?» y «¿Y si Ford prefiere algo más simple?» → «¿Hubo otras lecturas de la prueba final? ¿Probaron algo más simple?»). **Salvedad de honestidad:** la tasa fija fue la primera lectura preregistrada de la prueba final (30/09) y la de CatBoost se acordó conociéndola. El guion no lo oculta: la pantalla 8 dice en voz alta que el equipo ya conocía otra lectura previa de la prueba final, y las cifras de las otras lecturas están en «Si preguntan: otras lecturas de la prueba final» (pantalla 8) y en las respuestas cortas. Tampoco se presentan como de CatBoost las piezas que se midieron con la tasa fija.

---

## Respuestas cortas a las preguntas probables del jurado

**¿Por qué CatBoost?** Porque elegimos por precisión y fue la de mayor precisión en selección: 136 de 740, 18,4 % contra 11,2 % del azar, días 100–174. No decimos que sea el mejor algoritmo: es la más precisa de una familia que empata, y en el último bloque bajó a 17,3 % (39 de 225, azar 8,8 %), con casi todas las alternativas por encima, en el límite del ruido.

**¿Por qué no eligieron el que más acierta en todos los tramos?** Porque el orden se invierte: entre 54 alternativas, la correlación entre el orden en selección y en confirmación es −0,34. El criterio de mejor peor lectura señala a Random Forest con atributos, con una ventaja dentro del ruido, y se fijó después de ver los tramos.

**¿Hubo otras lecturas de la prueba final? ¿Probaron algo más simple?** Sí, y lo decimos. La primera lectura, preregistrada el 30/09, fue la de la tasa fija por código, sin machine learning, la ganadora de la primera etapa con desempate por simplicidad: 10,9 de cada 100 contra 8,2 al azar, 1,32 veces (1,01–1,64), mejora por poco. Después se leyó Random Forest con atributos: 11,8, 1,44 veces (1,13–1,76), sin acuerdo explícito de todo el equipo. Las tres superan al azar y sus rangos se superponen: muestran que priorizar por código funciona sobre esta base, no cuál modelo es mejor. La de CatBoost, 12,0 y 1,45 veces, es más débil porque se acordó conociendo la primera. Si algo falla en la operación, se vuelve al muestreo aleatorio de hoy.

**La ficha pide un modelo de ML. ¿Lo es?** Sí: CatBoost es un modelo de machine learning. Con un solo predictor, todos los modelos estiman una tabla de tasas por código; por eso la salida es una tasa por código y no un puntaje por unidad.

**¿Por qué solo el código de catálogo?** Es lo único que se conoce seguro al elegir: está en el parabrisas y en el programa del día. El historial no tiene marca de Gate Release y no podemos probar que exista al elegir.

**¿Y el historial de reparaciones?** Probado cuatro veces, la última con siete modelos contra su par sin historial: no aporta (AUC 0,53–0,54 con o sin historial). Con el supuesto conservador, entre el 89 % y el 95 % de los VIN no tiene eventos disponibles.

**¿Y los tiempos de ciclo y parámetros de ajuste?** No están en la base. Los pedimos a Ford el 18/09 y respondió que el dataset tenía lo necesario. No inventamos variables.

**¿Probaron más variables y más modelos?** Sí: 238 pipelines y 458.098 configuraciones, cada una de las 37 columnas restantes, solas y juntas, con y sin datos sintéticos. Agregarlas empeora; seguir buscando no produce una ganadora.

**¿Por qué la mejora es tan chica?** Porque la señal es chica: en selección, el oráculo con el código da 22,8 % contra 11,2 % al azar, y CatBoost 18,4 %. Lo que se puede mostrar es una mejora sostenida, no una diferencia grande.

**¿Por qué cae de 18,4 % a 12,0 %?** El azar también cae, de 11,2 % a 8,2 %, y puede haber optimismo por haber elegido la mejor en selección. No verificamos cuál pesa más.

**¿Cómo saben que no hay fuga?** Partición temporal con 5 días de margen, tasas solo con resultados de Día ≤ t−5, hiperparámetros dentro del entrenamiento y etiquetas de la prueba enmascaradas. La versión con fuga «gana» con 22,3 % en validación, y por eso sabemos que el margen importa.

**¿La prueba final ya se había mirado?** En parte: los experimentos exploratorios usaron esos días y se publicaron tasas por mercado. Además, al acordar la lectura de CatBoost el equipo ya conocía otra lectura previa. Lo declaramos en el preregistro; la cifra puede ser optimista.

**¿«Dónde mirar», el mínimo por código y el detector se midieron con CatBoost?** No: con el predictor de la primera etapa (ver la respuesta sobre otras lecturas). Si el equipo decide medirlos con CatBoost, sería solo en validación.

**¿Qué pasa si la hoja solo audita lo que prioriza?** Se pierde información del resto. Por eso el mínimo por código (una auditoría cada 40 días por código) y los días de control al implementar.

**¿Cuánto ahorra?** No lo afirmamos: Ford no pudo dar costos y la base es ficticia. Dejamos la fórmula: (precisión de la hoja − precisión al azar) × auditorías por día × costo evitado por calibración encontrada.

**¿Y si Ford consigue datos de proceso?** Es la única vía con margen grande, pero no se puede medir con esta base. Proponemos un piloto; la simulación con señal inventada no es una medición.

**¿Funciona para unidades sin actividad QLS?** No lo sabemos: la base no las tiene. La hoja sirve para todas porque el código se lee en el parabrisas, y en planta se miden por separado.

---

## Decisiones del equipo antes de ensayar

1. **CatBoost como única solución y único resultado (decisión del usuario, 01/10).** El texto hablado y la presentación muestran solo CatBoost; la tasa fija no se nombra salvo en los respaldos («Si preguntan» de la pantalla 8 y respuestas cortas). **Salvedad:** según `solucion/preregistro.json`, la tasa fija era la cifra oficial preregistrada y fue la primera lectura de la prueba final; la de CatBoost se acordó conociéndola (`preregistro-precision.json`, `ya_visto`). Por eso la pantalla 8 dice en voz alta «el equipo ya conocía otra lectura previa de la prueba final» y nunca debe decirse que fue la única lectura. Confirmar que todo el equipo acepta encabezar con CatBoost en esos términos. Los borradores [02-1](02-1-resumen-ejecutivo.md), [02-2](02-2-especificaciones-tecnicas.md), [03](03-factibilidad-economica.md) y [06](06-conclusiones.md) siguen diciendo que la cifra oficial es la tasa fija; hay que alinearlos o registrar la diferencia en #33.
2. **Lectura de Random Forest.** `prueba-final.json` tiene una cuarta corrida (01/10, `preregistro-efectividad.json`, 77 de 652) pedida sin acuerdo explícito del resto del equipo. `research/opcion-mas-precisa.md` y otros documentos todavía dicen que Random Forest «nunca se leyó en la prueba final». Ya no se muestra; actualizar esos documentos.
3. **Hojas del Día 190 y del Día 260.** Se generaron con la tasa fija (`p8.json`). El guion dice «predictor de la primera etapa». Decidir si se regeneran con CatBoost (solo cambia la columna de tasa).
4. **Piezas medidas con la tasa fija.** «Dónde mirar» (63,4 % contra 35,2 %), mínimo por código, detector y los 2,4 s se midieron con la tasa fija; el guion dice «evaluado con el predictor de la primera etapa» y remite a «Si preguntan» de la pantalla 8 para decir cuál es. Si se miden con CatBoost, solo en validación («prueba final no releída»).
5. **Rango del último bloque.** La tarjeta de la pantalla 7 dice «unos ±5 puntos» (como `solucion-tecnica-explicada.md` §7.2), pero `precision.json` da 13,4 %–21,5 % para 17,3 % (−3,9 / +4,1 puntos). El guion dice el rango exacto; conviene corregir la tarjeta a «unos ±4 puntos».
6. **Costos y horas.** Decidir si se restaura el bloque financiero del original como supuesto ilustrativo rotulado (ver cambio 2) o se mantiene solo la fórmula.
7. **Nombres de los integrantes y universidad** (portada y pases): completar los [COMPLETAR] y confirmar «Universidad Austral» para los tres.
8. **Presentación.** Confirmar que `contenido.js` tenga las pantallas 6, 7, 8 y 15 como asume este guion (elección por precisión, CatBoost con sus tres tarjetas, solo la lectura de CatBoost y las tres tarjetas de conclusiones).

---

## Tabla de cifras y fuentes

Todas sobre la base ficticia. Abreviaturas: `res/` = `solucion/resultados/`; `res/pf` = `res/prueba-final.json` (corridas[0] primera lectura, `preregistro.json`; [1] CatBoost, `preregistro-precision.json`, repetida en [2]; [3] Random Forest, `preregistro-efectividad.json`; tramo [0] salvo indicación); `res/prec` = `res/precision.json`.

| Cifra en el speech | Pantalla | Fuente |
| --- | --- | --- |
| 458.098 configuraciones; 238 pipelines individuales | 1, 6 | `research/busqueda-amplia.md`, tabla de configuraciones |
| Cupo cerca del 5 %; 0–5 días en playa; rondas de unas 2 horas | 2 | `docs/entrega/02-2-especificaciones-tecnicas.md`; `CONTEXT.md`; reunión del 22/09 (#5) |
| 195.808 eventos; 59.681 VIN; 6.079 CALIBRADA; 10,2 % | 3 | `research/audit-csv.json` (`rows`, `vins`, `vin_label_sets.CALIBRADA`) |
| 98 códigos | 3, 4 | `research/catalog-groups.json` (`cobertura.codigos_base`) |
| Unas 13 auditorías sobre unos 265 vehículos por día | 3 | `docs/entrega/04-valor-diferencial.md`, sección 2 (validación) |
| 90 % de unidades OK («nueve de cada diez») | 3 | Derivado de 10,2 % CALIBRADA (`research/audit-csv.json`) |
| Pedido a Ford del 18/09 | 4 | `research/consultas-ford.md`; `docs/entrega/preguntas-jurado.md` (3) |
| Componente presente en todas las filas CALIBRADA (20.817 de 20.817) y en ninguna OK | 4 | `research/eda-qls.md`; por VIN hasta el Día 194: `res/preparacion.json` (`componente_como_fuga_hasta_194`: 4.898 CALIBRADA con componente, 0 OK) |
| AUC exploratorio: historial ≈ 0,51 (0,514); cuatro algoritmos 0,557–0,563; tasa 0,558; oráculo 0,589; redes 0,53–0,545 | 4 | `research/experimentos-modelado.md`, secciones 2 y 3 (días 200–260) |
| Exploratorio: tasa móvil 13,2; tasa que no se actualiza 10,8; azar 8,3 cada 100 | 4 | `research/experimentos-modelado.md`, sección 4 (días 200–260) |
| Historial: siete modelos; 89 % a 95 % sin eventos; AUC 0,53–0,54 | 4, respuestas | `research/historial-vin.md`; `docs/entrega/02-2-especificaciones-tecnicas.md` |
| Área: 20,0 % contra 21,2 % | 4 (Si preguntan) | `research/eda-qls.md`; documento interno `solucion-tecnica-explicada.md` §4.1 |
| χ² 56,1 del mercado en validación, n = 8.038 | 4 (Si preguntan) | `research/catalogo-agrupacion.md`, observación 5 |
| Casi 196.000 eventos | 5 | Redondeo de 195.808 (`research/audit-csv.json`) |
| 14,5 % (Día 0–19) → 7,4 % (Día 240–259) | 5 | `docs/entrega/preguntas-jurado.md` (9); validación #7 |
| Particiones ≤149, 150–154, 155–194, 195–199, ≥200; Día 284; 5 días de margen | 5 | `research/validation-partitions.json`; `res/preparacion.json`; `prototipos/presentacion-3d/contenido.js` |
| 8.038 VIN en validación; 391 elegidos | 5, 6 | `res/p3.json` (`resultados[1].vins`, `.elegidos`) |
| 13.312 VIN; 652 elegidos; 68 días | 5, 8 | `res/pf` corridas[1] (`vins`, `elegidos`, `dias`) |
| Fuga 22,3 %; oráculo 20,2 % | 5, 6, respuestas | `res/p3.json` (`resultados[15]`, `resultados[14]`) |
| 4.910 VIN posteriores a DIA_260; 54.771 en la población principal | 5 (Si preguntan) | `res/preparacion.json` (`control_particiones`) |
| Primera etapa: 31 alternativas; 29 empatan | 6 (Si preguntan) | `res/eleccion.json` (`comparacion`); `res/p4.json` |
| Predictor de la primera etapa en validación: 15,1 % | 11 | `res/eleccion.json` (`ganadora`) |
| 37 columnas restantes | 6, respuestas | `research/busqueda-amplia.md`, catálogo del experimento, punto 3 |
| Señal inventada: unos 16 puntos (logística, 20,4 % → 36,7 %, 175–194) | 6 | `research/sensibilidad-proceso.md` (16,27 puntos) |
| Bloques 100–174 (cuatro) y 175–194; 54 alternativas; nueve familias de ML | 6, 7 | `res/precision.json` (`protocolo`, `ranking`) |
| Vida media 15 días; reentrenado cada 5 días; semilla 1 | 7 | `solucion/preregistro-precision.json` (`ganadora.parametros`); `res/pf` corridas[1] |
| CatBoost en selección 136 de 740, 18,4 % (15,6–21,2); por bloque 17,8 / 17,2 / 22,1 / 15,7 | 6, 7 | `res/prec` (`ganadora.precision_seleccion`, `precision_seleccion_rango95`, `precision_por_bloque`) |
| Azar en selección 11,2 % (por bloque 13,3 / 10,9 / 12,6 / 7,1); oráculo 22,8 % | 6, 7, respuestas | `res/prec` (`azar`, `oraculo`) |
| Random Forest con atributos 135, XGBoost con atributos 134 (de 740) | 6 | `res/prec` (`ranking[1]`, `ranking[2]`) |
| 21 % de los VIN de 50–99 con código en 100–149 | 7 | `research/opcion-mas-precisa.md`, observaciones |
| 17 a 18 % de las estimaciones que se actualizan | 7 | `research/opcion-mas-precisa.md`, punto 3 |
| Confirmación: CatBoost 39 de 225, 17,3 % (13,4–21,5), azar 8,8 %, 1,97 veces (1,54–2,46); 51 de 54 con más aciertos, hasta 7 más (46 de 225, 20,4 %, doce alternativas) | 7, respuestas | `res/prec` (`ganadora.confirmacion`; `ranking[*].confirmacion.calibrada_elegidas`) |
| Spearman −0,34 (p = 0,013); CatBoost última de las diez primeras en confirmación | 7, respuestas | `research/opcion-mas-precisa.md`, punto 1 |
| Diez primeros, 8 aciertos de diferencia (136 a 128 de 740) | 6 | `res/precision.json` (`ranking[0]` a `ranking[9]`) |
| CatBoost en validación 63 de 391 (16,1 %); Random Forest peor lectura 17,7 % (18,7 / 17,7 / 20,0) | 7 (Si preguntan) | `res/precision.json` (`validacion_original_155_194`); `research/opcion-mas-precisa.md`, elección por efectividad |
| Simulación: ≈0,7 puntos (+0,68; +0,18 a +1,18; 24 de 24); +0,34 (−0,29 a +0,88) | 7 (Si preguntan) | `research/simulacion-evaluacion.md` |
| Mercado y versión, unos 3 a 4 puntos (hipótesis) | 7 (Si preguntan) | `docs/entrega/06-conclusiones.md`, hipótesis |
| Primera lectura (preregistro del 30/09): 71 de 652, 10,9 % (8,3–13,6), 8,2 %, 1,32 (1,01–1,64), límite inferior +0,07 puntos | 8 (Si preguntan: otras lecturas), respuestas | `res/pf` corridas[0] (`precision_cupo`, `precision_rango95`, `azar_mismo_cupo`, `veces_azar`, `diferencia_con_azar_rango95`) |
| CatBoost en la prueba final: 78 de 652, 12,0 % (9,2–14,8), azar 8,2 %, 1,45 (1,14–1,76), diferencia +1,2 a +6,3 puntos; unas 54 al azar con el mismo cupo (652 × 0,0823) | 8, 13, 15, respuestas | `res/pf` corridas[1] (repetida en corridas[2]) |
| Lectura de Random Forest: 77 de 652, 11,8 % (9,2–14,6), 1,44 (1,13–1,76) | 8 (Si preguntan: otras lecturas), respuestas | `res/pf` corridas[3]; `solucion/preregistro-efectividad.json` (`acuerdo`) |
| CatBoost por tramos: ≤260, 77 de 631, 12,2 % (9,4–15,3) contra 8,3 %, 1,47 (1,16–1,81); >260, 21 elegidos; con la cohorte (n = 18.222) 8,8 % contra 6,0 % | 8 | `res/pf` corridas[1], tramos[1], [2] y [3] |
| Caída del azar 11,2 % (selección) → 8,2 % (prueba) | 8, respuestas | `res/prec` (`azar`); `res/pf` corridas[1] |
| Hoja del Día 190: 297 unidades, 28 códigos, cupo 14, 2 filas de mínimo, 0 VIN | 9 | `res/p8.json` |
| Dónde mirar, prueba final (predictor de la primera etapa): 71 CALIBRADA, 63,4 % contra 35,2 % | 10 | `res/pf` corridas[0] (`piezas.p6…prueba_final`) |
| Dónde mirar, validación: 59 CALIBRADA, 61,0 % contra 30,5 % | 10 (Si preguntan) | `res/p6.json` (`componente.calibrada_elegidas_por_la_ganadora`) |
| 20 % al azar: 15,1 % → 13,8 %; mínimo por código P = 40, 15,3 % | 11 | `res/p5.json` (`resultados[5]`, `resultados[2]`, `minimo_por_codigo.P`) |
| Mínimo por código en la prueba final 10,6 % (8,0–13,3), 1,29 veces | 11 (Si preguntan) | `res/pf` corridas[0] (`piezas.p5`); `docs/entrega/06-conclusiones.md` |
| Detector: 1 falsa alarma cada 30 días; 90,8 %, 10 días; 66,9 %, 16 días; 7 alarmas en 40 días; 16 en 85 días | 11 | `res/p6.json` (`detector`); `res/pf` corridas[0] (`piezas.p6.resultado.detector.alarmas`) |
| Cuatro marcos (ISO/IEC 27001, IEC 62443, Ley 25.326, NIST CSF 2.0); AAIP 47/2018 | 12 | `docs/entrega/02-3-seguridad-privacidad.md` |
| 2,4 s por corrida (2,2 + 0,2); 18 modelos × 8 reentrenamientos en unos 50 s | 13 | `docs/entrega/03-factibilidad-economica.md`, secciones de tiempo y escenarios |
| USD 24,5 por mes (t3.small São Paulo, USD 0,0336/h × 730 h); USD 0,02–0,07 por hora | 13 | `docs/entrega/03-factibilidad-economica.md`, sección 4 |
| CatBoost: 3,7 calibraciones más cada 100 (1,2 a 6,3 puntos) | 13 | `res/pf` corridas[1]: 0,1196 − 0,0823 y `diferencia_con_azar_rango95` |
| Días de control simulados: 1,35 veces (0,75–2,47) | 14 (Si preguntan) | `res/p5.json`; `docs/entrega/04-valor-diferencial.md`, sección 2 |
| Ocho próximos pasos | 15 | `docs/entrega/06-conclusiones.md` |
