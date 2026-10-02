# Ford Predictive Quality — FordwardAI

Solución del equipo **FordwardAI** (Mateo Serebrinsky, Máximo Georgalos y Facundo Lanusse, Universidad Austral) para el desafío *Data-Driven Predictive Quality* del Ford Innovation Challenge III. Se presentó en el Trials Day del 2 de octubre de 2026, en Planta Pacheco.

## La solución en un párrafo

Hoy el 5 % que va a Auditoría Adicional se elige al azar. Proponemos una **hoja de códigos prioritarios**: con el mismo cupo, dice qué códigos de catálogo buscar en la playa de despacho y cuántas unidades de cada uno. La tasa de cada código la estima **CatBoost con el código y sus atributos** (mercado, motor, tracción y versión), que se reentrena solo cada 5 días con lo auditado. Sobre la base ficticia, entre auditados con actividad QLS, en la prueba final (n = 13.312 VIN), de cada 100 elegidos se calibrarían **12,0** (rango del 95 %: 9,2–14,8), contra 8,2 al azar con el mismo cupo: 1,45 veces el azar.

**La solución se iteró:**
- **Primera etapa:** se elegía la alternativa más simple, y ganó una tasa fija por código (10,9 contra 8,2 en su lectura de la prueba final).
- **Segunda etapa:** se pasó a elegir por precisión en cinco bloques de tiempo, y ganó CatBoost.
- **Advertencia:** la lectura de CatBoost es más débil, porque se acordó conociendo la primera.

La prueba final se leyó tres veces, y las tres lecturas están declaradas en [cómo se iteró la solución](docs/entrega/02-2-especificaciones-tecnicas.md#cómo-se-iteró-la-solución). No es una medición de planta: la base es ficticia y solo tiene auditados con actividad QLS.

## Qué hay en el repo

| Carpeta | Qué es |
| --- | --- |
| [`docs/entrega/`](docs/entrega/README.md) | Borradores del Informe por sección, figuras, ideas descartadas y preguntas del jurado |
| [`plataforma/`](plataforma/README.md) | MVP de la plataforma web: cómo se usaría la hoja en planta, de Gate Release al reporte para la línea |
| [`prototipos/presentacion-3d/`](prototipos/presentacion-3d/README.md) | La presentación, como sitio estático con notas del orador |
| [`solucion/`](solucion/README.md) | Código de la prueba de concepto: validación, elección, preregistros, hoja y figuras; resultados agregados en `solucion/resultados/` |
| [`solucion/experimentos/`](solucion/experimentos/README.md) | Experimentos exploratorios, separados del recorrido principal |
| [`research/`](research/) | Auditoría del CSV, particiones, agrupación del catálogo y estudios ([búsqueda amplia](research/busqueda-amplia.md), [opción más precisa](research/opcion-mas-precisa.md), [datos de proceso](research/datos-proceso.md), [simulación](research/simulacion-evaluacion.md)) |
| [`docs/`](docs/) | [Alcance de entrega](docs/alcance-entrega.md), [datos locales](docs/datos-locales.md), [diccionario de datos](docs/diccionario-datos.md), [plan de acción](docs/plan-de-accion.md) (histórico) y la [consigna](docs/fuentes/) |

El vocabulario está en [CONTEXT.md](CONTEXT.md).

## Ver la plataforma y la presentación

Se levantan las dos juntas con un comando: la plataforma en <http://127.0.0.1:8765> y la presentación en <http://localhost:8000/prototipos/presentacion-3d/>. **Sin datos, la plataforma arranca en modo demo** con una base sintética del mismo esquema ([`plataforma/demo.py`](plataforma/demo.py)): sirve para ver el flujo, pero sus cifras no son resultados. Con los dos CSV de Ford (CSV QLS y catálogo, identificados por SHA-256 en [datos locales](docs/datos-locales.md)) muestra la base ficticia. Los datos nunca están en el repo.

**Opción A · Un comando, con Python 3.13** ([descargar](https://www.python.org/downloads/)). La primera vez crea el entorno `.venv` e instala `requirements.txt`; después abre las dos páginas.

| Sistema | Demo | Con los CSV de Ford |
| --- | --- | --- |
| macOS o Linux | `./iniciar.sh` | `./iniciar.sh "<Dataset QLS Inspección Adicional.csv>" "<Códigos de catálogo.csv>"` |
| Windows | `iniciar.bat` | `iniciar.bat "<Dataset QLS Inspección Adicional.csv>" "<Códigos de catálogo.csv>"` |

**Opción B · Docker**, en cualquier sistema con Docker instalado, sin Python:

```sh
docker compose up --build
```

Para usar la base de Ford, copiar los dos CSV en `./datos/` (Git la ignora) o indicar la carpeta con `FORD_DATOS=/ruta docker compose up --build`.

**Opción C · A mano.**
1. Crear el entorno: `python3.13 -m venv .venv` y `.venv/bin/pip install -r requirements.txt`. En Windows, el intérprete es `.venv\Scripts\python`.
2. Levantar la plataforma: `.venv/bin/python -m plataforma.servidor`, con `--csv` y `--catalogo` si se usan los datos de Ford.
3. Levantar la presentación: `python3 -m http.server 8000` desde la raíz.

Solo para recalcular los resultados (no para verlos), xgboost y lightgbm necesitan OpenMP: `brew install libomp` en macOS y `apt-get install libgomp1` en Linux.

**La plataforma** arranca en el Día 155. Primero se arma la hoja; **Avanzar al día siguiente** simula la llegada de unidades y resultados. El recorrido (Día de planta → Hoja → Selección → Seguimiento → Resultados → Modelo → Reporte para la línea) está en el [README de la plataforma](plataforma/README.md). Ningún VIN sale del servidor. El build de la interfaz está versionado, así que no hace falta Node.

**La presentación** necesita internet, porque three.js, GSAP y las fuentes se cargan por CDN. Se recorre con las flechas o con scroll; `N` muestra las notas del orador y `?estatico=1` evita el 3D en equipos lentos. Las capturas de la plataforma no se versionan porque muestran tasas por código. Sin ellas, esas pantallas muestran un esquema, con un aviso que se oculta con `?limpio=1`. Para generarlas (con los CSV, Chrome y bash):

```sh
FORD_CSV="<Dataset QLS Inspección Adicional.csv>" FORD_CATALOGO="<Códigos de catálogo.csv>" prototipos/presentacion-3d/herramientas/capturar_flujo.sh
```

Más opciones en el [README de la presentación](prototipos/presentacion-3d/README.md).

## Reproducir los resultados

```sh
.venv/bin/python -m solucion.pruebas                                     # pruebas sintéticas, sin el CSV
.venv/bin/python -m solucion.run --csv "<CSV vigente>" --catalogo "<catálogo vigente>"
.venv/bin/python -m solucion.empaquetar --destino "<ruta externa>/reproduccion.zip" --salida "<hoja generada>"
```

Desde la raíz, con el entorno de la opción C. `solucion.run` recalcula la validación, la hoja de desarrollo y las figuras, y verifica los hashes de las entradas. Los resultados de referencia son los agregados versionados de las corridas documentadas. Los modelos de ML (incluida la elección por precisión, `--piezas precision`, donde gana CatBoost) pueden variar según el procesador; sus cifras de referencia son las de [`precision.json`](solucion/resultados/precision.json). Las lecturas de la prueba final no se repiten: están en [`prueba-final.json`](solucion/resultados/prueba-final.json). Detalle en [reproducción](solucion/README.md).

## Límites

- La base es **ficticia** y reúne solo auditados con actividad QLS: cada cifra se dice «entre auditados con actividad QLS, [tramo], base ficticia, n = …».
- No afirmamos impacto ni ahorro en planta, reducción de calibraciones, validez para unidades no auditadas ni causas. Eso se mide en planta, con días de control.
- Hay 195.808 eventos, 59.681 VIN y 6.079 VIN CALIBRADA. Los 4.910 VIN cuya primera inspección es posterior a DIA_260 son todos OK; Ford analiza una posible mejora en planta, sin confirmarla.

## Trabajo en equipo y decisiones

Las [convenciones compartidas](AGENTS.md) rigen para Codex y Claude Code; [CONTRIBUTING.md](CONTRIBUTING.md) fija ramas, commits y PRs, y la [guía del equipo](docs/trabajo-equipo.md) explica las skills. Cada decisión vive en su ticket. El [mapa de decisiones](https://github.com/FordwardAI/ford-predictive-quality/issues/1) las indexa, la construcción se siguió en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33) y el estado está en el [tablero del proyecto](https://github.com/orgs/FordwardAI/projects/1).
