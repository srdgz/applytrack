# ADR-0001 · Monorepo con pnpm y Turborepo

- **Estado:** Propuesta
- **Fecha:** 2026-10-05

## Contexto

La web (Vue 3) y la app (React Native) comparten dominio, casos de uso, catálogos de idioma y tokens de diseño. Con repositorios separados habría que publicar paquetes y sincronizar versiones en cada cambio.

## Decisión

Un monorepo con **pnpm workspaces** para gestionar las dependencias y **Turborepo** para orquestar y cachear las tareas (`build`, `lint`, `typecheck`, `test`).

## Consecuencias

- Un cambio en `core` y su uso en las dos apps van en el mismo PR.
- El enlazado estricto de pnpm evita usar dependencias no declaradas.
- Metro (el empaquetador de React Native) necesita configuración extra para resolver los paquetes del workspace (`watchFolders` y `nodeModulesPaths`). Expo SDK 52+ lo detecta casi todo solo.
- **Alternativas descartadas:** Nx (más potente, pero más configuración de la necesaria para este tamaño) y npm workspaces (sin caché de tareas y con un enlazado menos estricto).
