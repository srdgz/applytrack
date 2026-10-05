# 107 · Notificaciones (toasts)

| Campo      | Valor                                           |
| ---------- | ----------------------------------------------- |
| Estado     | Aprobado                                        |
| Versión    | 0.2                                             |
| Fecha      | 2026-10-05                                      |
| Requisitos | Transversal: lo usan RF-02 a RF-05 y RF-09      |
| Hito       | M2 (lógica compartida y web) y componente móvil |

## 0. Cambios respecto a la versión 0.1

- **Estilo inspirado en [Sileo](https://sileo.aaryan.design)**: píldora oscura que se transforma en tarjeta, con animación de muelle.
- **Siete tipos** en lugar de tres: `success`, `error`, `warning`, `info`, `action`, `icon` y `promise`.
- **Título y descripción** en lugar de un único mensaje.
- **Posición arriba**: arriba a la derecha en la web y arriba en la app.
- Se **revisa la regla «sin acciones dentro del aviso»** (sección 3.3).

Sileo no se usa como dependencia: es solo para React DOM y la web es Vue. Se **imita su diseño** sobre la cola compartida que ya existe, para que web y app se comporten igual.

## 1. Objetivo

Avisos breves y vistosos, iguales en la web y en la app, que confirmen acciones, adviertan, informen de errores y acompañen operaciones que tardan.

## 2. Aspecto (referencia: Sileo)

### 2.1 Forma

- **Píldora:** rectángulo oscuro (`#1a1a1a`) de esquinas redondeadas (16 px) con un **distintivo** circular (icono del color del tipo sobre ese mismo color al 20 %) y el **título** en el color del tipo.
- **Cuerpo:** al expandirse, la píldora se funde con una tarjeta del mismo color, más ancha (unos 350 px), que muestra la **descripción** en blanco al 50 % y, si lo hay, el **botón de acción**.
- **Transformación:** en la web, la píldora y el cuerpo son dos formas SVG fusionadas con un filtro «gooey» (desenfoque más umbral de opacidad), igual que Sileo; así parece una sola forma que crece. En la app se aproxima con un contenedor que anima su altura y su ancho con muelle (sección 6).
- Mismo color oscuro en tema claro y oscuro. En tema oscuro se añade un borde sutil (blanco al 10 %) para separarlo del fondo.

### 2.2 Colores por tipo

| Tipo                 | Color                                 | Valor                      | Icono por defecto       |
| -------------------- | ------------------------------------- | -------------------------- | ----------------------- |
| `success`            | Verde                                 | `oklch(72.3% 0.219 142.1)` | Check                   |
| `error`              | Rojo                                  | `oklch(63.7% 0.237 25.3)`  | Cruz                    |
| `warning`            | Amarillo                              | `oklch(79.5% 0.184 86)`    | Círculo con exclamación |
| `info`               | Azul                                  | `oklch(62.3% 0.214 259.8)` | Círculo con «i»         |
| `action`             | Azul                                  | `oklch(62.3% 0.214 259.8)` | Círculo con «i»         |
| `icon`               | El que se indique (por defecto, azul) | —                          | El que se indique       |
| `promise` (cargando) | Gris                                  | `oklch(55.6% 0 0)`         | Indicador giratorio     |

Contrastes sobre `#1a1a1a`: todos los títulos superan 4,5:1 y la descripción (blanco al 50 %) unos 5,4:1 (WCAG AA).

### 2.3 Ciclo de vida

1. **Entra** como píldora (escala y opacidad con muelle).
2. Si tiene descripción o acción, **se expande** a los ~300 ms.
3. Permanece expandido; poco antes de cerrarse **se contrae** de nuevo a píldora.
4. **Sale** (opacidad y escala).

- Pasar el ratón por encima, darle el foco o pulsarlo (app) lo **expande y pausa** el tiempo.
- Con «reducir movimiento», todo cambia sin animación.

## 3. Tipos y comportamiento

### 3.1 Tabla

| Tipo      | Uso                                                                                 | Rol ARIA                | Se cierra solo     |
| --------- | ----------------------------------------------------------------------------------- | ----------------------- | ------------------ |
| `success` | Una acción ha salido bien                                                           | `status`                | Sí, a los 6 s      |
| `info`    | Información neutra                                                                  | `status`                | Sí, a los 6 s      |
| `icon`    | Información con un icono propio                                                     | `status`                | Sí, a los 6 s      |
| `warning` | Algo que conviene saber, sin ser un fallo (p. ej., una regla que impide una acción) | `alert`                 | Sí, a los 8 s      |
| `error`   | Algo no se ha podido hacer                                                          | `alert`                 | **No**             |
| `action`  | Aviso con un botón (p. ej., «Deshacer»)                                             | `status`                | **No**             |
| `promise` | Operación en curso que acaba en `success` o `error`                                 | `status` mientras carga | Según el resultado |

### 3.2 Promesas

- `toast.promise(promesa, { loading, success, error })`: muestra el aviso de carga (no se cierra solo) y, cuando la promesa termina, **se transforma** en el mismo aviso (sin crear otro) en `success` o `error`, con su título y descripción.
- El cambio se anuncia a los lectores de pantalla con el nuevo contenido.
- Si la promesa tarda menos de 300 ms, se muestra directamente el resultado, para evitar un parpadeo.

### 3.3 Avisos con acción (revisión de la regla de la 0.1)

La versión 0.1 prohibía botones dentro de los avisos porque un control que desaparece solo es difícil de alcanzar con teclado o lector de pantalla (WCAG 2.2.1). Para poder usar el tipo `action` sin ese problema:

- Un aviso `action` **no se cierra solo**: se queda hasta que se pulsa su botón o se cierra.
- Se puede alcanzar con el teclado: el aviso está en el orden de tabulación justo después del contenido principal, y el atajo `Alt+T` lleva el foco al aviso más reciente que tenga acción.
- La acción **nunca es la única forma** de hacer algo: tiene que existir también en la pantalla (por ejemplo, «Desarchivar» en el aviso permanente del detalle, spec 106).

### 3.4 Reglas que se mantienen de la 0.1

- Máximo **3** visibles; el cuarto expulsa al más antiguo que se cierra solo o, si no hay, al más antiguo.
- Un aviso repetido (mismo tipo y título) no se duplica: reinicia su tiempo.
- Todos tienen botón de cerrar («Cerrar aviso»). A diferencia de Sileo, que no lo tiene, aquí se muestra al expandirse y siempre está disponible para teclado y lectores de pantalla. `Escape` cierra el aviso con el foco.
- El foco no se mueve solo al aparecer un aviso.
- Cada aviso lleva el tipo como texto oculto antes del título («Hecho:», «Error:»…), además del icono y el color.

## 4. Lógica compartida: `packages/notifications`

Se amplía el modelo:

```ts
type ToastKind = "success" | "info" | "warning" | "error" | "action" | "icon" | "loading";

interface ToastContent {
  title: string;
  description?: string;
  icon?: ToastIconName;
  action?: { label: string; onPress: () => void };
}

interface Toast extends ToastContent {
  id: string;
  kind: ToastKind;
}

interface ToastQueue {
  show(kind: ToastKind, content: ToastContent): string;
  update(id: string, kind: ToastKind, content: ToastContent): void;
  promise<T>(task: Promise<T>, messages: PromiseMessages<T>): Promise<T>;
  dismiss(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
  clear(): void;
  subscribe(listener: (toasts: readonly Toast[]) => void): () => void;
}
```

- `ToastIconName` es una lista cerrada de nombres (`check`, `x`, `alert`, `info`, `loader`, `rocket`, `sparkles`, `archive`, `trash`, `refresh`), y cada plataforma tiene su dibujo para cada nombre.
- Duraciones por tipo según la tabla 3.1. `loading` nunca se cierra solo.
- La expansión y la contracción son de presentación: viven en cada plataforma, no en la cola.

## 5. Web

- **Posición:** arriba a la derecha (`top-right`), a 16 px de los bordes y por encima de la cabecera. Por debajo de `md`, arriba y a todo el ancho menos el margen. El más reciente, arriba.
- **Implementación:**
  - el SVG con el filtro «gooey» y las dos formas, como Sileo;
  - las animaciones de muelle se hacen con transiciones CSS y la función de aceleración `linear()`, que imita un muelle sin librerías, para no aumentar el bundle;
  - el texto (título, descripción, botones) va en HTML encima del SVG, para que sea accesible y seleccionable.
- **Regiones vivas:** como en la 0.1, una `status` y una `alert` presentes desde el principio.

### 5.1 Usos en la web

| Situación                                             | Tipo                | Título                                                          | Descripción                                       |
| ----------------------------------------------------- | ------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Empezar la demo                                       | `icon` (`sparkles`) | Modo demo activado                                              | Los datos solo se guardan en este dispositivo.    |
| Candidatura creada                                    | `success`           | Candidatura guardada                                            | {empresa} · {puesto}                              |
| Candidatura editada                                   | `success`           | Cambios guardados                                               | {empresa}                                         |
| Estado cambiado                                       | `success`           | Estado actualizado                                              | {empresa} pasa a «{estado}».                      |
| Transición no permitida (arrastre)                    | `warning`           | Movimiento no permitido                                         | No se puede pasar de «{origen}» a «{destino}».    |
| Archivar                                              | `action`            | Candidatura archivada                                           | Ya no aparece en el tablero. · Acción: «Deshacer» |
| Desarchivar                                           | `success`           | Candidatura desarchivada                                        | —                                                 |
| Eliminar                                              | `success`           | Candidatura eliminada                                           | {empresa}                                         |
| Restaurar datos de ejemplo                            | `promise`           | Cargando: «Restaurando datos…» → «Datos de ejemplo restaurados» | —                                                 |
| Error al guardar, cambiar estado, archivar o eliminar | `error`             | No se ha podido completar                                       | Mensaje del error                                 |

## 6. App móvil

- **Posición:** arriba, por debajo de la barra de estado (área segura superior) y centrado, con el más reciente arriba.
- **Forma y animación:**
  - un único contenedor `#1a1a1a` que anima su ancho (de píldora a tarjeta) y su altura con `Animated.spring`;
  - sin filtro «gooey», que React Native no permite, el resultado es una transformación de tamaño, muy parecida a la vista;
  - todo con componentes incluidos en Expo Go (ADR-0006).
- **Interacción:** tocar el aviso lo expande o lo contrae; mantenerlo pulsado lo pausa; deslizarlo hacia arriba lo cierra.
- **Accesibilidad:** `announceForAccessibility` con tipo, título y descripción; `accessibilityLiveRegion` según el rol; la acción y el cierre son botones con su nombre.
- **Pantalla provisional:** un botón por tipo (los siete) para verlos en Expo Go.

## 7. Textos nuevos

Las claves de la 0.1 (`toast.close`, `toast.region` y los nombres de tipo) se amplían con `toast.warning`, `toast.action`, `toast.loading`, y las claves de títulos y descripciones de la tabla 5.1 (`notify.*`), en español e inglés.

## 8. Criterios de aceptación

### Lógica compartida

| Id        | Criterio                                                                                                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-107-01 | Cada tipo se cierra solo según la tabla 3.1 (`error`, `action` y `loading` nunca).                                                                                                                         |
| CA-107-02 | Máximo 3 visibles con la regla de expulsión de 3.4.                                                                                                                                                        |
| CA-107-03 | Un aviso repetido (mismo tipo y título) no se duplica y reinicia su tiempo.                                                                                                                                |
| CA-107-04 | `pause` y `resume` conservan el tiempo restante.                                                                                                                                                           |
| CA-107-05 | `update` cambia tipo y contenido del mismo aviso y reinicia su tiempo según el nuevo tipo.                                                                                                                 |
| CA-107-06 | `promise` muestra `loading` y lo transforma en `success` o `error` con el mismo `id`; si termina en menos de 300 ms, muestra solo el resultado. Devuelve el valor o rechaza igual que la promesa original. |
| CA-107-07 | `pnpm depcruise`: `notifications` no depende de nada y `core` no lo importa.                                                                                                                               |

### Web

| Id        | Criterio                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| CA-107-08 | Los avisos aparecen arriba a la derecha (≥ `md`) o arriba a todo el ancho (< `md`), sin scroll horizontal.                   |
| CA-107-09 | Cada tipo muestra su color, icono y título; la descripción aparece al expandirse; con «reducir movimiento» no hay animación. |
| CA-107-10 | Ratón encima o foco dentro: se expande y se pausa. `Escape` cierra.                                                          |
| CA-107-11 | El aviso `action` de archivar no se cierra solo, su botón «Deshacer» desarchiva y se alcanza con `Alt+T`.                    |
| CA-107-12 | Restaurar los datos de ejemplo muestra el aviso de carga y se transforma en éxito.                                           |
| CA-107-13 | Todos los usos de la tabla 5.1 muestran el tipo, título y descripción indicados, en español y en inglés.                     |

### App móvil

| Id        | Criterio                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| CA-107-14 | El `ToastHost` muestra los siete tipos arriba, por debajo del área segura, con su color e icono (tests con React Native Testing Library). |
| CA-107-15 | Tocar expande o contrae, mantener pausa, deslizar hacia arriba cierra, y la acción ejecuta su función.                                    |
| CA-107-16 | Desde la pantalla provisional se puede lanzar cada tipo y se ve en Expo Go.                                                               |
