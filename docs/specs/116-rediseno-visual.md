# 116 · Rediseño visual: color por estado e Inter

| Campo      | Valor                                                                |
| ---------- | -------------------------------------------------------------------- |
| Estado     | Aprobado                                                             |
| Versión    | 0.3                                                                  |
| Fecha      | 2026-10-09                                                           |
| Requisitos | Transversal (web y móvil); RNF-04 y RNF-05 de [000](000-producto.md) |
| Hito       | M5, antes del despliegue en Vercel y del APK                         |

## 1. Objetivo

Que la web y la app se vean más modernas y atractivas antes de publicarlas, sin cambiar lo que hacen. La idea central es que **cada estado tenga su color**, para que el tablero se lea de un vistazo, junto con una tipografía nueva, más aire y superficies con algo de profundidad.

Se eligió la dirección «B · Color por estado» entre tres propuestas (refinada, color por estado y contraste).

## 2. Color por estado

### 2.1 Tonos

Cada tono tiene dos tokens: `status-{tono}` (el color fuerte: puntos, bordes y texto) y `status-{tono}-soft` (el fondo suave), en claro y en oscuro.

| Tono           | Estados                 | Color        |
| -------------- | ----------------------- | ------------ |
| `wishlist`     | Me interesa             | Gris pizarra |
| `applied`      | Aplicada                | Azul         |
| `screening`    | Primer contacto         | Cian         |
| `interviewing` | Entrevistas             | Violeta      |
| `offer`        | Oferta, Aceptada        | Verde        |
| `rejected`     | Descartada              | Rosa         |
| `closed`       | Retirada, Sin respuesta | Gris neutro  |

- Los 14 tokens nuevos se añaden a `packages/design-tokens` y a `apps/web/src/style.css` en `oklch`, y el test que ya compara ambos los cubre.
- **Contraste (test nuevo en `design-tokens`):** el color fuerte sobre su fondo suave llega a 4,5:1, y sobre `surface` a 3:1, en los dos temas.
- `packages/presentation` exporta `statusTone(status)` y `columnTone(columna)`, para que la web y la app usen la misma tabla. La columna «Cerradas» usa el tono `closed`.
- El color nunca es la única pista: el nombre del estado sigue siempre visible.

### 2.2 Dónde se usa

- **Cabecera de columna** (web) y **pestañas** (móvil): punto del color del estado y contador en una píldora con el fondo suave. La pestaña elegida se rellena con el fondo suave y se marca con el borde del color fuerte.
- **Tarjeta:** borde superior de 3 px con el color del estado.
- **Insignia de estado** (`StatusBadge` y su equivalente en la app): fondo suave, texto fuerte y punto. Sustituye a la versión actual morada o con borde.
- **Lista:** la columna Estado usa la misma insignia.
- **Estadísticas:** las barras de «Por estado» toman el color de cada estado; el resto de gráficos siguen en el color de acento.
- **Detalle:** la insignia y el historial de estados (punto de cada cambio con el color del estado al que pasó).

## 3. Tipografía · Inter

- **Web:** `@fontsource-variable/inter` (solo el subconjunto latino, en `woff2`, con `font-display: swap`) importado en `main.ts`, y `--font-sans` apunta a Inter con la fuente del sistema como respaldo. El archivo se precarga en `index.html`.
- **Móvil:** `@expo-google-fonts/inter` con `expo-font`, en los pesos 400, 500, 600 y 700. La pantalla de carga se mantiene hasta que las fuentes están listas.
- En React Native una fuente propia no responde a `fontWeight` en Android, así que NativeWind define una familia por peso (`font-sans`, `font-medium`, `font-semibold` y `font-bold` apuntan a `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold` e `Inter_700Bold`), y las clases actuales se mantienen.
- Títulos con `tracking-tight`; números de las estadísticas con cifras tabulares.

## 4. Superficies, formas y detalles

| Elemento               | Ahora                         | Después                                                                                            |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Tarjetas               | Radio 8 px, borde gris        | Radio 14 px, borde más suave, sombra ligera; en web, al pasar el ratón sube 1 px y crece la sombra |
| Avatar                 | No hay                        | Cuadrado redondeado con las iniciales de la empresa, en el tono del estado                         |
| Columnas del tablero   | Fondo gris                    | Fondo más claro y radio 16 px                                                                      |
| Botones y campos       | Radio 6 px                    | Radio 10 px, 44 px de alto; el botón principal con una sombra suave del color de acento            |
| Etiquetas y modalidad  | Píldoras con borde            | Píldoras de fondo neutro sin borde                                                                 |
| Navegación web         | Icono morado                  | Elemento activo con fondo `accent-soft` y texto de acento                                          |
| Cabecera web           | Fondo sólido                  | Fondo traslúcido con desenfoque al hacer scroll                                                    |
| Barra inferior (móvil) | Icono y texto morados         | Indicador en píldora detrás del icono activo                                                       |
| Botón flotante (móvil) | Sin sombra                    | Sombra del color de acento                                                                         |
| Aviso de modo demo     | Franja morada a todo lo ancho | Franja más fina y discreta, con un punto de color y los enlaces como botones de texto              |
| Estadísticas           | Tarjetas planas               | Cada indicador con un icono en un cuadrado de color suave; barras con esquinas redondeadas         |

- Las iniciales salen de una función pura nueva en `packages/presentation`, `companyInitials("Nimbus Labs") → "NL"`, con tests (una palabra, varias, símbolos y acentos). El avatar es decorativo y se oculta al lector de pantalla.
- Los colores base (`canvas`, `surface`, `border`…) se ajustan ligeramente para que el fondo sea un poco más frío y las superficies destaquen más; el acento morado de la marca no cambia.
- Las animaciones de elevación respetan `prefers-reduced-motion`.

## 5. Lo que no cambia

- El comportamiento, los textos, la navegación y la accesibilidad: no cambian etiquetas, roles ni textos, así que los tests unitarios, Playwright y Maestro siguen buscando lo mismo.
- El logo, los iconos de la app y la pantalla de carga de la [108](108-identidad-visual.md).
- Los avisos (estilo Sileo, [107](107-notificaciones.md)).

## 6. Fuera de alcance

- Ilustraciones para los estados vacíos.
- Logos reales de las empresas.
- Animaciones al mover tarjetas entre columnas.

## 7. Criterios de aceptación

| Id        | Criterio                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-116-01 | Cada estado se muestra con su tono en las columnas, las pestañas, las tarjetas, las insignias y las barras de estadísticas, en web y móvil. |
| CA-116-02 | Los tokens de estado coinciden entre `design-tokens` y la web, y cumplen el contraste de la sección 2.1 en claro y en oscuro.               |
| CA-116-03 | `statusTone`, `columnTone` y `companyInitials` tienen tests y la web y la app los usan.                                                     |
| CA-116-04 | La web y la app usan Inter; en Android los pesos se ven distintos (no todo en regular).                                                     |
| CA-116-05 | axe sigue sin errores, Lighthouse mantiene sus umbrales y el presupuesto de JS no cambia (la fuente no cuenta como JS).                     |
| CA-116-06 | Todos los tests (Vitest, Jest, Playwright y los 6 flujos de Maestro) pasan sin cambiar sus selectores.                                      |
| CA-116-07 | Las capturas del README se regeneran: las de la web con Playwright y las de la app con Maestro.                                             |

## 8. Notas de implementación

- **Tonos en la web:** cada elemento lleva `data-tone` y `style.css` define `--tone` y `--tone-soft` para cada tono, así que las clases son siempre las mismas (`bg-(--tone-soft)`, `text-(--tone)`, `border-t-(--tone)`) y Tailwind no necesita generar clases dinámicas.
- **Tonos en la app:** `src/ui/tone.ts` tiene las clases de cada tono escritas enteras, para que Tailwind las encuentre. `StatusBadge` y `Avatar` son componentes nuevos.
- **Radios:** en lugar de cambiar cada componente, se cambia la escala: `rounded-md` pasa a 10 px, `rounded-lg` a 14 px y `rounded-xl` a 16 px, en la web y en la app.
- **Sin elevación al pasar el ratón:** subir la tarjeta con `transform` (y también usar `@container`) crea un nuevo bloque contenedor, y el menú «Mover a…» quedaba atrapado debajo de la tarjeta siguiente. Al pasar el ratón solo crece la sombra.
- **Avatar en el tablero de escritorio:** entre 1024 y 1535 px las seis columnas son estrechas y el avatar cortaba el nombre de la empresa, así que en ese tramo se oculta; se ve en el móvil, a 768 px y desde 1536 px.
- **Inter en la web:** un `@font-face` propio carga solo el archivo latino (48 KB), con `font-display: swap`. No se precarga porque Vite cambia el nombre del archivo al compilar; Lighthouse sigue en 100 de rendimiento y el JS no cambia (132 KB).
- **Inter en la app:** `src/ui/Text.tsx` envuelve el `Text` de React Native y añade `font-sans`; una regla de ESLint impide importar `Text` directamente de `react-native`. Un plugin de Tailwind hace que `font-medium`, `font-semibold` y `font-bold` cambien de familia (`Inter_500Medium`…) con peso 400, para que Android no engorde la letra dos veces. `app/_layout.tsx` no pinta nada hasta que las fuentes están cargadas, así que la pantalla de carga sigue visible mientras tanto.
- **Sombras en la app:** se usa la propiedad `boxShadow` de React Native (nueva arquitectura), igual en Android y en iOS.
- **App en el emulador:** los 6 flujos de Maestro pasan. En el de «Modo demo», las pestañas ahora son más anchas y «Entrevistas» empieza fuera de la pantalla, así que el flujo toca antes «Primer contacto» para que la fila se desplace.
- **Capturas del README:** se reducen a las mismas cuatro pantallas en la web (a 1280 px) y en la app (tablero, lista, nueva candidatura y estadísticas en oscuro), en una tabla con una fila para cada una. Playwright y Maestro solo generan esas ocho.
