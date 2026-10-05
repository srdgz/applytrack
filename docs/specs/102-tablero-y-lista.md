# 102 · Tablero y lista

| Campo      | Valor                                                            |
| ---------- | ---------------------------------------------------------------- |
| Estado     | Borrador, pendiente de revisión                                  |
| Versión    | 0.1                                                              |
| Fecha      | 2026-10-05                                                       |
| Requisitos | RF-06, RF-07 y RF-08 de [000-producto](000-producto.md)          |
| Hito       | M2 (núcleo, adaptador local e interfaz web); la app móvil, en M4 |

## 1. Objetivo

Ver las candidaturas de dos formas, tablero y lista, y encontrar cualquiera con búsqueda y filtros. Es la primera spec con interfaz, así que también fija la estructura mínima de la web (sección 6) sobre la que se montarán las demás pantallas de M2.

Queda fuera de esta spec mover tarjetas entre columnas: es la spec 101 · cambio de estado (RF-05).

## 2. Consulta: `ApplicationQuery`

```ts
interface ApplicationQuery {
  text?: string;
  statuses?: readonly ApplicationStatus[];
  workModes?: readonly WorkMode[];
  sources?: readonly ApplicationSource[];
  tags?: readonly string[];
  archived: "exclude" | "only" | "include";
  sort: { field: SortField; direction: "asc" | "desc" };
  offset: number;
  limit: number;
}

type SortField = "company" | "appliedAt" | "updatedAt";

interface Page<T> {
  items: readonly T[];
  total: number;
  offset: number;
  limit: number;
}
```

### 2.1 Valores por defecto

| Campo                                              | Por defecto                                                   |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `text`, `statuses`, `workModes`, `sources`, `tags` | Sin filtro                                                    |
| `archived`                                         | `"exclude"`                                                   |
| `sort`                                             | `updatedAt` descendente (lo último que se ha movido, primero) |
| `offset` / `limit`                                 | `0` / `50`                                                    |

### 2.2 Reglas de filtrado

| Filtro                             | Regla                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text`                             | Se separa en palabras. **Cada palabra** tiene que aparecer en la empresa, el puesto o alguna etiqueta (puede ser en campos distintos). Sin distinguir mayúsculas ni tildes, y como subcadena: `fron` encuentra «Frontend». Un texto vacío o solo con espacios no filtra. |
| `statuses`, `workModes`, `sources` | La candidatura tiene que tener **uno de** los valores indicados. Una lista vacía equivale a no filtrar.                                                                                                                                                                  |
| `tags`                             | La candidatura tiene que tener **al menos una** de las etiquetas, sin distinguir mayúsculas ni tildes.                                                                                                                                                                   |
| Entre filtros distintos            | Se combinan con **Y**: tienen que cumplirse todos.                                                                                                                                                                                                                       |
| `archived`                         | `exclude`: solo las no archivadas. `only`: solo las archivadas. `include`: todas.                                                                                                                                                                                        |

### 2.3 Orden

- `company`: por el nombre sin tildes y en minúsculas, para que todos los adaptadores ordenen igual sin depender del idioma de la base de datos.
- `appliedAt`: las candidaturas sin fecha (`wishlist`) van **siempre al final**, tanto en orden ascendente como descendente.
- `updatedAt`: por fecha y hora.
- **Desempate:** a igualdad de valor, por `id` ascendente. Así la paginación es estable y no repite ni salta elementos.

### 2.4 Límites

- `limit` entre 1 y 500, y `offset` ≥ 0, ambos enteros. Fuera de rango → `VALIDATION_FAILED` con `INVALID_OPTION` en el campo correspondiente.
- La interfaz no envía nunca valores fuera de rango (ver 7.3). Esta validación es una red de seguridad.

## 3. Modelo de lectura

Los listados no devuelven la entidad, sino un resumen con datos calculados para pintar las tarjetas:

```ts
interface ApplicationSummary extends ApplicationSnapshot {
  daysSinceUpdate: number;
  stale: boolean;
}
```

| Campo             | Cálculo                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `daysSinceUpdate` | Días de calendario entre el día de `updatedAt` (en la zona horaria del dispositivo) y hoy (`Clock.today()`). `0` si se actualizó hoy.                                   |
| `stale`           | `true` si el estado es activo (`wishlist`, `applied`, `screening`, `interviewing`, `offer`) y `daysSinceUpdate > 14`. Es la misma definición de «parada» que usa RF-10. |

La constante `STALE_AFTER_DAYS = 14` vive en `core` y la comparten esta spec y la 105.

### 3.1 Columnas del tablero

Función pura `groupForBoard(items)` en `core`:

| Columna        | Estados                                            |
| -------------- | -------------------------------------------------- |
| `wishlist`     | `wishlist`                                         |
| `applied`      | `applied`                                          |
| `screening`    | `screening`                                        |
| `interviewing` | `interviewing`                                     |
| `offer`        | `offer`                                            |
| `closed`       | `accepted`, `rejected`, `withdrawn`, `no_response` |

- Devuelve las 6 columnas siempre en este orden, aunque estén vacías, cada una con su lista y su número de elementos.
- Dentro de cada columna se respeta el orden de la consulta.

## 4. Casos de uso y puertos

### 4.1 `SearchApplications`

Entrada: `Partial<ApplicationQuery>`, que se completa con los valores por defecto. Salida: `Result<Page<ApplicationSummary>, ApplicationUseCaseError>`.

1. Sin usuario → `UNAUTHENTICATED`.
2. Completa y valida la consulta (2.1 y 2.4).
3. Llama a `ApplicationRepository.search(owner, query)`.
4. Convierte cada candidatura en `ApplicationSummary` con `Clock`.

### 4.2 `ListTags`

Devuelve las etiquetas usadas en las candidaturas de la persona usuaria (archivadas incluidas), para ofrecerlas en el filtro.

- Sin repetidos, sin distinguir mayúsculas ni tildes. Se conserva la forma de la candidatura actualizada más recientemente.
- Ordenadas sin tildes y en minúsculas.

### 4.3 Cambios en `ApplicationRepository`

```ts
interface ApplicationRepository {
  findById(owner: UserId, id: ApplicationId): Promise<Application | null>;
  save(application: Application): Promise<void>;
  search(owner: UserId, query: ApplicationQuery): Promise<Page<Application>>;
  listTags(owner: UserId): Promise<readonly string[]>;
}
```

- Las reglas de las secciones 2.2 y 2.3 son **funciones puras de `core`** (`matchesQuery`, `compareForQuery`). El repositorio en memoria y `adapter-local` las usan directamente. En M3, `adapter-supabase` traducirá las mismas reglas a SQL.
- La **suite de contrato** se amplía con casos de búsqueda, orden y paginación. Así se garantiza que todos los adaptadores devuelven exactamente lo mismo.

## 5. Interfaz web: tablero

Ruta `/board`.

### 5.1 Tarjeta

| Elemento      | Detalle                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Empresa       | Texto principal, una línea, con puntos suspensivos si no cabe. El nombre completo sigue disponible para lectores de pantalla. |
| Puesto        | Texto secundario, máximo dos líneas.                                                                                          |
| Modalidad     | Etiqueta pequeña: «Remoto», «Híbrido», «Presencial».                                                                          |
| Actualización | «Hoy», «Ayer» o «Hace N días», con `Intl.RelativeTimeFormat`.                                                                 |
| Parada        | Si `stale`, indicador con icono **y** texto («Parada»), no solo color.                                                        |
| Etiquetas     | Las 3 primeras y «+N» si hay más.                                                                                             |
| Estado        | Solo en la columna «Cerradas»: indica cuál de los cuatro estados cerrados tiene.                                              |

- La tarjeta entera es un enlace a la candidatura (`/applications/:id`). Hasta que exista la pantalla de detalle (spec 101), lleva al formulario de edición (spec 100).
- El texto accesible del enlace incluye empresa, puesto y estado.

### 5.2 Comportamiento por ancho

Según [003-responsive](003-responsive.md):

| Ancho       | Tablero                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < `md`      | Una columna cada vez. Encima, pestañas desplazables con el nombre y el número de cada columna, siguiendo el patrón de pestañas de ARIA (flechas para moverse, `Inicio` y `Fin`). Se abre en la primera columna con candidaturas. |
| `md` – `lg` | Columnas de ancho fijo (unos 280 px) con scroll horizontal **dentro del tablero**; la página no se desplaza en horizontal.                                                                                                       |
| ≥ `lg`      | Las 6 columnas a la vista, repartiendo el ancho. Desde `2xl` el tablero puede ocupar todo el ancho (excepción de 003).                                                                                                           |

- Cada columna es una región con título (`<section aria-labelledby>`) y sus tarjetas, una lista (`<ol>`).
- El filtro de estado del tablero muestra solo las columnas de los estados elegidos. La columna «Cerradas» aparece si se elige al menos uno de sus estados.

### 5.3 Límite

El tablero pide hasta 500 candidaturas en una sola consulta. Si hay más (`total > 500`), avisa y propone usar la lista. En una búsqueda de empleo real no debería pasar.

## 6. Interfaz web: lista

Ruta `/list`.

| Ancho       | Presentación                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| < `md`      | Tarjetas apiladas, como las del tablero pero con el estado siempre visible.                              |
| `md` – `lg` | Tabla reducida: «Empresa y puesto» (juntos), «Estado» y «Última actualización».                          |
| ≥ `lg`      | Tabla completa: Empresa, Puesto, Estado, Modalidad, Fuente, Fecha de candidatura y Última actualización. |

- **Ordenar:** las cabeceras de Empresa, Fecha de candidatura y Última actualización son botones. Un clic ordena por esa columna; otro, invierte el orden. La columna activa lleva `aria-sort`. En pantallas estrechas, un selector «Ordenar por» hace lo mismo.
- **Cargar más:** se cargan 50 y, si hay más, un botón «Cargar más» añade las 50 siguientes. Encima se indica «Mostrando 50 de 73». Se elige un botón y no el scroll infinito porque se puede usar con teclado y no impide llegar al pie de página.
- Cada fila o tarjeta enlaza a la candidatura, como en el tablero.

## 7. Búsqueda y filtros (tablero y lista)

### 7.1 Controles

| Control        | Tipo                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| Búsqueda       | Campo de texto. Busca 300 ms después de dejar de escribir.                 |
| Estado         | Selección múltiple.                                                        |
| Modalidad      | Selección múltiple.                                                        |
| Fuente         | Selección múltiple.                                                        |
| Etiqueta       | Selección múltiple con las opciones de `ListTags`.                         |
| Archivadas     | Selector: «Ocultar archivadas» (por defecto), «Solo archivadas» o «Todas». |
| Quitar filtros | Botón visible solo si hay algún filtro activo. Muestra cuántos hay.        |

Distribución según 003: hoja inferior en < `md`, barra plegable en `md`–`lg` y barra siempre visible en ≥ `lg`. La búsqueda está siempre visible en todos los anchos.

### 7.2 Filtros en la URL

Los filtros y el orden viven en la URL, no en un store: se pueden compartir, sobreviven a una recarga y el botón «atrás» funciona.

| Parámetro     | Ejemplo                    | Notas                               |
| ------------- | -------------------------- | ----------------------------------- |
| `q`           | `q=vue%20remoto`           | Texto de búsqueda                   |
| `status`      | `status=applied,screening` | Separados por comas                 |
| `mode`        | `mode=remote`              |                                     |
| `source`      | `source=linkedin,referral` |                                     |
| `tag`         | `tag=Vue,TypeScript`       |                                     |
| `archived`    | `archived=only`            | Se omite si es `exclude`            |
| `sort`, `dir` | `sort=company&dir=asc`     | Se omiten si son los de por defecto |

- Los valores por defecto **no** se escriben en la URL, para que quede corta.
- Al escribir en la búsqueda se usa `router.replace` (no llena el historial con cada letra). Cambiar un filtro o el orden usa `router.push`, así «atrás» deshace el último cambio.
- Al pasar del tablero a la lista o al revés, se conservan los filtros. El orden solo existe en la lista; el tablero lo ignora.

### 7.3 URL con valores no válidos

Una URL editada a mano puede traer valores raros. La función `queryFromSearchParams` de la web:

- descarta los valores que no están en las listas cerradas (`status=hired` se ignora);
- sustituye un `sort` o `dir` no válidos por los de por defecto;
- nunca muestra un error por la URL: aplica lo que entiende y sigue.

## 8. Estructura mínima de la web (M2)

| Ruta                     | Pantalla                                                              | Spec |
| ------------------------ | --------------------------------------------------------------------- | ---- |
| `/`                      | Inicio: «Probar sin cuenta» e «Iniciar sesión» (desactivado hasta M3) | 103  |
| `/board`                 | Tablero                                                               | 102  |
| `/list`                  | Lista                                                                 | 102  |
| `/applications/new`      | Nueva candidatura                                                     | 100  |
| `/applications/:id`      | Detalle (hasta la 101, redirige a editar)                             | 101  |
| `/applications/:id/edit` | Editar candidatura                                                    | 100  |
| `/stats`                 | Estadísticas                                                          | 105  |
| `/settings`              | Idioma, tema y salir de la demo                                       | 104  |

- **Navegación** (según 003): Tablero, Lista, Estadísticas y Ajustes. El botón «Nueva candidatura» es la acción principal: botón flotante en < `md` y botón en la cabecera a partir de `md`.
- **Sin sesión**, cualquier ruta salvo `/` redirige a `/`. Con sesión, `/` redirige a `/board`.
- El aviso del modo demo (103, sección 6) aparece en todas las pantallas con sesión demo.
- Mientras no existan las specs 104 y 105, `/stats` y `/settings` muestran una pantalla mínima. Ajustes ofrecerá al menos el cambio de idioma, para poder comprobar la i18n desde el principio.

## 9. Estados de carga, vacío y error

| Situación                   | Qué se ve                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cargando                    | Esqueletos con la forma de las tarjetas o de las filas. Solo aparecen si la carga dura más de 200 ms, para evitar parpadeos. |
| Sin ninguna candidatura     | Mensaje de bienvenida y botón «Añadir candidatura».                                                                          |
| Sin resultados con filtros  | «Ninguna candidatura coincide con los filtros» y botón «Quitar filtros».                                                     |
| Columna vacía en el tablero | Texto discreto «Sin candidaturas».                                                                                           |
| Error inesperado            | Mensaje genérico y botón «Reintentar». El error no se muestra en crudo.                                                      |

Los cambios de número de resultados se anuncian a los lectores de pantalla con una región `aria-live="polite"` («12 candidaturas»).

## 10. App móvil (M4)

Mismo comportamiento con componentes nativos:

- **Teléfono:** tablero con pestañas de columna desplazables, como en la web < `md`, y lista con tarjetas.
- **Tableta en horizontal:** columnas con scroll horizontal.
- Los filtros se guardan en los parámetros de la ruta de Expo Router, el equivalente a la URL de la web.
- Deslizar para actualizar (`pull to refresh`) en tablero y lista.

## 11. Criterios de aceptación

### Núcleo y adaptadores

| Id        | Criterio                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| CA-102-01 | Sin filtros, `SearchApplications` devuelve las no archivadas ordenadas por `updatedAt` descendente, de 50 en 50.                         |
| CA-102-02 | `text: "fron vue"` encuentra una candidatura con puesto «Frontend» y la etiqueta «Vue», y no una que solo tenga una de las dos palabras. |
| CA-102-03 | `text: "ingenieria"` encuentra «Ingeniería Frontend».                                                                                    |
| CA-102-04 | Filtros de distinto tipo se combinan con Y; varios valores del mismo filtro, con O.                                                      |
| CA-102-05 | `archived` `exclude`, `only` e `include` devuelven lo que corresponde.                                                                   |
| CA-102-06 | Orden por `appliedAt` deja las de `wishlist` al final en los dos sentidos.                                                               |
| CA-102-07 | Recorrer todas las páginas devuelve cada candidatura exactamente una vez, también con valores repetidos en el campo de orden.            |
| CA-102-08 | `limit: 0`, `limit: 501` u `offset: -1` devuelven `VALIDATION_FAILED`.                                                                   |
| CA-102-09 | `daysSinceUpdate` y `stale` son correctos, también en el límite de 14 y 15 días, y `stale` es siempre `false` en estados cerrados.       |
| CA-102-10 | `groupForBoard` devuelve las 6 columnas en orden, con los estados cerrados agrupados en `closed`.                                        |
| CA-102-11 | `ListTags` no repite «Vue» y «vue» y las devuelve ordenadas.                                                                             |
| CA-102-12 | Las candidaturas de otra persona no aparecen nunca en `search` ni en `listTags`.                                                         |
| CA-102-13 | El repositorio en memoria y `LocalApplicationRepository` pasan la suite de contrato ampliada.                                            |
| CA-102-14 | Sin sesión, `SearchApplications` y `ListTags` devuelven `UNAUTHENTICATED`.                                                               |

### Web

| Id        | Criterio                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| CA-102-15 | Con la demo recién cargada, el tablero muestra las 6 columnas con 2, 3, 2, 2, 1 y 4 tarjetas (la archivada no aparece). |
| CA-102-16 | Las candidaturas paradas muestran el indicador «Parada» con texto.                                                      |
| CA-102-17 | Filtrar, recargar la página y pulsar «atrás» conservan y deshacen los filtros como se describe en 7.2.                  |
| CA-102-18 | Una URL con valores no válidos carga sin errores y aplica solo los válidos.                                             |
| CA-102-19 | A 360, 768, 1280 y 1920 px no hay scroll horizontal de página, y el tablero se comporta como indica 5.2.                |
| CA-102-20 | En < `md`, las pestañas del tablero se pueden usar solo con teclado.                                                    |
| CA-102-21 | En la lista, ordenar por una cabecera actualiza `aria-sort` y la URL.                                                   |
| CA-102-22 | «Cargar más» añade las siguientes candidaturas sin repetir ninguna.                                                     |
| CA-102-23 | Todos los textos de tablero, lista y filtros cambian al pasar de español a inglés.                                      |
| CA-102-24 | axe no encuentra infracciones graves en tablero y lista, en tema claro y oscuro.                                        |
