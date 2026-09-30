# Ideas descartadas y por qué

Borrador de apoyo para el Informe (E2), sección 2.2 o anexo, y para responder al jurado. El [alcance de entrega][alc-ent] pide nombrar en el informe las ideas del documento inicial que no entran, junto con el motivo. El documento inicial es de **propuestas**, no de exigencias de Ford ([consigna y fuentes][cf]).

| Idea | De dónde viene | Por qué no entra | Fuente de la decisión | ¿Se puede reabrir? |
| --- | --- | --- | --- | --- |
| **Predictive Quality Passport**: una salida por VIN con score de riesgo, factores, historial resumido, componentes y nivel de confianza | [Documento inicial][wf], «Posible concepto de producto» | Con el código como único predictor, todas las unidades de un código reciben la misma estimación: un pasaporte por VIN repetiría la misma cifra para cada unidad del código y sugeriría una precisión individual que no existe. El historial resumido no es admisible. La salida acordada es una hoja por código | [Salida para Calidad][sal], puntos 1, 2 y 4; [admisibilidad][adm], punto 4 | Si se prueba que el historial está disponible al elegir y aporta señal |
| **Perfil de riesgo por VIN** («Risk Score: 87 %», prioridad y señales principales) | [Documento inicial][wf], «Quality Risk Profile por VIN» | La tasa es de la versión y el mercado, no la probabilidad de un vehículo. Mostrarla como «probabilidad de la unidad» o como score está prohibido | [Salida para Calidad][sal], punto 2; [CONTEXT.md][ctx], «Tasa reciente del código» | No con el predictor actual |
| **Secuencias y orden del historial** | [Documento inicial][wf], «Secuencia de eventos» | No está probado que el historial exista al momento de elegir: entre Gate Release y la auditoría pasan de 0 a 5 días y la base no marca Gate Release. Además, en los experimentos exploratorios el historial dio AUC 0,50–0,52 | [Representación][rep], punto 3; [alternativas][alt], punto 15; [admisibilidad][adm], punto 4; [experimentos][exp] | Si Ford prueba la disponibilidad del historial. En el anexo de validación, el historial solo dio 8,7–9,0 % en el cupo, contra 9,9 % esperado al azar (n = 8.038 VIN, base ficticia) ([`p6.json`][p6]) |
| **Detección de anomalías** en el historial | [Documento inicial][wf], «Detección de anomalías» | En los experimentos exploratorios, la rareza del historial no separó calibradas (AUC 0,494) y sumarla al código empeoró el modelo. Usa el historial, que no es admisible | [Alternativas][alt], punto 15; [EDA][eda], sección 10 | No para este esfuerzo |
| **Comparación contra vehículos similares** | [Documento inicial][wf] | Quedó absorbida por el núcleo: la tasa ya compara cada unidad con las de su mismo código | [Alternativas][alt], punto 15 | — |
| **Grupo de control del 20 % permanente** (política 80 / 20) | [Experimentos de modelado][exp], sección 1; [alternativas][alt], punto 12 | El equipo rechazó el azar permanente: si la hoja rinde más que el azar, reservar para siempre una quinta parte del cupo al azar resigna calibraciones todos los días. Lo reemplazan el **mínimo por código** (mantiene al día la tasa de los códigos poco elegidos) y los **días de control** (miden la hoja solo durante la implementación). ε = 20 % queda como referencia de lo que costaría | [Base QLS][qls], puntos 5 y 6 | — |
| Confirmar o descartar unidad por unidad (variante A del prototipo) | Prototipo de salida | Demasiado manual; Ford prefiere una lista al inicio del día | [Salida para Calidad][sal], punto 8; [operación][ope], «Qué pasa con el supuesto» | — |
| Riesgo relativo (tasa del código ÷ tasa general) como predictor aparte | [Experimentos de modelado][exp], sección 4 | Dentro de un día ordena igual que la tasa móvil. Sigue en la hoja como «veces la tasa general» | [Representación][rep], punto 2 | — |
| Mínimo de VIN para estimar la tasa de un código | [Validación][val], punto 6 | El suavizado hacia la tasa general ya cubre los códigos chicos | [Alternativas][alt], punto 2 | — |
| Resultado o componente de la Auditoría Adicional como predictor | — | Son lo que se quiere anticipar: el componente existe solo si la unidad es CALIBRADA. Usarlos es fuga | [Admisibilidad][adm], punto 5; [preparación][prep] | Nunca |

**Plataforma web: ya no está descartada.** Hasta el 29/09 figuraba acá porque la ficha acepta un reporte accionable y Ford pidió una lista al inicio del día. El 30/09 pasó a ser una **propuesta de implementación y escalado** para visualizar todos los datos de la solución, con un prototipo de pantallas para la presentación ([#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33)). Para el 2/10 la E3 sigue siendo la hoja: planilla e imprimible.

## Qué se conserva de esas ideas

- De la **predicción del componente** del documento inicial sale «dónde mirar», pero como lo que se predice, no como predictor (sección 4).
- Del **aprendizaje continuo** sale la selección que aprende de sus auditorías, con mínimo por código y días de control (sección 4).
- De la **comparación contra el azar** del documento inicial sale la métrica principal: precisión en el cupo y veces el azar, al mismo cupo diario ([mejora útil][mej]).

[ctx]: ../../CONTEXT.md
[ficha]: ../fuentes/documentation.md
[wf]: ../fuentes/ford_predictive_quality_wayfinder.md
[cf]: ../../research/consigna-fuentes.md
[exp]: ../../research/experimentos-modelado.md
[eda]: ../../research/eda-qls.md
[prep]: ../../solucion/resultados/preparacion.json
[p6]: ../../solucion/resultados/p6.json
[alc-ent]: ../alcance-entrega.md#entregables
[adm]: https://github.com/FordwardAI/ford-predictive-quality/issues/6#issuecomment-5804466671
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[rep]: https://github.com/FordwardAI/ford-predictive-quality/issues/9#issuecomment-5820084609
[alt]: https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998
[sal]: https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
[agr]: https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
