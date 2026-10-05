# ApplyTrack

Gestor de candidaturas de empleo con **web (Vue 3)** y **app móvil (React Native)**, que comparten un núcleo de dominio con **arquitectura hexagonal**.

> 🚧 En desarrollo. Hito actual: **M1 · Núcleo** (ver la [hoja de ruta](docs/specs/004-hoja-de-ruta.md)).

## Puesta en marcha

Requisitos: **Node 24** (mínimo 22.12, ver `.nvmrc`) y **pnpm 12**.

```bash
pnpm install
```

| Comando          | Qué hace                                           |
| ---------------- | -------------------------------------------------- |
| `pnpm lint`      | ESLint en todos los paquetes                       |
| `pnpm typecheck` | Comprobación de tipos con TypeScript               |
| `pnpm test`      | Tests con cobertura (mínimo 90 % en `core`)        |
| `pnpm depcruise` | Reglas de dependencia de la arquitectura hexagonal |
| `pnpm format`    | Formatea el código con Prettier                    |
| `pnpm build`     | Compila las apps                                   |

## Estructura

```
apps/           # web (Vue 3) y mobile (React Native), a partir de M2 y M4
packages/
  config/       # tsconfig y ESLint compartidos
  core/         # dominio y casos de uso, sin dependencias de runtime
docs/
  specs/        # especificaciones
  adr/          # decisiones de arquitectura
```

## Documentación

| Documento                                            | Contenido                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| [000 · Producto](docs/specs/000-producto.md)         | Visión, alcance, modelo de dominio, requisitos y criterios de aceptación |
| [001 · Arquitectura](docs/specs/001-arquitectura.md) | Hexagonal, SOLID, monorepo, datos y testing                              |
| [002 · i18n](docs/specs/002-i18n.md)                 | Español e inglés: catálogos, formatos y verificación                     |
| [003 · Responsive](docs/specs/003-responsive.md)     | Breakpoints y comportamiento de cada pantalla                            |
| [004 · Hoja de ruta](docs/specs/004-hoja-de-ruta.md) | Hitos y estimaciones                                                     |
| [ADR](docs/adr)                                      | Decisiones de arquitectura                                               |

## Stack

TypeScript · Vue 3 · Pinia · Vue Router · React Native · Expo · Zustand · Tailwind CSS · NativeWind · Supabase · Vitest · Playwright · Jest · Maestro · pnpm · Turborepo · GitHub Actions · Vercel · EAS

## Forma de trabajo

Spec-Driven Development: cada funcionalidad empieza por una especificación con criterios de aceptación en `docs/specs`, y el código se escribe después.
