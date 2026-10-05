# 101 · Cambio de estado

| Campo      | Valor                                           |
| ---------- | ----------------------------------------------- |
| Estado     | Aprobado                                        |
| Versión    | 0.1                                             |
| Fecha      | 2026-10-05                                      |
| Requisitos | RF-05 de [000-producto](000-producto.md)        |
| Hito       | M2 (núcleo e interfaz web); la app móvil, en M4 |

## 1. Objetivo

Mover una candidatura por su proceso (de «Aplicada» a «Primer contacto», de «Entrevistas» a «Oferta»…) guardando un historial que no se puede editar. Se puede hacer desde dos sitios:

- la **pantalla de detalle**, que además muestra todos los datos y el historial;
- el **tablero**, arrastrando la tarjeta o con su menú «Mover a…».

## 2. Reglas de dominio

### 2.1 Tabla de transiciones

Es la de [000-producto](000-producto.md), sección 5.2, y vive en `core` como datos (`ALLOWED_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]>`):

| Desde                               | Puede pasar a                                                       |
| ----------------------------------- | ------------------------------------------------------------------- |
| `wishlist`                          | `applied`, `withdrawn`                                              |
| `applied`                           | `screening`, `interviewing`, `rejected`, `withdrawn`, `no_response` |
| `screening`                         | `interviewing`, `offer`, `rejected`, `withdrawn`, `no_response`     |
| `interviewing`                      | `offer`, `rejected`, `withdrawn`, `no_response`                     |
| `offer`                             | `accepted`, `rejected`, `withdrawn`                                 |
| `no_response`                       | `screening`, `interviewing`, `rejected`                             |
| `accepted`, `rejected`, `withdrawn` | Ninguno (estados finales)                                           |

- Pasar al **mismo estado** no es una transición: se trata como no permitida.
- Funciones puras: `allowedTransitions(status)` y `canTransition(from, to)`.

### 2.2 `application.changeStatus(to, at, note?)`

Devuelve `Result<void, DomainError>`.

1. Si `canTransition(status, to)` es falso → `INVALID_STATUS_TRANSITION` con `meta: { from, to }`. No cambia nada.
2. La nota es opcional: se quitan los espacios del principio y del final, y vacía equivale a ausente. Máximo **500 caracteres** → `FIELD_TOO_LONG` (`field: "note"`, `meta.max`).
3. Si es válida:
   - `status = to`;
   - se añade al historial `{ from, to, changedAt: at, note? }`;
   - `updatedAt = at`;
   - si `to` es `applied` y no hay `appliedAt`, se rellena con el día de `at` (regla de 000, 5.2).

### 2.3 Caso de uso `ChangeApplicationStatus`

Entrada: `{ id: string; to: string; note?: string }`. Salida: `Result<ApplicationSnapshot, ApplicationUseCaseError>`.

1. Sin usuario → `UNAUTHENTICATED`.
2. `to` no es un estado conocido → `VALIDATION_FAILED` con `INVALID_OPTION` en `to`.
3. No existe o es de otra persona → `APPLICATION_NOT_FOUND`.
4. `changeStatus` falla:
   - por la transición → `{ code: "INVALID_STATUS_TRANSITION", from, to }`;
   - por la nota → `VALIDATION_FAILED`.
5. Guarda y devuelve el snapshot.

`ApplicationUseCaseError` y `USE_CASE_ERROR_CODES` incorporan `INVALID_STATUS_TRANSITION`.

### 2.4 Fuera de alcance

- **Deshacer un cambio.** El historial solo crece. Para corregir un error se hace otro cambio si la tabla lo permite.
- Editar o borrar entradas del historial.
- Cambios de estado automáticos (por ejemplo, pasar a `no_response` tras X días).

## 3. Pantalla de detalle

Ruta `/applications/:id`. Sustituye a la redirección provisional al formulario de edición.

- Es una **página completa**, como el formulario (spec 100, 8.1). **Cambia [003-responsive](003-responsive.md)**, que proponía un panel lateral desde `md`.

### 3.1 Contenido

| Bloque    | Contenido                                                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabecera  | Empresa (título), puesto, estado actual, indicador «Parada» si procede. Acciones: «Editar» (spec 100) y «Cambiar estado».                                                                                                                                 |
| Datos     | Modalidad, fuente, ubicación, URL de la oferta (enlace externo, se abre en otra pestaña con `rel="noopener noreferrer"` y lo indica en el texto accesible), salario formateado, fecha de candidatura, etiquetas y notas. Los datos vacíos no se muestran. |
| Historial | Lista de cambios, **el más reciente primero**. Cada entrada: «De X a Y» (la primera, solo «Creada en X»), fecha relativa con la fecha completa en un `<time datetime>`, y la nota si la hay.                                                              |

### 3.2 Cambiar estado

- El botón «Cambiar estado» abre un panel en la misma página (no un modal) con:
  - un grupo de opciones (`radio`) **solo con los estados permitidos** desde el actual;
  - una nota opcional (`textarea`, contador «0 / 500»);
  - «Guardar cambio» y «Cancelar».
- En un estado final (`accepted`, `rejected`, `withdrawn`), en lugar del botón aparece el texto «Estado final: no admite más cambios».
- Al guardar: se actualizan la cabecera y el historial sin recargar, se cierra el panel, el foco vuelve al botón «Cambiar estado» y aparece el aviso «Estado cambiado a Y».

### 3.3 Distribución

| Ancho  | Distribución                                                           |
| ------ | ---------------------------------------------------------------------- |
| < `lg` | Una columna: cabecera, datos e historial.                              |
| ≥ `lg` | Dos columnas: cabecera y datos a la izquierda, historial a la derecha. |

## 4. Tablero

### 4.1 Menú «Mover a…» (todos los anchos y todos los dispositivos)

- Cada tarjeta tiene un botón de menú (`aria-haspopup="menu"`, nombre accesible «Mover Empresa a…»). Al pulsarlo se abre una lista con los estados permitidos.
- Funciona por completo con teclado: flechas para recorrer las opciones, `Intro` para elegir, `Escape` para cerrar y devolver el foco al botón.
- En un estado final, el botón no aparece.
- Es la alternativa a arrastrar que exige RF-05 y la única forma de mover en pantallas táctiles.

### 4.2 Arrastrar y soltar (≥ `md` con puntero preciso)

- Solo con `@media (pointer: fine)` y a partir de `md`. Se usa la API nativa de arrastrar y soltar de HTML; no hace falta ninguna librería.
- **Durante el arrastre:** las columnas a las que se puede soltar se resaltan y las demás se atenúan. El texto «Suelta para mover a Y» aparece en la columna bajo el cursor.
- **Al soltar en una columna permitida:** se cambia el estado y la tarjeta queda en su nueva columna.
- **Al soltar en una columna no permitida:** la tarjeta vuelve a su sitio y un aviso explica «No se puede pasar de X a Y».
- **Columna «Cerradas»:** agrupa cuatro estados, así que al soltar se pregunta cuál, con solo los estados cerrados permitidos desde el actual. Si solo hay uno permitido, se aplica directamente.
- Los cambios hechos desde el tablero **no llevan nota**. La nota se puede añadir cambiando el estado desde el detalle.

### 4.3 Avisos

Cada cambio (desde menú o arrastre) muestra el aviso «Estado cambiado a Y» y lo anuncia a los lectores de pantalla. Los rechazos se anuncian con `role="alert"`.

## 5. Textos nuevos

Ejemplos de claves (lista completa al implementar):

| Clave                              | ES                                      | EN                                                  |
| ---------------------------------- | --------------------------------------- | --------------------------------------------------- |
| `errors.INVALID_STATUS_TRANSITION` | No se puede pasar de «{from}» a «{to}». | It is not possible to move from “{from}” to “{to}”. |
| `detail.changeStatus`              | Cambiar estado                          | Change status                                       |
| `detail.finalStatus`               | Estado final: no admite más cambios.    | Final status: no further changes.                   |
| `detail.historyCreated`            | Creada en «{to}»                        | Created as “{to}”                                   |
| `detail.historyChange`             | De «{from}» a «{to}»                    | From “{from}” to “{to}”                             |
| `board.moveTo`                     | Mover {company} a…                      | Move {company} to…                                  |
| `board.dropHere`                   | Suelta para mover a «{to}»              | Drop to move to “{to}”                              |
| `board.statusChanged`              | Estado cambiado a «{to}»                | Status changed to “{to}”                            |

`{from}` y `{to}` se pasan ya traducidos (`t("status.x")`), nunca como códigos.

## 6. App móvil (M4)

Detalle con la misma información y cambio de estado con una hoja inferior. En el tablero no se arrastra: se usa el menú «Mover a…».

## 7. Criterios de aceptación

### Núcleo

| Id        | Criterio                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CA-101-01 | Para las 81 combinaciones de estados, `canTransition` coincide con la tabla 2.1 (incluido «mismo estado = no permitido»).               |
| CA-101-02 | Un cambio válido actualiza `status` y `updatedAt` y añade una entrada al historial con `from`, `to`, `changedAt` y la nota normalizada. |
| CA-101-03 | Un cambio no permitido devuelve `INVALID_STATUS_TRANSITION` con `from` y `to`, y no guarda nada.                                        |
| CA-101-04 | Pasar de `wishlist` a `applied` sin `appliedAt` la rellena con el día del cambio; si ya tenía fecha, la conserva.                       |
| CA-101-05 | Una nota de más de 500 caracteres devuelve `VALIDATION_FAILED` con `FIELD_TOO_LONG` en `note`.                                          |
| CA-101-06 | Un estado desconocido devuelve `INVALID_OPTION`; sin sesión, `UNAUTHENTICATED`; con un id ajeno o inexistente, `APPLICATION_NOT_FOUND`. |
| CA-101-07 | Los historiales de los datos de ejemplo respetan la tabla de transiciones (completa CA-103-06).                                         |

### Web

| Id        | Criterio                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| CA-101-08 | El detalle muestra los datos guardados y el historial del más reciente al más antiguo, con sus notas.                           |
| CA-101-09 | Desde el detalle solo se ofrecen los estados permitidos; en un estado final no hay forma de cambiarlo.                          |
| CA-101-10 | Cambiar el estado con nota desde el detalle actualiza la cabecera y el historial, devuelve el foco al botón y muestra el aviso. |
| CA-101-11 | El menú «Mover a…» del tablero se puede usar solo con teclado y mueve la tarjeta a su nueva columna.                            |
| CA-101-12 | Arrastrar a una columna permitida mueve la tarjeta; a una no permitida, la devuelve y anuncia el motivo.                        |
| CA-101-13 | Soltar en «Cerradas» pregunta el estado si hay más de uno posible.                                                              |
| CA-101-14 | Con puntero táctil (`pointer: coarse`) o por debajo de `md` las tarjetas no se pueden arrastrar, pero el menú sí funciona.      |
| CA-101-15 | Las tarjetas y las filas de la lista llevan al detalle, y «Editar» lleva al formulario.                                         |
| CA-101-16 | Todos los textos nuevos, incluidos los nombres de estado dentro de los mensajes, cambian al pasar a inglés.                     |
| CA-101-17 | A 360, 768, 1280 y 1920 px no hay scroll horizontal y el detalle se distribuye como en 3.3.                                     |
