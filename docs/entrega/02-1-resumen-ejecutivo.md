# 2.1 Resumen ejecutivo: tres versiones

Borrador para la sección 2.1 del Informe (E2), que admite **media carilla como máximo** ([alcance de entrega][alc]). Las tres versiones se escriben **antes** de la corrida única de la prueba final, como pide el [plan][plan-com]. Después de la corrida se usa la versión que corresponda a la lectura, sin reescribir el criterio: mejora si el rango completo de la diferencia con el azar queda por encima de cero, inconcluso si lo incluye y peor si queda entero por debajo ([mejora útil][mej], punto 9).

Las tres llevan el calificador QLS y los mismos límites fijos ([validación][val], punto 8; [base QLS][qls], punto 2):

1. el tramo de prueba ya se había explorado en experimentos anteriores;
2. la tasa por mercado de destino dentro de la prueba ya se había visto;
3. que los auditados se eligen al azar es un supuesto de Ford;
4. en planta solo se conocería el resultado de lo que se audita;
5. el Día del VIN aproxima el día de la auditoría.

Valores que se completan con la corrida: X = precisión en el cupo de la opción elegida, Y = precisión esperada al azar con el mismo cupo, ambas en la prueba final, con su rango del 95 %. [pendiente: P7]

---

## Versión A: mejora

**Qué hace.** Proponemos una **hoja de códigos prioritarios**: cada mañana ordena los códigos de catálogo que se van a producir según su tasa reciente de calibración e indica cuántas unidades de cada código derivar a Auditoría Adicional para llenar el cupo del día. El analista lee el código en el parabrisas. No cambia la cantidad de auditorías: cambia cuáles se eligen.

**Resultado.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200), de cada 100 elegidos se calibrarían [pendiente: P7 — X], contra [pendiente: P7 — Y] al azar (rango del 95 %: [pendiente: P7]), con n = 13.312 VIN y 652 elegidos en 68 días. La opción, la tasa de calibración de cada código calculada con el histórico, se eligió en validación entre 31 alternativas, desde esa tasa hasta nueve familias de ML, y se leyó una sola vez en la prueba.

**Por qué es viable.** Usa un dato que ya está en la etiqueta del parabrisas, se recalcula en segundos con un script y no necesita nube ni datos personales.

**Límites.** El tramo de prueba y la tasa por mercado ya se habían mirado; la selección al azar de los auditados es un supuesto de Ford; en planta solo se conoce lo auditado; el Día del VIN es aproximado. No es una medición de planta.

**Próximo paso.** La base respalda implementar la hoja y medirla en planta con **días de control** (días alternados al azar) y un **mínimo por código**.

---

## Versión B: inconcluso

**Qué hace.** Proponemos una **hoja de códigos prioritarios**: cada mañana ordena los códigos de catálogo del día según su tasa reciente de calibración e indica cuántas unidades de cada código derivar a Auditoría Adicional, sin cambiar la cantidad de auditorías.

**Resultado.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200, n = 13.312 VIN, 652 elegidos en 68 días), la base **no permite distinguir** el resultado del azar: de cada 100 elegidos se calibrarían [pendiente: P7 — X], contra [pendiente: P7 — Y] al azar, con un rango del 95 % que incluye la referencia ([pendiente: P7]). Hay dos causas posibles y la base no permite elegir entre ellas: que el código de catálogo no tenga señal, o que las etiquetas ficticias no tengan relación con él.

**Por qué igual es viable medirlo.** La hoja usa un dato del parabrisas, corre en segundos y no necesita nube ni datos personales.

**Límites.** El tramo de prueba y la tasa por mercado ya se habían mirado; la selección al azar de los auditados es un supuesto de Ford; en planta solo se conoce lo auditado; el Día del VIN es aproximado.

**Próximo paso.** La forma de saberlo es en planta: implementar la hoja con **días de control** alternados al azar, que miden la hoja frente al método actual en las mismas condiciones.

---

## Versión C: peor

**Qué hace.** Evaluamos una **hoja de códigos prioritarios** que ordena los códigos de catálogo del día según su tasa reciente de calibración, con el mismo cupo de auditorías que hoy.

**Resultado.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200, n = 13.312 VIN, 652 elegidos en 68 días), el rango completo queda **por debajo del azar**: de cada 100 elegidos se calibrarían [pendiente: P7 — X], contra [pendiente: P7 — Y] al azar (rango del 95 %: [pendiente: P7]). Con esta base, **no proponemos reemplazar la selección al azar**.

**Qué se conserva.** [pendiente: P7 — pieza del diferencial que se haya sostenido en la prueba, por ejemplo «dónde mirar»; si ninguna se sostuvo, se dice así.] El método de evaluación sin fuga y la hoja quedan listos para medirse con datos reales.

**Límites.** El tramo de prueba y la tasa por mercado ya se habían mirado; la selección al azar de los auditados es un supuesto de Ford; en planta solo se conoce lo auditado; el Día del VIN es aproximado.

**Próximo paso.** Medir en planta con **días de control** antes de adoptar la hoja.

---

## Notas para el armado

- En validación ganó la alternativa más simple, la tasa fija (29 de 31 alternativas empataron; [`eleccion.json`][elec]). Se presenta como hallazgo: con el código como único predictor, el valor está en cómo se usa la tasa y no en el algoritmo ([plan][plan-com]).
- Y se toma como la precisión esperada al azar con el mismo cupo diario (el campo `azar_mismo_cupo` de los resultados), no como un sorteo simulado. Ver la nota en [README](README.md#para-decidir-en-equipo).
- n y cupo de la prueba final salen de [preparacion.json][prep] (conteos sin etiquetas). La cantidad de CALIBRADA de la prueba no se cita antes de la corrida.

[alc]: ../alcance-entrega.md#qué-exigen-los-templates
[plan-com]: ../plan-de-accion.md#cómo-se-comunican-los-resultados
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
[prep]: ../../solucion/resultados/preparacion.json
[elec]: ../../solucion/resultados/eleccion.json
