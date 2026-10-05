# 107 · Notificaciones (toasts)

| Campo      | Valor                                                  |
| ---------- | ------------------------------------------------------ |
| Estado     | Aprobado                                               |
| Versión    | 0.1                                                    |
| Fecha      | 2026-10-05                                             |
| Requisitos | Transversal: lo usan RF-02 a RF-05 y RF-09             |
| Hito       | M2 (lógica compartida y web); app móvil, ver sección 7 |

## 1. Objetivo

Un sistema de avisos breves (toasts) **igual en la web y en la app**, que sustituya al aviso sencillo actual de la web (un único mensaje, sin botón de cerrar y sin distinguir éxitos de errores).

Sirve para confirmar acciones («Candidatura guardada») y para informar de errores que no pertenecen a un campo concreto («No se puede pasar de X a Y»).

## 2. Tipos

| Tipo      | Uso                        | Rol ARIA            | Se cierra solo              |
| --------- | -------------------------- | ------------------- | --------------------------- |
| `success` | Una acción ha salido bien  | `status` (educado)  | Sí, a los 5 s               |
| `info`    | Información neutra         | `status` (educado)  | Sí, a los 5 s               |
| `error`   | Algo no se ha podido hacer | `alert` (inmediato) | **No**: hasta que se cierra |

- Cada tipo tiene **icono y color propios, y además texto**: el tipo nunca se comunica solo con el color.
- Los errores no se cierran solos, para que dé tiempo a leerlos (WCAG 2.2.1).

## 3. Comportamiento

- **Pila:** se ven como máximo **3** a la vez. Si llega un cuarto, se cierra el más antiguo de los que se cierran solos. Si los tres son errores, se cierra el error más antiguo.
- **Repetidos:** si llega un aviso con el mismo tipo y texto que uno visible, no se duplica: se reinicia su temporizador.
- **Pausa:** el temporizador se detiene mientras el puntero está encima o el foco está dentro del aviso (web), o mientras se mantiene pulsado (móvil), y se reanuda con el tiempo que le quedaba.
- **Cerrar:** todos tienen un botón de cerrar con nombre accesible («Cerrar aviso»). En la web, `Escape` con el foco dentro de un aviso lo cierra.
- **Sin acciones dentro del aviso.** Nada de «Deshacer» ni enlaces: un control que desaparece solo es difícil de alcanzar con teclado o lector de pantalla. Lo que necesite una acción va en la propia pantalla (como el aviso de archivada de la spec 106).
- **El foco no se mueve** al aparecer un aviso: no interrumpe lo que se está haciendo.
- **Movimiento:** entran y salen con una transición breve, que se desactiva con «reducir movimiento».

## 4. Lógica compartida: `packages/notifications`

La cola, los tiempos, la pila máxima y la regla de repetidos se implementan **una sola vez**, en TypeScript puro y sin dependencias de framework, y la usan la web y la app.

```ts
type ToastKind = "success" | "info" | "error";

interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastQueue {
  show(kind: ToastKind, message: string): string;
  dismiss(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
  subscribe(listener: (toasts: readonly Toast[]) => void): () => void;
}

function createToastQueue(options?: {
  maxVisible?: number;
  durationMs?: number;
  scheduler?: Scheduler;
}): ToastQueue;
```

- `Scheduler` (`setTimeout` / `clearTimeout` / `now`) se inyecta para poder probar los tiempos sin esperas reales.
- Los mensajes llegan **ya traducidos**: el paquete no conoce el idioma.
- Las reglas de dependencia (001, sección 6) se amplían: `notifications` no importa nada del monorepo ni de npm, y `core` no lo importa (no es lógica de negocio).

## 5. Web

- Un componente `ToastRegion` en el layout, con **dos regiones vivas** que existen siempre (vacías al principio), para que los lectores de pantalla anuncien bien: una `role="status"` para éxito e información, y otra `role="alert"` para errores.
- Composable `useToast()` que expone `success(message)`, `info(message)` y `error(message)`.
- **Posición:**

| Ancho  | Posición                                                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < `md` | Abajo, a todo el ancho menos el margen, por encima de la navegación inferior y del botón flotante «Nueva candidatura» (o de la barra de botones del formulario), para no taparlos. |
| ≥ `md` | Abajo a la derecha, con un ancho máximo de unos 24 rem.                                                                                                                            |

- **Usos que se migran o se añaden:**

| Situación                                          | Tipo      | Antes                                                      |
| -------------------------------------------------- | --------- | ---------------------------------------------------------- |
| Candidatura guardada (crear / editar)              | `success` | Aviso sencillo                                             |
| Estado cambiado                                    | `success` | Aviso sencillo                                             |
| Archivada / desarchivada / eliminada               | `success` | Aviso sencillo                                             |
| Datos de ejemplo restaurados                       | `success` | Texto en Ajustes                                           |
| Transición no permitida al soltar en el tablero    | `error`   | Banda de aviso sobre el tablero                            |
| Error inesperado al guardar o al cambiar el estado | `error`   | Texto junto al formulario (se mantiene, y además el aviso) |

- Los errores de validación de campos **siguen junto a cada campo** (spec 100): no se convierten en avisos.

## 6. Textos nuevos

| Clave           | ES           | EN                   |
| --------------- | ------------ | -------------------- |
| `toast.close`   | Cerrar aviso | Dismiss notification |
| `toast.success` | Hecho        | Done                 |
| `toast.info`    | Información  | Information          |
| `toast.error`   | Error        | Error                |
| `toast.region`  | Avisos       | Notifications        |

Las etiquetas de tipo (`toast.success`…) se leen antes del mensaje para quien no ve el icono, como texto visualmente oculto.

## 7. App móvil

- Mismo paquete `notifications` y mismo comportamiento.
- Un componente `ToastHost` en la raíz de la app, con un hook `useToast()` de la misma forma que en la web.
- **Posición:** abajo, por encima de la barra de pestañas y respetando el área segura.
- **Accesibilidad:** al aparecer se anuncia con `AccessibilityInfo.announceForAccessibility`; los errores además con `accessibilityLiveRegion="assertive"` en Android.
- Solo usa componentes incluidos en Expo Go (ADR-0006): `Animated` de React Native, sin librerías externas.
- **Cuándo:** la app todavía no tiene pantallas (llegan en M4). Se propone construir **ya** el `ToastHost` y el hook, con sus tests, y mostrarlo en la pantalla provisional actual con un botón de prueba, para poder verlo en Expo Go desde ahora.

## 8. Criterios de aceptación

### Lógica compartida

| Id        | Criterio                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| CA-107-01 | `success` e `info` se cierran solos a los 5 s; `error` no se cierra solo.                                                       |
| CA-107-02 | Nunca hay más de 3 visibles; el cuarto expulsa al más antiguo que se cierra solo o, si todos son errores, al error más antiguo. |
| CA-107-03 | Un aviso repetido (mismo tipo y texto) no se duplica y reinicia su tiempo.                                                      |
| CA-107-04 | `pause` detiene el tiempo y `resume` continúa con el que quedaba.                                                               |
| CA-107-05 | `dismiss` lo cierra y cancela su temporizador; los suscriptores reciben cada cambio y pueden darse de baja.                     |
| CA-107-06 | `pnpm depcruise` confirma que `notifications` no depende de nada y que `core` no lo importa.                                    |

### Web

| Id        | Criterio                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CA-107-07 | Las dos regiones vivas existen desde el principio; los éxitos van en `status` y los errores en `alert`.                                    |
| CA-107-08 | Cada aviso tiene botón «Cerrar aviso» y se cierra también con `Escape` cuando tiene el foco.                                               |
| CA-107-09 | El tiempo se pausa con el puntero encima o el foco dentro.                                                                                 |
| CA-107-10 | Todos los usos de la tabla de la sección 5 muestran el aviso del tipo indicado; la transición no permitida del tablero ya no usa la banda. |
| CA-107-11 | A 360 px el aviso no tapa la navegación inferior ni provoca scroll horizontal.                                                             |
| CA-107-12 | Todos los textos cambian al pasar a inglés.                                                                                                |

### App móvil

| Id        | Criterio                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------- |
| CA-107-13 | `ToastHost` muestra los avisos con el mismo comportamiento (tests con React Native Testing Library). |
| CA-107-14 | Desde la pantalla provisional se puede lanzar un aviso de cada tipo y se ve en Expo Go.              |
