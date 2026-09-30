# 2.1 Resumen ejecutivo

Sección 2.1 del Informe (E2), de **media carilla como máximo** ([alcance de entrega][alc]). Las tres versiones (mejora, inconcluso, peor) se escribieron **antes** de la corrida única de la prueba final, como pide el [plan][plan-com]. La corrida dio **mejora** y el equipo eligió esa versión (sesión conjunta del 30/09, [#33][i33]); las otras dos quedan en el historial de Git. El criterio no se reescribió: mejora si el rango completo de la diferencia con el azar queda por encima de cero ([mejora útil][mej], punto 9).

La versión lleva el calificador QLS y los límites fijos ([validación][val], punto 8; [base QLS][qls], punto 2):

1. el tramo de prueba ya se había explorado en experimentos anteriores;
2. la tasa por mercado de destino dentro de la prueba ya se había visto;
3. que los auditados se eligen al azar es un supuesto de Ford;
4. en planta solo se conocería el resultado de lo que se audita;
5. el Día del VIN aproxima el día de la auditoría.

X = precisión en el cupo de la opción elegida e Y = precisión esperada al azar con el mismo cupo, ambas en la prueba final con su rango del 95 % ([`prueba-final.json`][final], corrida 1).

---

## Resumen ejecutivo

**Qué hace.** Proponemos una **hoja de códigos prioritarios**: cada mañana ordena los códigos de catálogo que se van a producir según su tasa de calibración histórica e indica cuántas unidades de cada código derivar a Auditoría Adicional para llenar el cupo del día. La tasa se revisa periódicamente y un detector de cambios avisa entre revisiones. El analista lee el código en el parabrisas. No cambia la cantidad de auditorías: cambia cuáles se eligen.

**Resultado.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200, n = 13.312 VIN, 652 elegidos en 68 días), de cada 100 elegidos se calibrarían **10,9** (rango del 95 %: 8,3–13,6), contra **8,2** al azar con el mismo cupo: 1,32 veces el azar (1,01–1,64). Es **mejora**, pero por poco: el límite inferior de la diferencia con el azar es de 0,07 puntos. Con el tramo ≤260 (n = 13.135 VIN) da 11,1 contra 8,3. En validación la misma opción había dado 15,1, así que la cifra de la prueba es más baja; puede haber optimismo por haberla elegido en validación, y no lo verificamos. La opción, la tasa de calibración de cada código calculada con el histórico, se eligió en validación entre 31 alternativas, desde esa tasa hasta nueve familias de ML, y se leyó una sola vez en la prueba.

**Por qué es viable.** Usa un dato que ya está en la etiqueta del parabrisas, se recalcula en segundos con un script y no necesita nube ni datos personales.

**Límites.** El tramo de prueba y la tasa por mercado ya se habían mirado; la selección al azar de los auditados es un supuesto de Ford; en planta solo se conoce lo auditado; el Día del VIN es aproximado. No es una medición de planta.

**Próximo paso.** La base respalda implementar la hoja y medirla en planta con **días de control** (días alternados al azar) y un **mínimo por código**.

---

## Notas para el armado

- En validación ganó la alternativa más simple, la tasa fija (29 de 31 alternativas empataron; [`eleccion.json`][elec]). Se presenta como hallazgo: con el código como único predictor, el valor está en cómo se usa la tasa y no en el algoritmo ([plan][plan-com]).
- Y se toma como la precisión esperada al azar con el mismo cupo diario (el campo `azar_mismo_cupo` de los resultados), no como un sorteo simulado. Decidido en la sesión conjunta del 30/09 ([#33][i33]).
- n y cupo de la prueba final salen de [preparacion.json][prep] (conteos sin etiquetas); las cifras de la corrida, de [`prueba-final.json`][final].

[alc]: ../alcance-entrega.md#qué-exigen-los-templates
[plan-com]: ../plan-de-accion.md#cómo-se-comunican-los-resultados
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
[prep]: ../../solucion/resultados/preparacion.json
[elec]: ../../solucion/resultados/eleccion.json
[final]: ../../solucion/resultados/prueba-final.json
[i33]: https://github.com/FordwardAI/ford-predictive-quality/issues/33
