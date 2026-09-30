# 1. Descripción del desafío

Borrador para la sección 1 del Informe (E2) y el separador 01 de la presentación (E1). Vocabulario según [CONTEXT.md][ctx].

## El proceso

Todos los vehículos de Planta Pacheco pasan por la **verificación de calidad**. Esa etapa registra incidencias y reparaciones en **QLS** (Quality Leadership System), el sistema de trazabilidad de la planta. Después viene **Gate Release**, que valida que el vehículo cumpla las especificaciones. Las unidades liberadas esperan en la **playa de despacho** entre 0 y 5 días. Allí se elige una parte de ellas para una **Auditoría Adicional**: una inspección de alta precisión que decide si la unidad necesita una calibración fina (resultado **CALIBRADA**) o no (**OK**) ([ficha técnica][ficha]; [operación de selección][ope]).

![Proceso y punto donde entra la hoja](figuras/diagrama_proceso.png)

*Figura: Body → Pintura → Montaje → Calidad → Gate Release → Inspección Adicional. La ficha ubica la herramienta predictiva en la Inspección Adicional ([consigna y fuentes][cf]). La figura marca dónde entra la hoja: en la playa de despacho, antes de elegir.*

## Cómo se elige hoy

### Observaciones (lo que dijo Ford, en la versión del equipo)

- Un **equipo de analistas** elige en rondas de unas dos horas, entre las unidades que llegan a la playa de despacho ([operación][ope], puntos 1 a 3).
- La elección es **completamente aleatoria**, sin criterio específico ([reunión del 22/09][reu]).
- El cupo es una **cantidad fija por día**. Lo define Calidad de Planta según el programa de producción, y equivale a cerca del **5 %** de lo que aprueba Gate Release. Ford no busca ampliar ese porcentaje, por costo y capacidad ([operación][ope], punto 4; [reunión del 22/09][reu]).
- El **código de catálogo** figura en una etiqueta del parabrisas y hoy no se usa para elegir. Los códigos que se van a producir en el día se conocen de antemano ([operación][ope], puntos 5 y 6).
- Lo que más le serviría a Ford es una **lista de unidades sugeridas al inicio del día** ([operación][ope], punto 7).

### Qué pide la ficha

La ficha pide anticipar qué unidades van a necesitar calibración fina en la Inspección Adicional, a partir del historial de QLS. La propuesta tiene que explicar el enfoque y la elección del modelo, la preparación de los datos y una validación que demuestre efectividad. Se valora además un reporte accionable con las unidades priorizadas y las variables de mayor impacto ([ficha técnica][ficha], «Base de Datos»).

## La pregunta que resolvemos

> Con el mismo cupo diario de auditorías que hoy, ¿se pueden elegir las unidades de modo que se encuentren más calibraciones que eligiendo al azar?

Tres cosas quedan fijas desde el principio:

- **Mismas auditorías.** La recomendación llena el cupo completo. Cambia qué unidades se eligen, no cuántas ([mejora útil][mej], punto 3).
- **La referencia es el azar**, porque es el método actual ([momento de la decisión][mom]).
- **Se mide cuántas calibraciones hay entre los elegidos.** La cifra principal es la **precisión en el cupo**: de cada 100 elegidos, cuántos se calibran. Se informa junto a las **veces el azar** ([mejora útil][mej], punto 6).

A cupo fijo, los costos no cambian el orden entre alternativas: la que más CALIBRADA encuentra es la mejor para cualquier par de costos positivos ([mejora útil][mej], observaciones). Por eso el desafío se resuelve sin costos de planta, que Ford no puede dar ([reunión del 22/09][reu]).

## Los datos

### Observaciones

- La base es **ficticia**, generada para el desafío ([ficha técnica][ficha], disclaimer).
- Reúne solo **auditados con actividad QLS**: unidades que pasaron por la Auditoría Adicional y además tuvieron al menos una incidencia registrada en QLS. Quedan afuera los auditados sin incidencias ([base QLS][qls]; [consultas a Ford][cfo], respuesta del 29/09).
- Tiene 195.808 eventos de calidad y 59.681 VIN, de los cuales 6.079 son CALIBRADA: 10,1858 % entre auditados con actividad QLS, base ficticia, n = 59.681 VIN ([población y etiquetas][pob]).
- 4.910 VIN tienen su primera inspección después de DIA_260 y todos son OK. Ford analiza una posible mejora en planta cerca de ese día, sin confirmarla ([población y etiquetas][pob]; [reunión del 22/09][reu]).

### Hipótesis (no verificadas)

- Los auditados son una muestra al azar de lo que aprueba Gate Release. Lo afirma Ford y no lo podemos comprobar ([mejora útil][mej], hipótesis).
- La tasa de calibración de las unidades sin actividad QLS podría ser distinta de la de la base ([base QLS][qls], hipótesis).

### Decisiones acordadas

- Toda cifra se acompaña del calificador «entre auditados con actividad QLS, [tramo], base ficticia, n = …» ([base QLS][qls], punto 2).
- Las cifras de este trabajo valen para la base ficticia. No prueban impacto ni ahorro en planta, ni valen para unidades no auditadas ([validación][val], punto 8).

[ctx]: ../../CONTEXT.md
[ficha]: ../fuentes/documentation.md
[cf]: ../../research/consigna-fuentes.md
[pob]: ../../research/poblacion-etiquetas.md
[cfo]: ../../research/consultas-ford.md
[ope]: https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950
[reu]: https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330
[mom]: https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685
[mej]: https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
