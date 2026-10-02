# Trabajo compartido con Codex y Claude Code

El flujo compartido está en [AGENTS.md](../AGENTS.md) y las convenciones de ramas, commits y títulos de PR en [CONTRIBUTING.md](../CONTRIBUTING.md). Claude importa AGENTS mediante [CLAUDE.md](../CLAUDE.md); los dos agentes reciben las mismas reglas del repo. Las preferencias personales no deben convertirse en requisitos del equipo sin documentarlas aquí.

## Incorporación

1. Clonar el repo y leer README, AGENTS y CONTEXT. Se necesitan Git, Python 3.13 con el entorno `.venv` de [`requirements.txt`](../requirements.txt) (ver [reproducción](../solucion/README.md)); `gh` autenticado y acceso al repo/Project para sincronizar GitHub.
2. Obtener el CSV por el canal del equipo, guardarlo fuera del repo y verificar el hash según [datos locales](datos-locales.md). No copiarlo como fixture ni adjuntarlo a tickets.
3. Ejecutar `python3 research/test_audit_dataset.py`. No requiere el CSV ni paquetes externos.
4. Abrir el agente desde el repo. Pedirle que indique qué convenciones cargó y el ticket que va a trabajar. En Claude se puede revisar `/context` para comprobar la carga de `CLAUDE.md`.
5. Verificar que esté disponible `ford-data-analysis`. Codex: `$ford-data-analysis`; Claude Code: `/ford-data-analysis`. Si la sesión ya estaba abierta, iniciar otra para comprobar la nueva skill. Si no se descubre automáticamente, indicar la ruta al SKILL.md.

La skill compartida vive en `.agents/skills/ford-data-analysis/`; `.claude/skills/ford-data-analysis` es un enlace relativo a esa carpeta. En Windows, si Git materializa el enlace como texto, habilitar soporte de symlinks y volver a obtenerlo, o pedir al agente que lea directamente el archivo canónico; no editar una segunda copia.

## Skills de Matt Pocock

Se usan las versiones vendorizadas en el repo, no una lista de comandos supuestos. Estas son las funciones relevantes para este proyecto; algunos nombres cambian entre versiones del catálogo.

| Trabajo | Skill usada en este proyecto |
| --- | --- |
| Continuar el mapa de decisiones | `wayfinder` |
| Resolver una decisión con el equipo | `grilling` junto con `domain-modeling` |
| Investigar fuentes externas y guardar evidencia | `research` |
| Explorar una salida concreta con una persona | `prototype` |
| Diagnosticar fallos o revisar cambios | `diagnosing-bugs`, `code-review` |
| Implementar comportamiento test-first cuando corresponde | `tdd` |

Las skills están vendorizadas en el repo: Codex las descubre en `.agents/skills/` y Claude Code en `.claude/skills/`, que contiene enlaces relativos a esas mismas carpetas (igual que `ford-data-analysis`). No hace falta instalar nada; al clonar, los dos agentes tienen las mismas instrucciones. Invocación: Codex `$wayfinder`, Claude Code `/wayfinder`.

- **Origen:** [mattpocock/skills](https://github.com/mattpocock/skills) v1.2.3, commit `959a8e9f1edc3adbe2f7e3054bb6fbefa6696260`. Se copiaron sin cambios las 25 skills del manifiesto del plugin (`.claude-plugin/plugin.json`); las carpetas `in-progress`, `misc` y `deprecated` del catálogo no se incluyen. Licencia MIT en `.agents/skills/LICENSE-mattpocock-skills`.
- **Una sola copia:** no instalar además el plugin `mattpocock-skills` de Claude Code ni copias globales en `~/.codex/skills` o `~/.claude/skills` con los mismos nombres; generan duplicados que pueden divergir. Si ya están instaladas, desactivarlas para este repo.
- **No editar las copias** para adaptarlas al proyecto: las particularidades van en AGENTS.md o en skills del equipo. No suponer que `grill-me` y `grilling`, por ejemplo, tienen instrucciones idénticas sin leerlas.
- **Actualizar** solo con un ticket propio, fuera del trabajo de otros tickets: obtener la nueva versión, revisar el diff, reemplazar las carpetas y registrar aquí versión y commit.

El proyecto ya se inició con **wayfinder**. Si se ejecuta `setup-matt-pocock-skills`, conservar el tracker existente: **GitHub Project FordwardAI-v1** con los issues del repositorio, este documento como configuración, `research/` como ubicación de investigaciones y `CONTEXT.md` como vocabulario. Retomar el mapa existente; no crear un mapa local ni otro Project.

## Skill de análisis de datos del equipo

`ford-data-analysis` complementa las skills generales con las particularidades QLS: cabecera doble del CSV, precisión y faltantes, conteos por evento/VIN, temporalidad, fuga y evidencia reproducible. Reutiliza el script actual y no requiere una librería nueva. Es una skill del equipo, no de Matt Pocock.

Para gráficos o tablas futuras, usar las herramientas disponibles para la necesidad concreta. Los frameworks de ML que usa la solución (scikit-learn, CatBoost, XGBoost, LightGBM) ya están fijados en `requirements.txt`; no hace falta sumar un profiler automático ni infraestructura de experimentos para seguir caracterizando la base.

## Wayfinding operations

**Issue tracker y seguimiento:** [GitHub Project FordwardAI-v1](https://github.com/orgs/FordwardAI/projects/1). **Tickets y dependencias nativas:** issues de `FordwardAI/ford-predictive-quality`. **Mapa wayfinder existente:** [Ford Predictive Quality — mapa de decisiones](https://github.com/FordwardAI/ford-predictive-quality/issues/1), label `wayfinder:map`.

- Los tickets de decisiones son **sub-issues nativos** del mapa, con `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling` o `wayfinder:task` según corresponda. Un enlace en el cuerpo no crea parentesco.
- Las dependencias usan **blocked by / blocking nativos** de GitHub. Crear primero los tickets y después vincularlos. No sustituir las relaciones con listas de números en Markdown.
- La frontera son los hijos **abiertos, sin asignación y sin bloqueantes abiertos**, en el orden de sub-issues del mapa. Consultar esos tres criterios en GitHub; `Todo` no garantiza que esté desbloqueado.
- Reclamar asignando a la persona responsable antes de trabajar; registrar la sesión/rama si hay concurrencia. Una consulta de estado no requiere reclamar un ticket. No quitar asignaciones ajenas.
- Añadir los tickets al Project y mantener su estado. Las tareas de mantenimiento, como estas convenciones, pueden tener ticket propio fuera del mapa: no son decisiones de producto.
- Resolución: comentario con respuesta, evidencia y commit; cerrar solo si se cumplió la pregunta; actualizar el índice del mapa con una síntesis y enlace. El detalle de la decisión vive en el ticket. Para cambios meramente técnicos, no cerrar decisiones relacionadas del equipo.
- En wayfinder, trabajar una decisión por sesión, salvo investigaciones que su workflow permita resolver en paralelo. HITL requiere intercambio humano real. Consultar la skill instalada para su mecanismo de delegación.
- Antes de editar un cuerpo, leer su versión actual para preservar cambios ajenos. No mantener en el repo otra copia editable del mapa.

Lecturas útiles (no modifican el tracker):

```sh
gh issue view 1 --repo FordwardAI/ford-predictive-quality --comments
gh issue list --repo FordwardAI/ford-predictive-quality --state open --json number,title,assignees,labels
gh project item-list 1 --owner FordwardAI --format json
```

La lista de issues no incluye por sí sola las dependencias. Verificarlas en la interfaz de GitHub o consultar `subIssues` y `blockedBy` mediante la API GraphQL antes de elegir la frontera. Si no hay acceso, señalar que el estado remoto no está verificado.

## Cierre y relevo

En el ticket, dejar un comentario breve con: resultado o avance, enlace al commit/PR, validaciones ejecutadas y qué sigue pendiente. El siguiente agente debe poder retomar desde GitHub y Git, sin leer el historial privado de una conversación. No marcar Done si falta integración o acuerdo humano.

## Referencias de compatibilidad

Consultadas el 18 de septiembre de 2026: [instrucciones de Codex](https://developers.openai.com/codex/guides/agents-md), [skills locales de Codex](https://developers.openai.com/codex/skills), [importación de instrucciones en Claude Code](https://code.claude.com/docs/en/memory) y [skills/enlaces simbólicos de Claude Code](https://code.claude.com/docs/en/skills). Verificar cambios de versión si un cliente no descubre las instrucciones o la skill; los archivos del repo no cambian permisos ni configuración global.
