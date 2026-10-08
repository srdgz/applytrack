# 113 · Estadísticas en el móvil

| Campo      | Valor                                                   |
| ---------- | ------------------------------------------------------- |
| Estado     | Aprobado                                                |
| Versión    | 0.2                                                     |
| Fecha      | 2026-10-08                                              |
| Requisitos | RF-10 de [000-producto](000-producto.md)                |
| Hito       | M4 (la web se hizo en [105](105-panel-estadisticas.md)) |

## 1. Objetivo

Sustituir la pestaña «Disponible pronto» de Estadísticas por el panel real, con las mismas métricas que la web. Se usa el mismo caso de uso, `GetDashboardStats`, con las mismas definiciones (105, sección 3), así que no hay cambios en `core`.

Con esta spec, la app móvil tiene todas las funciones de la web.

## 2. Bloques

Los mismos que en la web y en el mismo orden:

| Bloque                  | En el móvil                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resumen**             | 4 tarjetas: candidaturas activas (con las cerradas debajo), tasa de respuesta, tasa de entrevista y ofertas. Las tasas, como «69 % · 9 de 13». |
| **Enviadas por semana** | 8 barras verticales, con el número encima y la fecha del lunes debajo («6 oct»). Una semana con 0 se ve como una línea mínima.                 |
| **Por estado**          | Barras horizontales con el nombre y el número, en el orden del proceso, separadas en «Activas» y «Cerradas».                                   |
| **Por fuente**          | Una fila por fuente con enviadas, con respuesta y tasa, ordenadas por enviadas.                                                                |
| **Tiempo de respuesta** | La mediana en días y la explicación «Mediana desde que envías la candidatura hasta la primera respuesta».                                      |
| **Paradas**             | Lista de candidaturas paradas con los días sin cambios. Cada una abre su detalle (spec 111).                                                   |

## 3. Distribución

| Ancho               | Resumen   | Resto de bloques                                                                                    |
| ------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Teléfono (< 768 dp) | 2 × 2     | Una columna                                                                                         |
| Tableta (≥ 768 dp)  | 4 en fila | Dos columnas: semanas y estados a la izquierda; fuentes, tiempo de respuesta y paradas a la derecha |

## 4. Gráficos y accesibilidad

- **Sin librería de gráficos,** como en la web: las barras son `View` con el alto o el ancho proporcional al valor y los colores de `design-tokens`. Así no se añade ninguna dependencia nativa y todo sigue funcionando en Expo Go.
- **Cada barra lleva su número escrito.** El color nunca es la única forma de leer un dato.
- **Para el lector de pantalla,** cada barra es un único elemento con su texto completo, por ejemplo «Semana del 6 oct: 3 enviadas» o «Aplicada: 3». La parte gráfica no se anuncia.
- Con la letra al 200 %, las etiquetas de las semanas pueden ocupar dos líneas, y las filas de estados y fuentes crecen en vez de cortarse.

## 5. Estados especiales

| Situación               | Qué se ve                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Sin ninguna candidatura | «Todavía no hay datos» y «Añadir candidatura», que abre el formulario (spec 112).                                                      |
| Sin ninguna enviada     | El resumen y los estados se muestran; las tasas muestran «—», y las fuentes y el tiempo de respuesta explican que aún no hay enviadas. |
| Sin respuestas          | «Todavía no hay respuestas.» en el tiempo de respuesta.                                                                                |
| Sin paradas             | «Ninguna candidatura parada. ¡Bien!»                                                                                                   |
| Cargando o error        | Esqueleto (si tarda más de 200 ms) o el error con «Reintentar», como en el tablero.                                                    |

## 6. Actualización

- Se recalcula al entrar en la pestaña (`useFocusEffect`), así refleja los cambios hechos en otras pantallas.
- Deslizar para actualizar.

## 7. Textos

Se reutilizan todos los de la web (`stats`). No se esperan textos nuevos.

## 8. Tests (Jest + RNTL)

Con la demo cargada:

- el resumen muestra 10 activas (5 cerradas), «69 % · 9 de 13» de respuesta, la tasa de entrevista y 2 ofertas;
- la mediana del tiempo de respuesta es de 7 días;
- la lista de paradas muestra Lince Software y Olivo Fintech, en ese orden, y pulsar una abre su detalle;
- hay 8 semanas, y cada barra tiene su texto accesible;
- los estados muestran el número de cada uno;
- sin candidaturas aparece el mensaje vacío y su botón abre el formulario;
- con una candidatura sin enviar, las tasas muestran «—».

## 9. Fuera de alcance

- Gráficos interactivos (tocar una barra para ver más) y filtrar por fechas.
- Exportar las estadísticas.

## 10. Criterios de aceptación

| Id        | Criterio                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| CA-113-01 | Con los datos de ejemplo, el panel muestra las mismas cifras que la web (CA-105-02 a CA-105-04 y CA-105-09). |
| CA-113-02 | Cada barra muestra su número y se anuncia como texto completo con VoiceOver y TalkBack.                      |
| CA-113-03 | Las candidaturas paradas abren su detalle.                                                                   |
| CA-113-04 | Sin candidaturas aparece el mensaje vacío; sin enviadas, las tasas muestran «—».                             |
| CA-113-05 | El panel se actualiza al volver a la pestaña y al deslizar para actualizar.                                  |
| CA-113-06 | En una tableta en horizontal se ve la distribución en dos columnas de la sección 3.                          |
| CA-113-07 | Todos los textos, porcentajes y fechas cambian al pasar a inglés, y con la letra al 200 % no se corta nada.  |

## 11. Notas de implementación

- **Resumen accesible:** cada tarjeta se anuncia como una sola frase («Tasa de respuesta: 69 %. 9 de 13»).
- **Textos «Disponible pronto» eliminados** de los catálogos junto con `ComingSoonScreen`.
- **Tests:** `stats.test.tsx` comprueba las cifras de la demo con las mismas expectativas que la web (CA-105-02 a CA-105-04 y CA-105-09).
- **Pendiente de probar en un dispositivo:** CA-113-06 (tableta) y CA-113-07 (letra al 200 %).

## 12. Decisiones tomadas

1. **Barras dibujadas con `View`,** sin librería de gráficos, por la misma razón que en la web y para no añadir módulos nativos que Expo Go no incluya.
2. **Resumen en 2 × 2 en el teléfono,** para que las cuatro cifras se vean sin desplazarse.
3. **Se elimina `ComingSoonScreen`,** que deja de usarse.
