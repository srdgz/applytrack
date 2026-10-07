# 104 · Autenticación, preferencias y Supabase

| Campo      | Valor                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Estado     | Aprobado                                                               |
| Versión    | 0.2                                                                    |
| Fecha      | 2026-10-07                                                             |
| Requisitos | RF-01 y RF-11 de [000-producto](000-producto.md), RNF-09               |
| Hito       | M3 (núcleo, `adapter-supabase`, base de datos y web); la app móvil, M4 |

## 1. Objetivo

Hasta ahora ApplyTrack solo funciona en modo demo, con los datos guardados en el navegador. Esta spec añade **cuentas reales**:

- Entrar con un **enlace mágico** por email, sin contraseña.
- Guardar las candidaturas en **Supabase**, con **Row Level Security** para que cada persona solo vea las suyas.
- Guardar el **idioma** y el **tema** en el perfil, para conservarlos entre dispositivos.

Los tres modos de uso quedan así:

| Modo      | Quién                          | Dónde viven los datos     | Preferencias         |
| --------- | ------------------------------ | ------------------------- | -------------------- |
| `guest`   | Sin sesión y sin demo          | (no hay datos)            | Dispositivo          |
| `demo`    | Ha pulsado «Probar sin cuenta» | `localStorage` (spec 103) | Dispositivo          |
| `account` | Ha entrado con su email        | Supabase                  | Dispositivo y perfil |

## 2. Núcleo

`core` sigue sin depender de Supabase (RNF-01). Todo lo nuevo son tipos, funciones puras, puertos y casos de uso.

### 2.1 Dominio

- **Email:** `validateEmail(value)` recorta espacios, pasa a minúsculas y comprueba la forma `algo@algo.algo` con un máximo de 254 caracteres. Devuelve `Result<Email, FieldIssue>` con los códigos `REQUIRED_FIELD` (el mismo que usa el formulario) o `INVALID_EMAIL`. No pretende validar todos los casos del RFC 5322: el servidor tiene la última palabra.
- **Código de acceso:** `validateSignInCode(value)` acepta exactamente 6 dígitos, ignorando espacios. Código de error: `INVALID_CODE_FORMAT`.
- **Preferencias:**

```ts
type Locale = "es" | "en";
type ThemePreference = "light" | "dark" | "system";

interface Preferences {
  readonly locale: Locale;
  readonly theme: ThemePreference;
}
```

`parsePreferences(raw)` convierte un valor desconocido en `Preferences`, o en `null` si falta algo o no es válido. Los adaptadores la usan al leer de almacenamiento.

### 2.2 Puertos

```ts
interface Account {
  readonly userId: UserId;
  readonly email: Email;
}

type AuthFailure = "RATE_LIMITED" | "INVALID_CODE" | "AUTH_UNAVAILABLE";

interface AuthGateway {
  currentAccount(): Promise<Account | null>;
  requestSignIn(email: Email, redirectTo: string): Promise<Result<void, AuthFailure>>;
  verifyCode(email: Email, code: string): Promise<Result<Account, AuthFailure>>;
  signOut(): Promise<void>;
}

interface PreferencesStore {
  get(): Promise<Preferences | null>;
  save(preferences: Preferences): Promise<void>;
}
```

- `PreferencesStore.get` devuelve `null` cuando no hay nada guardado, para poder distinguir «sin preferencias» de «preferencias por defecto» (ver 2.4).
- `SessionProvider` no cambia. En modo cuenta lo implementa el adaptador de Supabase a partir de la sesión de Auth.

### 2.3 Casos de uso

| Caso de uso         | Entrada                 | Salida y errores                                                                                             |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GetCurrentAccount` | (nada)                  | `Account \| null`                                                                                            |
| `RequestSignIn`     | `{ email, redirectTo }` | `VALIDATION_FAILED` (campo `email`), `RATE_LIMITED`, `AUTH_UNAVAILABLE`                                      |
| `VerifySignInCode`  | `{ email, code }`       | `Account`; `VALIDATION_FAILED` (campos `email` o `code`), `INVALID_CODE`, `RATE_LIMITED`, `AUTH_UNAVAILABLE` |
| `SignOut`           | (nada)                  | `void`                                                                                                       |
| `GetPreferences`    | `{ fallback }`          | `Preferences` (ver 2.4)                                                                                      |
| `UpdatePreferences` | `Partial<Preferences>`  | `Preferences`; `SYNC_FAILED` si se guardó en el dispositivo pero no en el perfil                             |

Los códigos `INVALID_CODE`, `RATE_LIMITED`, `AUTH_UNAVAILABLE` y `SYNC_FAILED` se añaden a `DomainErrorCode` y a los catálogos de i18n.

### 2.4 Reglas de las preferencias

Los casos de uso de preferencias reciben un `device: PreferencesStore` y, solo en modo cuenta, un `profile: PreferencesStore`.

- **`GetPreferences`:**
  1. Con cuenta y perfil con preferencias: **gana el perfil**, y se copian al dispositivo.
  2. Con cuenta y perfil vacío (primera vez que entra): se usan las del dispositivo y **se suben al perfil**. Así quien ya había elegido inglés en este navegador no lo pierde al registrarse.
  3. Sin cuenta: las del dispositivo.
  4. Si no hay nada guardado: `fallback`, que la web calcula con el idioma del navegador y el tema `system`.
  - Si leer el perfil falla, se usan las del dispositivo sin mostrar error: las preferencias nunca bloquean el arranque.
- **`UpdatePreferences`:** guarda primero en el dispositivo (el cambio se ve al momento) y después en el perfil. Si el perfil falla, devuelve `SYNC_FAILED` con las preferencias ya aplicadas en el dispositivo.

## 3. Base de datos

Carpeta `supabase/` en la raíz, gestionada con la CLI de Supabase como dependencia de desarrollo (`pnpm supabase …`, sin instalaciones globales).

### 3.1 Migración inicial

Las tablas `applications`, `status_changes` y `profiles` de la sección 7 de [001](001-arquitectura.md), con estos ajustes:

- `profiles.locale` y `profiles.theme` pasan a ser **nulos por defecto**, con `check` de valores válidos y una columna `updated_at`. Un perfil con las dos columnas a `null` es un perfil vacío (regla 2.4.2).
- Un **trigger** en `auth.users` crea la fila de `profiles` al registrarse.
- `check` de `status`, `source`, `work_mode` y `salary_currency` con los mismos valores que `core/domain/application/options.ts`, y `salary_min <= salary_max`.
- Índices: `(owner_id, updated_at desc)` en `applications` y `(application_id, changed_at)` en `status_changes`.
- Extensión `unaccent` y función inmutable `public.fold(text)` = `lower(unaccent(text))`.

### 3.2 Seguridad (RNF-09)

- **RLS activado en las tres tablas**, con políticas separadas para `select`, `insert`, `update` y `delete`, todas con `owner_id = (select auth.uid())` (o `user_id` en `profiles`).
- `insert` y `update` también exigen `with check` del mismo dueño, para que nadie pueda asignar una candidatura a otra persona.
- `status_changes` comprueba además que la candidatura pertenece al mismo dueño.
- Las funciones son `security invoker`, así que también pasan por RLS.
- En el cliente solo existe la **clave publicable** (antes llamada `anon`). La clave de servicio solo se usa en los tests de CI contra la instancia local.

### 3.3 Funciones RPC

- **`save_application(payload jsonb)`**: en una sola transacción hace upsert de la candidatura e inserta los cambios de estado que aún no existen (cada uno lleva su posición `seq` en el historial, que solo crece). Así `ApplicationRepository.save` sigue siendo atómico (001, sección 4.2).
- **`search_applications(query jsonb)`**: aplica en SQL **exactamente** las mismas reglas que `matchesQuery` y `compareForQuery` de `core`:
  - Cada palabra del texto debe aparecer, sin tildes ni mayúsculas, en la empresa, el puesto o alguna etiqueta.
  - Etiquetas: basta con que coincida una.
  - Orden por el campo pedido y desempate por `id`, comparando con `collate "C"` para que coincida con la comparación de JavaScript. Las fechas de candidatura vacías van siempre al final.
  - Devuelve la página y el total en una sola llamada.

  Se hace en SQL y no con filtros de PostgREST porque «cada palabra en cualquier campo» y el plegado de tildes no se pueden expresar bien con ellos. La suite de contrato es la que garantiza que coincide con el adaptador local.

### 3.4 Despliegue de la base de datos

- **Local (CI):** `supabase start` levanta Postgres, Auth y la API en Docker, y aplica las migraciones.
- **Proyecto en la nube:** las migraciones se aplican con `pnpm supabase db push` después de `pnpm supabase link`. Requiere iniciar sesión en Supabase (ver sección 8).

## 4. `packages/adapter-supabase`

| Clase                             | Implementa              | Notas                                                                                                                                                                                                   |
| --------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SupabaseApplicationRepository`   | `ApplicationRepository` | Usa las dos RPC. Valida cada fila con Zod antes de rehidratar el dominio; una fila inválida se descarta y se avisa por `warn`, igual que en el adaptador local.                                         |
| `SupabaseAuthGateway`             | `AuthGateway`           | `signInWithOtp` con `emailRedirectTo` y `shouldCreateUser: true`; `verifyOtp` con `type: "email"`. Traduce los errores de Supabase (`over_email_send_rate_limit`, `otp_expired`, red…) a `AuthFailure`. |
| `SupabaseSessionProvider`         | `SessionProvider`       | Devuelve el `UserId` de la sesión actual.                                                                                                                                                               |
| `SupabaseProfilePreferencesStore` | `PreferencesStore`      | Lee y escribe `profiles` del usuario actual.                                                                                                                                                            |
| `createSupabaseAdapters(client)`  | (fábrica)               | Recibe un `SupabaseClient` ya creado. Crear el cliente (URL, clave, almacenamiento) es cosa de cada app.                                                                                                |

- Depende de `@applytrack/core`, `@supabase/supabase-js` y `zod`. Se añaden reglas de `dependency-cruiser` equivalentes a las de `adapter-local`: solo puede importar `core` de entre los paquetes del monorepo, y `core` y la interfaz no pueden importarlo.
- En `adapter-local` se añade `LocalPreferencesStore` sobre `KeyValueStore`, que reutiliza la clave `applytrack:locale` que ya existe y añade `applytrack:theme`.

### 4.1 Tests

- **Suite de contrato:** `describeApplicationRepositoryContract` se ejecuta también contra Supabase. Para eso la suite pasa a recibir una fábrica con los dos dueños de prueba y una función que genera los ids, porque en Postgres `owner_id` debe ser un usuario real y los ids, UUID. Los adaptadores en memoria y local siguen pasando la suite sin cambios en sus resultados.
- **Tests de RLS** con dos usuarios reales de la instancia local, cada uno con su propia sesión:
  - B no ve, no edita y no borra las candidaturas de A, ni su historial ni su perfil.
  - B no puede crear una candidatura con `owner_id` de A.
  - Sin sesión no se puede leer ni escribir nada.
- **Tests unitarios** del traductor de errores y de los esquemas Zod, sin red.
- Los tests que necesitan Supabase se **saltan** si no existen `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` y `SUPABASE_TEST_SECRET_KEY`, para que `pnpm test` siga funcionando sin Docker. En CI siempre existen.

### 4.2 CI

Nuevo job `supabase` en `ci.yml`:

1. `supabase/setup-cli` y `pnpm supabase start` (solo base de datos, Auth y API).
2. `pnpm supabase db lint` para revisar la migración.
3. Tests de `adapter-supabase` con las claves que imprime `supabase status -o env`. Son las claves públicas de desarrollo de la instancia local, no secretos.

## 5. Interfaz web

### 5.1 Configuración

- `apps/web/.env.example` (en el repo) y `apps/web/.env.local` (ignorado por git) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Si faltan**, la web funciona igual que ahora: solo modo demo, y el botón «Entrar» queda desactivado con el texto «Las cuentas no están configuradas en este entorno». Así el build de CI y quien clone el repo no necesitan Supabase.
- El cliente de Supabase se crea en `src/di/` con `flowType: "pkce"` y almacenamiento en `localStorage`.

### 5.2 Raíz de composición y cambio de modo

- Al arrancar, `createBrowserContainer` comprueba si hay sesión de Supabase:
  - **Con sesión:** repositorio, sesión y preferencias de perfil de Supabase.
  - **Sin sesión:** los adaptadores locales de ahora (`guest` o `demo`).
- Entrar y salir de una cuenta **recarga la página** (`window.location.assign`) para que la composición se haga de cero. Es más simple y seguro que cambiar adaptadores en caliente, y no deja datos de un modo en memoria del otro. Empezar y salir de la demo sigue igual que ahora, sin recargar.
- `UseCases` añade `getCurrentAccount`, `requestSignIn`, `verifySignInCode`, `signOut`, `getPreferences`, `updatePreferences` y `mode: "guest" | "demo" | "account"`. El guardia del router usa el modo en vez de `isDemoActive`.
- **Los datos de la demo no se pasan a la cuenta.** Al entrar con cuenta, la demo queda guardada en el navegador y se puede retomar después de cerrar sesión.

### 5.3 Pantalla «Entrar» (`/sign-in`, solo sin sesión)

Se abre desde el botón «Entrar» de la pantalla de inicio, que deja de estar desactivado.

1. **Paso 1 · Email:**
   - Campo de email con `autocomplete="email"` y `inputmode="email"`, y botón «Enviarme el enlace».
   - Validación al enviar con `validateEmail`, con el error junto al campo.
2. **Paso 2 · Revisa tu correo:**
   - Texto: «Te hemos enviado un enlace a `email`. Ábrelo en este navegador o escribe el código de 6 dígitos del mismo correo».
   - Campo de código con `autocomplete="one-time-code"`, `inputmode="numeric"` y botón «Entrar».
   - **Reenviar** desactivado durante 60 s, con la cuenta atrás visible y anunciada solo al terminar, para no saturar el lector de pantalla.
   - «Usar otro email» vuelve al paso 1.
3. Errores con aviso toast (spec 107) y mensaje junto al campo:
   - `RATE_LIMITED`: «Has pedido demasiados correos. Espera unos minutos».
   - `INVALID_CODE`: «El código no es válido o ha caducado».
   - `AUTH_UNAVAILABLE`: «No se ha podido conectar. Revisa tu conexión».

**Por qué también un código:** el enlace usa PKCE y solo funciona en el **mismo navegador** que lo pidió. El código sirve si el correo se abre en otro dispositivo, y será la forma de entrar en la app móvil desde Expo Go (M4), donde abrir enlaces profundos es poco fiable. Necesita cambiar la plantilla del correo en Supabase para incluir `{{ .Token }}` (sección 8).

### 5.4 Vuelta desde el enlace (`/auth/callback`)

- Intercambia el `code` de la URL por una sesión y recarga en `/board` con el aviso «Has entrado como `email`».
- Si el enlace ha caducado, ya se usó o se abrió en otro navegador: mensaje explicándolo y botón «Volver a entrar», que lleva a `/sign-in` con el email rellenado si se conoce.

### 5.5 Cuenta en la navegación y cerrar sesión

- En modo cuenta, la barra lateral muestra el email (recortado con `…` y completo en el tooltip) y el botón **«Cerrar sesión»**, accesible desde cualquier pantalla (RF-01). En la barra inferior del móvil está dentro de «Ajustes».
- Cerrar sesión no pide confirmación (no se pierde nada), recarga en `/` y muestra «Has cerrado sesión».
- El aviso permanente de modo demo (spec 103) solo aparece en modo demo.

### 5.6 Ajustes

- **Idioma:** igual que ahora, pero pasa por `UpdatePreferences`.
- **Tema (nuevo):** grupo de opciones «Claro», «Oscuro» y «Sistema» (`role="radiogroup"`, con flechas del teclado).
  - Se aplica con `data-theme` en `<html>`. «Sistema» quita el atributo y sigue a `prefers-color-scheme`, como ahora.
  - Un script mínimo en `index.html` aplica el tema guardado antes de pintar, para evitar el destello del tema equivocado.
- **Cuenta (solo modo cuenta):** email y «Cerrar sesión».
- **Demo (solo modo demo):** como ahora.
- Si `UpdatePreferences` devuelve `SYNC_FAILED`, aviso de tipo `warning`: «Guardado en este dispositivo, pero no en tu cuenta».

### 5.7 Textos nuevos

Claves nuevas en `@applytrack/i18n` (ES y EN) para la pantalla «Entrar», la vuelta del enlace, la cuenta, el tema y los códigos de error nuevos. El test de paridad de claves las cubre.

## 6. App móvil (M4)

Fuera de esta spec. Quedan preparados `core` y `adapter-supabase`, que funcionan igual en React Native. En M4, la app entrará con el código de 6 dígitos y guardará la sesión con AsyncStorage.

## 7. Fuera de alcance

- Borrar la cuenta o exportar los datos.
- Pasar las candidaturas de la demo a la cuenta.
- Entrar con Google, GitHub u otros proveedores.
- SMTP propio. El de Supabase limita a unos pocos correos por hora, suficiente para un portfolio.
- Despliegue en Vercel. Se hará al cerrar M3, en un paso aparte, cuando la web con cuentas funcione en local.

## 8. Configuración del proyecto en Supabase

Pasos manuales, porque necesitan la cuenta de Supabase del proyecto:

1. Crear un proyecto gratuito en [supabase.com](https://supabase.com) (región UE).
2. Copiar la URL y la clave publicable en `apps/web/.env.local`.
3. En Authentication → URL Configuration, añadir `http://localhost:5173/auth/callback` a las URL de redirección.
4. En Authentication → Email Templates → Magic Link, usar la plantilla de `supabase/templates/magic-link.html`, con el enlace y el código.
5. Ejecutar `pnpm supabase login`, `pnpm supabase link` y `pnpm supabase db push` para crear las tablas.

## 9. Criterios de aceptación

### Núcleo

| Id        | Criterio                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-104-01 | `validateEmail` acepta ` Ana@Example.com` como `ana@example.com` y rechaza vacío (`REQUIRED_FIELD`), `ana@`, `ana@example` y más de 254 caracteres (`INVALID_EMAIL`). |
| CA-104-02 | `validateSignInCode` acepta `123 456` como `123456` y rechaza `12345`, `1234567` y `12a456`.                                                                          |
| CA-104-03 | `RequestSignIn` con un email inválido devuelve `VALIDATION_FAILED` sin llamar al `AuthGateway`.                                                                       |
| CA-104-04 | `RequestSignIn` y `VerifySignInCode` devuelven tal cual los fallos `RATE_LIMITED`, `INVALID_CODE` y `AUTH_UNAVAILABLE` del puerto.                                    |
| CA-104-05 | `GetPreferences` aplica las cuatro reglas de 2.4, incluido subir las del dispositivo a un perfil vacío y no fallar si el perfil falla.                                |
| CA-104-06 | `UpdatePreferences` guarda en el dispositivo aunque falle el perfil, y entonces devuelve `SYNC_FAILED`.                                                               |
| CA-104-07 | `parsePreferences` devuelve `null` con valores desconocidos o incompletos.                                                                                            |
| CA-104-08 | `core` sigue con ≥ 90 % de cobertura y sin dependencias de runtime.                                                                                                   |

### Supabase

| Id        | Criterio                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-104-09 | La suite de contrato pasa contra `SupabaseApplicationRepository`, igual que contra el adaptador en memoria y el local.                                    |
| CA-104-10 | Un usuario no puede leer, editar, borrar ni crear a nombre de otro candidaturas, historial ni perfil; sin sesión no se accede a nada.                     |
| CA-104-11 | Si `save_application` falla a mitad, no queda ni la candidatura ni el cambio de estado a medias.                                                          |
| CA-104-12 | Una fila que no cumple el esquema Zod se descarta con un aviso y no rompe la búsqueda.                                                                    |
| CA-104-13 | El job `supabase` de la CI arranca la instancia local, revisa la migración y pasa los tests. `pnpm test` sin Docker se salta esos tests y sigue en verde. |
| CA-104-14 | `dependency-cruiser` impide que `core`, `ui` o `adapter-local` importen `adapter-supabase` o `@supabase/*`.                                               |

### Web

| Id        | Criterio                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-104-15 | Sin variables de Supabase, la web arranca en modo demo y «Entrar» aparece desactivado con su explicación.                                      |
| CA-104-16 | En «Entrar», un email inválido muestra el error junto al campo; uno válido pasa al paso 2 y el reenvío queda bloqueado 60 s.                   |
| CA-104-17 | Con un código válido se recarga en `/board` en modo cuenta; con uno inválido se ve el mensaje y se puede reintentar.                           |
| CA-104-18 | `/auth/callback` con un código válido entra; con uno caducado o de otro navegador muestra la explicación y «Volver a entrar».                  |
| CA-104-19 | En modo cuenta no aparece el aviso de demo; se ven el email y «Cerrar sesión», que lleva a `/` sin sesión.                                     |
| CA-104-20 | Con sesión, `/` y `/sign-in` redirigen a `/board`; sin sesión ni demo, las rutas internas redirigen a `/`.                                     |
| CA-104-21 | Cambiar el tema a «Oscuro» se aplica al momento, se mantiene al recargar sin destello y «Sistema» vuelve a seguir al sistema operativo.        |
| CA-104-22 | Con cuenta, cambiar idioma o tema en un navegador se ve al entrar desde otro navegador.                                                        |
| CA-104-23 | Entrar por primera vez con el navegador en inglés deja el perfil en inglés.                                                                    |
| CA-104-24 | Todos los textos nuevos existen en español e inglés, la pantalla «Entrar» funciona con teclado y no hay scroll horizontal de 320 px a 2560 px. |

## 10. Notas de implementación

- **`status_changes.seq`:** cada cambio de estado guarda su posición en el historial, con `unique (application_id, seq)`. Es más fiable que identificarlos por fecha y estado, y mantiene el orden aunque dos cambios compartan instante.
- **Fechas:** Postgres devuelve `+00:00` en vez de `Z`; el adaptador las normaliza con `toISOString()` para que el snapshot sea idéntico al guardado.
- **Plegado de tildes:** `public.fold` usa `unaccent`, que pliega algunos caracteres más que la normalización NFD de JavaScript (por ejemplo, `ø` → `o`). Para los textos en español e inglés el resultado es el mismo, y la suite de contrato lo comprueba.
- **Avisos tras recargar:** «Has entrado como…» y «Has cerrado sesión» se guardan en `sessionStorage` antes de recargar y se muestran al arrancar.
- **Sesión cerrada en otra pestaña:** si Supabase avisa de `SIGNED_OUT`, la web recarga en `/`.
- **«Entrar» en modo demo:** `/sign-in` solo redirige al tablero con cuenta, así que también se puede abrir desde la demo.
- **Cobertura de `adapter-supabase`:** el umbral del 90 % se aplica a las partes puras (filas y traducción de errores). El resto lo cubren los tests de integración del job `supabase` de la CI.
- **Validación previa de la migración:** se ha ejecutado en PGlite con un esquema `auth` simulado para comprobar el guardado atómico, la búsqueda y las políticas RLS antes de la CI.

## 11. Decisiones tomadas

1. **Enlace y código en el mismo correo**, por la limitación de PKCE y por Expo Go (5.3).
2. **Recargar al entrar y salir** de la cuenta en vez de cambiar adaptadores en caliente (5.2).
3. **Búsqueda en una función SQL** para que tenga las mismas reglas que el adaptador local (3.3).
4. **El perfil gana**, salvo cuando está vacío, que hereda las del dispositivo (2.4).
5. **Sin Docker en local:** los tests contra Supabase se ejecutan en CI y se saltan en local. Así no hace falta instalar Docker para trabajar en el proyecto.
6. **Sin variables de Supabase la web sigue funcionando** en modo demo (5.1).
7. **El tema** entra en esta spec porque RF-11 lo pide y ahora la web solo sigue al sistema.
