# Anexo del estudio: catálogo y resultados completos

Generado por [`documentar_busqueda.py`](documentar_busqueda.py) a partir de agregados publicados. No contiene VIN ni datos crudos. Interpretación y límites en [el estudio](busqueda-amplia.md).

## Fuentes y denominadores

- CSV SHA-256: `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`.
- Catálogo SHA-256: `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`.
- Código de la corrida principal: `23da09aff29781ce8e3e1d56859c7239f07f9b15`.
- Código de revisión: `7e55ff5cc0367f04d96eb9b4d7c8ccbfd6184d79`; semillas: `7e55ff5cc0367f04d96eb9b4d7c8ccbfd6184d79+cambios`.
- Unidad VIN; base ficticia, solo auditados con actividad QLS; semilla primaria 1.
- Selección 100–174: 15,279 VIN, 1,702 CALIBRADA, 740 elegidos, 67 días con actividad.
- Comprobación 175–194: 4,626 VIN, 408 CALIBRADA, 225 elegidos, 19 días con actividad.
- Todos los períodos ya vistos; el orden usa selección, nunca comprobación.

## Comparaciones principales

| Alternativa | Selección | Comprobación | Lift posterior | Recall posterior |
| --- | ---: | ---: | ---: | ---: |
| Tasa fija | 94/740 · 12,70 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| Jerárquico 60 días | 131/740 · 17,70 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| CatBoost con atributos | 128/740 · 17,30 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| XGBoost con atributos | 134/740 · 18,11 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| Random Forest con atributos | 139/740 · 18,78 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| CatBoost OK/componente | 142/740 · 19,19 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 60 % stacking + 40 % jerárquico | 147/740 · 19,86 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 80 % XGBoost + 20 % historial A | 154/740 · 20,81 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| Catálogo + Rep.PosA, logística A | 136/740 · 18,38 % | 48/225 · 21,33 % | 2.43× | 11,76 % |

## Estabilidad: cinco semillas

Mismos VIN en cada semilla; el promedio no agrega nuevas inspecciones ni muestras independientes. Pesos de mezcla congelados. No se escoge la mejor semilla.

| Alternativa | Aciertos selección, semillas 1–5 | Media selección | Aciertos comprobación, semillas 1–5 | Media comprobación |
| --- | --- | ---: | --- | ---: |
| RF atributos | 139, 135, 127, 133, 135 | 133,8/740 (18,08 %) | 46, 46, 46, 46, 46 | 46,0/225 (20,44 %) |
| Mezcla | 147, 126, 126, 131, 129 | 131,8/740 (17,81 %) | 46, 44, 46, 44, 45 | 45,0/225 (20,00 %) |
| CatBoost conjunto | 142, 130, 134, 127, 133 | 133,2/740 (18,00 %) | 39, 42, 41, 38, 40 | 40,0/225 (17,78 %) |
| Jerárquico | 131, 131, 131, 131, 131 | 131,0/740 (17,70 %) | 41, 41, 41, 41, 41 | 41,0/225 (18,22 %) |
| Stacking | 100, 95, 100, 103, 92 | 98,0/740 (13,24 %) | 44, 42, 44, 42, 44 | 43,2/225 (19,20 %) |

## Las 37 columnas adicionales evaluadas

Se ensayan con catálogo como base, no como sustituto. A: eventos hasta Día del VIN; B: hasta Día−5. Ninguno acredita disponibilidad operativa.

1. `INSPECTOR`
2. `Hora Inspección`
3. `Fecha Inspección`
4. `CP`
5. `Sec.CP`
6. `CP Grupo Trabajo Reporta`
7. `CP Zona Reporta`
8. `Componente Inspección`
9. `UC Nombre Incidencia`
10. `UC Nombre Tipo Incidencia`
11. `UC Nombre Posicion A`
12. `UC Nombre Posicion B`
13. `UC Nombre Posicion C`
14. `UC Nombre Grupo Posicion C`
15. `UC Nombre Posición D`
16. `UC Nombre Grupo Posición D`
17. `UC Posición Arbitraria`
18. `CCC`
19. `VFG`
20. `VRT`
21. `UC Nombre PUL a Reparar`
22. `Fecha Reparación`
23. `Hora Reparación`
24. `Código de Reparador`
25. `Rep PUL`
26. `Rep Parte Causal`
27. `Rep.incid.`
28. `Rep.Tipo Incid.`
29. `Rep.PosA`
30. `Rep.PosB`
31. `Rep.PosC`
32. `Rep.Grp.PosC`
33. `Rep Nombre Posición D`
34. `Rep Nombre Grupo Posición D`
35. `Rep.Pos.arbit`
36. `Rep Respuesta a Pregunta Remplazar`
37. `Rep Respuesta a Pregunta Desensamblar`

VIN agrupa unidades; Auditoría Adicional y su componente son objetivos; Código de Catálogo es la base explícita. Por eso no aparecen en esta lista de adicionales.

## Cobertura por método y tamaño

El mejor de cada fila se eligió por aciertos en selección. El pool de 16 representantes se eligió en ese mismo período. No todas las configuraciones representan hipótesis independientes.

| Método | Entradas/pool | Configuraciones | Mejor selección | Su comprobación |
| --- | ---: | ---: | ---: | ---: |
| `continuo_precision` | 16 | 3968 | 150/740 · 20,27 % | 44/225 · 19,56 % |
| `convexo_brier` | 12 (meta) | 1 | 124/740 · 16,76 % | 40/225 · 17,78 % |
| `convexo_logloss` | 12 (meta) | 1 | 129/740 · 17,43 % | 40/225 · 17,78 % |
| `individual` | 1 | 238 | 142/740 · 19,19 % | 39/225 · 17,33 % |
| `mediana` | 2 | 120 | 142/740 · 19,19 % | 38/225 · 16,89 % |
| `mediana` | 3 | 560 | 145/740 · 19,59 % | 46/225 · 20,44 % |
| `mediana` | 4 | 1820 | 143/740 · 19,32 % | 44/225 · 19,56 % |
| `mediana` | 5 | 4368 | 147/740 · 19,86 % | 46/225 · 20,44 % |
| `mediana` | 6 | 8008 | 145/740 · 19,59 % | 44/225 · 19,56 % |
| `mediana` | 7 | 11440 | 149/740 · 20,14 % | 45/225 · 20,00 % |
| `mediana` | 8 | 12870 | 144/740 · 19,46 % | 40/225 · 17,78 % |
| `mediana` | 9 | 11440 | 146/740 · 19,73 % | 46/225 · 20,44 % |
| `mediana` | 10 | 8008 | 144/740 · 19,46 % | 46/225 · 20,44 % |
| `mediana` | 11 | 4368 | 146/740 · 19,73 % | 46/225 · 20,44 % |
| `mediana` | 12 | 1820 | 143/740 · 19,32 % | 47/225 · 20,89 % |
| `mediana` | 13 | 560 | 143/740 · 19,32 % | 46/225 · 20,44 % |
| `mediana` | 14 | 120 | 136/740 · 18,38 % | 46/225 · 20,44 % |
| `mediana` | 15 | 16 | 133/740 · 17,97 % | 46/225 · 20,44 % |
| `mediana` | 16 | 1 | 133/740 · 17,97 % | 46/225 · 20,44 % |
| `pares` | 2 | 253827 | 154/740 · 20,81 % | 43/225 · 19,11 % |
| `pesos_25` | 3 | 1680 | 146/740 · 19,73 % | 43/225 · 19,11 % |
| `pesos_25` | 4 | 1820 | 145/740 · 19,59 % | 42/225 · 18,67 % |
| `promedio` | 2 | 120 | 142/740 · 19,19 % | 38/225 · 16,89 % |
| `promedio` | 3 | 560 | 144/740 · 19,46 % | 43/225 · 19,11 % |
| `promedio` | 4 | 1820 | 145/740 · 19,59 % | 42/225 · 18,67 % |
| `promedio` | 5 | 4368 | 146/740 · 19,73 % | 41/225 · 18,22 % |
| `promedio` | 6 | 8008 | 146/740 · 19,73 % | 40/225 · 17,78 % |
| `promedio` | 7 | 11440 | 147/740 · 19,86 % | 44/225 · 19,56 % |
| `promedio` | 8 | 12870 | 147/740 · 19,86 % | 44/225 · 19,56 % |
| `promedio` | 9 | 11440 | 145/740 · 19,59 % | 43/225 · 19,11 % |
| `promedio` | 10 | 8008 | 145/740 · 19,59 % | 43/225 · 19,11 % |
| `promedio` | 11 | 4368 | 145/740 · 19,59 % | 44/225 · 19,56 % |
| `promedio` | 12 | 1820 | 144/740 · 19,46 % | 44/225 · 19,56 % |
| `promedio` | 13 | 560 | 141/740 · 19,05 % | 44/225 · 19,56 % |
| `promedio` | 14 | 120 | 138/740 · 18,65 % | 43/225 · 19,11 % |
| `promedio` | 15 | 16 | 133/740 · 17,97 % | 43/225 · 19,11 % |
| `promedio` | 16 | 1 | 128/740 · 17,30 % | 43/225 · 19,11 % |
| `rangos` | 2 | 120 | 145/740 · 19,59 % | 41/225 · 18,22 % |
| `rangos` | 3 | 560 | 143/740 · 19,32 % | 43/225 · 19,11 % |
| `rangos` | 4 | 1820 | 144/740 · 19,46 % | 44/225 · 19,56 % |
| `rangos` | 5 | 4368 | 141/740 · 19,05 % | 44/225 · 19,56 % |
| `rangos` | 6 | 8008 | 143/740 · 19,32 % | 44/225 · 19,56 % |
| `rangos` | 7 | 11440 | 140/740 · 18,92 % | 44/225 · 19,56 % |
| `rangos` | 8 | 12870 | 140/740 · 18,92 % | 44/225 · 19,56 % |
| `rangos` | 9 | 11440 | 142/740 · 19,19 % | 44/225 · 19,56 % |
| `rangos` | 10 | 8008 | 136/740 · 18,38 % | 43/225 · 19,11 % |
| `rangos` | 11 | 4368 | 135/740 · 18,24 % | 43/225 · 19,11 % |
| `rangos` | 12 | 1820 | 132/740 · 17,84 % | 43/225 · 19,11 % |
| `rangos` | 13 | 560 | 131/740 · 17,70 % | 41/225 · 18,22 % |
| `rangos` | 14 | 120 | 130/740 · 17,57 % | 43/225 · 19,11 % |
| `rangos` | 15 | 16 | 130/740 · 17,57 % | 43/225 · 19,11 % |
| `rangos` | 16 | 1 | 126/740 · 17,03 % | 43/225 · 19,11 % |
| `stacking_C0.01` | 12 (meta) | 1 | 130/740 · 17,57 % | 40/225 · 17,78 % |
| `stacking_C0.1` | 12 (meta) | 1 | 130/740 · 17,57 % | 41/225 · 18,22 % |
| `stacking_C1.0` | 12 (meta) | 1 | 129/740 · 17,43 % | 41/225 · 18,22 % |
| `stacking_C10.0` | 12 (meta) | 1 | 132/740 · 17,84 % | 41/225 · 18,22 % |
| `stacking_lightgbm` | 12 (meta) | 1 | 130/740 · 17,57 % | 42/225 · 18,67 % |
| `stacking_rf` | 12 (meta) | 1 | 125/740 · 16,89 % | 37/225 · 16,44 % |

Total: **458,098** configuraciones. Revisión de catálogo: **125,377**, con solapamiento; no sumar ambos totales.

Los tamaños de conjuntos cuentan entradas, que pueden ser estimadores o ensembles internos. En búsqueda continua 16 es el pool; un peso cercano a cero puede hacer que una entrada apenas influya.

### Pool de representantes

- `ml_logistica_atributos|fijo`
- `ml_nb|reentrenado`
- `ml_rf_atributos|fijo`
- `ml_xgboost_atributos|reentrenado`
- `ml_lightgbm_atributos|fijo`
- `ml_catboost_atributos|reentrenado`
- `ml_mlp_atributos|fijo`
- `tasa_fija`
- `movil_30_0`
- `movil_mercado_60`
- `jerarquico_60_40`
- `decaimiento_15`
- `campos_A|lightgbm|base|natural`
- `campos_B|lightgbm|base|natural`
- `conjunto|catboost`
- `historial|riesgo|A`

## Todos los pipelines individuales

Ordenados por aciertos de selección, con desempate por nombre para presentar la tabla. Identificadores técnicos conservados para localizar hiperparámetros y resultados en los JSON.

- `ml_*`: catálogo, código o atributos; `fijo`/`reentrenado` son modos del protocolo existente.
- `campos_A/B`: catálogo + representación de columnas; `base` usa solo catálogo.
- `historial|…|sin`: control sin eventos; A/B son supuestos de disponibilidad.
- `conjunto`: objetivo OK/componente, con entradas de catálogo.
- `natural`, `balanceado`, `sobremuestreo`, `sintetico`: políticas de entrenamiento; `_prior` añade corrección de proporciones.
- `columna:` añade un campo; `top` selecciona campos en entrenamiento; `sin_` excluye un grupo.

| # | Pipeline | Selección | Comprobación | Lift posterior | Recall posterior |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | `conjunto\|catboost` | 142/740 · 19,19 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 2 | `historial\|riesgo\|A` | 139/740 · 18,78 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 3 | `ml_rf_atributos\|fijo` | 139/740 · 18,78 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 4 | `campos_A\|lightgbm\|base\|natural` | 136/740 · 18,38 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 5 | `campos_A\|logistica\|columna:Rep.PosA\|natural` | 136/740 · 18,38 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 6 | `campos_B\|lightgbm\|base\|natural` | 136/740 · 18,38 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 7 | `historial\|lightgbm\|A` | 136/740 · 18,38 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 8 | `ml_xgboost_atributos\|reentrenado` | 134/740 · 18,11 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 9 | `campos_A\|rf\|base\|natural` | 133/740 · 17,97 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 10 | `campos_B\|rf\|base\|natural` | 133/740 · 17,97 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 11 | `historial\|lightgbm\|B` | 132/740 · 17,84 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 12 | `historial\|ranker\|sin` | 132/740 · 17,84 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 13 | `jerarquico_60_40` | 132/740 · 17,84 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 14 | `campos_A\|xgboost\|base\|natural` | 131/740 · 17,70 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 15 | `campos_B\|lightgbm\|top5\|natural` | 131/740 · 17,70 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 16 | `campos_B\|xgboost\|base\|natural` | 131/740 · 17,70 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 17 | `jerarquico_60_20` | 131/740 · 17,70 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 18 | `movil_mercado_60` | 131/740 · 17,70 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 19 | `historial\|riesgo\|sin` | 130/740 · 17,57 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 20 | `ml_rf_atributos\|reentrenado` | 130/740 · 17,57 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 21 | `campos_A\|logistica\|columna:UC Nombre Posicion A\|natural` | 129/740 · 17,43 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 22 | `conjunto\|lightgbm` | 129/740 · 17,43 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 23 | `jerarquico_120_40` | 129/740 · 17,43 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 24 | `ml_lightgbm_atributos\|fijo` | 129/740 · 17,43 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 25 | `campos_B\|lightgbm\|todas\|sintetico` | 128/740 · 17,30 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 26 | `campos_B\|lightgbm\|todas\|sintetico_prior` | 128/740 · 17,30 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 27 | `campos_B\|rf\|todas\|natural` | 128/740 · 17,30 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 28 | `historial\|lightgbm\|sin` | 128/740 · 17,30 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 29 | `jerarquico_None_40` | 128/740 · 17,30 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 30 | `ml_catboost_atributos\|reentrenado` | 128/740 · 17,30 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 31 | `ml_promedio_atributos\|fijo` | 128/740 · 17,30 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 32 | `historial\|riesgo\|B` | 127/740 · 17,16 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 33 | `movil_mercado_30` | 127/740 · 17,16 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 34 | `historial\|logistica\|B` | 126/740 · 17,03 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 35 | `jerarquico_120_10` | 126/740 · 17,03 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 36 | `ml_xgboost_atributos\|fijo` | 126/740 · 17,03 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 37 | `movil_mercado_120` | 126/740 · 17,03 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 38 | `campos_A\|catboost\|base\|natural` | 125/740 · 16,89 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 39 | `campos_A\|logistica\|columna:Rep Nombre Grupo Posición D\|natural` | 125/740 · 16,89 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 40 | `campos_A\|logistica\|columna:Rep.PosB\|natural` | 125/740 · 16,89 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 41 | `campos_A\|logistica\|columna:UC Nombre Posicion B\|natural` | 125/740 · 16,89 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 42 | `campos_B\|catboost\|base\|natural` | 125/740 · 16,89 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 43 | `campos_B\|catboost\|top20\|natural` | 125/740 · 16,89 % | 38/225 · 16,89 % | 1.92× | 9,31 % |
| 44 | `campos_B\|lightgbm\|top10\|natural` | 125/740 · 16,89 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 45 | `jerarquico_120_20` | 125/740 · 16,89 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 46 | `jerarquico_60_10` | 125/740 · 16,89 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 47 | `jerarquico_None_10` | 125/740 · 16,89 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 48 | `campos_B\|lightgbm\|todas\|balanceado` | 124/740 · 16,76 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 49 | `campos_B\|lightgbm\|todas\|balanceado_prior` | 124/740 · 16,76 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 50 | `jerarquico_None_20` | 124/740 · 16,76 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 51 | `ml_promedio_atributos\|reentrenado` | 124/740 · 16,76 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 52 | `campos_A\|lightgbm\|top10\|natural` | 123/740 · 16,62 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 53 | `campos_A\|logistica\|columna:VRT\|natural` | 123/740 · 16,62 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 54 | `campos_B\|catboost\|todas\|sobremuestreo` | 123/740 · 16,62 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 55 | `campos_B\|catboost\|todas\|sobremuestreo_prior` | 123/740 · 16,62 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 56 | `campos_B\|catboost\|top5\|natural` | 123/740 · 16,62 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 57 | `historial\|logistica\|sin` | 123/740 · 16,62 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 58 | `campos_B\|lightgbm\|todas\|sobremuestreo` | 122/740 · 16,49 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 59 | `campos_B\|lightgbm\|todas\|sobremuestreo_prior` | 122/740 · 16,49 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 60 | `ml_logistica_atributos\|fijo` | 122/740 · 16,49 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 61 | `campos_A\|catboost\|top20\|natural` | 121/740 · 16,35 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 62 | `campos_A\|catboost\|top5\|natural` | 121/740 · 16,35 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 63 | `campos_A\|logistica\|columna:VFG\|natural` | 121/740 · 16,35 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 64 | `ml_catboost_atributos\|fijo` | 121/740 · 16,35 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 65 | `campos_A\|lightgbm\|top20\|natural` | 120/740 · 16,22 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 66 | `campos_A\|logistica\|columna:Hora Inspección\|natural` | 120/740 · 16,22 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 67 | `campos_A\|logistica\|columna:Hora Reparación\|natural` | 120/740 · 16,22 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 68 | `campos_A\|logistica\|columna:UC Nombre Grupo Posicion C\|natural` | 120/740 · 16,22 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 69 | `campos_B\|catboost\|todas\|balanceado` | 120/740 · 16,22 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 70 | `campos_B\|catboost\|todas\|balanceado_prior` | 120/740 · 16,22 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 71 | `campos_B\|catboost\|top10\|natural` | 120/740 · 16,22 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 72 | `decaimiento_15` | 120/740 · 16,22 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 73 | `campos_A\|logistica\|columna:Fecha Inspección\|natural` | 119/740 · 16,08 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 74 | `campos_A\|logistica\|columna:Rep.Pos.arbit\|natural` | 119/740 · 16,08 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 75 | `campos_A\|logistica\|columna:UC Nombre Grupo Posición D\|natural` | 119/740 · 16,08 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 76 | `campos_A\|logistica\|columna:UC Posición Arbitraria\|natural` | 119/740 · 16,08 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 77 | `historial\|mil_atencion\|sin` | 119/740 · 16,08 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 78 | `historial\|mil_media\|sin` | 119/740 · 16,08 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 79 | `campos_A\|catboost\|top10\|natural` | 118/740 · 15,95 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 80 | `campos_A\|lightgbm\|top5\|natural` | 118/740 · 15,95 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 81 | `campos_A\|logistica\|columna:Rep.Tipo Incid.\|natural` | 118/740 · 15,95 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 82 | `campos_B\|catboost\|todas\|sintetico` | 118/740 · 15,95 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 83 | `campos_B\|catboost\|todas\|sintetico_prior` | 118/740 · 15,95 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 84 | `campos_B\|lightgbm\|todas\|natural` | 118/740 · 15,95 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 85 | `campos_B\|logistica\|columna:Rep Respuesta a Pregunta Desensamblar\|natural` | 118/740 · 15,95 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 86 | `campos_B\|logistica\|columna:Rep Respuesta a Pregunta Remplazar\|natural` | 118/740 · 15,95 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 87 | `campos_B\|logistica\|columna:Rep.PosA\|natural` | 118/740 · 15,95 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 88 | `campos_B\|xgboost\|todas\|natural` | 118/740 · 15,95 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 89 | `campos_A\|logistica\|columna:Fecha Reparación\|natural` | 117/740 · 15,81 % | 50/225 · 22,22 % | 2.53× | 12,25 % |
| 90 | `campos_A\|logistica\|columna:UC Nombre PUL a Reparar\|natural` | 117/740 · 15,81 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 91 | `campos_B\|lightgbm\|top20\|natural` | 117/740 · 15,81 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 92 | `campos_B\|logistica\|columna:Rep Nombre Grupo Posición D\|natural` | 117/740 · 15,81 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 93 | `campos_B\|logistica\|columna:Rep.Pos.arbit\|natural` | 117/740 · 15,81 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 94 | `campos_B\|logistica\|columna:UC Nombre Grupo Posición D\|natural` | 117/740 · 15,81 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 95 | `campos_B\|logistica\|columna:UC Nombre Posicion A\|natural` | 117/740 · 15,81 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 96 | `ml_xgboost\|reentrenado` | 117/740 · 15,81 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 97 | `campos_A\|logistica\|columna:CP Grupo Trabajo Reporta\|natural` | 116/740 · 15,68 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 98 | `campos_A\|logistica\|columna:UC Nombre Tipo Incidencia\|natural` | 116/740 · 15,68 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 99 | `campos_B\|logistica\|columna:Hora Reparación\|natural` | 116/740 · 15,68 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 100 | `campos_B\|logistica\|columna:Rep.PosB\|natural` | 116/740 · 15,68 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 101 | `campos_B\|logistica\|columna:UC Posición Arbitraria\|natural` | 116/740 · 15,68 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 102 | `campos_A\|lightgbm\|todas\|balanceado` | 115/740 · 15,54 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 103 | `campos_A\|lightgbm\|todas\|balanceado_prior` | 115/740 · 15,54 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 104 | `campos_A\|lightgbm\|todas\|sobremuestreo` | 115/740 · 15,54 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 105 | `campos_A\|lightgbm\|todas\|sobremuestreo_prior` | 115/740 · 15,54 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 106 | `campos_A\|logistica\|columna:Rep.Grp.PosC\|natural` | 115/740 · 15,54 % | 49/225 · 21,78 % | 2.48× | 12,01 % |
| 107 | `campos_A\|logistica\|columna:Rep.PosC\|natural` | 115/740 · 15,54 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 108 | `campos_B\|logistica\|columna:UC Nombre Posicion B\|natural` | 115/740 · 15,54 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 109 | `campos_A\|logistica\|columna:CP Zona Reporta\|natural` | 114/740 · 15,41 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 110 | `campos_A\|logistica\|columna:UC Nombre Incidencia\|natural` | 114/740 · 15,41 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 111 | `campos_B\|logistica\|columna:CP Zona Reporta\|natural` | 114/740 · 15,41 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 112 | `historial\|ranker\|B` | 114/740 · 15,41 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 113 | `ml_lightgbm_atributos\|reentrenado` | 114/740 · 15,41 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 114 | `campos_A\|logistica\|columna:Sec.CP\|natural` | 113/740 · 15,27 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 115 | `campos_A\|xgboost\|todas\|natural` | 113/740 · 15,27 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 116 | `campos_B\|logistica\|columna:Rep PUL\|natural` | 113/740 · 15,27 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 117 | `campos_B\|logistica\|columna:UC Nombre Grupo Posicion C\|natural` | 113/740 · 15,27 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 118 | `movil_30_0` | 113/740 · 15,27 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 119 | `campos_A\|catboost\|todas\|natural` | 112/740 · 15,14 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 120 | `campos_A\|lightgbm\|todas\|natural` | 112/740 · 15,14 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 121 | `campos_A\|logistica\|base\|natural` | 112/740 · 15,14 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 122 | `campos_B\|catboost\|todas\|natural` | 112/740 · 15,14 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 123 | `campos_B\|logistica\|base\|natural` | 112/740 · 15,14 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 124 | `campos_B\|logistica\|columna:CP\|natural` | 112/740 · 15,14 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 125 | `campos_B\|logistica\|columna:Código de Reparador\|natural` | 112/740 · 15,14 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 126 | `campos_B\|logistica\|columna:Fecha Reparación\|natural` | 112/740 · 15,14 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 127 | `campos_B\|logistica\|columna:Rep Nombre Posición D\|natural` | 112/740 · 15,14 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 128 | `campos_B\|logistica\|columna:Rep Parte Causal\|natural` | 112/740 · 15,14 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 129 | `campos_B\|logistica\|columna:Rep.Grp.PosC\|natural` | 112/740 · 15,14 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 130 | `decaimiento_30` | 112/740 · 15,14 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 131 | `historial\|logistica\|A` | 112/740 · 15,14 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 132 | `ml_mlp_atributos\|fijo` | 112/740 · 15,14 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 133 | `campos_A\|logistica\|columna:CP\|natural` | 111/740 · 15,00 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 134 | `campos_A\|logistica\|columna:Rep Parte Causal\|natural` | 111/740 · 15,00 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 135 | `campos_B\|logistica\|columna:Hora Inspección\|natural` | 111/740 · 15,00 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 136 | `campos_B\|logistica\|columna:Rep.Tipo Incid.\|natural` | 111/740 · 15,00 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 137 | `campos_B\|logistica\|columna:UC Nombre Posición D\|natural` | 111/740 · 15,00 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 138 | `campos_B\|logistica\|columna:VFG\|natural` | 111/740 · 15,00 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 139 | `campos_B\|logistica\|grupo:tiempos\|natural` | 111/740 · 15,00 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 140 | `ml_mlp_atributos\|reentrenado` | 111/740 · 15,00 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 141 | `campos_A\|logistica\|columna:CCC\|natural` | 110/740 · 14,86 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 142 | `campos_A\|logistica\|grupo:tiempos\|natural` | 110/740 · 14,86 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 143 | `campos_B\|logistica\|columna:UC Nombre Tipo Incidencia\|natural` | 110/740 · 14,86 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 144 | `decaimiento_60` | 110/740 · 14,86 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 145 | `ml_logistica_atributos\|reentrenado` | 110/740 · 14,86 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 146 | `campos_A\|logistica\|columna:Código de Reparador\|natural` | 109/740 · 14,73 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 147 | `campos_B\|logistica\|columna:UC Nombre PUL a Reparar\|natural` | 109/740 · 14,73 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 148 | `campos_B\|logistica\|columna:UC Nombre Posicion C\|natural` | 109/740 · 14,73 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 149 | `campos_B\|logistica\|columna:VRT\|natural` | 109/740 · 14,73 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 150 | `historial\|mil_atencion\|A` | 109/740 · 14,73 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 151 | `movil_30_20` | 109/740 · 14,73 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 152 | `campos_A\|logistica\|columna:Componente Inspección\|natural` | 108/740 · 14,59 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 153 | `campos_A\|logistica\|columna:Rep PUL\|natural` | 108/740 · 14,59 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 154 | `campos_B\|logistica\|columna:CP Grupo Trabajo Reporta\|natural` | 108/740 · 14,59 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 155 | `campos_B\|logistica\|columna:Componente Inspección\|natural` | 108/740 · 14,59 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 156 | `campos_B\|logistica\|columna:INSPECTOR\|natural` | 108/740 · 14,59 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 157 | `campos_B\|logistica\|columna:Rep.PosC\|natural` | 108/740 · 14,59 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 158 | `historial\|mil_media\|A` | 108/740 · 14,59 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 159 | `ml_lightgbm\|reentrenado` | 108/740 · 14,59 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 160 | `movil_120_20` | 108/740 · 14,59 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 161 | `movil_60_20` | 108/740 · 14,59 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 162 | `campos_A\|logistica\|columna:Rep.incid.\|natural` | 107/740 · 14,46 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 163 | `campos_B\|logistica\|columna:Fecha Inspección\|natural` | 107/740 · 14,46 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 164 | `campos_B\|logistica\|columna:Sec.CP\|natural` | 107/740 · 14,46 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 165 | `campos_A\|logistica\|top20\|natural` | 106/740 · 14,32 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 166 | `campos_A\|rf\|todas\|natural` | 106/740 · 14,32 % | 38/225 · 16,89 % | 1.92× | 9,31 % |
| 167 | `ml_mlp\|reentrenado` | 106/740 · 14,32 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 168 | `movil_120_0` | 106/740 · 14,32 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 169 | `movil_60_0` | 106/740 · 14,32 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 170 | `campos_A\|logistica\|columna:Rep Nombre Posición D\|natural` | 105/740 · 14,19 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 171 | `campos_A\|logistica\|todas\|sintetico` | 105/740 · 14,19 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 172 | `campos_A\|logistica\|todas\|sintetico_prior` | 105/740 · 14,19 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 173 | `campos_B\|logistica\|columna:CCC\|natural` | 105/740 · 14,19 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 174 | `campos_B\|logistica\|columna:Rep.incid.\|natural` | 105/740 · 14,19 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 175 | `campos_B\|logistica\|columna:UC Nombre Incidencia\|natural` | 105/740 · 14,19 % | 48/225 · 21,33 % | 2.43× | 11,76 % |
| 176 | `campos_B\|logistica\|todas\|natural` | 105/740 · 14,19 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 177 | `ml_promedio\|reentrenado` | 105/740 · 14,19 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 178 | `ml_rf\|reentrenado` | 105/740 · 14,19 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 179 | `campos_A\|catboost\|todas\|balanceado` | 104/740 · 14,05 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 180 | `campos_A\|catboost\|todas\|balanceado_prior` | 104/740 · 14,05 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 181 | `campos_A\|catboost\|todas\|sobremuestreo` | 104/740 · 14,05 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 182 | `campos_A\|catboost\|todas\|sobremuestreo_prior` | 104/740 · 14,05 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 183 | `campos_A\|logistica\|columna:INSPECTOR\|natural` | 104/740 · 14,05 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 184 | `campos_A\|logistica\|columna:UC Nombre Posicion C\|natural` | 104/740 · 14,05 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 185 | `campos_A\|logistica\|columna:UC Nombre Posición D\|natural` | 104/740 · 14,05 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 186 | `campos_A\|logistica\|top5\|natural` | 104/740 · 14,05 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 187 | `campos_A\|logistica\|columna:Rep Respuesta a Pregunta Desensamblar\|natural` | 103/740 · 13,92 % | 50/225 · 22,22 % | 2.53× | 12,25 % |
| 188 | `campos_A\|logistica\|todas\|sobremuestreo` | 103/740 · 13,92 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 189 | `campos_A\|logistica\|todas\|sobremuestreo_prior` | 103/740 · 13,92 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 190 | `ml_stacking\|reentrenado` | 103/740 · 13,92 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 191 | `campos_A\|logistica\|columna:Rep Respuesta a Pregunta Remplazar\|natural` | 102/740 · 13,78 % | 50/225 · 22,22 % | 2.53× | 12,25 % |
| 192 | `campos_A\|logistica\|todas\|natural` | 102/740 · 13,78 % | 39/225 · 17,33 % | 1.97× | 9,56 % |
| 193 | `campos_B\|logistica\|sin:reparaciones\|natural` | 102/740 · 13,78 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 194 | `campos_B\|logistica\|sin:tiempos\|natural` | 102/740 · 13,78 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 195 | `historial\|catboost\|A` | 102/740 · 13,78 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 196 | `ml_logistica\|reentrenado` | 102/740 · 13,78 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 197 | `campos_B\|logistica\|grupo:inspeccion\|natural` | 101/740 · 13,65 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 198 | `campos_B\|logistica\|grupo:reparaciones\|natural` | 101/740 · 13,65 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 199 | `campos_B\|logistica\|top20\|natural` | 101/740 · 13,65 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 200 | `campos_A\|logistica\|todas\|balanceado` | 100/740 · 13,51 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 201 | `campos_A\|logistica\|todas\|balanceado_prior` | 100/740 · 13,51 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 202 | `campos_B\|logistica\|sin:inspeccion\|natural` | 100/740 · 13,51 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 203 | `campos_B\|logistica\|top10\|natural` | 100/740 · 13,51 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 204 | `campos_B\|logistica\|top5\|natural` | 100/740 · 13,51 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 205 | `conjunto\|logistica` | 100/740 · 13,51 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 206 | `historial\|mil_atencion\|B` | 100/740 · 13,51 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 207 | `historial\|mil_media\|B` | 100/740 · 13,51 % | 47/225 · 20,89 % | 2.38× | 11,52 % |
| 208 | `historial\|ranker\|A` | 100/740 · 13,51 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 209 | `ml_stacking\|fijo` | 100/740 · 13,51 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 210 | `campos_A\|logistica\|sin:tiempos\|natural` | 99/740 · 13,38 % | 38/225 · 16,89 % | 1.92× | 9,31 % |
| 211 | `campos_A\|logistica\|grupo:inspeccion\|natural` | 98/740 · 13,24 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 212 | `ml_nb\|reentrenado` | 98/740 · 13,24 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 213 | `ml_rf\|fijo` | 98/740 · 13,24 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 214 | `campos_A\|logistica\|grupo:reparaciones\|natural` | 97/740 · 13,11 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 215 | `campos_A\|logistica\|top10\|natural` | 97/740 · 13,11 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 216 | `campos_B\|logistica\|todas\|sintetico` | 97/740 · 13,11 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 217 | `campos_B\|logistica\|todas\|sintetico_prior` | 97/740 · 13,11 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 218 | `ml_lightgbm\|fijo` | 97/740 · 13,11 % | 44/225 · 19,56 % | 2.23× | 10,78 % |
| 219 | `ml_xgboost\|fijo` | 97/740 · 13,11 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 220 | `campos_A\|logistica\|sin:reparaciones\|natural` | 96/740 · 12,97 % | 41/225 · 18,22 % | 2.07× | 10,05 % |
| 221 | `campos_B\|logistica\|todas\|balanceado` | 96/740 · 12,97 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 222 | `campos_B\|logistica\|todas\|balanceado_prior` | 96/740 · 12,97 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 223 | `ml_mlp\|fijo` | 94/740 · 12,70 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 224 | `tasa_fija` | 94/740 · 12,70 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 225 | `campos_B\|logistica\|todas\|sobremuestreo` | 93/740 · 12,57 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 226 | `campos_B\|logistica\|todas\|sobremuestreo_prior` | 93/740 · 12,57 % | 45/225 · 20,00 % | 2.28× | 11,03 % |
| 227 | `ml_promedio\|fijo` | 92/740 · 12,43 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 228 | `campos_A\|logistica\|sin:inspeccion\|natural` | 91/740 · 12,30 % | 40/225 · 17,78 % | 2.02× | 9,80 % |
| 229 | `historial\|catboost\|sin` | 89/740 · 12,03 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 230 | `ml_logistica\|fijo` | 86/740 · 11,62 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 231 | `historial\|catboost\|B` | 85/740 · 11,49 % | 42/225 · 18,67 % | 2.12× | 10,29 % |
| 232 | `ml_catboost\|reentrenado` | 84/740 · 11,35 % | 43/225 · 19,11 % | 2.18× | 10,54 % |
| 233 | `campos_A\|catboost\|todas\|sintetico` | 82/740 · 11,08 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 234 | `campos_A\|catboost\|todas\|sintetico_prior` | 82/740 · 11,08 % | 37/225 · 16,44 % | 1.87× | 9,07 % |
| 235 | `campos_A\|lightgbm\|todas\|sintetico` | 81/740 · 10,95 % | 38/225 · 16,89 % | 1.92× | 9,31 % |
| 236 | `campos_A\|lightgbm\|todas\|sintetico_prior` | 81/740 · 10,95 % | 38/225 · 16,89 % | 1.92× | 9,31 % |
| 237 | `ml_nb\|fijo` | 80/740 · 10,81 % | 46/225 · 20,44 % | 2.33× | 11,27 % |
| 238 | `ml_catboost\|fijo` | 74/740 · 10,00 % | 43/225 · 19,11 % | 2.18× | 10,54 % |

## Evidencia detallada

Los JSON conservan rangos bootstrap, treinta máximos, pesos, controles, ajustes por bloque y metas. Las bandas por búsqueda son condicionales; consultar el informe antes de interpretar diferencias.

- [Búsqueda principal](../solucion/experimentos/resultados/busqueda.json)
- [Catálogo y diagnóstico adaptativo](../solucion/experimentos/resultados/robustez_busqueda.json)
- [Cinco semillas](../solucion/experimentos/resultados/semillas_busqueda.json)
