# 103 · Modo demo

| Campo      | Valor                                           |
| ---------- | ----------------------------------------------- |
| Estado     | Aprobado                                        |
| Versión    | 0.2                                             |
| Fecha      | 2026-10-05                                      |
| Requisitos | RF-09 de [000-producto](000-producto.md)        |
| Hito       | M1 (adaptador y datos); la interfaz, en M2 y M4 |

## 1. Objetivo

Que cualquiera pueda probar ApplyTrack en menos de un minuto, sin registrarse y sin backend. En concreto:

- Quien visite el portfolio pulsa **«Probar sin cuenta»** y ve un tablero con candidaturas de ejemplo.
- Lo que haga se guarda solo en su dispositivo.
- Los E2E de la web y del móvil se ejecutan en este modo, sin depender de Supabase.
- Durante M2 es el único modo disponible, así que es la forma de ver la web funcionando en `localhost`.

## 2. Paquete `adapter-local`

Implementa los puertos de `core` sobre un almacén clave-valor. No sabe si corre en un navegador o en un móvil: la app le pasa el almacén.

```ts
interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

| Plataforma | Almacén                                     | Notas                                   |
| ---------- | ------------------------------------------- | --------------------------------------- |
| Web        | `localStorage` envuelto en promesas         | Límite habitual de unos 5 MB por origen |
| Móvil      | `@react-native-async-storage/async-storage` | Incluido en Expo Go (ADR-0006)          |
| Tests      | `MemoryKeyValueStore`                       | Exportado desde `adapter-local`         |

Contenido del paquete:

| Pieza                        | Implementa                           | Descripción                                                                                                       |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `LocalApplicationRepository` | `ApplicationRepository`              | Guarda las candidaturas del usuario demo. Pasa la suite de contrato de `core`.                                    |
| `DemoSessionProvider`        | `SessionProvider`                    | Devuelve el usuario `demo-user` mientras la demo está activa y `null` si no.                                      |
| `LocalDemoData`              | `DemoData` (puerto nuevo, sección 4) | Carga, reinicia y borra los datos de ejemplo.                                                                     |
| `SystemClock`                | `Clock`                              | Hora del sistema. `today()` en la zona horaria del dispositivo.                                                   |
| `UuidGenerator`              | `IdGenerator`                        | Recibe la función que genera UUID v4: `crypto.randomUUID` en web y `Crypto.randomUUID` de `expo-crypto` en móvil. |

`SystemClock` y `UuidGenerator` también los usará el modo con cuenta. Si en M3 hace falta compartirlos sin depender de `adapter-local`, se moverán a un paquete propio (`adapter-system`).

## 3. Formato de almacenamiento

Una sola clave por tipo de dato, con versión:

| Clave                | Contenido                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `applytrack:mode`    | `"demo"` o ausente. La app la lee al arrancar para decidir qué adaptadores montar.             |
| `applytrack:demo:v1` | `{ "version": 1, "locale": "es", "seededAt": "<ISO>", "applications": ApplicationSnapshot[] }` |

Reglas de lectura:

- Cada snapshot se valida con un esquema de **Zod** antes de pasarlo a `Application.restore`. Los datos de `localStorage` los puede modificar cualquiera desde las herramientas del navegador.
- **Una fila inválida se descarta** y se avisa con `console.warn`. Las demás se cargan con normalidad.
- **Si el JSON está corrupto o la versión es desconocida**, se vuelven a cargar los datos de ejemplo. En modo demo no hay datos reales que se puedan perder.

Reglas de escritura:

- **Leer, modificar y escribir en cada operación.** `save` vuelve a leer el almacén justo antes de escribir, así no se pierden los cambios de otra pestaña abierta a la vez.
- **Escrituras en cola.** Las escrituras de una misma instancia se encadenan en una cola de promesas para que dos `save` seguidos no se pisen (AsyncStorage es asíncrono).
- **Almacén lleno.** Si el almacén rechaza la escritura (por ejemplo, `QuotaExceededError`), el repositorio lanza `StorageFullError`. La app lo muestra con un mensaje genérico; no es un error de negocio.

## 4. Puerto y casos de uso nuevos en `core`

La interfaz no puede importar adaptadores (regla `ui-no-adapters`), así que el control de la demo se expone como un puerto de `core`:

```ts
interface DemoData {
  isActive(): Promise<boolean>;
  start(contentLocale: string): Promise<void>; // carga los datos de ejemplo si no hay ninguno
  reset(contentLocale: string): Promise<void>; // sustituye todo por los datos de ejemplo
  exit(): Promise<void>; // sale de la demo sin borrar los datos
}
```

| Caso de uso | Qué hace                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `StartDemo` | Activa el modo demo. Si ya había datos de una visita anterior, los conserva.                   |
| `ResetDemo` | Borra lo que haya hecho la persona usuaria y vuelve a cargar los ejemplos en el idioma activo. |
| `ExitDemo`  | Vuelve a la pantalla de inicio. Los datos se conservan para la próxima vez.                    |

`contentLocale` es un identificador opaco (`"es"` o `"en"`): `core` no interpreta el idioma, solo lo pasa al adaptador para elegir los textos de ejemplo.

## 5. Datos de ejemplo

### 5.1 Reglas

- **15 candidaturas** que cubren los **9 estados**, para que el tablero, la lista y las estadísticas tengan contenido desde el principio.
- **Empresas inventadas.** No se usan nombres de empresas reales.
- **Fechas relativas a hoy** (`Clock`): se guardan como «hace N días» y se calculan al cargar. Así la demo siempre parece reciente, con actividad en el gráfico semanal y con algunas candidaturas «paradas» (más de 14 días sin cambios).
- **Historial coherente:** cada candidatura tiene su historial completo, y cada cambio respeta la tabla de transiciones de [000-producto](000-producto.md) (5.2).
- **Bilingüe:** puestos, notas y etiquetas tienen versión en español y en inglés. Los nombres de las empresas son iguales en los dos idiomas.
- **Idioma de los datos:** los ejemplos se cargan en el idioma activo al empezar la demo. Si después se cambia el idioma, **no se retraducen**: ya son datos de la persona usuaria. Reiniciar la demo los vuelve a cargar en el idioma activo.

### 5.2 Conjunto

Días contados hacia atrás desde hoy. La columna «Recorrido» muestra el estado y, entre paréntesis, hace cuántos días se llegó a él.

| #   | Empresa           | Puesto (ES / EN)                                     | Modalidad | Fuente       | Recorrido                                                     | Extra                          |
| --- | ----------------- | ---------------------------------------------------- | --------- | ------------ | ------------------------------------------------------------- | ------------------------------ |
| 1   | Nimbus Labs       | Desarrollo Frontend (Vue) / Frontend Developer (Vue) | remote    | linkedin     | wishlist (2)                                                  | Etiquetas Vue, TypeScript      |
| 2   | Quokka Studio     | Desarrollo React Native / React Native Developer     | hybrid    | company_site | wishlist (5)                                                  |                                |
| 3   | Brisa Health      | Ingeniería Frontend / Frontend Engineer              | remote    | infojobs     | applied (3)                                                   |                                |
| 4   | Lince Software    | Desarrollo Web / Web Developer                       | onsite    | tecnoempleo  | applied (20)                                                  | Parada                         |
| 5   | Atlas Retail Tech | Desarrollo Móvil / Mobile Developer                  | remote    | linkedin     | applied (9)                                                   |                                |
| 6   | Puerto Data       | Desarrollo Frontend / Frontend Developer             | hybrid    | referral     | applied (12) → screening (6)                                  |                                |
| 7   | Olivo Fintech     | Desarrollo Vue / Vue Developer                       | remote    | recruiter    | applied (25) → screening (18)                                 | Parada                         |
| 8   | Kraken Games      | Desarrollo de Interfaces / UI Developer              | remote    | linkedin     | applied (21) → screening (15) → interviewing (4)              | Nota con la próxima entrevista |
| 9   | Sierra Mobility   | Ingeniería React Native / React Native Engineer      | hybrid    | company_site | applied (30) → interviewing (10)                              |                                |
| 10  | Tejo Cloud        | Desarrollo Frontend / Frontend Developer             | remote    | referral     | applied (35) → screening (28) → interviewing (20) → offer (2) | Salario 34.000–38.000 EUR      |
| 11  | Mirlo Apps        | Desarrollo Móvil / Mobile Developer                  | remote    | linkedin     | applied (60) → interviewing (50) → offer (42) → accepted (40) | Salario 38.000–42.000 GBP      |
| 12  | Faro Labs         | Desarrollo Frontend / Frontend Developer             | onsite    | infojobs     | applied (40) → screening (33) → rejected (30)                 | **Archivada**                  |
| 13  | Cobalto Systems   | Desarrollo Vue / Vue Developer                       | hybrid    | tecnoempleo  | applied (15) → rejected (8)                                   |                                |
| 14  | Nórdica Media     | Responsable Frontend / Frontend Lead                 | onsite    | recruiter    | applied (45) → interviewing (38) → withdrawn (36)             | Nota: exigía mudanza           |
| 15  | Delta Commerce    | Desarrollo React / React Developer                   | remote    | linkedin     | applied (50) → no_response (20)                               | Salario 60.000–75.000 USD      |

Los puestos en español usan formas neutras que nombran el área («Desarrollo Frontend», «Ingeniería Frontend»), sin marcar género. El resto de campos (URL, ubicación, notas, etiquetas) se rellenan en `adapter-local/src/seed/` con textos realistas y breves.

## 6. Interfaz (orientativo, se cierra en M2 y M4)

- **Pantalla de inicio:** botones «Probar sin cuenta» e «Iniciar sesión». El segundo aparece desactivado hasta M3.
- **Aviso permanente** en todas las pantallas de la demo: «Modo demo · los datos solo se guardan en este dispositivo», con las acciones «Reiniciar» y «Salir».
- **«Reiniciar»** pide confirmación, porque borra lo que haya hecho la persona usuaria.
- **Otras pestañas (web):** se escucha el evento `storage` para refrescar los datos si cambian en otra pestaña abierta.

## 7. Criterios de aceptación

| Id        | Criterio                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-103-01 | `LocalApplicationRepository` pasa la suite de contrato de `core` con `MemoryKeyValueStore`.                                                                                           |
| CA-103-02 | `StartDemo` sin datos previos carga las 15 candidaturas de ejemplo; `DemoSessionProvider` devuelve `demo-user`.                                                                       |
| CA-103-03 | `StartDemo` con datos de una visita anterior los conserva tal cual.                                                                                                                   |
| CA-103-04 | `ResetDemo` sustituye todo por los ejemplos en el idioma indicado.                                                                                                                    |
| CA-103-05 | `ExitDemo` hace que `DemoSessionProvider` devuelva `null`, pero conserva los datos.                                                                                                   |
| CA-103-06 | Los ejemplos cubren los 9 estados; cada historial es coherente (cada `from` es el `to` anterior y el último `to` es el estado actual) y cada cambio respeta la tabla de transiciones. |
| CA-103-07 | Ningún ejemplo tiene fechas futuras y todos pasan la validación de la spec 100.                                                                                                       |
| CA-103-08 | Los ejemplos en español y en inglés tienen la misma estructura: mismas empresas, estados y fechas. Solo cambian los textos.                                                           |
| CA-103-09 | Con un JSON corrupto o una versión desconocida, se vuelven a cargar los ejemplos.                                                                                                     |
| CA-103-10 | Una fila con datos inválidos se descarta, se avisa por consola y el resto se carga.                                                                                                   |
| CA-103-11 | Dos instancias del repositorio sobre el mismo almacén (dos pestañas) no pierden los cambios de la otra al guardar.                                                                    |
| CA-103-12 | Dos `save` lanzados a la vez en la misma instancia se guardan los dos.                                                                                                                |
| CA-103-13 | Si el almacén rechaza la escritura, se lanza `StorageFullError`.                                                                                                                      |
| CA-103-14 | `pnpm depcruise` sigue sin infracciones: `adapter-local` solo depende de `core` (y de Zod), y `core` no depende de `adapter-local`.                                                   |

## 8. Dependencias con otras specs

- **101 · Cambio de estado:** la tabla de transiciones se implementa en esa spec. Hasta entonces, CA-103-06 comprueba la coherencia del historial, y la comprobación contra la tabla se activa al implementar la 101.
- **102 · Tablero y lista:** añadirá `search` al repositorio; `LocalApplicationRepository` lo implementará entonces.
- **104 · Autenticación y preferencias:** definirá dónde se guardan idioma y tema. En la demo irán al mismo `KeyValueStore`.
