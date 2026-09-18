# Contributing

Estas convenciones aplican a contribuciones humanas, de Codex y de Claude Code. Para el flujo wayfinder y el seguimiento en GitHub Project FordwardAI-v1, consultar [AGENTS.md](AGENTS.md) y la [guía del equipo](docs/trabajo-equipo.md).

## Branch Naming Conventions

- Seguir [Conventional Branch 1.1.0](https://conventionalbranch.org/).
- Usar `<tipo>/<descripcion>` con minúsculas, números y guiones, sin espacios ni guiones consecutivos. Incluir el número del ticket cuando corresponda.
- Usar `feature/`, `fix/`, `hotfix/`, `release/` o `chore/` según el propósito. Para ramas creadas por agentes, mantener `codex/` o `claude/`, admitidos por la especificación. `main` no lleva prefijo.

Ejemplos:

```text
chore/14-contributing
codex/14-contributing
claude/14-contributing
```

## Commit Message Conventions

- Seguir [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `<tipo>[scope opcional]: <descripcion>`.
- Usar `feat` para funcionalidades y `fix` para correcciones. En este repo también usamos `docs`, `test`, `refactor`, `chore`, `build` y `ci` cuando describen mejor el cambio.
- Marcar cambios incompatibles con `!` antes de `:` o un footer `BREAKING CHANGE:` que explique el impacto.
- Vincular el ticket en el cuerpo o footer. Aplicar la convención a commits nuevos; no reescribir el historial anterior.

Ejemplo:

```text
docs: documentar convenciones de contribución

Refs: #14
```

## Pull Request Title Naming Conventions

- Seguir [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) también en los títulos de PR, como convención de este repositorio.
- Describir el cambio final con el mismo formato del encabezado de commit. Ejemplo: `docs: documentar convenciones de contribución`.
- En el cuerpo, enlazar el ticket y resumir cambio, validación y pendientes. Usar `Closes #N` solo si integrar la PR realmente resuelve ese ticket; para avances parciales usar `Refs #N`.

Antes de publicar, ejecutar `git diff --check` y las verificaciones pertinentes indicadas en [AGENTS.md](AGENTS.md). Actualizar ticket y Project según el avance real.
