# CatBoost + tasa móvil hacia mercado

Experimento autorizado por Facundo el 30/09/2026, seguido en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33). **Exploratorio, solo Día <195; prueba final no releída.** No modifica la solución operativa ni el preregistro.

## Fuente y reproducción

- CSV vigente: SHA-256 `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`.
- Catálogo vigente: SHA-256 `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`.
- Unidad VIN; población principal acordada, entre auditados con actividad QLS, base ficticia. Se conserva la exclusión acordada de la cohorte cuya primera inspección es posterior a DIA_260; no se agregan filtros ni deduplicación.
- [Código](../solucion/experimentos/ensemble.py), [resultados agregados](../solucion/experimentos/resultados/ensemble.json). Entorno fijado en `requirements.txt`; versiones efectivas y versión del código en los resultados.

Desde la raíz, sin rutas personales en el código:

```sh
.venv/bin/python -m solucion.run --csv '<CSV>' --catalogo '<catálogo>' --cache '<carpeta fuera del repo>' --salida '<carpeta fuera del repo>' --piezas ensemble
.venv/bin/python -m solucion.pruebas
git diff --check
```

## Método

- Predicción combinada: `peso × CatBoost + (1 − peso) × tasa móvil suavizada hacia mercado`. CatBoost usa código y atributos derivados del catálogo, sin historial ni campos de Auditoría Adicional como predictores.
- Pesos de CatBoost prefijados: 25, 50 y 75 %. Ventanas: 30, 60 y 120 días, suavizado con peso 20. Se comparan nueve mezclas, CatBoost solo y las tres tasas móviles solas.
- Bloques de selección: 100–118, 119–137, 138–156 y 157–174. Comprobación posterior: 175–194. Ambos tramos ya vistos en trabajos previos: no es una nueva confirmación independiente.
- CatBoost se reentrena cada cinco días. Vida media e hiperparámetros se eligen por log-loss interno antes de cada bloque, usando el protocolo de `precision.py`. El puntaje usa únicamente resultados de Día ≤t−5.
- Semilla primaria 1, fijada antes de correr. Se eligen peso y ventana por precisión acumulada en selección; empate exacto por menor varianza entre bloques y luego nombre, como en `elegir_por_precision`. El mejor componente individual se elige también solo en selección.
- Se conservan peso y ventana elegidos al evaluar estabilidad con semillas 1–5; no se elige una semilla por rendimiento.
- Cupo diario `max(1, N_d // 20)`. Bootstrap pareado por días, 2.000 remuestreos, semillas y rangos en el JSON.

## Observaciones

Entre auditados con actividad QLS, base ficticia. Selección: n = 15.279 VIN, 740 elegidos; comprobación posterior: n = 4.626 VIN, 225 elegidos.

| Alternativa | Selección 100–174 | Comprobación 175–194 |
| --- | --- | --- |
| CatBoost solo, semilla 1 | 128/740 = 17,30 % | 39/225 = 17,33 % |
| Mejor individual en selección: móvil 60 días hacia mercado | 131/740 = 17,70 % | 42/225 = 18,67 % |
| Mezcla elegida: 25 % CatBoost + 75 % móvil 30 días hacia mercado | 132/740 = 17,84 % | 43/225 = 19,11 % |

- La mezcla suma **una CALIBRADA** respecto al mejor individual en cada tramo. Diferencia en selección: +0,14 puntos, rango del 95 % **−1,54 a +1,85 puntos**. En comprobación: +0,44 puntos, rango **−2,93 a +4,98 puntos**. No se distingue de cero.
- Frente a CatBoost solo, la mezcla suma cuatro CALIBRADA en cada tramo, pero sus rangos también incluyen cero: selección −1,85 a +3,24 puntos; comprobación −0,56 a +4,85 puntos.
- Con peso y ventana congelados, las cinco semillas de la mezcla encuentran 130–132 CALIBRADA en selección y 42–43 en comprobación. El mejor individual encuentra 131 y 42, respectivamente. Ninguna semilla muestra una diferencia con el mejor individual cuyo rango quede por encima de cero.
- La mezcla 50/50 con ventana 30 también encuentra 132 en selección; pierde el desempate por varianza. Su resultado posterior no se usa para elegirla.
- Una repetición completa dio resultados y ajustes idénticos en el mismo entorno. Las pruebas sintéticas pasan, incluida la mezcla, sus extremos y el bloqueo de la tabla desbloqueada.

## Hipótesis y límites

- La mezcla podría moderar variaciones de CatBoost entre semillas; los conteos son compatibles con ello, pero no prueban una mejora futura.
- La tabla histórica de `precision.json` publica 136 aciertos para CatBoost, frente a 128 en esta reproducción local con semilla 1. No se estableció la causa de esa diferencia; no se sobrescribe el resultado anterior. Todos los componentes de esta comparación se recalcularon en el mismo entorno y protocolo, y la repetición local fue idéntica. No comparar la mezcla nueva contra el 18,4 % histórico como si fueran una misma corrida.
- Se buscaron nueve mezclas y tres ventanas sobre períodos ya explorados. Los rangos son descriptivos y no corrigen selección ni comparaciones múltiples. La estabilidad entre semillas no reemplaza la validación sobre períodos nuevos.
- La evaluación conoce las etiquetas de los auditados con actividad QLS del CSV; en planta solo se conocerá lo auditado bajo la política aplicada. No acredita impacto real ni rendimiento sobre unidades sin actividad QLS.

## Decisión sobre este experimento

**No hay evidencia suficiente para incorporar el ensemble por una mejora de precisión.** Se conserva como candidato experimental. No se cambia el modelo operativo, la hoja ni el preregistro y no se solicita otra lectura de la prueba final. Una evaluación independiente requeriría nuevos datos temporales o una prueba en planta.
