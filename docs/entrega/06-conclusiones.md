# 6. Conclusiones

Borrador para la sección 6 del Informe (E2) y el separador 06 de la presentación. El template pide «próximos pasos concretos» hacia la implementación ([plan][plan-rev], templates). El párrafo de resultado se elige después de la corrida única entre las tres versiones escritas antes ([resumen ejecutivo](02-1-resumen-ejecutivo.md)).

## Resultado

Elegir una de las tres, según la lectura de la prueba final ([mejora útil][mej], punto 9):

- **Mejora.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200, n = 13.312 VIN, 652 elegidos en 68 días), la hoja encontró [pendiente: P7 — X] calibraciones cada 100 elegidos, contra [pendiente: P7 — Y] al azar (rango del 95 %: [pendiente: P7]).
- **Inconcluso.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (n = 13.312 VIN), la base no permite distinguir el resultado del azar ([pendiente: P7]). Puede deberse a falta de señal en el código o a etiquetas ficticias sin relación con él; la base no permite elegir entre las dos.
- **Peor.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (n = 13.312 VIN), el rango completo quedó por debajo del azar ([pendiente: P7]). No proponemos reemplazar el azar.

Siempre se agregan los límites fijos: el tramo de prueba y la tasa por mercado ya se habían mirado, la selección al azar de los auditados es un supuesto de Ford, en planta solo se conocería lo auditado y el Día del VIN es aproximado ([plan][plan-com]).

## Qué aprendimos

### Observaciones

- En validación, 29 de las 31 alternativas elegibles (referencias y ML) empataron con la de mayor precisión; la regla eligió la más simple, la tasa fija, con 15,1 % (11,6–18,8) contra 9,9 % esperado al azar, 1,53 veces el azar, entre auditados con actividad QLS, validación 155–194, base ficticia, n = 8.038 VIN ([`eleccion.json`][elec]).
- Con etiquetas parciales, el mínimo por código (P = 40) conserva esa precisión: 15,3 % (11,9–19,1) ([`p5.json`][p5]).
- «Dónde mirar» acertó el componente en 36 de las 59 CALIBRADA que eligió la tasa fija (61,0 %), contra 18 de 59 (30,5 %) con la lista general, en validación ([`p6.json`][p6]).
- El techo con el código como predictor (oráculo) es 20,2 % en el mismo cupo y la misma base ([`p3.json`][p3]).
- La señal del código se explica sobre todo por el mercado de destino ([agrupación del catálogo][cat]).

### Hipótesis

- Con un único predictor, el valor está en cómo se usa la tasa y no en el algoritmo ([alternativas][alt], idea que ordena el ticket). La validación es compatible con eso: nueve familias de ML, en dos modos, no superaron a la tasa fija más allá del empate ([`p4.json`][p4]). La prueba final lo contrasta solo para la opción elegida: [pendiente: P7].

### Decisiones acordadas

- El código de catálogo es el único predictor; el historial queda fuera hasta que se pruebe su disponibilidad al elegir ([admisibilidad][adm]).
- La hoja prioriza códigos, no vehículos, y no muestra «probabilidad de la unidad» ([salida para Calidad][sal]).

## Valor para Ford

- **Mismas auditorías, mejor elegidas.** No cambia el cupo ni la capacidad, cambia qué unidades se eligen ([mejora útil][mej], punto 3).
- **Usa lo que ya está a la vista:** el código del parabrisas y el programa del día ([operación][ope]).
- **Explicable:** cada prioridad se lee como la tasa reciente de una versión y un mercado.
- **Sin riesgo operativo:** si la hoja no está, se elige al azar como hoy ([seguridad y privacidad](02-3-seguridad-privacidad.md)).
- **Sigue aprendiendo** con el mínimo por código y avisa cambios con el detector (sección 4).

## Próximos pasos concretos

Ordenados por dependencias; las fechas las define Ford.

1. **Conectar las entradas:** exportación diaria de QLS con resultados de Auditoría Adicional y programa del día.
2. **Cargar el histórico** de auditorías al azar para arrancar las tasas por código.
3. **Instalar el script** en una notebook o un servidor de planta y generar la primera hoja.
4. **Capacitar al equipo de analistas** con la hoja impresa.
5. **Arrancar la etapa con días de control**, alternando días con hoja y días al azar, con el mínimo por código activo.
6. **Medir por separado** unidades con y sin actividad QLS, y calcular con esos datos la duración y el tamaño que necesita la etapa.
7. **Decidir con los datos de planta** si la hoja orienta todo el cupo.
8. **Sumar la subcategorización** del catálogo cuando Ford la publique, compitiendo en validación con la misma regla.

[plan-rev]: ../plan-de-accion.md#revisión-de-fuentes-del-2909
[plan-com]: ../plan-de-accion.md#cómo-se-comunican-los-resultados
[p3]: ../../solucion/resultados/p3.json
[elec]: ../../solucion/resultados/eleccion.json
[p4]: ../../solucion/resultados/p4.json
[p5]: ../../solucion/resultados/p5.json
[p6]: ../../solucion/resultados/p6.json
[cat]: ../../research/catalogo-agrupacion.md
[adm]: https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804466671
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[alt]: https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998
[sal]: https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
