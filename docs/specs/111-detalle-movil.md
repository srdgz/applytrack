# 111 · Detalle, cambio de estado, archivar y eliminar en el móvil

| Campo      | Valor                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------- |
| Estado     | Aprobado                                                                                  |
| Versión    | 0.1                                                                                       |
| Fecha      | 2026-10-08                                                                                |
| Requisitos | RF-04 y RF-05 de [000-producto](000-producto.md)                                          |
| Hito       | M4 (la web se hizo en [101](101-cambio-de-estado.md) y [106](106-archivar-y-eliminar.md)) |

## 1. Objetivo

Sustituir la pantalla «Disponible pronto» de `/applications/[id]` por el detalle real de la candidatura, con las mismas acciones que en la web:

- ver sus datos y su historial;
- cambiar de estado, también directamente desde el tablero;
- archivar y desarchivar;
- eliminar.

Se usan los mismos casos de uso y reglas que en la web: `GetApplication`, `ChangeApplicationStatus`, `ArchiveApplication`, `UnarchiveApplication`, `DeleteApplication`, `allowedTransitions` e `isFinalStatus`. No hay cambios en `core`.

Editar la candidatura es la spec 112. Hasta entonces, «Editar» abre `/applications/[id]/edit` con «Disponible pronto».

## 2. Pantalla de detalle (`/applications/[id]`)

Es una pantalla de la pila raíz, por encima de las pestañas, con el botón «Volver» arriba. Si se llegó a ella sin pantalla anterior, «Volver» lleva al tablero.

### 2.1 Contenido

| Bloque    | Contenido                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabecera  | Empresa (título), puesto, estado actual e indicador «Parada» si procede.                                                                             |
| Acciones  | «Cambiar estado» (principal) y «Editar». Debajo, «Archivar» o «Desarchivar» y «Eliminar» (en rojo, nunca como botón principal).                      |
| Datos     | Modalidad, fuente, ubicación, enlace a la oferta, salario, fecha de candidatura, etiquetas y notas. Los datos vacíos no se muestran.                 |
| Historial | Cambios del más reciente al más antiguo. Cada entrada: «De X a Y» (la primera, «Creada en X»), fecha relativa y fecha completa, y la nota si la hay. |

- **Enlace a la oferta:** se abre en el navegador del sistema con `Linking.openURL`. Su nombre accesible indica que sale de la app.
- **Estado final** (`accepted`, `rejected` o `withdrawn`): en lugar de «Cambiar estado» se muestra «Estado final: no admite más cambios».
- **Distribución:** una columna en el teléfono. En una tableta en horizontal (≥ 768 dp), dos columnas: cabecera y datos a la izquierda, historial a la derecha, como en la web.

### 2.2 Estados de la pantalla

| Situación | Qué se ve                                                   |
| --------- | ----------------------------------------------------------- |
| Cargando  | Esqueleto de la cabecera, si tarda más de 200 ms.           |
| No existe | «No se ha encontrado la candidatura» y «Volver al tablero». |
| Error     | Mensaje genérico y «Reintentar».                            |

Al volver a la pantalla, por ejemplo después de editar, se recargan los datos.

## 3. Cambiar estado (`/applications/[id]/status`)

Pantalla modal, igual que los filtros:

- título «Cambiar estado» y el estado actual;
- opciones de tipo `radio` **solo con los estados permitidos** desde el actual;
- nota opcional, multilínea, con el contador «0 / 500»;
- «Guardar cambio», desactivado hasta elegir un estado, y «Cancelar».

Al guardar:

- se cierra la pantalla y se vuelve a la anterior (el detalle o el tablero), que se recarga;
- aparece el aviso «Estado actualizado» con «{empresa} pasa a «{estado}»».
- Si el caso de uso devuelve un error (la candidatura ya no existe o la transición dejó de estar permitida), se muestra el mensaje traducido y no se cierra.

## 4. Mover desde el tablero

- Cada tarjeta del tablero tiene un botón de 44 × 44 dp con tres puntos, a la derecha de la empresa. Su nombre accesible es «Mover {empresa} a…».
- Abre la misma pantalla de cambio de estado de la sección 3, así que desde el tablero también se puede añadir una nota (en la web, el tablero no la admite).
- En un estado final, el botón no aparece.
- **Alternativa:** mantener pulsada la tarjeta abre la misma pantalla.
- No hay arrastrar y soltar, como ya decía la spec 110.

## 5. Archivar y desarchivar

- **Sin confirmación,** porque se puede deshacer.
- Al archivar:
  - aparece bajo la cabecera un aviso permanente, «Esta candidatura está archivada: no aparece en el tablero ni en la lista», con el botón «Desarchivar»;
  - aparece el aviso «Candidatura archivada»;
  - el foco del lector de pantalla pasa al botón «Desarchivar».
- Al desarchivar desaparece el aviso permanente y aparece «Candidatura desarchivada».

## 6. Eliminar

- «Eliminar» abre el diálogo nativo (`Alert`):
  - título: «¿Eliminar la candidatura de {empresa}?»;
  - texto: «Se borrarán sus datos y su historial. Esta acción no se puede deshacer.»;
  - botones: «Cancelar» (`style: "cancel"`) y «Eliminar definitivamente» (`style: "destructive"`).
- Al confirmar:
  - se vuelve al tablero quitando el detalle de la pila (`router.dismissTo("/board")`), para que «atrás» no lleve a una candidatura que ya no existe;
  - aparece el aviso «Candidatura eliminada».
- Si falla, se muestra el error con `accessibilityRole="alert"` y se ofrece volver al tablero.

## 7. Textos

Se reutilizan los de la web (`detail`, `notify`, `status`, `source`, `workMode`, `form`). Se añaden solo los del móvil que falten, como «Cambiar estado de {empresa}» para el título de la pantalla modal.

## 8. Tests (Jest + RNTL)

Con la demo cargada:

- el detalle muestra los datos, oculta los vacíos y ordena el historial del más reciente al más antiguo, con sus notas;
- la pantalla de cambio de estado solo ofrece los estados permitidos;
- cambiar de estado con nota actualiza el detalle y el historial y muestra el aviso;
- en un estado final no se puede cambiar de estado;
- el botón de tres puntos de una tarjeta abre el cambio de estado y la tarjeta acaba en su nueva columna;
- archivar muestra el aviso permanente y la candidatura desaparece del tablero; desarchivar la devuelve;
- eliminar pide confirmación; cancelar no borra nada; confirmar vuelve al tablero sin la candidatura;
- un id que no existe muestra «No se ha encontrado la candidatura»;
- «Editar» abre su ruta.

## 9. Fuera de alcance

- Editar los datos de la candidatura (spec 112).
- Compartir la candidatura o la oferta con otras apps.
- Acciones al deslizar las tarjetas.

## 10. Criterios de aceptación

| Id        | Criterio                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| CA-111-01 | Las tarjetas del tablero y las filas de la lista abren el detalle real de la candidatura.                                         |
| CA-111-02 | El detalle muestra los datos guardados sin los vacíos y el historial del más reciente al más antiguo, con sus notas.              |
| CA-111-03 | La pantalla de cambio de estado solo ofrece las transiciones permitidas; en un estado final no hay forma de cambiarlo.            |
| CA-111-04 | Cambiar el estado, con o sin nota, actualiza el detalle, el historial, el tablero y la lista, y muestra el aviso.                 |
| CA-111-05 | Desde el tablero, el botón de tres puntos y la pulsación larga abren el cambio de estado, y la tarjeta acaba en la columna nueva. |
| CA-111-06 | Archivar muestra el aviso permanente con «Desarchivar» y saca la candidatura del tablero; desarchivar la devuelve a su columna.   |
| CA-111-07 | Eliminar pide confirmación; cancelar no borra nada y confirmar vuelve al tablero sin dejar el detalle en la pila.                 |
| CA-111-08 | Una candidatura que no existe muestra el mensaje y «Volver al tablero».                                                           |
| CA-111-09 | El enlace a la oferta se abre en el navegador del sistema.                                                                        |
| CA-111-10 | Todo funciona con VoiceOver y TalkBack, los textos nuevos están en español e inglés y con la letra al 200 % no se corta nada.     |

## 11. Decisiones tomadas

1. **Cambio de estado en una pantalla modal**, la misma desde el detalle y desde el tablero, en lugar del panel de la web. En un teléfono, un panel que se despliega dentro del detalle obliga a desplazarse mucho.
2. **Nota también desde el tablero:** al compartir pantalla con el detalle, sale gratis.
3. **Botón de tres puntos y pulsación larga** en las tarjetas, en lugar de arrastrar. El botón es la forma accesible; la pulsación larga es el atajo habitual en móvil.
4. **Diálogo nativo** para confirmar el borrado, como decía la spec 106.
5. **Aviso permanente para desarchivar,** y no un «Deshacer» en el aviso temporal, por la misma razón de accesibilidad que en la web.
