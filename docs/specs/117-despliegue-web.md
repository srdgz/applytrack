# 117 · Despliegue de la web en Vercel y cómo ejecutar la app

| Campo      | Valor                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| Estado     | Aprobado                                                                                |
| Versión    | 0.3                                                                                     |
| Fecha      | 2026-10-09                                                                              |
| Requisitos | RNF-08 de [000](000-producto.md); sección de CD de [001](001-arquitectura.md); ADR-0006 |
| Hito       | M5 (cierre)                                                                             |

## 1. Objetivo

Publicar la web en Vercel para que cualquiera pueda probarla (modo demo y cuentas reales), y dejar en el README cómo ejecutar la app móvil.

**Cambio de alcance:** no se genera el APK de Android ni se publica la app con EAS. La app se ejecuta desde el código con Expo Go o en un emulador. ADR-0006 se actualiza para recogerlo.

## 2. Proyecto en Vercel

| Ajuste               | Valor                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| Repositorio          | `srdgz/applytrack`, rama de producción `main`                                  |
| Root Directory       | `apps/web` (Vercel detecta el workspace de pnpm e instala desde la raíz)       |
| Framework            | Vite (comando `vite build`, salida `dist`)                                     |
| Node.js              | 24.x                                                                           |
| pnpm                 | 12, el de `packageManager`, con la variable `ENABLE_EXPERIMENTAL_COREPACK=1`   |
| Variables de entorno | `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, en Production y Preview |
| Dominio              | `applytrack.vercel.app` si está libre; si no, el que asigne Vercel             |
| Previsualizaciones   | Una por PR y por rama, automáticas con la integración de GitHub                |

- Sin las variables de Supabase la web sigue funcionando solo en modo demo, como en local.
- La clave publicable de Supabase está pensada para el navegador: la seguridad la dan las políticas RLS. Aun así, no se escribe en el repositorio.

## 3. `apps/web/vercel.json`

- **Rutas de la SPA:** cualquier ruta que no sea un archivo devuelve `index.html`, para que funcionen al recargar o al abrir un enlace directo (`/board`, `/applications/…`, `/auth/callback`). Las rutas desconocidas siguen mostrando la página 404 de la app.
- **Caché:** los archivos de `/assets/` llevan nombre con hash y se sirven con `Cache-Control: public, max-age=31536000, immutable`. `index.html` no se guarda en caché.
- **Cabeceras de seguridad:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` y `Permissions-Policy` sin cámara, micrófono ni ubicación.
- **Solo despliega si cambia la web:** `ignoreCommand` con `npx turbo-ignore @applytrack/web`, para no desplegar cuando un commit solo toca la app móvil o la documentación.

Además, la tarea `build` de `turbo.json` declara `VITE_*` en `env`, para que un cambio de variables invalide la caché del build.

## 4. Supabase

En Authentication → URL Configuration:

- **Site URL:** la URL de producción de Vercel.
- **Redirect URLs:** añadir `https://<dominio>/auth/callback` y, para las previsualizaciones, `https://applytrack-*-<equipo>.vercel.app/auth/callback`. Se mantienen las de desarrollo (`http://localhost:5173/**`, `exp://**`).

La web ya usa `window.location.origin` para la dirección de vuelta del enlace mágico, así que no cambia código.

## 5. README

- **Enlace a la demo** al principio, junto al badge de la CI.
- **«Cómo probarlo»** en tres partes:
  - **En el navegador:** el enlace de Vercel, con «Probar sin cuenta» o entrando con email.
  - **App móvil:** instalar Expo Go en el teléfono, clonar el repo, `pnpm install` y `pnpm dev:mobile`, y escanear el QR (con la cámara en iOS y desde Expo Go en Android). Para entrar con email, `pnpm dev:mobile:tunnel`. También en el emulador de Android y en el simulador de iOS.
  - **En local:** los comandos que ya hay.
- Se quita «Previsto: Vercel · EAS» del stack y Vercel pasa a «En uso». La nota de los hitos dice que el proyecto está terminado.

## 6. Documentación que cambia

- **ADR-0006:** pasa a «Aceptada, revisada» con una sección que explica que no se genera APK ni se usa EAS Update: la app se prueba desde el código con Expo Go o en un emulador.
- **000 (RNF-08) y 001 (CD):** `main` despliega la web en Vercel con previsualización por PR; el móvil no se publica.
- **004:** M4 se queda en «App que se abre en Expo Go con un QR», y la entrada de la 117.

## 7. Lo que hace cada uno

| Paso                                                                                          | Quién          |
| --------------------------------------------------------------------------------------------- | -------------- |
| `vercel.json`, `turbo.json`, README y documentación                                           | Implementación |
| Crear el proyecto en Vercel, importar el repo y poner los ajustes y variables de la sección 2 | Tú             |
| Cambiar la Site URL y las Redirect URLs en Supabase                                           | Tú             |
| Comprobar la web publicada (sección 8)                                                        | Los dos        |

## 8. Criterios de aceptación

| Id        | Criterio                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| CA-117-01 | La URL de producción carga la web, y «Probar sin cuenta» abre el tablero con los datos de ejemplo.                   |
| CA-117-02 | Recargar en `/board`, `/list`, `/stats` y en el detalle de una candidatura muestra la pantalla, no un 404 de Vercel. |
| CA-117-03 | Entrar con email en producción envía el enlace, y al pulsarlo se vuelve a la web publicada con la sesión iniciada.   |
| CA-117-04 | Los archivos de `/assets/` llevan la cabecera de caché inmutable y la página, las cabeceras de seguridad.            |
| CA-117-05 | Un PR que toca la web genera una previsualización; un commit que solo toca la app móvil no despliega.                |
| CA-117-06 | El README enlaza la demo y explica cómo ejecutar la app con Expo Go y en el emulador, sin mencionar un APK.          |
| CA-117-07 | Lighthouse sobre la URL de producción mantiene 100 en rendimiento, accesibilidad y buenas prácticas.                 |

## 9. Fuera de alcance

- APK de Android, EAS Build y EAS Update.
- Dominio propio.
- Política de seguridad de contenido (CSP): `index.html` tiene un script en línea para el tema y necesitaría un hash; se puede añadir más adelante.
- Analíticas.

## 10. Notas de implementación

- **`vercel.json`** declara también `framework`, `buildCommand` (`pnpm run build`) y `outputDirectory`, para que el despliegue no dependa de lo que se elija en el panel.
- **Sin cabecera propia para `index.html`:** con la reescritura, las páginas se piden como `/board` o `/list`, no como `/index.html`, así que una regla para ese archivo no se aplicaría. Vercel ya sirve el HTML con `max-age=0, must-revalidate`.
- **Test de la configuración:** `apps/web/vercel.test.ts` comprueba la reescritura, las cabeceras de caché y seguridad y el `ignoreCommand` (CA-117-02, 04 y 05 en lo que se puede comprobar sin desplegar).
- **Dominio:** `applytrack.vercel.app` estaba ocupado y Vercel asignó `applytrack-roan.vercel.app`, que es el que usan el README y Supabase.
- **Lighthouse en producción:** `pnpm --filter @applytrack/web lighthouse:production` ejecuta el mismo script contra la URL publicada (variable `LIGHTHOUSE_URL`, sin servidor local).
- **Comprobado en producción (2026-10-09):**
  - CA-117-01: «Probar sin cuenta» abre el tablero con los datos de ejemplo.
  - CA-117-02: `/`, `/board`, `/list`, `/stats`, `/applications/demo-01` y `/auth/callback` devuelven la web, y al recargar el detalle se ve la candidatura.
  - CA-117-04: las páginas llevan las cuatro cabeceras de seguridad (más HSTS, que pone Vercel) y `/assets/`, incluida la fuente, la caché inmutable.
  - CA-117-07: Lighthouse en producción da 100 en rendimiento, accesibilidad y buenas prácticas en el inicio y el tablero.
  - El build de producción incluye la URL de Supabase, así que las cuentas están activas.
  - CA-117-03: entrar con email en producción envía el enlace y vuelve a la web publicada con la sesión iniciada.
- **Pendiente de comprobar:** la previsualización de un PR y que un commit que solo toca la app no despliegue (CA-117-05), cuando llegue el caso.
