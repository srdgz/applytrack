# 112 · Crear y editar candidaturas en el móvil

| Campo      | Valor                                                           |
| ---------- | --------------------------------------------------------------- |
| Estado     | Aprobado                                                        |
| Versión    | 0.2                                                             |
| Fecha      | 2026-10-08                                                      |
| Requisitos | RF-02 y RF-03 de [000-producto](000-producto.md)                |
| Hito       | M4 (la web se hizo en [100](100-crear-y-editar-candidatura.md)) |

## 1. Objetivo

Sustituir las pantallas «Disponible pronto» de `/applications/new` y `/applications/[id]/edit` por el formulario real. Tiene los mismos campos, grupos y reglas que la web y usa los mismos casos de uso: `CreateApplication`, `UpdateApplicationDetails`, `ValidateApplicationDraft` y `GetApplication`. No hay cambios en `core`.

Con esta spec, la app móvil tiene todas las funciones de la web salvo las estadísticas (spec 113).

## 2. Lógica compartida

`apps/web/src/form/form-values.ts` no depende de Vue y el móvil necesita lo mismo, así que pasa a `@applytrack/presentation` como `form.ts`, con sus tests:

- `FormValues`;
- `emptyValues` y `valuesFromSnapshot`;
- `toDraft` y `toDetailsDraft`;
- `showsAppliedAt`, `groupOf` y `sameValues`.

La web la importa desde el paquete. Su `useApplicationForm`, que usa Vue, se queda en la web.

## 3. Pantallas

| Ruta                      | Pantalla           | Tras guardar                                    |
| ------------------------- | ------------------ | ----------------------------------------------- |
| `/applications/new`       | Nueva candidatura  | Vuelve a la pantalla anterior (tablero o lista) |
| `/applications/[id]/edit` | Editar candidatura | Vuelve al detalle                               |

- Son pantallas completas de la pila raíz, con «Volver» arriba, no modales: el formulario es largo y necesita su propio desplazamiento.
- **Editar:**
  - se carga la candidatura con `GetApplication`, con un esqueleto mientras tanto;
  - si no existe, se muestra «No se ha encontrado la candidatura» y «Volver al tablero»;
  - el estado se muestra como texto, con la nota «El estado se cambia desde el detalle de la candidatura».

## 4. Campos

Mismos grupos que la web, cada uno en una sección con su título:

| Grupo     | Campo                 | Control                                                                                                                                                                                                                                                                          |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oferta    | Empresa\*, Puesto\*   | Texto, con el máximo de caracteres del dominio.                                                                                                                                                                                                                                  |
|           | URL de la oferta      | Texto con `keyboardType="url"`.                                                                                                                                                                                                                                                  |
|           | Fuente\*, Modalidad\* | Fichas de tipo `radio`, como en los filtros (spec 110). Son 7 y 3 opciones: caben sin necesidad de un desplegable.                                                                                                                                                               |
|           | Ubicación             | Texto.                                                                                                                                                                                                                                                                           |
| Proceso   | Estado inicial\*      | Fichas «Me interesa» (preseleccionada) y «Aplicada». Solo al crear.                                                                                                                                                                                                              |
|           | Fecha de candidatura  | Botón con la fecha que abre el **selector de fecha nativo** (`@react-native-community/datetimepicker`, incluido en Expo Go), con hoy como máximo. Solo aparece si el estado no es «Me interesa»; al elegir «Aplicada» se rellena con hoy si está vacía. Al lado, «Quitar fecha». |
| Salario   | Mínimo, Máximo        | Texto con teclado numérico. Debajo, el rango formateado («35.000 € – 40.000 €») y la ayuda «Bruto anual».                                                                                                                                                                        |
|           | Moneda                | Fichas EUR, GBP y USD (EUR por defecto).                                                                                                                                                                                                                                         |
| Etiquetas | Etiquetas             | Campo de texto. La tecla de enviar o una coma añaden la etiqueta como ficha. Cada ficha tiene su botón «Quitar etiqueta X». Se muestra «3 de 10».                                                                                                                                |
| Notas     | Notas                 | Texto multilínea con contador «120 / 5.000».                                                                                                                                                                                                                                     |

- Los obligatorios llevan `*`, y arriba del formulario se explica: «Los campos con \* son obligatorios».
- El teclado no tapa el campo activo (`KeyboardAvoidingView`), y la tecla de siguiente salta al campo siguiente en los campos de texto.

## 5. Validación

Las mismas reglas y el mismo momento que en la web (100, 8.3):

- se valida con `ValidateApplicationDraft`;
- cada campo muestra su error al salir de él y, desde entonces, se revalida con cada cambio;
- al pulsar «Guardar» se muestran todos los errores;
- los errores de `salary.*` van bajo el grupo de salario y los de `tags.*` bajo las etiquetas, con la ficha afectada marcada;
- **al guardar con errores:** no se guarda nada, la pantalla se desplaza hasta el primer campo con error, el lector de pantalla se sitúa en él y se anuncia «Revisa los campos marcados».

## 6. Guardar, cancelar y salir

- **Barra inferior fija** con «Guardar» (principal) y «Cancelar», encima del área segura y del teclado.
- **Mientras se guarda,** «Guardar» queda ocupado y desactivado.
- **Al guardar** aparece el aviso «Candidatura guardada» (crear) o «Cambios guardados» (editar) y se vuelve según la tabla de la sección 3. Guardar sin cambios al editar vuelve sin modificar nada.
- **Cambios sin guardar:** si se intenta salir con cambios (con «Cancelar», con «Volver», con el gesto de volver de iOS o con el botón atrás de Android), se pide confirmación con un diálogo nativo con «Seguir editando» y «Descartar» (destructivo). Se usa `usePreventRemove` de React Navigation, que cubre todas esas formas de salir.
- **Error inesperado al guardar:** mensaje encima de la barra y se conservan los datos.

## 7. Textos

Se reutilizan los de la web (`form`, `application`, `errors`, `notify`). Solo se añaden los del móvil, como «Elegir fecha», «Quitar fecha», «Seguir editando» y «Descartar».

## 8. Tests

- **`presentation`:** los tests de `form-values` que hoy están en la web.
- **Móvil (Jest + RNTL):**
  - crear con los obligatorios añade la candidatura a «Me interesa» y muestra el aviso;
  - elegir «Aplicada» muestra la fecha con hoy, y volver a «Me interesa» la oculta;
  - guardar con errores no guarda y muestra cada error bajo su campo;
  - las etiquetas se añaden con la tecla de enviar y con coma, se quitan con su botón, y una repetida muestra el error;
  - el rango de salario se muestra formateado;
  - editar carga los valores, guarda los cambios y vuelve al detalle, que los muestra;
  - salir con cambios pide confirmación: «Seguir editando» se queda y «Descartar» sale; sin cambios no pregunta;
  - con un id que no existe se muestra el mensaje.

## 9. Fuera de alcance

- Autocompletar la empresa o las etiquetas con datos anteriores.
- Rellenar los datos a partir de la URL de la oferta.

## 10. Criterios de aceptación

| Id        | Criterio                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-112-01 | La web sigue pasando sus tests importando la lógica del formulario desde `@applytrack/presentation`.                                           |
| CA-112-02 | Crear con los campos obligatorios guarda la candidatura en «Me interesa», muestra «Candidatura guardada» y vuelve a la pantalla anterior.      |
| CA-112-03 | La fecha de candidatura aparece con hoy al elegir «Aplicada», usa el selector nativo, no admite fechas futuras y desaparece con «Me interesa». |
| CA-112-04 | Guardar con errores no guarda, muestra cada error bajo su campo, lleva al primero y lo anuncia.                                                |
| CA-112-05 | Las etiquetas se añaden con la tecla de enviar y con coma, se quitan con su botón y muestran «N de 10».                                        |
| CA-112-06 | Editar carga los valores, no permite cambiar el estado y, al guardar, el detalle muestra los cambios.                                          |
| CA-112-07 | Salir con cambios sin guardar, de cualquier forma, pide confirmación; sin cambios, no.                                                         |
| CA-112-08 | Con el teclado abierto, el campo activo y la barra de botones siguen a la vista.                                                               |
| CA-112-09 | Todo funciona con VoiceOver y TalkBack, los textos nuevos están en español e inglés y con la letra al 200 % no se corta nada.                  |

## 11. Notas de implementación

- **`usePreventRemove` de Expo Router:** Expo Router 57 incluye su propia copia de React Navigation, así que el hook se importa de `expo-router/react-navigation` y no de `@react-navigation/native`, que no encontraría el navegador.
- **Identificadores de foco:** `FOCUS_TARGETS` depende del DOM y se queda en la web (`apps/web/src/form/focus-targets.ts`); el resto de `form-values` pasa a `presentation/src/form.ts`.
- **Primer error:** al guardar con errores, la pantalla se desplaza a la sección del primer error. Si es un campo de texto, recibe el foco; si es un grupo de fichas o la fecha, el lector de pantalla se sitúa en él.
- **Fecha:** en Android se abre el diálogo nativo con `DateTimePickerAndroid.open`; en iOS, el calendario en línea bajo el botón.
- **`PendingScreen` eliminada:** ya no queda ninguna pantalla «Disponible pronto» salvo la pestaña de Estadísticas (spec 113).
- **Pendiente de probar en un dispositivo:** CA-112-03 (selector nativo), CA-112-08 (teclado) y CA-112-09 (VoiceOver, TalkBack y letra al 200 %).

## 12. Decisiones tomadas

1. **Lógica del formulario en `presentation`**, como los filtros en la spec 110, en lugar de copiarla.
2. **Fichas en lugar de desplegables** para fuente, modalidad, moneda y estado inicial: tienen pocas opciones, se ven todas de un vistazo y no necesitan otra pantalla.
3. **Selector de fecha nativo** con `@react-native-community/datetimepicker`, que viene en Expo Go.
4. **Pantallas completas y no modales**, porque el formulario es largo y la confirmación al salir es más fiable en una pantalla de la pila.
5. **`usePreventRemove`** para la confirmación, porque cubre a la vez el botón, el gesto de iOS y el botón atrás de Android.
