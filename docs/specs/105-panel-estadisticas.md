# 105 · Panel de estadísticas

| Campo      | Valor                                           |
| ---------- | ----------------------------------------------- |
| Estado     | Aprobado                                        |
| Versión    | 0.1                                             |
| Fecha      | 2026-10-05                                      |
| Requisitos | RF-10 de [000-producto](000-producto.md)        |
| Hito       | M2 (núcleo e interfaz web); la app móvil, en M4 |

## 1. Objetivo

Ayudar a entender cómo va la búsqueda de empleo con pocas cifras, fáciles de leer y que permitan actuar: cuántas candidaturas hay en cada fase, si las empresas responden, qué canales funcionan mejor y cuáles conviene mover.

## 2. Qué candidaturas cuentan

- **Las estadísticas de proceso cuentan también las archivadas.** Archivar sirve para ordenar el tablero, pero esas candidaturas forman parte de la búsqueda.
- **La lista de paradas excluye las archivadas.** Si alguien archiva una candidatura, ya ha decidido no seguirla.
- **No hay filtros en esta pantalla.** Quedan para después del MVP.

## 3. Métricas

Todas se calculan en `core` con una función pura, `computeDashboardStats(applications, today)`, a partir del estado actual y del historial de cada candidatura.

### 3.1 Definiciones

| Concepto                            | Definición                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Enviada**                         | Candidatura que ha pasado alguna vez por `applied`: su historial incluye `applied`.                                                                                                        |
| **Con respuesta**                   | Enviada que después pasó a `screening`, `interviewing`, `offer`, `accepted` o `rejected`. Un rechazo cuenta como respuesta; `withdrawn` (lo decide la persona usuaria) y `no_response` no. |
| **Con entrevista**                  | Enviada que ha pasado alguna vez por `interviewing`.                                                                                                                                       |
| **Con oferta**                      | Enviada que ha pasado alguna vez por `offer`.                                                                                                                                              |
| **Días hasta la primera respuesta** | Días de calendario entre el paso a `applied` y el primer paso a un estado de respuesta.                                                                                                    |
| **Parada**                          | La de [102](102-tablero-y-lista.md): estado activo y más de 14 días sin cambios (`STALE_AFTER_DAYS`).                                                                                      |

### 3.2 Cifras del panel

| Bloque                  | Contenido                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resumen** (4 cifras)  | Candidaturas activas · Tasa de respuesta · Tasa de entrevista · Ofertas                                                                                                                       |
| **Por estado**          | Número de candidaturas en cada uno de los 9 estados, más los totales de activas y cerradas.                                                                                                   |
| **Enviadas por semana** | Candidaturas enviadas en cada una de las **últimas 8 semanas** (de lunes a domingo, en la zona horaria del dispositivo), según `appliedAt`. La semana actual cuenta aunque no haya terminado. |
| **Por fuente**          | Para cada fuente con al menos una enviada: enviadas, con respuesta y tasa de respuesta. Ordenadas por número de enviadas.                                                                     |
| **Tiempo de respuesta** | Mediana de días hasta la primera respuesta. Se usa la mediana y no la media porque un solo caso muy lento no la distorsiona.                                                                  |
| **Paradas**             | Lista de candidaturas paradas, de la más antigua a la más reciente, con enlace a su detalle y los días sin cambios.                                                                           |

### 3.3 Tasas

- Tasa = numerador / enviadas. Se muestra en porcentaje sin decimales (`Intl.NumberFormat`, `style: "percent"`) y siempre acompañada de las cifras: «69 % · 9 de 13».
- Si no hay ninguna enviada, la tasa no se calcula: se muestra «—» con el texto «Todavía no has enviado ninguna candidatura».

## 4. Núcleo

```ts
interface DashboardStats {
  active: number;
  closed: number;
  byStatus: Record<ApplicationStatus, number>;
  sent: number;
  responded: number;
  interviewed: number;
  offered: number;
  medianDaysToResponse: number | null;
  weekly: { weekStart: CalendarDate; count: number }[];
  bySource: { source: ApplicationSource; sent: number; responded: number }[];
  stale: ApplicationSummary[];
}
```

- **Caso de uso `GetDashboardStats`:** sin sesión devuelve `UNAUTHENTICATED`. Lee todas las candidaturas con `ApplicationRepository.search` (archivadas incluidas, de 500 en 500 hasta tenerlas todas) y llama a `computeDashboardStats` con `Clock.today()`.
- Las tasas se calculan en la interfaz a partir de los recuentos, para que `core` no dependa del redondeo ni del formato.
- No hace falta ningún puerto nuevo.

## 5. Interfaz web

Ruta `/stats`. Sustituye a la pantalla provisional.

### 5.1 Distribución

Según [003-responsive](003-responsive.md):

| Ancho       | Resumen    | Resto de bloques                                                                                  |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------- |
| < `md`      | 1 columna  | 1 columna                                                                                         |
| `md` – `lg` | 2 columnas | 1 columna                                                                                         |
| ≥ `lg`      | 4 columnas | 2 columnas: semanas y estados a la izquierda; fuentes, tiempo de respuesta y paradas a la derecha |

### 5.2 Gráficos

- **Sin librería de gráficos.** Las barras se dibujan con HTML y CSS, con el ancho o la altura proporcional al valor. Así no se añade peso al bundle (RNF-06) y se aprovechan los tokens de color y el tema oscuro.
- **Cada barra lleva su número escrito.** El color nunca es la única forma de leer un dato.
- **Datos accesibles:** cada gráfico es en realidad una lista (`<ol>`/`<dl>`) con etiqueta y valor, que los lectores de pantalla leen como texto. Las barras son decorativas (`aria-hidden`).
- **Semanas:** barras verticales. Debajo de cada una, la fecha del lunes («6 oct»). Si una semana tiene 0, la barra se ve como una línea mínima, para que se note que existe.
- **Estados:** barras horizontales en el orden del proceso, separando activas y cerradas.

### 5.3 Estados especiales

| Situación               | Qué se ve                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Sin ninguna candidatura | Mensaje «Todavía no hay datos» y botón «Añadir candidatura».                                                           |
| Sin ninguna enviada     | El resumen y los estados se muestran; las tasas, el tiempo de respuesta y las fuentes indican que aún no hay enviadas. |
| Sin paradas             | «Ninguna candidatura parada. ¡Bien!»                                                                                   |
| Cargando / error        | Igual que en el tablero (102, sección 9).                                                                              |

### 5.4 Actualización

Los datos se recalculan al entrar en la pantalla y cuando cambian (por ejemplo, desde otra pestaña), igual que el tablero.

## 6. App móvil (M4)

Mismos bloques en una columna, con las mismas reglas de accesibilidad.

## 7. Criterios de aceptación

Las cifras de CA-105-02 a 05 se refieren a los **datos de ejemplo recién cargados** (spec 103).

### Núcleo

| Id        | Criterio                                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-105-01 | `computeDashboardStats` sin candidaturas devuelve todo a 0, `medianDaysToResponse: null`, 8 semanas a 0 y listas vacías.                                         |
| CA-105-02 | Con los datos de ejemplo: 13 enviadas, 9 con respuesta, 5 con entrevista y 2 con oferta.                                                                         |
| CA-105-03 | Con los datos de ejemplo: la mediana de días hasta la primera respuesta es 7.                                                                                    |
| CA-105-04 | Con los datos de ejemplo: 10 activas y 5 cerradas (la archivada cuenta), y 2 paradas (Lince Software y Olivo Fintech, en ese orden).                             |
| CA-105-05 | Una candidatura archivada y parada no aparece en la lista de paradas, pero sí en las demás cifras.                                                               |
| CA-105-06 | Las semanas empiezan en lunes, hay exactamente 8, la última es la actual, y una candidatura enviada un domingo cuenta en la semana que empezó el lunes anterior. |
| CA-105-07 | Un rechazo directo desde `applied` cuenta como respuesta; `withdrawn` y `no_response`, no.                                                                       |
| CA-105-08 | `GetDashboardStats` sin sesión devuelve `UNAUTHENTICATED` y nunca incluye candidaturas de otra persona.                                                          |

### Web

| Id        | Criterio                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------- |
| CA-105-09 | Con los datos de ejemplo, el resumen muestra «69 % · 9 de 13» como tasa de respuesta.             |
| CA-105-10 | Cada barra muestra su valor como texto y los gráficos se leen como listas con lector de pantalla. |
| CA-105-11 | Las candidaturas paradas enlazan a su detalle.                                                    |
| CA-105-12 | Sin candidaturas aparece el mensaje vacío; sin enviadas, las tasas muestran «—».                  |
| CA-105-13 | Todos los textos, porcentajes y fechas cambian al pasar a inglés.                                 |
| CA-105-14 | A 360, 768, 1280 y 1920 px no hay scroll horizontal y la distribución es la de 5.1.               |
