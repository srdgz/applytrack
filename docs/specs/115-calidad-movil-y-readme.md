# 115 · E2E del móvil con Maestro y README con capturas

| Campo      | Valor                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| Estado     | Aprobado                                                                           |
| Versión    | 0.1                                                                                |
| Fecha      | 2026-10-09                                                                         |
| Requisitos | RNF-07 de [000-producto](000-producto.md); sección 8 de [001](001-arquitectura.md) |
| Hito       | M5 (segunda parte; la web se hizo en [114](114-calidad-web.md))                    |

## 1. Objetivo

- Cubrir con **Maestro** los flujos principales de la app móvil de principio a fin, en un emulador de Android real, como hace Playwright en la web.
- Terminar el **README** para el portfolio, con capturas de la web y de la app generadas automáticamente.

## 2. Maestro (`apps/mobile/.maestro`)

### 2.1 Cómo se ejecuta

- **En Expo Go,** en el emulador de Android de Android Studio (`Medium_Phone_API_37.0` en el equipo de desarrollo). Es la misma forma de abrir la app que usa cualquiera que la pruebe (ADR-0006).
- Cada flujo:
  1. abre Expo Go limpiando sus datos (`launchApp` con `clearState`), para empezar siempre sin demo;
  2. abre el proyecto con `openLink` y la dirección de Metro, que se pasa como variable (`APP_URL`, por defecto `exp://10.0.2.2:8081`, que es el ordenador visto desde el emulador).
- **Sin Supabase,** como los E2E de la web: los flujos usan el modo demo.
- Los elementos se buscan por su texto o su nombre accesible, igual que en los tests de RNTL. **No se añaden `testID`**: si Maestro no encuentra algo por su nombre, VoiceOver o TalkBack tampoco lo anunciarían bien.

### 2.2 Flujos

| Flujo                      | Qué comprueba                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `demo.yaml`                | «Probar sin cuenta» abre el tablero con el aviso de demo y las pestañas con sus números; «Salir» vuelve al inicio. |
| `crear.yaml`               | Crear una candidatura con los obligatorios y encontrarla en «Me interesa».                                         |
| `cambiar-estado.yaml`      | Desde el botón de tres puntos de una tarjeta, pasarla a «Aplicada» con una nota, y ver la nota en el historial.    |
| `buscar-y-filtrar.yaml`    | Buscar «nordica» y filtrar por estado.                                                                             |
| `archivar-y-eliminar.yaml` | Archivar y desarchivar; eliminar con la confirmación del sistema.                                                  |
| `idioma-y-tema.yaml`       | Cambiar a inglés y a tema oscuro, cerrar la app y comprobar que se mantienen.                                      |

Los pasos repetidos (abrir la app, empezar la demo) van en subflujos de `.maestro/common/`.

### 2.3 Scripts

| Script                    | Qué hace                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| `pnpm e2e:mobile`         | Ejecuta todos los flujos contra la app abierta con `pnpm dev:android`. |
| `pnpm screenshots:mobile` | Ejecuta el flujo de capturas (sección 3.2).                            |

### 2.4 Instalación (la hace Sandra)

Maestro es una herramienta global que necesita Java 17. Se instala una vez siguiendo su guía oficial para Windows. La spec documenta los pasos en el README del móvil, pero no se instala nada desde el repo.

### 2.5 CI

**No se ejecuta en la CI todavía.** Un emulador de Android con Expo Go en GitHub Actions es lento e inestable, y depende de descargar Expo Go en cada ejecución. Se añadirá cuando exista el APK (en el despliegue, después de M5): el job instalará el APK en el emulador y ejecutará los mismos flujos cambiando solo el `appId`.

## 3. README con capturas

### 3.1 Web

`pnpm screenshots` (spec 114) guarda en `docs/screenshots/`:

- el tablero a 1280 px en tema claro y a 360 px en tema oscuro;
- la lista y las estadísticas a 1280 px;
- el formulario a 360 px.

### 3.2 Móvil

Un flujo de Maestro, `capturas.yaml`, recorre el inicio, el tablero, el detalle, el formulario, las estadísticas y los ajustes en tema claro y oscuro, y guarda las imágenes con `takeScreenshot` en `docs/screenshots/mobile-*.png`.

### 3.3 Cambios en el README

- **Una sección «Capturas» al principio,** con una fila de la web (escritorio y móvil) y otra de la app, a un tamaño moderado y con texto alternativo descriptivo.
- **«Cómo probarlo»:**
  - la web en local (y, tras el despliegue, el enlace público);
  - la app con Expo Go y el túnel;
  - el modo demo.
- **«Calidad»:** qué se comprueba en la CI (tests unitarios y de contrato, reglas de arquitectura, E2E en 4 tamaños, axe, Lighthouse y presupuesto de JavaScript) y los resultados actuales de Lighthouse.
- **Estructura** con todos los paquetes, y la tabla de documentación con todas las specs.
- Las imágenes se optimizan al guardarlas (PNG sin pérdida, comprimido), para que el repo no crezca de más.

## 4. Fuera de alcance

- **El GIF animado** que proponía la hoja de ruta. Grabar y convertir vídeo a GIF necesita `ffmpeg` y deja archivos grandes en el repo; las capturas estáticas cumplen el objetivo. Se puede añadir más adelante, por ejemplo con un vídeo enlazado.
- Maestro en iOS: el simulador solo existe en macOS.
- Ejecutar Maestro en la CI (sección 2.5).

## 5. Criterios de aceptación

| Id        | Criterio                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| CA-115-01 | Los 6 flujos de la sección 2.2 pasan en el emulador de Android con Expo Go, con `pnpm e2e:mobile`.         |
| CA-115-02 | Ningún flujo usa `testID`: todo se encuentra por texto o nombre accesible.                                 |
| CA-115-03 | `pnpm screenshots` y `pnpm screenshots:mobile` regeneran las capturas del README.                          |
| CA-115-04 | El README muestra las capturas de la web y de la app, explica cómo probar el proyecto y resume la calidad. |
| CA-115-05 | Todas las specs están enlazadas en el README y en la hoja de ruta con su estado.                           |

## 6. Decisiones tomadas

1. **Maestro con Expo Go en local,** y en la CI solo cuando exista el APK.
2. **Sin `testID`,** para que los flujos también validen la accesibilidad.
3. **Capturas automáticas** de web y móvil, para poder regenerarlas cuando cambie la interfaz.
4. **Sin GIF** por ahora (sección 4).
