<p align="center"><img src="brand/icon.svg" alt="" width="96" height="96"></p>

# ApplyTrack

[![CI](https://github.com/srdgz/applytrack/actions/workflows/ci.yml/badge.svg)](https://github.com/srdgz/applytrack/actions/workflows/ci.yml)

Gestor de candidaturas de empleo con **web (Vue 3)** y **app móvil (React Native + Expo)** que comparten un núcleo de dominio con **arquitectura hexagonal**, escrito en TypeScript y desarrollado con **Spec-Driven Development**.

> 🚧 En desarrollo. Hechos los hitos M0, M1 y M2 (núcleo, modo demo y web completa) y M3 (cuentas con Supabase). Siguientes: app móvil (M4) y calidad (M5). Ver la [hoja de ruta](docs/specs/004-hoja-de-ruta.md).

## Qué hace

- **Cuentas sin contraseña:** enlace mágico por email, con los datos en Supabase y Row Level Security.
- **Modo demo sin registro:** 15 candidaturas de ejemplo guardadas solo en el navegador.
- **Tablero** por estados, con arrastrar y soltar (ratón) y menú «Mover a…» (teclado y táctil).
- **Lista** con orden por columnas, búsqueda sin tildes y filtros que viven en la URL.
- **Formulario** de crear y editar con validación en vivo y las mismas reglas que el dominio.
- **Detalle** con historial de cambios de estado y transiciones permitidas.
- **Estadísticas:** tasas de respuesta, entrevista y oferta, actividad semanal, efectividad por fuente y candidaturas paradas.
- **Archivar, desarchivar y eliminar.**
- **Avisos** inspirados en [Sileo](https://sileo.aaryan.design): siete tipos, promesas y «Deshacer».
- **Español e inglés**, tema claro, oscuro o del sistema (guardados en el perfil), y diseño responsive de 320 px a 2560 px.

## Arquitectura

```
apps/
  web/              Vue 3 · Vite · Tailwind CSS 4 · vue-router · vue-i18n
  mobile/           Expo · React Native (de momento, pantalla de prueba de avisos)
packages/
  core/             Dominio y casos de uso. Sin dependencias de runtime.
  adapter-local/    Repositorio del modo demo sobre localStorage / AsyncStorage
  adapter-supabase/ Repositorio, sesión, acceso y perfil sobre Supabase
  i18n/             Catálogos ES/EN compartidos en formato ICU
  notifications/    Cola de avisos compartida por web y móvil
  config/           tsconfig y ESLint compartidos
brand/              Logo en SVG; `pnpm brand` genera los iconos de la web y la app
supabase/           Migraciones SQL con RLS, configuración local y plantilla del correo
docs/
  specs/            Especificaciones con criterios de aceptación
  adr/              Decisiones de arquitectura
```

- **Puertos y adaptadores:** `core` define los puertos (repositorio, sesión, reloj…) y los adaptadores los implementan. Las apps solo conectan las piezas en su carpeta `di/`.
- **Reglas comprobadas en CI** con `dependency-cruiser`: el dominio no importa nada externo, `core` no usa paquetes de npm, la interfaz no importa adaptadores y no hay dependencias circulares.
- **Errores de negocio como datos:** los casos de uso devuelven `Result` con códigos de error, y la interfaz los traduce.
- **Suite de contrato:** todos los repositorios pasan los mismos tests de búsqueda, orden, paginación y aislamiento entre usuarios.

## Puesta en marcha

Requisitos: **Node 24** (mínimo 22.12, ver `.nvmrc`) y **pnpm 12**.

```bash
pnpm install
pnpm dev:web      # http://localhost:5173
pnpm dev:mobile   # abre la app en Expo Go con el QR
```

Sin más configuración, la web funciona en modo demo. Para activar las cuentas, copia `apps/web/.env.example` a `apps/web/.env.local` con la URL y la clave publicable de un proyecto de Supabase, y aplica las migraciones con `pnpm supabase link` y `pnpm supabase db push`. Los pasos completos están en la [spec 104](docs/specs/104-autenticacion.md#8-configuración-del-proyecto-en-supabase).

| Comando          | Qué hace                                              |
| ---------------- | ----------------------------------------------------- |
| `pnpm lint`      | ESLint en todos los paquetes                          |
| `pnpm typecheck` | Comprobación de tipos con TypeScript                  |
| `pnpm test`      | Vitest (paquetes y web) y Jest (móvil), con cobertura |
| `pnpm depcruise` | Reglas de dependencia de la arquitectura hexagonal    |
| `pnpm format`    | Formatea el código con Prettier                       |
| `pnpm build`     | Compila la web                                        |

## Documentación

| Documento                                                            | Contenido                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| [000 · Producto](docs/specs/000-producto.md)                         | Visión, alcance, modelo de dominio y requisitos      |
| [001 · Arquitectura](docs/specs/001-arquitectura.md)                 | Hexagonal, SOLID, monorepo, datos y testing          |
| [002 · i18n](docs/specs/002-i18n.md)                                 | Español e inglés: catálogos, formatos y verificación |
| [003 · Responsive](docs/specs/003-responsive.md)                     | Breakpoints y comportamiento de cada pantalla        |
| [004 · Hoja de ruta](docs/specs/004-hoja-de-ruta.md)                 | Hitos y estado de cada especificación                |
| [100 · Crear y editar](docs/specs/100-crear-y-editar-candidatura.md) | Validación, casos de uso y formulario                |
| [101 · Cambio de estado](docs/specs/101-cambio-de-estado.md)         | Transiciones, detalle y movimientos en el tablero    |
| [102 · Tablero y lista](docs/specs/102-tablero-y-lista.md)           | Búsqueda, filtros, orden y paginación                |
| [103 · Modo demo](docs/specs/103-modo-demo.md)                       | Adaptador local y datos de ejemplo                   |
| [104 · Autenticación](docs/specs/104-autenticacion.md)               | Enlace mágico, preferencias y Supabase               |
| [105 · Estadísticas](docs/specs/105-panel-estadisticas.md)           | Métricas y panel                                     |
| [106 · Archivar y eliminar](docs/specs/106-archivar-y-eliminar.md)   | Archivado reversible y borrado con confirmación      |
| [108 · Identidad visual](docs/specs/108-identidad-visual.md)         | Logo, iconos y pantalla de carga                     |
| [107 · Notificaciones](docs/specs/107-notificaciones.md)             | Avisos compartidos web y móvil                       |
| [ADR](docs/adr)                                                      | Decisiones de arquitectura                           |

## Stack

**En uso:** TypeScript · Vue 3 · Vite · Tailwind CSS 4 · vue-router · vue-i18n · React Native · Expo · Supabase (Auth, Postgres, RLS) · Zod · Vitest · Testing Library · Jest · ESLint · Prettier · dependency-cruiser · pnpm · Turborepo · Husky · commitlint · GitHub Actions

**Previsto:** NativeWind (M4) · Playwright · axe · Maestro (M5) · Vercel · EAS

## Forma de trabajo

Spec-Driven Development: cada funcionalidad empieza por una especificación con criterios de aceptación en `docs/specs`. Cuando se aprueba, se implementa, se prueba contra esos criterios y se documentan los cambios en la propia especificación.

## Licencia

[MIT](LICENSE) © 2026 Sandra Rodríguez
