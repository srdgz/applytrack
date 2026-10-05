# 003 · Diseño responsive

| Campo   | Valor      |
| ------- | ---------- |
| Estado  | Aprobado   |
| Versión | 0.2        |
| Fecha   | 2026-10-05 |

## 1. Principios

- **Mobile first**: los estilos base son los de la pantalla más estrecha; los breakpoints añaden, no quitan.
- **Rango soportado en la web**: de **320 px** a **2560 px** de ancho, sin scroll horizontal de página ni contenido cortado.
- **App móvil**: teléfonos y tabletas, en vertical y horizontal, con el tamaño de letra del sistema hasta 200 %.
- **Tokens compartidos**: breakpoints, espaciados, tipografía y colores salen de `packages/design-tokens` y los consumen tanto Tailwind (web) como NativeWind (móvil).

## 2. Breakpoints

| Token  | Ancho mínimo | Dispositivo típico                      |
| ------ | ------------ | --------------------------------------- |
| (base) | 0            | Teléfono en vertical                    |
| `sm`   | 640 px       | Teléfono grande en horizontal           |
| `md`   | 768 px       | Tableta en vertical                     |
| `lg`   | 1024 px      | Tableta en horizontal, portátil pequeño |
| `xl`   | 1280 px      | Escritorio                              |
| `2xl`  | 1536 px      | Pantalla grande                         |

En pantallas muy anchas el contenido se limita con un `max-width` y se centra. La excepción es el tablero, que puede usar todo el ancho disponible.

## 3. Comportamiento por pantalla

| Pantalla                  | < `md`                                                                                                          | `md` – `lg`                                                             | ≥ `lg`                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Navegación**            | Barra inferior con 4 accesos                                                                                    | Barra lateral solo con iconos, con tooltips                             | Barra lateral que se contrae (iconos con tooltips) o se expande (iconos y textos); ver 3.1 |
| **Tablero**               | Una columna cada vez, con pestañas de estado deslizables y contador; cambio de estado con un menú en la tarjeta | Columnas con scroll horizontal **dentro del tablero** (no de la página) | Todas las columnas visibles                                                                |
| **Lista**                 | Tarjetas apiladas                                                                                               | Tabla con columnas reducidas                                            | Tabla completa                                                                             |
| **Detalle**               | Pantalla completa                                                                                               | Panel lateral sobre la lista                                            | Panel lateral con el historial al lado                                                     |
| **Formulario**            | Una columna, botón de guardar fijo abajo                                                                        | Dos columnas                                                            | Dos columnas dentro de un modal o panel                                                    |
| **Panel de estadísticas** | Tarjetas en una columna; gráficos a ancho completo                                                              | Rejilla de 2 columnas                                                   | Rejilla de 4 columnas                                                                      |
| **Filtros**               | Hoja inferior (bottom sheet)                                                                                    | Barra plegable                                                          | Barra siempre visible                                                                      |

### 3.1 Barra lateral

- **Entre `md` y `lg`** siempre está contraída: solo iconos.
- **Desde `lg`**, un botón al principio de la barra la contrae o la expande. Lleva `aria-expanded` y su nombre cambia entre «Contraer menú» y «Expandir menú».
- **Contraída**, cada icono muestra su nombre en un tooltip al pasar el ratón y al recibir el foco con el teclado. El nombre sigue disponible para lectores de pantalla aunque no se vea. `Escape` oculta el tooltip (WCAG 1.4.13).
- **Preferencia:** se guarda en el dispositivo (`applytrack:sidebar`). La primera vez empieza contraída por debajo de `2xl` (1536 px), para dejar sitio al tablero, y expandida a partir de `2xl`.

## 4. Interacción y accesibilidad

- **Zonas táctiles** de al menos 44 × 44 px.
- **Arrastrar y soltar** en el tablero solo en pantallas ≥ `md` con puntero preciso (`@media (pointer: fine)`). En el resto, el cambio de estado se hace con menús. En todos los casos existe la alternativa con teclado (RF-05).
- **Zoom**: la web no bloquea el zoom del navegador y sigue usable al 200 %.
- **Áreas seguras**: en móvil se respetan notch y barra de gestos (`react-native-safe-area-context`).
- **Movimiento**: las animaciones se desactivan con `prefers-reduced-motion` (web) o la opción equivalente del sistema (móvil).
- **Tema**: claro, oscuro o el del sistema, con contraste AA en los dos.

## 5. Verificación

- **Playwright** ejecuta los E2E en cuatro tamaños: 360 × 640, 768 × 1024, 1280 × 800 y 1920 × 1080.
- Un test comprueba en cada tamaño que `document.documentElement.scrollWidth <= window.innerWidth`.
- **Capturas de referencia** de tablero, lista y formulario en los cuatro tamaños, los dos temas y los dos idiomas, para revisarlas en cada PR que toque la interfaz.
- **Móvil**: revisión manual en un iPhone SE (pantalla pequeña), un teléfono Android mediano y un iPad, con la letra del sistema al máximo.
