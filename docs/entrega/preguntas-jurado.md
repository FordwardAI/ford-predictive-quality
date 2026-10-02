# Preguntas probables del jurado

Borrador de apoyo para el bloque de preguntas (~10 minutos) de la presentación (E1). Respuestas cortas, para decir en voz alta, con su fuente. El jurado se supone mixto, técnico y de planta ([plan][plan-pend]). Las cifras de validación y de la prueba final llevan su calificador. La solución es **CatBoost con atributos del código, reentrenado cada 5 días**; la iteración está en [cómo se iteró la solución][iter].

## Sobre el enfoque y el modelo

**1. La ficha pide un modelo de ML. ¿Qué modelo usan?**
CatBoost, un modelo de árboles de decisión, con el código de catálogo y lo que se lee de él: mercado, motor, tracción y versión. Se reentrena solo cada 5 días con lo auditado. Llegamos en dos etapas:
- **Primera:** la regla desempataba por simplicidad, 29 de 31 alternativas empataron y ganó una tasa fija por código ([`eleccion.json`][elec]).
- **Segunda:** elegimos por precisión entre 54 alternativas en cinco bloques de tiempo, y ganó CatBoost, con 18,4 % en selección contra 11,2 % al azar ([`precision.json`][prec]).

No decimos que sea el mejor algoritmo: es la más precisa de una familia que empata. Lo que importa es que la tasa se actualice y se apoye en el mercado.

**2. ¿Por qué el predictor es el código de catálogo?**
Porque el código, y lo que se lee de él, es lo único que se sabe con certeza al momento de elegir: está en el parabrisas y se conoce desde el programa de producción ([operación][ope], puntos 5 y 6). El historial no tiene marca de Gate Release, así que no se puede probar que existiera al elegir ([admisibilidad][adm], puntos 3 y 4).

**3. El desafío habla de tiempos de ciclo, parámetros de ajuste e interacciones. ¿Dónde están?**
No están en la base. Los pedimos a Ford el 18/09 y Ford respondió que el dataset entregado tenía lo necesario ([consultas a Ford][cfo]). Las interacciones entre posiciones del código las captan los modelos de ML con atributos, como CatBoost ([`precision.json`][prec]).

**4. El historial de reparaciones es casi todo el dataset. ¿Por qué no lo usan?**
Por disponibilidad: puede incluir eventos posteriores al momento de elegir, porque entre Gate Release y la auditoría pasan de 0 a 5 días ([admisibilidad][adm], punto 4). Además, en los experimentos exploratorios dio AUC de 0,50 a 0,52, como el azar ([experimentos][exp]). Igual lo evaluamos en un anexo con la misma partición: solo con historial, 8,7–9,0 % en el cupo contra 9,9 % esperado al azar; sumado al código, no mejora al código solo, entre auditados con actividad QLS, validación 155–194, base ficticia, n = 8.038 VIN ([`p6.json`][p6]).

**5. ¿Probaron redes neuronales, boosting, ensambles?**
Sí: logística, Naive Bayes, Random Forest, XGBoost, LightGBM, CatBoost, MLP, promedio y stacking, en modo fijo y reentrenado, con el código solo y con sus atributos ([alternativas][alt], punto 3; [`precision.json`][prec]). Con atributos, CatBoost, Random Forest y XGBoost quedaron arriba, a pocos aciertos entre sí (18,4 %, 18,2 % y 18,1 % en selección). En el último bloque, con la mezcla de códigos estable, casi todas empatan.

**6. ¿Por qué priorizan códigos y no vehículos?**
Porque con el código como predictor, dos unidades del mismo código son indistinguibles. Mostrar un puntaje por vehículo daría una precisión individual que no existe ([salida para Calidad][sal], puntos 1 y 2).

**7. ¿Qué variable explica la prioridad?**
El mercado de destino, que fija la posición 3 del código. Es el único atributo de la agrupación que sostiene la señal en validación (χ² 56,1, entre auditados con actividad QLS, validación 155–194, base ficticia, n = 8.038 VIN) ([agrupación del catálogo][cat]).

## Sobre la validación

**8. ¿Cómo saben que no hay fuga de información?**
Partición temporal con 5 días de margen, tasas calculadas solo con resultados de Día ≤ t−5, hiperparámetros ajustados dentro del entrenamiento y etiquetas de la prueba enmascaradas en el código ([validación][val]; [`preparacion.json`][prep]). Además mostramos la versión con fuga: «gana» con 22,3 % en validación y por eso sabemos que el margen importa ([`p3.json`][p3]).

**9. ¿Por qué no un split aleatorio?**
Porque la proporción CALIBRADA baja con el tiempo: de 14,5 % (Día del VIN 0–19) a 7,4 % (Día 240–259), entre auditados con actividad QLS, población principal, base ficticia, n = 54.771 VIN ([validación][val], observaciones). Un split mezclado inflaría el resultado ([validación][val], punto 1).

**10. ¿Por qué 5 días de margen?**
Es el máximo que informó Ford entre Gate Release y la auditoría ([reunión del 22/09][reu]).

**11. ¿Por qué cambiaron de la tasa fija a CatBoost?**
Porque con la regla de la primera etapa casi todo empataba y ganaba la más simple, sin que la validación de 35 días pudiera separar a las alternativas. Cambiamos el criterio a la precisión y medimos en cinco bloques de tiempo, con 965 elegidos en vez de 391. Ahí se vio lo robusto: cerca del Día 100 rota la mezcla de códigos y la tasa fija cae a 12,7 %, mientras las que se actualizan se sostienen en 17–18 % ([`precision.json`][prec]; [opción más precisa][omp]).

**12. ¿Cuánta diferencia puede detectar la validación?**
Con 391 elegidos, el rango de la precisión en el cupo es de unos ±3,4 a ±4,5 puntos: separa del azar, pero casi no separa a las alternativas entre sí ([`p3.json`][p3]; [plan][plan-inc], incompatibilidad 11).

**13. ¿La prueba final ya se había mirado?**
Sí, en parte: los experimentos exploratorios usaron ese tramo y se publicaron tasas por mercado dentro de él. Lo declaramos en el preregistro y en los límites; la cifra puede ser optimista ([validación][val], punto 2; [plan][plan-inc], incompatibilidad 4). Además, la leímos tres veces, cada una con su preregistro:
- tasa fija: 10,9 % contra 8,2 % al azar;
- CatBoost: 12,0 %, 1,45 veces el azar;
- Random Forest: 11,8 %.

La de CatBoost se acordó conociendo la primera, y por eso es una lectura más débil. Las tres superan al azar ([cómo se iteró][iter]).

**14. ¿Por qué precisión en el cupo y no AUC o accuracy?**
Porque la decisión es elegir un número fijo de unidades por día. Importa cuántas de las elegidas se calibran. El AUC queda como diagnóstico ([mejora útil][mej], punto 6).

**15. ¿Qué pasa si el resultado es inconcluso?**
Lo decimos así, con las dos causas posibles sin elegir ninguna: falta de señal en el código o etiquetas ficticias sin relación con él. La forma de saberlo es medir en planta con días de control ([plan][plan-com]).

**16. ¿Qué pasó después de DIA_260?**
Los 4.910 VIN que empiezan después son todos OK. Ford analiza una posible mejora en planta, sin confirmarla; nosotros no le asignamos causa. Quedan fuera de la población principal y entran en una sensibilidad ([admisibilidad][adm], punto 2; [validación][val], punto 7).

## Sobre la base y los límites

**17. ¿Por qué repiten «entre auditados con actividad QLS»?**
Porque Ford aclaró que la base solo tiene auditados que además tuvieron incidencias en QLS. Las tasas valen para esa población, no para todos los auditados ([base QLS][qls], punto 2).

**18. ¿Funciona para las unidades sin actividad QLS?**
No lo sabemos: la base no las tiene. La hoja se propone para todas las unidades porque el código se lee en el parabrisas, y en planta se miden por separado ([base QLS][qls], puntos 4 y 7).

**19. ¿Qué limita que la base sea ficticia?**
Las cifras muestran que el método funciona o no sobre esa base. No prueban impacto ni ahorro en planta ([validación][val], punto 8; [ficha técnica][ficha]).

**20. ¿Cuánto ahorra la solución?**
No lo afirmamos: Ford no pudo dar costos y la base es ficticia. Dejamos la fórmula para que Ford la aplique: (precisión de la hoja − precisión al azar) × auditorías por día × costo evitado por calibración encontrada ([factibilidad](03-factibilidad-economica.md)).

## Sobre la operación

**21. ¿Qué necesita la planta para implementarlo?**
Una exportación diaria de QLS con los resultados de auditoría, el programa del día, el cupo de Calidad de Planta y una notebook o un servidor donde correr la [plataforma](../../plataforma/README.md) ([trabajo futuro](05-trabajo-futuro.md)).

**22. ¿Cuánto cuesta?**
No tiene licencias ni necesita nube. Corre en equipo existente. Como techo, una VM chica en la nube cuesta del orden de USD 0,02 a 0,07 por hora según tamaño y región (precios públicos consultados el 29/09/2026) ([factibilidad](03-factibilidad-economica.md)).

**23. ¿Cómo maneja un código nuevo?**
Usa la tasa general, o la de su mercado en la variante de mercado, hasta tener resultados propios. En validación hubo 3 códigos nuevos con 119 VIN ([`preparacion.json`][prep]; [plan][plan-reg]).

**24. ¿Qué pasa si un código de la hoja no llega a la playa?**
La cantidad pendiente pasa a los códigos siguientes del ranking que sí llegaron; solo se completa al azar si se agota el ranking ([CONTEXT.md][ctx], «Hoja de códigos prioritarios»).

**25. Si la hoja siempre elige los mismos códigos, ¿cómo se entera de que otro empeoró?**
Con el mínimo por código: cada código recibe por rotación al menos una auditoría cada cierto período, y el detector de cambios avisa si su tasa se mueve ([base QLS][qls], punto 5). En validación, con el predictor de la primera etapa, se eligió una auditoría por código cada 40 días, que mantuvo 15,3 % en el cupo; el detector encontró el 90,8 % de las subas sintéticas al doble, con demora mediana de 10 días ([`p5.json`][p5]; [`p6.json`][p6]).

**26. ¿Por qué no dejar un 20 % al azar para siempre?**
Porque, si la hoja rinde más que el azar, ese 20 % cuesta calibraciones todos los días. Los días de control miden la hoja solo durante la implementación, y después la hoja orienta todo el cupo ([base QLS][qls], punto 5).

**27. ¿Cuánto tiempo haría falta en planta para ver si funciona?**
No lo podemos calcular sin datos reales de planta: depende de la tasa y del cupo reales. Queda para calcularlo con los primeros datos ([base QLS][qls], punto 7).

**28. ¿Introduce un riesgo de ciberseguridad?**
Limita su exposición: lee una exportación, no se conecta a la red de automatización, no usa nube ni LLM y no usa datos personales. Para operar en la red de planta hacen falta usuarios, permisos, comunicación cifrada y recuperación aprobados por IT. Si falla, se elige al azar como hoy ([seguridad y privacidad](02-3-seguridad-privacidad.md)). La evolución en tiempo real correría en el GCP de Ford, con conexión solo saliente desde planta (pregunta 32).

**29. ¿Qué aporta más allá de la selección?**
«Dónde mirar» (qué componente revisar primero), el detector de cambios por código y un insumo para la subcategorización del catálogo ([valor diferencial](04-valor-diferencial.md)).

**30. ¿Se puede replicar en otras plantas?**
Sí, si tienen un código de catálogo visible, resultados de auditoría con fecha y un cupo diario. Cada planta corre su propia hoja ([trabajo futuro](05-trabajo-futuro.md)).

## Sobre la evolución en tiempo real (feedback del 02/10)

**31. ¿Pueden dar un puntaje al final de la línea con los parámetros de producción?**
Sí, como evolución de la hoja: el mismo servicio, al terminar la línea y antes de Gate Release, suma al código los parámetros publicados hasta ese momento. Con solo el código da la hoja actual. Sin datos reales de parámetros no sabemos cuánto mejora; por eso arranca en sombra y se compara con el catálogo solo en un período nuevo ([puntaje de fin de línea](05-1-scoring-fin-de-linea.md)).

**32. ¿Usarían MQTT y Pub/Sub?**
Pub/Sub para todo. MQTT donde la fuente sea un equipo de planta (herramientas de apriete, PLC, metrología), con el broker en la DMZ y salida solo hacia GCP. Las aplicaciones como QLS publicarían directo en Pub/Sub. Todo termina en el BigQuery que Ford ya usa ([arquitectura](05-1-scoring-fin-de-linea.md#arquitectura-en-gcp)).

**33. ¿Podrían retener un VIN antes de Gate Release?**
Como sugerencia con sus motivos, y la decisión queda en Calidad de Ford. Primero en sombra («se habría retenido» contra el resultado posterior), porque en la base ficticia el historial del VIN no separó calibradas. El sistema nunca escribe en QLS, el MES ni los controladores ([evaluación en vivo](05-1-scoring-fin-de-linea.md#evaluación-en-vivo)).

[ctx]: ../../CONTEXT.md
[iter]: 02-2-especificaciones-tecnicas.md#cómo-se-iteró-la-solución
[prec]: ../../solucion/resultados/precision.json
[omp]: ../../research/opcion-mas-precisa.md
[ficha]: ../fuentes/documentation.md
[exp]: ../../research/experimentos-modelado.md
[cat]: ../../research/catalogo-agrupacion.md
[cfo]: ../../research/consultas-ford.md
[p3]: ../../solucion/resultados/p3.json
[elec]: ../../solucion/resultados/eleccion.json
[p4]: ../../solucion/resultados/p4.json
[p5]: ../../solucion/resultados/p5.json
[p6]: ../../solucion/resultados/p6.json
[prep]: ../../solucion/resultados/preparacion.json
[plan-pend]: ../plan-de-accion.md#pendientes-con-default
[plan-com]: ../plan-de-accion.md#cómo-se-comunican-los-resultados
[plan-inc]: ../plan-de-accion.md#incompatibilidades-y-cómo-se-resuelven
[plan-reg]: ../plan-de-accion.md#reglas-que-no-cambian
[adm]: https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804466671
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[alt]: https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998
[sal]: https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
[reu]: https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330
