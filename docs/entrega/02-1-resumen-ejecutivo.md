# 2.1 Resumen ejecutivo

Sección 2.1 del Informe (E2), de **media carilla como máximo** ([alcance de entrega][alc]). La solución **se iteró** y la prueba final se leyó tres veces; el detalle está en [cómo se iteró la solución][iter]. Las versiones del resumen (mejora, inconcluso, peor) se escribieron **antes** de la primera lectura, como pide el [plan][plan-com]. El criterio no se reescribió: es mejora si el rango completo de la diferencia con el azar queda por encima de cero ([mejora útil][mej], punto 9).

El resumen lleva el calificador QLS y los límites fijos ([validación][val], punto 8; [base QLS][qls], punto 2):

1. el tramo de prueba ya se había explorado en experimentos anteriores;
2. la tasa por mercado de destino dentro de la prueba ya se había visto;
3. que los auditados se eligen al azar es un supuesto de Ford;
4. en planta solo se conocería el resultado de lo que se audita;
5. el Día del VIN aproxima el día de la auditoría.

X es la precisión en el cupo de CatBoost e Y, la precisión esperada al azar con el mismo cupo. Ambas son de la prueba final, con su rango del 95 % ([`prueba-final.json`][final], `corridas[1]`).

---

## Resumen ejecutivo

**Qué hace.** Proponemos una **hoja de códigos prioritarios**. Cada mañana ordena los códigos de catálogo que se van a producir y dice cuántas unidades de cada código derivar a Auditoría Adicional para llenar el cupo del día. El orden lo da un modelo **CatBoost con el código de catálogo y sus atributos** (mercado, motor, tracción y versión). El modelo se reentrena solo cada 5 días con lo auditado, y un detector de cambios avisa entre reentrenamientos. El analista lee el código en el parabrisas. No cambia la cantidad de auditorías: cambia cuáles se eligen.

**Resultado.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200, n = 13.312 VIN, 652 elegidos en 68 días), de cada 100 elegidos por CatBoost se calibrarían **12,0** (rango del 95 %: 9,2–14,8), contra **8,2** al azar con el mismo cupo. Son 1,45 veces el azar (1,14–1,76): **mejora**, y el límite inferior de la diferencia con el azar es de 1,2 puntos. Con el tramo ≤260 (n = 13.135 VIN) da 12,2 contra 8,3.

**Cómo llegamos.** La solución se iteró:
- **Primera etapa:** el criterio era elegir la alternativa más simple, y ganó la tasa fija por código. Su lectura de la prueba final dio 10,9 contra 8,2.
- **Segunda etapa:** el criterio pasó a ser la precisión, medida en cinco bloques de tiempo entre 54 alternativas, y ganó CatBoost (18,4 contra 11,2 en selección).
- **Advertencia:** la lectura de CatBoost es **más débil**, porque se acordó cuando ya conocíamos la primera, y CatBoost es la mejor de una familia que empata.

**Por qué es viable.** Usa un dato que ya está en la etiqueta del parabrisas, se reentrena en segundos sin intervención y no necesita datos personales.

**Límites.** El tramo de prueba y la tasa por mercado ya se habían mirado. Que los auditados se eligen al azar es un supuesto de Ford. En planta solo se conoce lo auditado, y el Día del VIN es aproximado. No es una medición de planta.

**Próximo paso.** Implementar la hoja y medirla en planta con **días de control** (días alternados al azar) y un **mínimo por código**.

---

## Notas para el armado

- Lo que se aprendió en la primera etapa sigue valiendo: con el código como predictor, el valor está en cómo se usa la tasa y no en el algoritmo. En la segunda etapa, lo que separa a las mejores alternativas es que **se actualizan** y se apoyan en el mercado cuando rota la mezcla de códigos ([`precision.json`][prec]; [opción más precisa][omp]).
- Y es la precisión esperada al azar con el mismo cupo diario (el campo `azar_mismo_cupo`), no un sorteo simulado. Se decidió en la sesión conjunta del 30/09 ([#33][i33]).
- n y el cupo de la prueba final salen de [preparacion.json][prep] (conteos sin etiquetas). Las cifras de las lecturas salen de [`prueba-final.json`][final].

[alc]: ../alcance-entrega.md#qué-exigen-los-templates
[iter]: 02-2-especificaciones-tecnicas.md#cómo-se-iteró-la-solución
[plan-com]: ../plan-de-accion.md#cómo-se-comunican-los-resultados
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
[prep]: ../../solucion/resultados/preparacion.json
[prec]: ../../solucion/resultados/precision.json
[omp]: ../../research/opcion-mas-precisa.md
[final]: ../../solucion/resultados/prueba-final.json
[i33]: https://github.com/FordwardAI/ford-predictive-quality/issues/33
