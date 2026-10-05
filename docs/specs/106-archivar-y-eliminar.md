# 106 · Archivar y eliminar

| Campo      | Valor                                           |
| ---------- | ----------------------------------------------- |
| Estado     | Aprobado                                        |
| Versión    | 0.1                                             |
| Fecha      | 2026-10-05                                      |
| Requisitos | RF-04 de [000-producto](000-producto.md)        |
| Hito       | M2 (núcleo e interfaz web); la app móvil, en M4 |

## 1. Objetivo

Quitar de la vista las candidaturas que ya no interesan sin perder su historia (**archivar**) y borrar las que no deberían existir, como un duplicado o una prueba (**eliminar**).

|                              | Archivar                                                  | Eliminar |
| ---------------------------- | --------------------------------------------------------- | -------- |
| ¿Se puede deshacer?          | Sí, desarchivando                                         | No       |
| ¿Sigue en las estadísticas?  | Sí (spec 105)                                             | No       |
| ¿Aparece en tablero y lista? | Solo con el filtro «Solo archivadas» o «Todas» (spec 102) | No       |
| Confirmación                 | No hace falta                                             | Siempre  |

## 2. Núcleo

### 2.1 Entidad

- `application.archive()` y `application.unarchive()` cambian `archived` y devuelven `true` si había algo que cambiar, o `false` si ya estaba en ese estado.
- **No modifican `updatedAt` ni el historial.** Archivar no es un avance del proceso, así que no debe hacer que una candidatura «parada» parezca reciente al desarchivarla.
- Archivar no impide nada más: una candidatura archivada se puede editar y cambiar de estado.

### 2.2 Puerto

`ApplicationRepository` añade:

```ts
delete(owner: UserId, id: ApplicationId): Promise<void>;
```

- Si el id no existe o es de otra persona, no hace nada y no falla. La comprobación de existencia la hace el caso de uso.
- La suite de contrato se amplía: lo eliminado ya no se encuentra ni aparece en `search` ni en `listTags`, y eliminar con otro `owner` no borra nada.

### 2.3 Casos de uso

| Caso de uso            | Entrada  | Salida                           | Comportamiento                                                              |
| ---------------------- | -------- | -------------------------------- | --------------------------------------------------------------------------- |
| `ArchiveApplication`   | `{ id }` | `Result<ApplicationSnapshot, …>` | Archiva y guarda. Si ya estaba archivada, devuelve el snapshot sin guardar. |
| `UnarchiveApplication` | `{ id }` | `Result<ApplicationSnapshot, …>` | Lo contrario.                                                               |
| `DeleteApplication`    | `{ id }` | `Result<void, …>`                | Comprueba que existe y es de la persona usuaria, y la elimina.              |

Errores comunes: `UNAUTHENTICATED` sin sesión y `APPLICATION_NOT_FOUND` si no existe o es de otra persona.

## 3. Interfaz web

### 3.1 Dónde están las acciones

En la **pantalla de detalle** (spec 101), en una fila de acciones secundarias bajo «Cambiar estado» y «Editar»:

- «Archivar» o «Desarchivar», según el caso.
- «Eliminar», con estilo de acción peligrosa (texto en rojo, nunca como botón principal).

No se añaden al menú de las tarjetas del tablero, que sigue siendo solo para mover. Queda como posible mejora.

### 3.2 Archivar y desarchivar

- **Sin confirmación,** porque se puede deshacer.
- Al archivar:
  - el detalle muestra un aviso permanente bajo la cabecera, «Esta candidatura está archivada: no aparece en el tablero ni en la lista», con el botón «Desarchivar»;
  - aparece el aviso breve «Candidatura archivada»;
  - el foco pasa al botón «Desarchivar» del aviso, para poder deshacer en el momento.
- Al desarchivar: el aviso desaparece, aparece «Candidatura desarchivada» y el foco vuelve al botón «Archivar».
- Se elige un aviso permanente en el detalle y no un «Deshacer» dentro del mensaje temporal. Un botón que desaparece solo a los pocos segundos es difícil de usar con teclado o lector de pantalla (WCAG 2.2.1).

### 3.3 Eliminar

- «Eliminar» abre un **diálogo modal** (`<dialog>` con `showModal`, que atrapa el foco y se cierra con `Escape`):
  - título: «¿Eliminar la candidatura de {empresa}?»;
  - texto: «Se borrarán sus datos y su historial. Esta acción no se puede deshacer.»;
  - botones: «Cancelar» y «Eliminar definitivamente» (estilo peligroso);
  - **el foco empieza en «Cancelar»,** para que pulsar `Intro` sin pensar no borre nada.
- Al confirmar:
  - se navega al tablero con `router.replace`, para que «atrás» no lleve a una candidatura que ya no existe;
  - aparece el aviso «Candidatura eliminada».
- Si falla (por ejemplo, ya no existe porque se borró en otra pestaña): el diálogo se cierra, se informa con `role="alert"` y se ofrece volver al tablero.

### 3.4 Marca de archivada en tablero y lista

Cuando el filtro muestra archivadas («Solo archivadas» o «Todas»), cada tarjeta y cada fila de la lista llevan la etiqueta «Archivada», con texto y no solo con color o icono.

### 3.5 Textos nuevos

Ejemplos (lista completa al implementar):

| Clave                                 | ES                                                                        | EN                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `detail.archive` / `detail.unarchive` | Archivar / Desarchivar                                                    | Archive / Unarchive                                                           |
| `detail.archivedNotice`               | Esta candidatura está archivada: no aparece en el tablero ni en la lista. | This application is archived: it does not appear on the board or in the list. |
| `detail.delete`                       | Eliminar                                                                  | Delete                                                                        |
| `detail.deleteTitle`                  | ¿Eliminar la candidatura de {company}?                                    | Delete the application for {company}?                                         |
| `detail.deleteWarning`                | Se borrarán sus datos y su historial. Esta acción no se puede deshacer.   | Its details and history will be deleted. This cannot be undone.               |
| `detail.deleteConfirm`                | Eliminar definitivamente                                                  | Delete permanently                                                            |
| `card.archived`                       | Archivada                                                                 | Archived                                                                      |

## 4. App móvil (M4)

Mismas acciones en el detalle. Eliminar se confirma con el diálogo nativo del sistema (`Alert` con botón destructivo).

## 5. Criterios de aceptación

### Núcleo

| Id        | Criterio                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-106-01 | Archivar marca `archived`, guarda y no cambia `updatedAt` ni el historial; archivar dos veces no vuelve a guardar.                                 |
| CA-106-02 | Desarchivar hace lo contrario con las mismas garantías.                                                                                            |
| CA-106-03 | Eliminar borra la candidatura: `findById` devuelve `null`, y deja de aparecer en `search` y en `listTags`.                                         |
| CA-106-04 | Los tres casos de uso devuelven `APPLICATION_NOT_FOUND` con un id inexistente o ajeno (sin borrar ni cambiar nada) y `UNAUTHENTICATED` sin sesión. |
| CA-106-05 | El repositorio en memoria y `LocalApplicationRepository` pasan la suite de contrato ampliada.                                                      |

### Web

| Id        | Criterio                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| CA-106-06 | Archivar desde el detalle muestra el aviso permanente, mueve el foco a «Desarchivar» y la candidatura desaparece del tablero. |
| CA-106-07 | Desarchivar quita el aviso y la candidatura vuelve al tablero en su columna.                                                  |
| CA-106-08 | Con el filtro «Solo archivadas», tarjetas y filas muestran la etiqueta «Archivada».                                           |
| CA-106-09 | «Eliminar» abre el diálogo con el foco en «Cancelar»; cancelar o pulsar `Escape` no borra nada.                               |
| CA-106-10 | Confirmar elimina, lleva al tablero sin dejar el detalle en el historial y muestra «Candidatura eliminada».                   |
| CA-106-11 | Una candidatura eliminada deja de contar en las estadísticas; una archivada sigue contando.                                   |
| CA-106-12 | Todos los textos nuevos cambian al pasar a inglés, y a 360, 768, 1280 y 1920 px no hay scroll horizontal.                     |
