# 3. Factibilidad económica

Borrador para la sección 3 del Informe (E2) y el separador 03 de la presentación. Sigue la estructura del [plan][plan-fact]: implementación, operación, mantenimiento, escenarios de escala y justificación de la inversión.

**Qué no incluye.** No estimamos costos dentro de la planta (el costo de auditar o de dejar pasar una unidad que necesitaba calibración): Ford indicó que no puede dar esas referencias ([reunión del 22/09][reu]). En su lugar dejamos una fórmula para que Ford aplique sus propios valores ([mejora útil][mej], punto 12; [alcance de entrega][alc-sec]).

## De qué está hecha la solución

Un script de Python con bibliotecas de código abierto (versiones fijadas en `requirements.txt`) que lee una exportación de QLS, el catálogo, el programa del día y el cupo, y produce una planilla y un imprimible. **No usa LLM ni servicios pagos**, no necesita GPU y no requiere nube ([plan][plan-fact]; [seguridad y privacidad](02-3-seguridad-privacidad.md)). No tiene costo de licencias.

Tiempo de una corrida diaria (hoja del día con la tasa vigente) en una notebook (Apple M1 Pro, medido el 29/09/2026): unos 2,2 s para leer el CSV completo y verificar su hash, y 0,2 s para armar la hoja del día (ranking, cantidades, planilla, imprimible y control de que no salga ningún VIN). El plan lo estima en segundos, porque con el código como predictor el cálculo es una tabla de tasas por código ([plan][plan-fact]).

## 1. Implementación

| Qué | Quién | Costo |
| --- | --- | --- |
| Automatizar la entrada: exportación diaria de QLS con resultados de Auditoría Adicional, y programa del día desde producción | TI y Calidad de Planta | Horas internas de Ford. No las estimamos: dependen de sus sistemas |
| Instalar el script en una notebook o un servidor de planta | TI | Horas internas; el equipo existente alcanza (ver escenarios) |
| Capacitar a los analistas en la hoja | Calidad de Planta | Una sesión corta: la hoja está pensada para usarse sin explicación técnica ([alcance de entrega][alc-ent], E3) |
| Etapa inicial con **días de control** | Calidad de Planta | Sin auditorías extra: los días de control usan el mismo cupo, al azar como hoy ([base QLS][qls], punto 5) |

Fórmula para Ford: **costo de implementación = horas de integración × costo por hora + horas de capacitación × costo por hora**.

## 2. Operación

| Qué | Consumo |
| --- | --- |
| Cómputo de la hoja del día y de la revisión de la tasa | Una corrida por día: unos 2,4 s en una notebook (lectura del CSV 2,2 s + hoja 0,2 s) |
| Almacenamiento | La exportación de QLS y la hoja del día. La base de todo el período ocupa 54,6 MB en CSV ([población y etiquetas][pob]) |
| Impresión o planilla | Una hoja de una página por día |
| Auditorías | **Ninguna adicional**: el cupo lo sigue fijando Calidad de Planta |

## 3. Mantenimiento

- Revisar periódicamente la opción elegida con los resultados nuevos. La prueba de concepto ya trae el comando para volver a evaluar sin fuga ([`solucion/README.md`][sol]).
- Atender las alertas del **detector de cambios** por código (sección 4).
- Actualizar el catálogo cuando aparezcan códigos nuevos o Ford publique la subcategorización. Un código nuevo funciona desde el primer día con la tasa general o la de su mercado ([plan][plan-reg]).
- Actualizar dependencias de software de forma controlada, con versiones fijadas.

## 4. Escenarios de escala

Precios públicos consultados el 29/09/2026, por hora, Linux, a demanda, en dólares, sin disco ni transferencia. Se incluyen solo como techo de referencia: la solución no necesita nube.

| Proveedor e instancia | Recursos | US East | São Paulo (Brasil) | Fuente |
| --- | --- | ---: | ---: | --- |
| AWS EC2 `t3.small` | 2 vCPU, 2 GiB | USD 0,0208 | USD 0,0336 | [AWS EC2 On-Demand][aws] |
| AWS EC2 `t3.medium` | 2 vCPU, 4 GiB | USD 0,0416 | USD 0,0672 | [AWS EC2 On-Demand][aws] |
| Azure `Standard_B2s` | 2 vCPU, 4 GiB | USD 0,0416 | USD 0,0672 | [Azure Retail Prices API][azure-api]; [especificaciones][azure-spec] |

Encendida todo el mes (730 horas), una `t3.small` en São Paulo cuesta 730 × 0,0336 ≈ USD 24,5 por mes, sin disco. Como la hoja se arma una vez por día, alcanzaría con encenderla minutos por día. Microsoft informa que la serie Bv1 de Azure está en etapa de fin de vida; para una instalación nueva correspondería una serie vigente ([especificaciones][azure-spec]).

| Escenario | Dónde corre | Cómputo | Qué cambia con un modelo más pesado |
| --- | --- | --- | --- |
| **Una línea** | Una notebook existente de Calidad | Una corrida diaria de unos 2,4 s | La opción elegida en validación es la tasa fija: no hay modelo que reentrenar. Si en una revisión futura ganara un modelo reentrenado, la corrida sumaría reentrenar sobre unas decenas de miles de VIN, sin GPU (como referencia, evaluar los 18 modelos de ML en validación, con 8 reentrenamientos cada uno, llevó unos 50 s en la misma notebook) |
| **Una planta** | Un servidor de planta existente, o una VM chica como las de la tabla | Una corrida por línea y por día | Igual que arriba, por línea |
| **Varias plantas** | Un servidor por planta o uno central que corre una vez por planta; cada planta con su catálogo y su cupo | Crece en proporción a la cantidad de plantas: sigue siendo una tabla de tasas por código por planta | El reentrenamiento se puede programar fuera del turno |

## 5. Justificación de la inversión

**A cupo fijo no hay auditorías extra.** El beneficio es encontrar más calibraciones con las mismas auditorías ([mejora útil][mej], punto 3).

A cupo fijo, cualquier par de costos positivos ordena igual a las alternativas: gana la que más CALIBRADA encuentra ([mejora útil][mej], observaciones). Por eso alcanza con una fórmula lineal:

> **beneficio diario = (precisión de la hoja − precisión al azar) × auditorías por día × costo evitado por calibración encontrada**

- **Precisión de la hoja y precisión al azar:** proporción CALIBRADA entre los elegidos. En planta se miden con los **días de control**, no con la base ([base QLS][qls], punto 7).
- **Auditorías por día:** el cupo diario que ya fija Calidad de Planta.
- **Costo evitado por calibración encontrada:** lo define Ford. Es lo que vale encontrar en la auditoría una unidad que necesitaba calibración, en lugar de que salga sin ella.

La diferencia de precisión en puntos porcentuales equivale a cuántas calibraciones más se encuentran cada 100 auditorías.

**Sobre la base ficticia**, la diferencia de la opción elegida en la prueba final es de 2,7 puntos porcentuales (10,9 % contra 8,2 % al azar; rango del 95 % de la diferencia: de 0,07 a 5,2 puntos), es decir, unas 2,7 calibraciones más cada 100 auditorías, entre auditados con actividad QLS, prueba final ≥200, base ficticia, n = 13.312 VIN. **Esa cifra no es un ahorro de planta**: la base es ficticia y solo cubre unidades con actividad QLS ([validación][val], punto 8; [base QLS][qls], hipótesis). Si la tasa de las unidades sin actividad QLS fuera distinta, la diferencia en planta también lo sería. La forma de medirla es la etapa con días de control.

**Costo total de propiedad, para comparar con el beneficio:** implementación (horas internas) + operación (casi nula en equipo existente, o una VM chica) + mantenimiento (horas internas de revisión).

[plan-fact]: ../plan-de-accion.md#factibilidad-económica-y-escalado
[plan-reg]: ../plan-de-accion.md#reglas-que-no-cambian
[alc-sec]: ../alcance-entrega.md#contenido-por-sección-del-informe
[alc-ent]: ../alcance-entrega.md#entregables
[pob]: ../../research/poblacion-etiquetas.md
[sol]: ../../solucion/README.md
[reu]: https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
[aws]: https://aws.amazon.com/ec2/pricing/on-demand/
[azure-api]: https://prices.azure.com/api/retail/prices
[azure-spec]: https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/bv1-series
