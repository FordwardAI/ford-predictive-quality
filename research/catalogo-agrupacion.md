# Agrupación de códigos de catálogo

Ticket: [Registrar la agrupación de códigos de catálogo recibida el 29/09](https://github.com/FordwardAI/ford-predictive-quality/issues/26). La decisión de uso está en [¿Cómo se usa la agrupación del catálogo con los resultados ya congelados?](https://github.com/FordwardAI/ford-predictive-quality/issues/27).

> **Nota del 29/09/2026** ([revisión de la especificación](https://github.com/FordwardAI/ford-predictive-quality/issues/13)): no existió ningún congelamiento de resultados; las menciones a «resultados congelados» quedaron sin efecto. Las tasas y χ² del tramo `prueba_final` de este registro usan etiquetas de la prueba final: esa lectura se declara en el preregistro y en los límites, y el suavizado hacia el mercado se justifica solo con validación. No volver a correr este análisis sobre la prueba antes de la corrida única. El resto del registro se conserva como histórico.

## Fuente

- `Códigos de catálogo.csv`: el usuario lo entregó el 29/09/2026. Sería la entrega de Ford sobre la subcategorización anunciada el 22/09, pero el canal no se verificó. Queda fuera del repo, junto a la base.
- Tamaño 7.079 bytes, SHA-256 `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`. UTF-8, delimitador coma, 100 líneas.
- Título «Agrupación de códigos de catálogo BX». La fila 3 tiene los encabezados. Son **tres tablas lado a lado** que no comparten filas: cada una ordena los mismos 98 códigos a su manera.
  - Familia motor, Código y Motor dominante.
  - Tracción, Código y Versión dominante.
  - País / mercado, Código y Versión dominante.
- Los valores están anonimizados (`LOCATION_n`, `VERSION_n`). El archivo no incluye más detalle sobre los features.
- Base cruzada: el CSV vigente de [datos locales](../docs/datos-locales.md), SHA-256 `a24860d8…5a82b`.

Reproducción desde la raíz:

```sh
python3 research/catalog_groups.py "/ruta/al/Dataset QLS Inspección Adicional.csv" "/ruta/a/Códigos de catálogo.csv" > research/catalog-groups.json
python3 research/test_catalog_groups.py
```

La [salida](catalog-groups.json) solo publica agregados por grupo. No publica el diccionario código → atributos ni las tasas por código. Unidad: VIN. Población principal: primera inspección ≤ DIA_260, **54.771 VIN, 6.079 CALIBRADA (11,10 %)**. Las particiones son las de #7, según el Día del VIN.

## Observaciones

1. **Cobertura completa.** Los 98 códigos del archivo son los 98 de la base, sin faltantes en ninguno de los dos sentidos. Cada VIN tiene un único código. Cada código aparece una sola vez por tabla. Las dos columnas «Versión dominante» coinciden en los 98 códigos.
2. **Atributos por código:**
   - Familia de motor: LION tiene 27 códigos y PANTHER 71.
   - Motor dominante: LION B, PANTHER J o PANTHER C.
   - Tracción: 4X2 tiene 20 códigos y 4X4 78.
   - Versión dominante: `VERSION_1`, `VERSION_2`, `VERSION_3` o `VERSION_P`.
   - Mercado: 9 valores, de `LOCATION_1` a `LOCATION_9`.

   Entre todos forman 45 combinaciones distintas: hasta 6 códigos comparten los cuatro atributos.
3. **El código ahora se puede leer por posiciones.** Esto se comprueba con los 98 códigos, `atributos_determinados_por_posicion`:
   - La posición 2 fija motor dominante, tracción y versión. Letras distintas pueden llevar a la misma combinación.
   - La posición 3 fija el mercado, una letra por `LOCATION_n`.
   - La posición 4 (`5`, `6`, `A`, `B`) no se explica con ningún atributo del archivo.

   Ya no hace falta «dar significado a las posiciones sin evidencia», el motivo del descarte en #9 punto 4 y #10. La lectura de la posición 4 sigue abierta.
4. **Casi toda la señal de los atributos está en el mercado.** χ² contra CALIBRADA en la población principal:

   | Vista | Grupos | χ² |
   | --- | ---: | ---: |
   | Código completo | 98 | 674,2 |
   | Combinación de los 4 atributos | 45 | 353,1 |
   | Mercado | 9 | 187,8 |
   | Motor dominante | 3 | 28,5 |
   | Versión dominante | 4 | 25,4 |
   | Familia de motor | 2 | 22,1 |
   | Tracción | 2 | 21,1 |

   El mercado con la tasa más alta tiene **20,50 % (331/1.615 VIN)**, casi el doble de la base. Es el grupo «posición 3 = F» ya visto en el [EDA](eda-qls.md). Le siguen dos mercados de volumen: 11,74 % (2.394/20.394) y 10,42 % (2.732/26.220). Los mercados chicos tienen pocos VIN: 5,59 % (8/143) y 11,11 % (3/27).
5. **Estabilidad temporal.** En validación (Día 155–194) y prueba (Día ≥200), motor, familia y tracción no discriminan: χ² entre 0,0 y 2,6. Sí lo hacían en entrenamiento (≤149), con χ² entre 29,6 y 57,1. La versión conserva poco: χ² 7,4 en validación y 13,6 en prueba. El mercado sí se sostiene: χ² 99,6, 56,1 y 56,9. El mismo mercado encabeza el entrenamiento y la validación (23,03 % y 21,80 %). En prueba sigue arriba del resto de los mercados con volumen, con 13,68 %.
6. La combinación de los cuatro atributos explica cerca de la mitad del χ² del código. El resto está dentro de cada combinación: la posición 4 y las letras de la posición 2 que llevan al mismo resultado.

## Hipótesis (no verificadas)

- «Dominante» sugiere que motor y versión son el valor mayoritario del código, no un atributo exacto de cada vehículo. No lo aclara el archivo. Mercado y tracción no llevan ese calificativo.
- La posición 4 podría codificar features no incluidos en la agrupación, como paquete o equipamiento. Ford describió el código como «versión y features».
- Lo que más aporta la agrupación es el mercado de destino. Los atributos de motor y tracción parecen reflejar el drift del período de entrenamiento más que una diferencia estable.
- Esto es sobre la base ficticia. No prueba que el mercado cause calibraciones en planta.

## Qué habilita (a decidir en #27, no decidido aquí)

- **Admisibilidad.** Los atributos se deducen del código, que ya es la única variable admitida por #6. Se conocen antes de Gate Release y no agregan fuga. Hace falta un acuerdo para usarlos como predictor, porque cambian las alternativas fijadas en #9 y #10.
- **Suavizado jerárquico.** Los códigos chicos se suavizan hacia su mercado en vez de hacia la tasa general, como en #7. Sería una alternativa nueva de validación. Los resultados están congelados desde el 29/09.
- **Hoja de códigos prioritarios (#11).** Se puede mostrar mercado, versión, motor y tracción junto a cada código, para que el responsable de la selección lo lea sin conocer los códigos. El orden no cambia.
- **Diferencial (c) de #10.** Los grupos por perfil de fallas se pueden comparar con la agrupación oficial para ver si coinciden con mercado o versión.
- **Informe.** Permite explicar la señal por mercado en lugar de «el código».

## Decisiones acordadas

Ninguna. Este registro no cambia el predictor, la hoja ni los resultados congelados.

## Límites

- El origen, el alcance y la vigencia del archivo no están confirmados, y los valores están anonimizados.
- χ² sin corrección por comparaciones múltiples. Es un contraste descriptivo, no una evaluación de desempeño en el cupo del 5 %.
- Las tasas son de VIN auditados de la base, no de toda la planta.
