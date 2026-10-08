# 109 · Base de la app móvil

| Campo      | Valor                                                   |
| ---------- | ------------------------------------------------------- |
| Estado     | Aprobado                                                |
| Versión    | 0.1                                                     |
| Fecha      | 2026-10-08                                              |
| Requisitos | RF-01, RF-09 y RF-11 de [000-producto](000-producto.md) |
| Hito       | M4 (primera de varias specs del móvil)                  |

## 1. Objetivo

Convertir la pantalla de prueba de `apps/mobile` en la estructura real de la app. Con esta spec se puede:

- abrir la app en Expo Go y ver la pantalla de inicio;
- probar sin cuenta (modo demo con AsyncStorage) o entrar con el email;
- moverse por las pestañas;
- cambiar idioma y tema en Ajustes.

Las pantallas de contenido llegan en las siguientes specs, en este orden:

| Spec | Contenido                                      |
| ---- | ---------------------------------------------- |
| 110  | Tablero, lista, búsqueda y filtros             |
| 111  | Detalle, cambio de estado, archivar y eliminar |
| 112  | Crear y editar candidatura                     |
| 113  | Estadísticas                                   |

Hasta entonces, las pestañas Tablero, Lista y Estadísticas muestran un estado vacío con el texto «Disponible pronto».

## 2. Raíz de composición compartida

Ahora mismo `apps/web/src/di/container.ts` decide qué adaptadores usar y crea los casos de uso. El móvil necesita exactamente lo mismo, cambiando solo el almacenamiento.

- Se mueve a un paquete nuevo, **`packages/composition`**, con `createContainer(options)` y el tipo `UseCases`. Las opciones son las de ahora: `store` (`KeyValueStore`), `clock`, `ids`, `warn`, `auth` y `signedIn`.
- La web y el móvil solo crean lo que depende de la plataforma (el almacenamiento y el cliente de Supabase) y llaman a `createContainer`.
- Los tipos de Vue (`InjectionKey`, `useUseCases`) se quedan en la web; el contexto de React, en el móvil.
- `dependency-cruiser`:
  - `composition` puede importar `core` y los adaptadores, pero no las apps ni `@supabase/*`;
  - las apps importan `composition` solo desde `src/di`.

## 3. Tecnología

| Necesidad          | Elección                                                   | Por qué                                                                                 |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Navegación         | **Expo Router** (rutas por archivos en `apps/mobile/app/`) | Incluido en Expo Go; enlaces profundos para la vuelta del correo.                       |
| Estilos            | **NativeWind 4.2** con **Tailwind CSS 3**                  | Es la versión estable para Expo 57. La 5, con Tailwind 4, sigue en _release candidate_. |
| Colores            | Paquete **`packages/design-tokens`**                       | Una sola fuente para los colores de la web y del móvil (ver 3.1).                       |
| Idioma             | **i18next** + **react-i18next** + **i18next-icu**          | Lee los mismos catálogos ICU de `@applytrack/i18n`.                                     |
| Idioma del sistema | **expo-localization**                                      | Incluido en Expo Go.                                                                    |
| Almacenamiento     | **@react-native-async-storage/async-storage**              | Incluido en Expo Go (ADR-0006).                                                         |
| Supabase           | `@supabase/supabase-js` con almacenamiento en AsyncStorage | El mismo `adapter-supabase` que la web.                                                 |

### 3.1 `packages/design-tokens`

- Exporta los colores de la web (`canvas`, `surface`, `ink`, `accent`, `danger`…) en claro y oscuro, en formato hexadecimal, porque React Native no entiende `oklch`.
- El móvil los usa en `tailwind.config.js`, como variables CSS que NativeWind cambia según el tema.
- La web sigue declarando los suyos en `style.css` con `oklch`. Un test comprueba que los dos sitios usan los mismos colores, convertidos a hexadecimal con una tolerancia de una unidad por canal.
- Se actualiza ADR-0004: NativeWind 4 con Tailwind 3 en el móvil hasta que salga la versión estable de NativeWind 5.

## 4. Estructura de la app

```
apps/mobile/
  app/
    _layout.tsx              proveedores: composición, idioma, tema, avisos, áreas seguras
    index.tsx                inicio (sin sesión)
    sign-in.tsx              entrar
    auth/callback.tsx        vuelta del enlace
    (app)/_layout.tsx        pestañas; redirige a / si no hay sesión ni demo
    (app)/board.tsx          «Disponible pronto» (spec 110)
    (app)/list.tsx           «Disponible pronto» (spec 110)
    (app)/stats.tsx          «Disponible pronto» (spec 113)
    (app)/settings.tsx       ajustes
  src/
    di/                      AsyncStorage, cliente de Supabase y createContainer
    i18n/                    i18next
    theme/                   aplicar el tema con NativeWind
    ui/                      componentes (botón, campo de texto, aviso de demo…)
    notifications/           avisos (ya existe)
```

- **Arranque:** la pantalla de carga nativa (spec 108) se mantiene con `expo-splash-screen` hasta que se ha decidido el modo (cuenta, demo o sin sesión) y se han cargado las preferencias. Así no se ve un parpadeo del tema ni del idioma.
- **Guardias:** igual que en la web. Con cuenta o demo, el inicio lleva al tablero. Sin ninguna de las dos, las pestañas llevan al inicio.
- **Pestañas:** Tablero, Lista, Estadísticas y Ajustes, con los iconos de la web dibujados con `react-native-svg`. Cada pestaña tiene un mínimo de 48 × 48 dp para el toque.

## 5. Pantallas de esta spec

### 5.1 Inicio

- Logo, título, descripción y los botones «Probar sin cuenta» y «Entrar», como en la web.
- «Entrar» se desactiva con su explicación si faltan `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `apps/mobile/.env.local`.

### 5.2 Entrar con el email

Igual que la web: email, «Enviarme el enlace» y luego «Revisa tu correo», con «Reenviar el correo» (espera de 60 s) y «Usar otro email».

**El enlace abre la app:**

- `emailRedirectTo` se crea con `Linking.createURL("auth/callback")`:
  - en Expo Go es `exp://<ip>:8081/--/auth/callback`;
  - en el APK, `applytrack://auth/callback`.
- El correo enlaza primero a Supabase, que comprueba el enlace y redirige a esa dirección. El móvil abre Expo Go o la app.
- `auth/callback.tsx` lee el `code` de la URL, lo cambia por una sesión con `exchangeCodeForSession` y reinicia la composición en modo cuenta.
- Como el enlace usa PKCE, hay que abrir el correo **en el mismo teléfono** en el que se pidió. El texto de «Revisa tu correo» lo indica.
- **No hace falta SMTP propio.** Basta con añadir en Supabase las direcciones de vuelta `exp://**` y `applytrack://**` (sección 8).

**Reinicio de la composición:** en la web se recarga la página al entrar y al salir. En el móvil, un componente raíz vuelve a crear el contenedor y el árbol de navegación (con una `key` nueva), con el mismo efecto.

### 5.3 Ajustes

- Idioma: selector con las dos opciones.
- Tema: «Claro», «Oscuro» y «Sistema», con `accessibilityRole="radio"`.
- Cuenta (con sesión): email y «Cerrar sesión».
- Modo demo (sin cuenta): «Reiniciar demo» y «Salir de la demo», con confirmación nativa (`Alert`) para reiniciar.
- Las preferencias se guardan con `UpdatePreferences`, igual que en la web, y avisan si no se han podido guardar en la cuenta.

### 5.4 Aviso de modo demo

Banda fija encima de las pestañas con el texto de la web y los enlaces «Reiniciar» y «Salir».

## 6. Accesibilidad y adaptación

- Todo lo pulsable tiene `accessibilityRole`, nombre y un área táctil mínima de 44 × 44 pt.
- Los textos respetan el tamaño de letra del sistema hasta el 200 %. Las filas pasan a ocupar más de una línea en lugar de cortarse.
- Áreas seguras con `react-native-safe-area-context`.
- La animación de los avisos se desactiva con «Reducir movimiento», como ahora.

## 7. Tests

- **`packages/composition`:**
  - los tests de la raíz de composición que hoy hay en la web pasan a este paquete;
  - se comprueba que el modo cuenta usa los adaptadores de la cuenta.
- **`packages/design-tokens`:** el test de colores entre web y móvil (3.1).
- **Móvil (Jest + RNTL):**
  - inicio con y sin Supabase configurado;
  - empezar la demo y llegar al tablero;
  - validación del email y paso a «Revisa tu correo»;
  - vuelta del enlace con código correcto e incorrecto (con el `AuthGateway` falso);
  - cambiar tema e idioma;
  - salir de la demo;
  - cerrar sesión.

## 8. Configuración en Supabase

En Authentication → URL Configuration → Redirect URLs, añadir `exp://**` (Expo Go) y `applytrack://**` (APK).

## 9. Fuera de alcance

- Las pantallas de contenido (specs 110–113).
- Maestro y la regla de lint de textos sin traducir: en M5.
- EAS Update y la generación del APK: al final, junto con el despliegue en Vercel.

## 10. Criterios de aceptación

| Id        | Criterio                                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-109-01 | La web sigue pasando todos sus tests usando `@applytrack/composition`, y `dependency-cruiser` aplica las reglas nuevas.                                          |
| CA-109-02 | Los colores del móvil y de la web coinciden según el test de `design-tokens`.                                                                                    |
| CA-109-03 | Al abrir la app sin sesión se ve el inicio. Tras «Probar sin cuenta» se ve la pestaña Tablero con el aviso de demo, y al cerrar y abrir la app sigue en la demo. |
| CA-109-04 | «Entrar» valida el email y, con uno válido, muestra «Revisa tu correo» con el reenvío bloqueado 60 s.                                                            |
| CA-109-05 | Abrir el enlace del correo en el mismo teléfono abre la app con la sesión iniciada. Con un enlace caducado se explica el fallo y se ofrece volver a entrar.      |
| CA-109-06 | Cambiar el tema o el idioma en Ajustes se aplica al momento, se mantiene al reabrir la app y, con cuenta, se guarda en el perfil.                                |
| CA-109-07 | Cerrar sesión y salir de la demo vuelven al inicio.                                                                                                              |
| CA-109-08 | Sin parpadeos de tema ni de idioma al abrir; la pantalla de carga se mantiene hasta que todo está listo.                                                         |
| CA-109-09 | Con la letra del sistema al 200 % no se corta ningún texto en un iPhone SE ni en un Android mediano.                                                             |

## 11. Decisiones tomadas

1. **Raíz de composición en un paquete compartido** en lugar de duplicarla en el móvil.
2. **NativeWind 4 con Tailwind 3** en el móvil: es la versión estable para Expo 57. Se revisará cuando salga NativeWind 5.
3. **Enlace mágico con enlace profundo** en lugar del código de 6 dígitos, para no necesitar SMTP propio. La limitación es la misma que en la web: abrir el correo en el mismo dispositivo.
4. **Pestañas pendientes con «Disponible pronto»**, para poder probar la navegación y los ajustes mientras se hacen las pantallas de contenido.
5. **Colores en hexadecimal en `design-tokens`**, con un test que los compara con los `oklch` de la web, en lugar de generar el CSS de la web.
