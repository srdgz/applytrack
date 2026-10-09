# 114 · Calidad de la web: E2E, accesibilidad y rendimiento

| Campo      | Valor                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado     | Aprobado                                                                                                                                       |
| Versión    | 0.1                                                                                                                                            |
| Fecha      | 2026-10-09                                                                                                                                     |
| Requisitos | RNF-03, RNF-04, RNF-05, RNF-06 y RNF-07 de [000-producto](000-producto.md); [002](002-i18n.md), sección 7; [003](003-responsive.md), sección 5 |
| Hito       | M5 (primera parte; el móvil, en la spec 115)                                                                                                   |

## 1. Objetivo

Comprobar de forma automática, en cada PR, que la web cumple los requisitos no funcionales que hasta ahora solo se revisaban a mano:

- los flujos principales funcionan de principio a fin en un navegador real;
- no hay scroll horizontal en los cuatro tamaños de 003;
- axe no encuentra infracciones graves en tema claro ni oscuro;
- Lighthouse da al menos 90 en rendimiento y accesibilidad en móvil, y el JavaScript inicial pesa menos de 200 KB comprimido;
- ningún texto visible está escrito a mano en los componentes.

## 2. E2E con Playwright (`apps/web/e2e`)

### 2.1 Configuración

- `@playwright/test` con **Chromium**, contra el build de producción servido con `vite preview`, como lo verá quien use la web.
- **Sin Supabase:** los E2E usan el modo demo, que no depende de servicios externos. Las cuentas ya están cubiertas por los tests de integración del adaptador (spec 104).
- **Cuatro proyectos,** uno por tamaño de 003: 360 × 640, 768 × 1024, 1280 × 800 y 1920 × 1080. El de 360 emula un dispositivo táctil.
- Reloj fijo con `page.clock` para que los datos de ejemplo y las fechas sean siempre los mismos.
- Fallos con captura, vídeo y traza, que se suben como artefacto en la CI.

### 2.2 Flujos

Los escenarios de [000-producto](000-producto.md) (sección 8), más los que cubren el resto de specs:

| Flujo                   | Qué comprueba                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Modo demo               | «Probar sin cuenta» abre el tablero con el aviso de demo y las 6 columnas con sus números; «Salir» vuelve al inicio.               |
| Crear candidatura       | Con los obligatorios aparece en «Me interesa»; con «Aplicada», la fecha de hoy. Guardar con errores marca los campos.              |
| Cambiar estado          | Desde el detalle solo se ofrecen los estados permitidos; cambiar con nota actualiza el historial. Mover desde el menú del tablero. |
| Transición no permitida | Desde «Me interesa» no se ofrece «Oferta» en ningún sitio.                                                                         |
| Búsqueda y filtros      | Buscar sin tildes, filtrar, recargar y pulsar «atrás» conservan y deshacen los filtros de la URL.                                  |
| Lista                   | Ordenar por cabecera y «Cargar más».                                                                                               |
| Archivar y eliminar     | Archivar saca la candidatura del tablero y desarchivar la devuelve; eliminar pide confirmación.                                    |
| Estadísticas            | Las cifras de la demo («69 % · 9 de 13») y las paradas, que enlazan a su detalle.                                                  |
| Idioma y tema           | Cambiar a inglés traduce todo sin recargar y se mantiene al recargar; el tema oscuro se aplica antes de pintar.                    |
| Solo teclado            | Crear una candidatura y moverla con el menú «Mover a…» sin usar el ratón.                                                          |
| Sin scroll horizontal   | En inicio, tablero, lista, detalle, formulario, estadísticas y ajustes, `scrollWidth <= innerWidth` en los cuatro tamaños.         |

- Los flujos funcionales se ejecutan en los **cuatro tamaños**, salvo los que dependen del ancho (pestañas del tablero en 360, arrastrar en 1280), que se ejecutan solo donde aplican.
- Se buscan los elementos por rol y nombre accesible (`getByRole`), igual que los tests de componentes. Si un elemento no se puede encontrar así, es un problema de accesibilidad que hay que arreglar.

## 3. Accesibilidad con axe

- `@axe-core/playwright` en inicio, «Entrar», tablero, lista, detalle, formulario, estadísticas y ajustes.
- En **tema claro y oscuro**, a 360 y a 1280.
- Reglas de WCAG 2.2 A y AA. **El test falla con cualquier infracción `serious` o `critical`.** Las `moderate` y `minor` se listan en el informe sin hacer fallar la CI.
- Si alguna regla da un falso positivo, se desactiva solo para ese elemento y se documenta en esta spec.

## 4. Capturas de referencia

- Un proyecto de Playwright aparte, `screenshots`, captura tablero, lista y formulario en los 4 tamaños, los 2 temas y los 2 idiomas (48 imágenes), y las sube como artefacto de la CI para revisarlas en cada PR.
- **No son tests de comparación de píxeles:** el renderizado de fuentes cambia entre Windows y el Linux de la CI, y las comparaciones fallarían sin que nada se haya roto. Son para mirarlas.
- `pnpm screenshots` guarda una selección en `docs/screenshots/` para el README (spec 115).

## 5. Rendimiento

- **Lighthouse CI** (`@lhci/cli`) sobre el build servido con `vite preview`:
  - preset móvil;
  - páginas: inicio y tablero (un script inicia la demo antes de medir el tablero);
  - 3 ejecuciones por página, usando la mediana;
  - falla si rendimiento o accesibilidad bajan de 0,9. Buenas prácticas y SEO se informan sin hacer fallar.
- **Presupuesto de JavaScript:** un script lee el `manifest.json` de Vite, suma los fragmentos que carga la página inicial y falla si superan **200 KB comprimidos con gzip**. Así se detecta antes que con Lighthouse si una dependencia nueva dispara el peso.

## 6. Textos sin traducir

- **Web:** regla `@intlify/vue-i18n/no-raw-text` en los `.vue`, con una lista corta de caracteres permitidos (`·`, `—`, `*`, flechas y números).
- **Móvil:** regla `i18next/no-literal-string` en modo `jsx-text-only`, con las mismas excepciones.
- Se corrigen los textos que aparezcan al activarlas.

## 7. Scripts y CI

| Script                               | Qué hace                                               |
| ------------------------------------ | ------------------------------------------------------ |
| `pnpm e2e`                           | Build de la web y todos los E2E y axe en los 4 tamaños |
| `pnpm e2e:ui`                        | Lo mismo con la interfaz de Playwright, para depurar   |
| `pnpm screenshots`                   | Capturas de referencia y selección para el README      |
| `pnpm --filter @applytrack/web size` | Presupuesto de JavaScript                              |
| `pnpm lighthouse`                    | Lighthouse CI en local                                 |

- **CI:**
  - job **`e2e`**: instala Chromium, construye la web y ejecuta los E2E, axe y las capturas; sube el informe de Playwright y las capturas;
  - job **`lighthouse`**: construye, comprueba el presupuesto de JavaScript y ejecuta Lighthouse CI.
- `pnpm test` no cambia: los E2E van aparte porque necesitan un navegador y tardan más.
- Los navegadores de Playwright se instalan en la carpeta del proyecto (`pnpm exec playwright install chromium`), así que no hace falta ninguna instalación global.

## 8. Fuera de alcance

- Firefox y WebKit. Se puede añadir más adelante; Chromium cubre la mayoría del uso y mantiene la CI rápida.
- E2E con cuentas reales de Supabase.
- Comparación de capturas píxel a píxel (ver sección 4).
- E2E del móvil con Maestro (spec 115).

## 9. Criterios de aceptación

| Id        | Criterio                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| CA-114-01 | `pnpm e2e` pasa en local y en la CI, en los 4 tamaños.                                                            |
| CA-114-02 | Los flujos de la sección 2.2 están cubiertos, incluido el de solo teclado.                                        |
| CA-114-03 | No hay scroll horizontal en ninguna pantalla principal en ninguno de los 4 tamaños.                               |
| CA-114-04 | axe no encuentra infracciones `serious` ni `critical` en las 8 pantallas, en tema claro y oscuro, a 360 y a 1280. |
| CA-114-05 | Lighthouse da al menos 90 en rendimiento y accesibilidad en móvil en inicio y tablero.                            |
| CA-114-06 | El JavaScript inicial pesa menos de 200 KB comprimido y la CI falla si se supera.                                 |
| CA-114-07 | Las reglas de textos sin traducir están activas en web y móvil, y el lint pasa.                                   |
| CA-114-08 | La CI sube el informe de Playwright, las 48 capturas de referencia y el informe de Lighthouse como artefactos.    |

## 10. Decisiones tomadas

1. **Dividir M5 en dos specs:** la web (114) y el móvil con Maestro y el README con capturas (115).
2. **Solo Chromium,** para que la CI sea rápida; los demás navegadores quedan como mejora.
3. **E2E en modo demo,** sin depender de Supabase ni de enviar correos.
4. **Capturas para revisar, no para comparar,** por las diferencias de renderizado entre sistemas.
5. **Presupuesto de JavaScript propio** además de Lighthouse, para detectar antes y con un mensaje más claro qué ha crecido.
