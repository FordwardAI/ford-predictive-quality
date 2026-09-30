# 6. Conclusiones

Borrador para la sección 6 del Informe (E2) y el separador 06 de la presentación. El template pide «próximos pasos concretos» hacia la implementación ([plan][plan-rev], templates). La corrida única dio **mejora** y esa es la versión del resultado ([resumen ejecutivo](02-1-resumen-ejecutivo.md)); las otras dos se escribieron antes de la corrida y quedan en el historial de Git.

## Resultado

Lectura de la prueba final ([mejora útil][mej], punto 9):

- **Mejora.** Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (Día ≥200, n = 13.312 VIN, 652 elegidos en 68 días), la hoja encontró 10,9 calibraciones cada 100 elegidos (rango del 95 %: 8,3–13,6), contra 8,2 al azar: 1,32 veces el azar (1,01–1,64). El límite inferior de la diferencia con el azar es de solo 0,07 puntos. Con la prueba ≤260 (n = 13.135 VIN) son 11,1 contra 8,3.

Siempre se agregan los límites fijos: el tramo de prueba y la tasa por mercado ya se habían mirado, la selección al azar de los auditados es un supuesto de Ford, en planta solo se conocería lo auditado y el Día del VIN es aproximado ([plan][plan-com]).

## Qué aprendimos

### Observaciones

- En validación, 29 de las 31 alternativas elegibles (referencias y ML) empataron con la de mayor precisión; la regla eligió la más simple, la tasa fija, con 15,1 % (11,6–18,8) contra 9,9 % esperado al azar, 1,53 veces el azar, entre auditados con actividad QLS, validación 155–194, base ficticia, n = 8.038 VIN ([`eleccion.json`][elec]).
- Con etiquetas parciales, el mínimo por código (P = 40) conserva esa precisión en validación: 15,3 % (11,9–19,1) ([`p5.json`][p5]). En la prueba final da 10,6 % (8,0–13,3), 1,29 veces el azar (0,98–1,60): inconcluso; con ε = 0 (solo el ranking) da 10,9 %: mejora ([`prueba-final.json`][final]).
- En la prueba final la tasa fija (≤194) bajó a 10,9 % desde el 15,1 % de validación, contra 8,2 % al azar (9,9 % en validación), entre auditados con actividad QLS, base ficticia ([`prueba-final.json`][final]).
- «Dónde mirar» en la prueba final: 63,4 % (53,2–73,1) contra 35,2 % (25,8–45,6) entre las 71 CALIBRADA que eligió la tasa fija, y 46,9 % contra 39,8 % sobre todas (n = 1.098 VIN): mejora.
- El detector dio 16 alarmas en 85 días de la prueba (15 a la baja, en 10 códigos), frente a 7 en 40 días de validación; se muestran como observaciones, sin causa.
- «Dónde mirar» acertó el componente en 36 de las 59 CALIBRADA que eligió la tasa fija (61,0 %), contra 18 de 59 (30,5 %) con la lista general, en validación ([`p6.json`][p6]).
- El techo con el código como predictor (oráculo) es 20,2 % en el mismo cupo y la misma base ([`p3.json`][p3]).
- La señal del código se explica sobre todo por el mercado de destino ([agrupación del catálogo][cat]).

### Hipótesis

- Con un único predictor, el valor está en cómo se usa la tasa y no en el algoritmo ([alternativas][alt], idea que ordena el ticket). La validación es compatible con eso: nueve familias de ML, en dos modos, no superaron a la tasa fija más allá del empate ([`p4.json`][p4]). La prueba final no la confirma ni la refuta: solo se leyó la opción elegida (tasa fija, 1,32 veces el azar), y las demás alternativas quedan con cifras de validación.

- La caída de la precisión desde validación puede deberse a optimismo de haber elegido la mejor alternativa en validación y a un azar más bajo en la prueba (8,2 % contra 9,9 %). No lo verificamos.

### Decisiones acordadas

- El código de catálogo es el único predictor; el historial queda fuera hasta que se pruebe su disponibilidad al elegir ([admisibilidad][adm]).
- La hoja prioriza códigos, no vehículos, y no muestra «probabilidad de la unidad» ([salida para Calidad][sal]).

## Valor para Ford

- **Mismas auditorías, mejor elegidas.** No cambia el cupo ni la capacidad, cambia qué unidades se eligen ([mejora útil][mej], punto 3).
- **Usa lo que ya está a la vista:** el código del parabrisas y el programa del día ([operación][ope]).
- **Explicable:** cada prioridad se lee como la tasa de calibración de una versión y un mercado.
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
[final]: ../../solucion/resultados/prueba-final.json
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
