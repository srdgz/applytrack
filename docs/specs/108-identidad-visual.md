# 108 · Identidad visual: logo, iconos y pantalla de carga

| Campo      | Valor                                                |
| ---------- | ---------------------------------------------------- |
| Estado     | Aprobado                                             |
| Versión    | 0.1                                                  |
| Fecha      | 2026-10-08                                           |
| Requisitos | Transversal (web y móvil)                            |
| Hito       | M3 (web y recursos de la app); pantallas móviles, M4 |

## 1. Objetivo

Dar a ApplyTrack una imagen reconocible en el navegador, en la pantalla de inicio del móvil y al abrir la app, con un logo único para web y móvil.

## 2. El logo · «Tablero»

Elegido entre tres propuestas (opción A).

- **Icono:** cuadrado redondeado (radio del 23 %) en el morado de la marca, `#4f46e5`. Dentro, **tres columnas** blancas alineadas arriba que se acortan de izquierda a derecha (100 %, 70 % y 40 % de alto, con opacidades 55 %, 80 % y 100 %), como el tablero cuando las candidaturas avanzan. Debajo de la columna más corta, un **círculo verde** `#34d399` con un check en `#064e3b`: la oferta conseguida.
- **Marca sin fondo:** las tres columnas y el círculo, para usar sobre fondos de color (pantalla de carga e icono adaptable de Android).
- **Versión oscura:** fondo `#0b1020` y columnas en `#a5b4fc`. La usa el favicon cuando el sistema está en modo oscuro.
- **Monocromo:** silueta de un solo color para el icono temático de Android 13+.
- **Logotipo:** icono + «ApplyTrack» en el texto de la interfaz, con peso 700.

### 2.1 Archivos fuente

Carpeta `brand/` en la raíz, con los SVG como única fuente de verdad: `icon.svg`, `icon-dark.svg`, `mark.svg` (blanco, sin fondo) y `mark-monochrome.svg`.

Los PNG se generan con `pnpm brand` (un script en `scripts/generate-brand-assets.mjs` que usa `sharp` como dependencia de desarrollo) y se versionan, para que nadie necesite generarlos para arrancar el proyecto.

## 3. Web

| Recurso                        | Detalle                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `favicon.svg`                  | El icono, con `@media (prefers-color-scheme: dark)` dentro del SVG para la versión oscura.    |
| `favicon-32.png`               | Respaldo para navegadores sin favicon SVG.                                                    |
| `apple-touch-icon.png`         | 180 × 180, sin transparencia, para «Añadir a pantalla de inicio» en iOS.                      |
| `icon-192.png`, `icon-512.png` | Para el manifiesto. El de 512 también como `maskable`, con la marca dentro de la zona segura. |
| `manifest.webmanifest`         | Nombre, nombre corto, `theme_color` `#4f46e5`, `background_color` y los iconos.               |

- `index.html` enlaza los iconos, el manifiesto y `<meta name="theme-color">` (morado en claro y `#0b1020` en oscuro).
- Componente `AppLogo.vue` con el icono en SVG en línea y `aria-hidden`, junto al nombre. Aparece en la cabecera de la app, en la pantalla de inicio y en «Entrar».
- No se convierte la web en PWA con modo sin conexión: el manifiesto solo sirve para el icono y el nombre al añadirla a la pantalla de inicio.

## 4. App móvil

| Recurso (`apps/mobile/assets/`) | Detalle                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `icon.png`                      | 1024 × 1024, sin transparencia (iOS lo exige).                                 |
| `android-icon-foreground.png`   | La marca en blanco, dentro del 66 % central (zona segura del icono adaptable). |
| `android-icon-monochrome.png`   | La silueta monocroma, para el icono temático.                                  |
| `splash-icon.png`               | La marca en blanco, 1024 × 1024 con margen.                                    |
| `favicon.png`                   | 48 × 48, para `expo start --web`.                                              |

- `app.json`:
  - El icono adaptable usa `backgroundColor` `#4f46e5` en lugar de una imagen de fondo.
  - Pantalla de carga con el plugin `expo-splash-screen`: la marca blanca de 200 px de ancho sobre `#4f46e5` en claro y sobre `#0b1020` en oscuro.
- La pantalla de prueba de la app muestra el logo encima del nombre, con `react-native-svg`, que ya es una dependencia.
- **Limitación de Expo Go:** muestra su propio icono y su propia pantalla de carga. Los de ApplyTrack solo se ven en el APK de Android (ADR-0006) o en una build de desarrollo.

## 5. Fuera de alcance

- Imágenes para compartir en redes (Open Graph). Se harán con las capturas del README en M5.
- Animación de la pantalla de carga.

## 6. Criterios de aceptación

| Id        | Criterio                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-108-01 | La pestaña del navegador muestra el icono, y cambia a la versión oscura con el sistema en modo oscuro.                                             |
| CA-108-02 | El manifiesto es válido y sus iconos existen con el tamaño declarado; el `maskable` no recorta la marca.                                           |
| CA-108-03 | El logo aparece en la cabecera, en el inicio y en «Entrar», no se anuncia dos veces al lector de pantalla y no provoca scroll horizontal a 320 px. |
| CA-108-04 | `pnpm brand` regenera todos los PNG desde `brand/` y el resultado coincide con los archivos versionados.                                           |
| CA-108-05 | `app.json` apunta a los nuevos recursos y `expo config` no da errores.                                                                             |
| CA-108-06 | El APK de Android muestra el icono adaptable y la pantalla de carga morada con la marca.                                                           |

## 7. Decisiones tomadas

1. **SVG como fuente y PNG generados con un script versionado**, para poder retocar el logo sin herramientas de diseño.
2. **Color de fondo en lugar de imagen** en el icono adaptable de Android: más ligero y siempre nítido.
3. **Pantalla de carga sobre morado** también en claro, para que se reconozca la marca al abrir la app; en oscuro, sobre el fondo oscuro de la app.
4. **Manifiesto sin modo sin conexión**: un service worker no aporta nada mientras los datos estén en Supabase o en el navegador.
