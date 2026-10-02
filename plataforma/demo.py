"""Base sintética de demostración: la plataforma funciona sin los CSV de Ford.

Genera eventos con los nombres técnicos del CSV QLS y un catálogo con la misma agrupación (mercado, versión, motor y
tracción), y los pasa por `solucion.datos.construir`, igual que la base real. Así el resto de la plataforma no distingue
la demo de la base ficticia: cambia solo el origen de los datos.

- 24 códigos `S<mercado><versión><tracción>` (por ejemplo `SA12`): 4 mercados × 3 versiones × 2 tracciones.
- Unas 250 unidades por día, Días 1–199, con una rotación de la mezcla de códigos cerca del Día 100.
- La tasa de calibración de cada código sale de sus atributos (el mercado pesa más) con un ruido propio del código.
- Identificadores `DEMO-<día>-<n>`: no tienen forma de VIN ni vienen de la base real.

Las cifras de la demo no son resultados: sirven para ver el flujo de la plataforma.
"""
import numpy as np

from solucion.datos import construir

SEMILLA = 20261002
DIAS = range(1, 200)  # Hasta el margen previo a la prueba final; la plataforma corre en 155–194.
POR_DIA = 250
MERCADOS = {"A": ("LOCATION_1", 1.0), "B": ("LOCATION_2", 0.75), "C": ("LOCATION_3", 1.9), "D": ("LOCATION_4", 0.55)}
VERSIONES = {1: ("VERSION_1", "MOTOR A", "MOTOR A1", 0.8), 2: ("VERSION_2", "MOTOR B", "MOTOR B1", 1.0),
             3: ("VERSION_3", "MOTOR B", "MOTOR B2", 1.35)}
TRACCIONES = {2: ("4X2", 0.9), 4: ("4X4", 1.15)}
COMPONENTES = [f"COMPONENTE_{i}" for i in range(1, 11)]
FUENTE = {"csv": "demo sintética (plataforma/demo.py)", "csv_sha256": "demo-sintetica",
          "catalogo": "demo sintética (plataforma/demo.py)", "catalogo_sha256": "demo-sintetica"}


def catalogo():
    """{código: atributos}, con las mismas claves que `research/catalog_groups.grouping`."""
    salida = {}
    for m, (mercado, _) in MERCADOS.items():
        for v, (version, motor, motor_dom, _) in VERSIONES.items():
            for t, (traccion, _) in TRACCIONES.items():
                salida[f"S{m}{v}{t}"] = {"mercado": mercado, "mercado_dominante": version, "motor": motor,
                                         "motor_dominante": motor_dom, "traccion": traccion,
                                         "traccion_dominante": version}
    return salida


def _tasas(codigos, rng):
    tasas = {}
    for c in codigos:
        _, fm = MERCADOS[c[1]]
        *_, fv = VERSIONES[int(c[2])]
        _, ft = TRACCIONES[int(c[3])]
        tasas[c] = float(np.clip(0.11 * fm * fv * ft * rng.lognormal(0, 0.25), 0.01, 0.5))
    return tasas


def eventos(semilla=SEMILLA, dias=DIAS, por_dia=POR_DIA):
    """Eventos con los nombres técnicos del CSV; una unidad puede tener varios."""
    rng = np.random.default_rng(semilla)
    codigos = sorted(catalogo())
    tasas = _tasas(codigos, rng)
    # Dos mezclas de producción: antes y después del Día 100 cambia qué códigos se fabrican más.
    mezclas = [rng.dirichlet(np.full(len(codigos), 0.6)) for _ in range(2)]
    preferidos = {c: rng.choice(len(COMPONENTES), 3, replace=False) for c in codigos}
    salida = []
    for dia in dias:
        mezcla = mezclas[0] if dia < 100 else mezclas[1]
        for i in range(int(rng.poisson(por_dia))):
            codigo = codigos[int(rng.choice(len(codigos), p=mezcla))]
            calibrada = rng.random() < tasas[codigo]
            componente = ""
            if calibrada:
                indice = preferidos[codigo][int(rng.choice(3, p=[0.6, 0.25, 0.15]))] if rng.random() < 0.7 \
                    else int(rng.integers(len(COMPONENTES)))
                componente = COMPONENTES[indice]
            unidad = f"DEMO-{dia:03d}-{i:04d}"
            for _ in range(1 + int(rng.poisson(0.8))):
                salida.append({"VIN": unidad, "Fecha Inspección": f"DIA_{dia}", "Fecha Reparación": f"DIA_{dia}",
                               "Hora Inspección": "0,25", "Hora Reparación": "0,5", "Código de Catálogo": codigo,
                               "Auditoría Adicional": "CALIBRADA" if calibrada else "OK",
                               "Componente Auditoría Adicional": componente,
                               "UC Nombre Incidencia": f"INCIDENCIA_{int(rng.integers(1, 21))}"})
    return salida


def tabla(semilla=SEMILLA):
    """Tabla enmascarada como la de `solucion.datos.cargar`, armada con la base sintética."""
    return construir(eventos(semilla), catalogo(), fuente=dict(FUENTE))
