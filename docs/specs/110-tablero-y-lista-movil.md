# 110 · Tablero, lista y filtros en el móvil

| Campo      | Valor                                                   |
| ---------- | ------------------------------------------------------- |
| Estado     | Aprobado                                                |
| Versión    | 0.2                                                     |
| Fecha      | 2026-10-08                                              |
| Requisitos | RF-06, RF-07 y RF-08 de [000-producto](000-producto.md) |
| Hito       | M4 (la web se hizo en [102](102-tablero-y-lista.md))    |

## 1. Objetivo

Llevar al móvil el tablero, la lista, la búsqueda y los filtros de la spec 102, con las mismas reglas y los mismos casos de uso (`SearchApplications`, `ListTags`, `groupForBoard`, `toSummary`). Lo que cambia es la interfaz, que usa patrones nativos.

Sigue fuera de esta spec lo que llega después:

| Acción                                                | Spec | Hasta entonces               |
| ----------------------------------------------------- | ---- | ---------------------------- |
| Abrir el detalle de una candidatura                   | 111  | Pantalla «Disponible pronto» |
| Cambiar el estado (menú «Mover a…»)                   | 111  | —                            |
| Crear una candidatura (botón flotante y estado vacío) | 112  | Pantalla «Disponible pronto» |

## 2. Lógica compartida: `packages/presentation`

La web tiene en `apps/web/src/query/url-query.ts` la lógica de los filtros y en `useFormat` el formato de fechas. Ninguna de las dos depende de Vue, y el móvil necesita exactamente lo mismo.

- **Paquete nuevo `@applytrack/presentation`**, sin dependencias de runtime aparte de `core`:
  - `filters.ts`: `Filters`, `DEFAULT_FILTERS`, `toApplicationQuery`, `countActiveFilters`, `withoutFilters`, `defaultDirection`, y también `filtersFromQuery` y `queryFromFilters`, que la web sigue usando para la URL.
  - `format.ts`: `createFormatter(locale)`, con `daysAgo`, `calendarDate`, `shortCalendarDate`, `ratio`, `instant`, `since` y `salary`, sobre `Intl`.
- Los tests de `url-query.test.ts` se mueven al paquete. La web importa de `@applytrack/presentation` y su `useFormat` pasa a envolver `createFormatter`.
- `dependency-cruiser`: `presentation` solo puede importar `core`. Ni adaptadores, ni frameworks, ni las apps.

## 3. Estado de los filtros en el móvil

- En la web, los filtros viven en la URL. En el móvil no hay URL que compartir, y cada pestaña es una ruta distinta, así que sus parámetros no se comparten.
- Los filtros se guardan en un **contexto de React** (`FiltersProvider`) dentro del grupo de pestañas, con el mismo tipo `Filters`. Así el tablero y la lista comparten búsqueda y filtros, como en la web.
- No se guardan en el dispositivo: al cerrar la app vuelven a los valores por defecto.
- El orden solo se usa en la lista; el tablero lo ignora, como en la web.

## 4. Tablero

### 4.1 Teléfono (ancho < 768 dp)

- **Arriba:** búsqueda y botón «Filtros», con el número de filtros activos si los hay (sección 6).
- **Debajo:** una fila de **pestañas desplazable** con las 6 columnas (Me interesa, Aplicada, Primer contacto, Entrevistas, Oferta y Cerradas), cada una con su número.
  - `accessibilityRole="tab"` con el estado `selected`, dentro de un contenedor `tablist`.
  - Al abrir el tablero se selecciona la **primera columna con candidaturas**.
  - Al cambiar de pestaña, la pestaña elegida se desplaza hasta quedar visible.
- **Contenido:** las tarjetas de la columna elegida en una `FlatList`. Si la columna no tiene ninguna, el texto «Sin candidaturas».

### 4.2 Tableta en horizontal (ancho ≥ 768 dp)

Las 6 columnas una al lado de otra, de 280 dp de ancho, con desplazamiento horizontal. Sin pestañas.

### 4.3 Tarjeta

Igual que la de la web (102, 5.1):

| Elemento      | Detalle                                                     |
| ------------- | ----------------------------------------------------------- |
| Empresa       | Una línea, con puntos suspensivos.                          |
| Puesto        | Hasta dos líneas.                                           |
| Modalidad     | Etiqueta pequeña.                                           |
| Actualización | «Hoy», «Ayer» o «Hace N días».                              |
| Parada        | Icono de reloj **y** el texto «Parada», no solo un color.   |
| Etiquetas     | Las 3 primeras y «+N».                                      |
| Estado        | En la columna «Cerradas» y en la lista, siempre visible.    |
| Archivada     | Marca «Archivada» si lo está (solo aparece con ese filtro). |

- La tarjeta entera es pulsable (`accessibilityRole="button"`). Su nombre accesible incluye empresa, puesto, estado y, si lo está, «Parada».
- Al pulsarla abre `/applications/[id]`, que hasta la spec 111 muestra «Disponible pronto».

### 4.4 Límite

Como en la web, el tablero pide hasta 500 candidaturas. Si hay más, muestra un aviso y propone usar la lista.

## 5. Lista

- Búsqueda y «Filtros» arriba, como en el tablero, más un botón **«Ordenar»**.
  - Abre una hoja con los tres campos (Última actualización, Fecha de candidatura y Empresa) y el sentido (ascendente o descendente), como opciones de tipo `radio`.
- Las tarjetas se muestran en una `FlatList`, siempre con su estado visible.
- **Carga incremental:**
  - se cargan 50;
  - al acercarse al final (`onEndReached`) se cargan las 50 siguientes, con un indicador mientras tanto;
  - el pie dice «Mostrando 50 de 73».

  En la web se eligió un botón porque el scroll infinito dificulta llegar al pie con teclado. En el móvil el patrón nativo es cargar al llegar al final, y el pie sigue siendo alcanzable. Para quien use lector de pantalla, el pie incluye además un botón «Cargar más».

## 6. Búsqueda y filtros

- **Búsqueda:** campo con icono, `returnKeyType="search"` y botón para borrarla. Busca 300 ms después de dejar de escribir.
- **Filtros:** el botón abre una pantalla modal (`presentation: "modal"` en Expo Router) con:

  | Sección    | Control                                                            |
  | ---------- | ------------------------------------------------------------------ |
  | Estado     | Fichas que se marcan y desmarcan (`accessibilityRole="checkbox"`). |
  | Modalidad  | Ídem                                                               |
  | Fuente     | Ídem                                                               |
  | Etiqueta   | Ídem, con las etiquetas de `ListTags`                              |
  | Archivadas | Ocultar archivadas, Solo archivadas o Todas (`radio`)              |
  - Los cambios se aplican al momento: no hay botón «Aplicar».
  - Arriba están «Quitar filtros», solo si hay alguno activo, y «Listo», que cierra la pantalla.
  - En el estado vacío con filtros, el botón «Quitar filtros» limpia todo menos el orden, como en la web.

## 7. Estados y actualización

| Situación                  | Qué se ve                                                             |
| -------------------------- | --------------------------------------------------------------------- |
| Cargando                   | Esqueletos con la forma de las tarjetas, solo si tarda más de 200 ms. |
| Sin ninguna candidatura    | Mensaje de bienvenida y «Añadir candidatura».                         |
| Sin resultados con filtros | «Ninguna candidatura coincide con los filtros» y «Quitar filtros».    |
| Error                      | Mensaje genérico y «Reintentar».                                      |

- **Deslizar para actualizar** (`RefreshControl`) en el tablero y en la lista.
- Al **volver a una pestaña** (`useFocusEffect`) se recargan los datos, para reflejar los cambios hechos en otras pantallas, como reiniciar la demo.
- Cuando cambia el número de resultados, se anuncia al lector de pantalla («12 candidaturas»), como la región `aria-live` de la web.

## 8. Botón «Nueva candidatura»

Botón flotante redondo de 56 dp abajo a la derecha, en el tablero y en la lista, encima de las pestañas y respetando el área segura. Su nombre accesible es «Nueva candidatura». Abre `/applications/new`, que hasta la spec 112 muestra «Disponible pronto».

## 9. Textos

Se reutilizan las claves de la web (`board`, `list`, `filters`, `sort`, `results`, `empty`, `feedback`, `card`). Se añaden solo las del móvil:

- «Filtros» con número;
- «Ordenar»;
- «Listo»;
- «Cargar más»;
- el anuncio del número de resultados, si no existe ya.

## 10. Tests

- **`presentation`:** los tests de filtros que hoy están en la web, y otros nuevos para `createFormatter` en español e inglés.
- **Móvil (Jest + RNTL),** con la demo cargada:
  - el tablero muestra las 6 pestañas con 2, 3, 2, 2, 1 y 4 candidaturas y abre en la primera con datos;
  - cambiar de pestaña muestra sus tarjetas;
  - la tarjeta de una candidatura parada lleva «Parada» en el texto y en el nombre accesible;
  - la búsqueda «arbol» filtra sin distinguir tildes;
  - en la pantalla de filtros, marcar un estado reduce los resultados y «Quitar filtros» los recupera;
  - los filtros se mantienen al pasar del tablero a la lista;
  - en la lista, ordenar por empresa cambia el orden;
  - con 60 candidaturas, la lista carga 50 y después 10 más, sin repetir ninguna;
  - los estados vacío, sin resultados y de error, y «Reintentar»;
  - pulsar una tarjeta o el botón flotante abre su ruta.

## 11. Fuera de alcance

- Arrastrar tarjetas entre columnas (en la web era opcional y en el móvil el menú «Mover a…» de la spec 111 cubre el caso).
- Guardar los filtros entre sesiones.
- Acciones al deslizar una tarjeta, como archivar.

## 12. Criterios de aceptación

| Id        | Criterio                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CA-110-01 | La web sigue pasando sus tests usando `@applytrack/presentation`, y `dependency-cruiser` aplica la regla del paquete.                      |
| CA-110-02 | Con la demo recién cargada, el tablero del teléfono muestra 6 pestañas con 2, 3, 2, 2, 1 y 4, y abre en la primera con candidaturas.       |
| CA-110-03 | En una tableta en horizontal se ven las 6 columnas con desplazamiento horizontal.                                                          |
| CA-110-04 | Las tarjetas muestran lo indicado en 4.3, y las paradas llevan «Parada» como texto y en su nombre accesible.                               |
| CA-110-05 | Buscar y filtrar dan los mismos resultados que en la web, y se mantienen al pasar entre tablero y lista.                                   |
| CA-110-06 | En la lista, el orden elegido se aplica, y la carga incremental muestra todas las candidaturas una sola vez con el pie «Mostrando N de M». |
| CA-110-07 | Deslizar para actualizar y volver a la pestaña recargan los datos.                                                                         |
| CA-110-08 | Los estados de carga, vacío, sin resultados y error se ven como en la sección 7.                                                           |
| CA-110-09 | Todo se puede usar con VoiceOver y TalkBack: pestañas, fichas de filtro y tarjetas anuncian su rol, su nombre y su estado.                 |
| CA-110-10 | Todos los textos nuevos están en español e inglés, y con la letra del sistema al 200 % no se corta nada.                                   |

## 13. Notas de implementación

- **`FiltersProvider` en la raíz** (`src/shell/AppRoot.tsx`) y no dentro del grupo de pestañas: las pantallas de filtros y de orden son modales de la pila raíz y necesitan el mismo contexto. Se reinicia al entrar o salir de la cuenta.
- **Orden en una pantalla modal** (`/sort`), igual que los filtros, en lugar de una hoja.
- **Columna activa:** si tras buscar o filtrar la columna elegida se queda vacía y otra tiene resultados, el tablero salta a la primera con datos. Si eliges tú una columna vacía, se respeta.
- **Recarga al volver** a la pestaña sin esqueleto, para no parpadear.
- **Tests:** `board.test.tsx` y `list.test.tsx`, por separado por el estado global del router. La carga al llegar al final se prueba llamando a `onEndReached`, porque en Jest la lista no tiene medidas reales.
- **Pendiente de probar en un dispositivo:** CA-110-03 (tableta en horizontal), CA-110-09 (VoiceOver y TalkBack) y CA-110-10 (letra al 200 %).

## 14. Decisiones tomadas

1. **Paquete `presentation`** para compartir filtros y formato entre web y móvil, en lugar de copiarlos.
2. **Filtros en un contexto de React** y no en los parámetros de la ruta, porque las pestañas no comparten parámetros y en el móvil no hay URL que compartir.
3. **Carga al llegar al final** en la lista, que es el patrón nativo, con un botón «Cargar más» accesible en el pie.
4. **Filtros en una pantalla modal** de Expo Router, en lugar de una hoja inferior con una librería externa: no añade dependencias y funciona en Expo Go.
5. **Detalle y formulario como «Disponible pronto»** hasta sus specs, para poder probar la navegación completa.
