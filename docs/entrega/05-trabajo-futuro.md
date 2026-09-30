# 5. Trabajo futuro

Borrador para la sección 5 del Informe (E2) y el separador 05 de la presentación. Describe cómo implementaría y escalaría Ford la solución, con su replicabilidad ([alcance de entrega][alc-sec]; [plan][plan-fact], «Escalado para Ford»). Los pasos se ordenan por dependencias, no por fechas: el calendario lo decide Ford.

**Por qué hace falta.** Toda la evaluación usa el CSV entregado: no habrá datos nuevos de Ford antes de la entrega ([plan][plan-inc], incompatibilidad 12). Las cifras valen para la base ficticia y solo para auditados con actividad QLS ([validación][val], punto 8; [base QLS][qls], punto 7). La única forma de saber qué pasa en planta es medir en planta.

## 1. Implementación inicial con días de control

1. **Conectar las entradas.** Exportación diaria de QLS con los resultados de Auditoría Adicional, programa de producción del día y cupo diario de Calidad de Planta ([plan][plan-fact]).
2. **Arrancar con el histórico que ya existe.** Las auditorías que Ford ya tiene, elegidas al azar según Ford, son etiquetas completas para arrancar la tasa de cada código. Es lo que simula la lectura con etiquetas parciales: etiquetas completas hasta el Día 149 y solo lo elegido desde el 155 ([plan][plan-par]).
3. **Hoja al inicio del día**, con la cantidad sugerida por código y las filas del **mínimo por código** ([operación][ope], decisiones 1 y 2; [base QLS][qls], punto 5).
4. **Días de control.** Durante la etapa inicial, se alternan días con hoja y días al azar. Los días al azar dan la referencia sin sesgo en las mismas condiciones de producción. Terminada la etapa, la hoja orienta todo el cupo ([CONTEXT.md][ctx], «Días de control»).
5. **Resultados separados** para unidades con y sin actividad QLS. El cruce se hace después, con QLS, sin necesidad de consultarlo desde la playa ([base QLS][qls], punto 7).

### Límites de una prueba en planta

Según la decisión de [base QLS][qls], punto 7:

- En planta solo se conoce el resultado de lo que se audita. Los días de control dan la referencia sin sesgo, y el mínimo por código evita que los códigos no elegidos queden sin datos.
- Si la tasa de las unidades sin actividad QLS difiere de la de la base, las veces el azar medidas en la base no se trasladan a planta. Por eso se analizan por separado.
- **La duración y el tamaño de la etapa con días de control no se fijan**: sin datos reales no se puede calcular la potencia. Como referencia de escala, en la validación sobre la base, con 391 elegidos, el rango de la precisión en el cupo fue de unos ±3,4 a ±4,5 puntos (sección 2.2, apartado D).
- Las afirmaciones cuantitativas siguen valiendo solo para la base ficticia.

## 2. Escalado

- **Recálculo diario** de la tasa reciente de cada código con los resultados que se van conociendo, con 5 días de margen.
- **Detector de cambios** activo por código, con alertas a quien designe Ford (sección 4).
- **Revisión periódica** de la opción elegida con el mismo protocolo sin fuga: partición temporal, cupo diario y bootstrap por días ([`solucion/README.md`][sol]).
- **Hoja para todas las unidades** de la playa, porque el código se lee en el parabrisas. La variante restringida a unidades con actividad QLS queda como opción si Ford confirma que QLS se puede consultar desde la playa ([base QLS][qls], punto 4).

## 3. Replicabilidad en otras líneas y plantas

Lo que se necesita para replicar:

| Requisito | Por qué |
| --- | --- |
| Un código de catálogo (o equivalente) visible en la unidad | Es el único predictor y lo que el analista lee |
| Resultados de las auditorías con la fecha y el código | Alimentan la tasa reciente |
| Un cupo diario definido | La hoja llena ese cupo |
| Un histórico de auditorías elegidas al azar para arrancar | Da tasas iniciales que no dependen de lo que la hoja elija |

Cada línea o planta corre su propia hoja con su catálogo y su cupo. El método, las pruebas y el protocolo de evaluación son los mismos.

## 4. Subcategorización del catálogo

Cuando Ford publique la subcategorización, se trata como una fuente nueva: se verifica su esquema, su hash y sus diferencias ([admisibilidad][adm-ctx]). Puede entrar como otro nivel de suavizado, igual que el mercado de destino, y compite en validación con la misma regla ([uso de la agrupación][agr], punto 3). La tabla descriptiva de grupos por perfil de fallas (sección 4) es un insumo para ese trabajo.

## 5. Historial de QLS

El historial (incidencias, reparaciones, tiempos) queda fuera del predictor porque no está probado que exista al momento de elegir. Si Ford prueba esa disponibilidad (por ejemplo, con una marca de Gate Release en la exportación), se reabre, empezando por las **secuencias** de eventos ([representación][rep], punto 3; [alternativas][alt], punto 15). El anexo de historial deja preparada esa evaluación. En validación, el historial solo no se distinguió del azar (8,7 % y 9,0 % en el cupo, contra 9,9 % esperado) y sumado al código empató con la tasa fija, entre auditados con actividad QLS, validación 155–194, base ficticia, n = 8.038 VIN ([`p6.json`][p6]).

## 6. Consulta operativa pendiente

Qué fracción de las unidades producidas tiene actividad QLS y si los analistas pueden consultar QLS desde la playa de despacho. Si no hay respuesta, se mantienen el supuesto y el límite declarados ([base QLS][qls], punto 8; [plan][plan-pend], «Pendientes con default»).


## 7. Plataforma web

Propuesta de implementación, no un entregable del 2/10 ([#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33), decisión del 30/09). La hoja sigue siendo la salida operativa y el piso si la plataforma no está disponible. La plataforma reúne en un solo lugar lo que hoy son archivos sueltos:

- **Operación diaria:** la hoja del día con la cantidad sugerida y las unidades, y el registro de cada ronda en la playa de despacho (qué códigos llegaron y cómo baja lo pendiente por el ranking).
- **Códigos y mercado:** la tasa de cada código en el tiempo, con su rango y su n; la señal por mercado de destino; «dónde mirar», si se sostiene en la prueba final; y las alertas del detector de cambios.
- **Evidencia del modelo:** la comparación de alternativas, las etiquetas parciales, la preparación de datos y el estado de la prueba final.
- **Implementación:** el seguimiento de los días de control y la configuración del cupo diario, el mínimo por código y la carga del programa del día.

**Prototipo:** galería de pantallas en [`prototipos/plataforma-web/`](../../prototipos/plataforma-web/README.md), con los tokens de la guía de marca de Ford y sin logo. Los datos (`data.js`) y las capturas se regeneran localmente y no se versionan.

**Límites:** el prototipo usa la base ficticia y cifras de validación. No hay integración con QLS ni con el programa de producción; esa integración es el trabajo principal para llevarla a planta. Los riesgos de acceso y de datos se analizan en [seguridad y privacidad](02-3-seguridad-privacidad.md).

[ctx]: ../../CONTEXT.md
[sol]: ../../solucion/README.md
[p6]: ../../solucion/resultados/p6.json
[alc-sec]: ../alcance-entrega.md#contenido-por-sección-del-informe
[plan-fact]: ../plan-de-accion.md#factibilidad-económica-y-escalado
[plan-inc]: ../plan-de-accion.md#incompatibilidades-y-cómo-se-resuelven
[plan-par]: ../plan-de-accion.md#parámetros
[plan-pend]: ../plan-de-accion.md#pendientes-con-default
[adm-ctx]: https://github.com/FordwardAI/ford-predictive-quality/issues/6
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[rep]: https://github.com/FordwardAI/ford-predictive-quality/issues/9#issuecomment-5820084609
[alt]: https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
[agr]: https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
