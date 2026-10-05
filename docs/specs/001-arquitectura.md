# 001 · Arquitectura

| Campo   | Valor      |
| ------- | ---------- |
| Estado  | Aprobado   |
| Versión | 0.2        |
| Fecha   | 2026-10-05 |

## 1. Objetivos

1. **Un solo núcleo para dos interfaces.** Las reglas de negocio se escriben y se prueban una vez y las usan la web (Vue 3) y la app (React Native).
2. **El núcleo no depende de nada externo.** Cambiar Supabase por otro backend, o Vue por otro framework, no debe tocar `core`.
3. **Todo se puede probar sin red.** Cualquier caso de uso se ejecuta en un test unitario con adaptadores en memoria.
4. **Las reglas se comprueban solas.** Las dependencias entre capas las verifica la CI; no dependen de la disciplina de quien programa.

## 2. Arquitectura hexagonal (puertos y adaptadores)

```
                     ADAPTADORES PRIMARIOS (dirigen la app)
          ┌──────────────────────────┐   ┌──────────────────────────┐
          │ apps/web  · Vue 3        │   │ apps/mobile · React Native│
          │ vistas, Pinia, router    │   │ pantallas, Zustand        │
          └────────────┬─────────────┘   └─────────────┬────────────┘
                       │  llaman a casos de uso (puertos de entrada)
          ┌────────────▼────────────────────────────────▼────────────┐
          │                     packages/core                         │
          │  ┌─────────────────────────────────────────────────────┐ │
          │  │ application: casos de uso + puertos de salida       │ │
          │  │  ┌───────────────────────────────────────────────┐  │ │
          │  │  │ domain: entidades, value objects, reglas      │  │ │
          │  │  └───────────────────────────────────────────────┘  │ │
          │  └─────────────────────────────────────────────────────┘ │
          └────────────▲────────────────────────────────▲────────────┘
                       │  implementan puertos de salida │
          ┌────────────┴─────────────┐   ┌──────────────┴───────────┐
          │ packages/adapter-supabase│   │ packages/adapter-local   │
          │ (modo con cuenta)        │   │ (modo demo y tests)      │
          └──────────────────────────┘   └──────────────────────────┘
                     ADAPTADORES SECUNDARIOS (los usa la app)
```

**Regla de dependencia:** las flechas de import siempre apuntan hacia dentro. `domain` no importa nada; `application` solo importa `domain`; los adaptadores importan `core`; las apps importan todo, pero solo las conectan en su raíz de composición.

## 3. Estructura del monorepo

```
applytrack/
├── apps/
│   ├── web/                     # Vue 3 + Vite + Tailwind
│   │   └── src/
│   │       ├── di/              # raíz de composición (único sitio que importa adaptadores)
│   │       ├── ui/
│   │       │   ├── components/  # atoms / molecules / organisms
│   │       │   ├── layouts/
│   │       │   └── views/
│   │       ├── stores/          # Pinia: estado de la UI, llama a casos de uso
│   │       ├── composables/
│   │       ├── router/
│   │       └── i18n/            # configuración de vue-i18n
│   └── mobile/                  # Expo + Expo Router + NativeWind
│       ├── app/                 # rutas (Expo Router)
│       └── src/
│           ├── di/
│           ├── ui/
│           ├── stores/          # Zustand
│           ├── hooks/
│           └── i18n/            # configuración de i18next
├── packages/
│   ├── core/                    # dominio + aplicación. Sin dependencias de runtime.
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── application/ # entidad Application, ApplicationStatus, transiciones
│   │       │   └── shared/      # Result, DomainError, value objects (Url, SalaryRange...)
│   │       └── application/
│   │           ├── ports/       # interfaces de salida (repositorios, Clock, IdGenerator...)
│   │           └── use-cases/   # un archivo por caso de uso
│   ├── adapter-supabase/        # implementa los puertos con Supabase
│   ├── adapter-local/           # implementa los puertos sobre un KeyValueStore
│   ├── i18n/                    # catálogos es.json / en.json compartidos + tipos de claves
│   ├── design-tokens/           # colores, espaciados, breakpoints (Tailwind y NativeWind)
│   └── config/                  # tsconfig, eslint y prettier compartidos
├── supabase/                    # migraciones SQL, políticas RLS, seed
└── docs/
    ├── specs/
    └── adr/
```

## 4. Capas en detalle

### 4.1 Dominio (`core/src/domain`)

- **Entidad `Application`**: guarda el estado y las invariantes de la sección 5 de [000-producto](000-producto.md). Solo se crea con `Application.create(props)` o `Application.restore(snapshot)`; el constructor es privado.
- **Value objects** inmutables: `ApplicationId`, `Url`, `SalaryRange`, `Tag`, `ApplicationStatus`.
- **Transiciones de estado**: una tabla (`ALLOWED_TRANSITIONS: Record<Status, Status[]>`) y un método `application.changeStatus(to, at, note?)`. No hay `if` repartidos por la UI.
- **Errores**: no se lanzan excepciones por fallos de negocio. Se devuelve `Result<T, DomainError>`, donde `DomainError` es `{ code: DomainErrorCode; field?: string; meta?: Record<string, unknown> }`. La UI traduce el `code`.
- **Funciones puras de lectura**: `computeDashboardStats(applications, now)` y `isStale(application, now)`.

### 4.2 Aplicación (`core/src/application`)

**Puertos de salida** (los implementan los adaptadores):

```ts
interface ApplicationRepository {
  findById(owner: UserId, id: ApplicationId): Promise<Application | null>;
  search(owner: UserId, query: ApplicationQuery): Promise<Page<Application>>;
  save(application: Application): Promise<void>; // crea o actualiza, de forma atómica
  delete(owner: UserId, id: ApplicationId): Promise<void>;
}

interface SessionProvider {
  currentUser(): Promise<UserId | null>;
}
interface PreferencesStore {
  get(): Promise<Preferences>;
  save(p: Preferences): Promise<void>;
}
interface Clock {
  now(): Date;
}
interface IdGenerator {
  next(): string;
}
```

**Puertos de entrada** (casos de uso). Un archivo y una clase por caso de uso, todos con la misma forma:

```ts
interface UseCase<Input, Output> {
  execute(input: Input): Promise<Result<Output, DomainError>>;
}
```

| Caso de uso                                   | RF                                                         |
| --------------------------------------------- | ---------------------------------------------------------- |
| `CreateApplication`                           | RF-02                                                      |
| `UpdateApplicationDetails`                    | RF-03                                                      |
| `ArchiveApplication` / `UnarchiveApplication` | RF-04                                                      |
| `DeleteApplication`                           | RF-04                                                      |
| `ChangeApplicationStatus`                     | RF-05                                                      |
| `GetApplication`                              | RF-05                                                      |
| `SearchApplications`                          | RF-06, RF-07, RF-08                                        |
| `GetDashboardStats`                           | RF-10                                                      |
| `GetPreferences` / `UpdatePreferences`        | RF-11                                                      |
| `ValidateApplicationDraft`                    | RF-02, RF-03 (validación en el momento en los formularios) |

`ValidateApplicationDraft` existe para que los formularios web y móvil usen **las mismas reglas** que el dominio, en lugar de reescribirlas con otra librería.

### 4.3 Adaptadores secundarios

| Paquete                 | Implementa                                                                    | Notas                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adapter-supabase`      | `ApplicationRepository`, `SessionProvider`, `PreferencesStore`                | Valida las filas que llegan de la base de datos con Zod antes de rehidratar el dominio. `save` llama a una función RPC de Postgres para guardar la candidatura y su historial en una sola transacción.                             |
| `adapter-local`         | `ApplicationRepository`, `SessionProvider` (usuario demo), `PreferencesStore` | Depende de un `KeyValueStore` (`getItem` / `setItem` / `removeItem`). La web le pasa `localStorage`; el móvil, AsyncStorage (compatible con Expo Go, ver ADR-0006). Incluye los datos de ejemplo del modo demo en los dos idiomas. |
| (en `core`, para tests) | `FixedClock`, `SequentialIdGenerator`, `InMemoryApplicationRepository`        | Dobles de test que se exportan desde `@applytrack/core/testing`.                                                                                                                                                                   |

### 4.4 Adaptadores primarios (apps)

- **Raíz de composición** (`src/di/container.ts`): es el único archivo que importa adaptadores. Según el modo (demo o con cuenta) crea los adaptadores, los inyecta en los casos de uso y expone un objeto `UseCases`.
  - Web: se entrega con `provide/inject` y una `InjectionKey<UseCases>` tipada.
  - Móvil: se entrega con un `React.Context`.
- **Stores** (Pinia / Zustand): guardan solo **estado de interfaz** (carga, filtros, selección) y llaman a los casos de uso. Ninguna regla de negocio vive en un store.
- **Componentes**: no importan casos de uso ni adaptadores. Reciben datos por props y emiten eventos, o usan un store o composable.

## 5. Principios SOLID aplicados

| Principio                        | Cómo se aplica                                                                                                                                                                                            | Cómo se comprueba                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **S**: responsabilidad única     | Un caso de uso por clase. La entidad valida; el repositorio persiste; el store gestiona el estado de interfaz; el componente pinta.                                                                       | Revisión en PR. Los casos de uso con más de unas 60 líneas o más de 4 dependencias se marcan para refactorizar. |
| **O**: abierto/cerrado           | Los estados y transiciones están en una tabla de datos: añadir un estado nuevo no obliga a cambiar `changeStatus`. Los backends se añaden como adaptadores nuevos sin tocar `core`.                       | Test de la tabla de transiciones con todas las combinaciones.                                                   |
| **L**: sustitución de Liskov     | Todos los `ApplicationRepository` deben comportarse igual. Una **suite de contrato** compartida (`describeApplicationRepositoryContract`) se ejecuta contra el adaptador en memoria, el local y Supabase. | La suite de contrato en CI, con Supabase local (`supabase start`).                                              |
| **I**: segregación de interfaces | Puertos pequeños (`Clock`, `IdGenerator`, `SessionProvider`) en vez de un `Services` gigante. Cada caso de uso recibe solo lo que usa.                                                                    | Lint de parámetros sin usar y revisión en PR.                                                                   |
| **D**: inversión de dependencias | Los casos de uso dependen de interfaces de `core`, nunca de implementaciones. Las instancias concretas solo aparecen en `di/`.                                                                            | `dependency-cruiser` en CI (ver 6).                                                                             |

## 6. Reglas de dependencia automáticas

Se usa `dependency-cruiser` con estas reglas, que hacen fallar la CI:

| Regla                     | Prohibido                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `domain-is-pure`          | `core/src/domain` importa cualquier cosa fuera de `domain`.                         |
| `application-only-domain` | `core/src/application` importa algo que no sea `domain` o `application`.            |
| `core-no-frameworks`      | `core` importa `vue`, `react`, `react-native`, `@supabase/*` u otro paquete de npm. |
| `adapters-only-core`      | Un adaptador importa otro adaptador o una app.                                      |
| `ui-no-adapters`          | Cualquier archivo de `apps/*/src` fuera de `di/` importa `adapter-*`.               |
| `no-circular`             | Dependencias circulares en cualquier paquete.                                       |

Los archivos `*.test.ts` quedan fuera de las reglas `domain-is-pure`, `application-only-domain` y `core-no-frameworks`: los tests pueden usar Vitest y los dobles de `@applytrack/core/testing`.

## 7. Datos (Supabase)

```sql
create table applications (
  id              uuid primary key,
  owner_id        uuid not null references auth.users on delete cascade,
  company         text not null check (char_length(company) between 1 and 120),
  position        text not null check (char_length(position) between 1 and 120),
  job_url         text,
  source          text not null,
  location        text,
  work_mode       text not null,
  salary_min      integer,
  salary_max      integer,
  salary_currency char(3),
  status          text not null,
  applied_at      date,
  tags            text[] not null default '{}',
  notes           text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table status_changes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  owner_id       uuid not null references auth.users on delete cascade,
  from_status    text,
  to_status      text not null,
  changed_at     timestamptz not null,
  note           text
);

create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  locale  text not null default 'es',
  theme   text not null default 'system'
);
```

- **RLS** en las tres tablas: `owner_id = auth.uid()` (o `user_id`) para `select`, `insert`, `update` y `delete`.
- **Búsqueda sin tildes**: extensión `unaccent` e índice sobre `unaccent(lower(company || ' ' || position))`.
- **Escritura atómica**: función `save_application(payload jsonb)` con `security invoker`, que hace upsert de la candidatura e inserta los cambios de estado nuevos en una sola transacción.
- Los `check` de la base de datos repiten los límites del dominio como segunda línea de defensa. La fuente de verdad sigue siendo el dominio.

## 8. Estrategia de testing

| Nivel                    | Herramienta                                      | Qué cubre                                                   | Dónde                               |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------- |
| Unitario de dominio      | Vitest                                           | Entidad, value objects, tabla de transiciones, estadísticas | `packages/core`                     |
| Unitario de casos de uso | Vitest + dobles de `core/testing`                | Cada caso de uso con sus errores                            | `packages/core`                     |
| Contrato                 | Vitest                                           | Suite común de `ApplicationRepository`                      | `adapter-local`, `adapter-supabase` |
| Componentes web          | Vitest + Vue Testing Library                     | Formularios, tablero, filtros                               | `apps/web`                          |
| Componentes móvil        | Jest + React Native Testing Library              | Pantallas principales                                       | `apps/mobile`                       |
| E2E web                  | Playwright, en modo demo, a 4 anchos de pantalla | Flujos de los criterios de aceptación                       | `apps/web/e2e`                      |
| E2E móvil                | Maestro                                          | Crear candidatura, cambiar estado, cambiar idioma           | `apps/mobile/.maestro`              |
| Accesibilidad            | `@axe-core/playwright`                           | Pantallas principales, tema claro y oscuro                  | `apps/web/e2e`                      |

Los E2E web se ejecutan en **modo demo**, así no necesitan backend y son rápidos y estables.

## 9. Herramientas

- **Monorepo**: pnpm workspaces + Turborepo (caché de tareas `build`, `lint`, `typecheck`, `test`).
- **TypeScript** en modo `strict`, con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`.
- **Calidad**: ESLint (configuración plana compartida), Prettier, Husky + lint-staged, commits convencionales con commitlint.
- **CI** (GitHub Actions): `lint → typecheck → test → dependency-cruiser → build`. Los E2E web van en un job aparte.
- **CD**: web en Vercel (previsualización por PR). Móvil sin tiendas (ver ADR-0006): `eas update` en un canal de previsualización por PR y en el canal estable desde `main`. En las etiquetas `v*` se genera además un APK de Android con `eas build --profile preview`.
- **Restricción del móvil**: solo se usan módulos nativos incluidos en Expo Go, para que la app se pueda abrir desde Expo Go en iOS y Android.

## 10. Decisiones registradas

- [ADR-0001](../adr/0001-monorepo-pnpm-turborepo.md) · Monorepo con pnpm y Turborepo
- [ADR-0002](../adr/0002-arquitectura-hexagonal.md) · Arquitectura hexagonal con núcleo compartido
- [ADR-0003](../adr/0003-supabase-backend.md) · Supabase como backend
- [ADR-0004](../adr/0004-tailwind-nativewind.md) · Tailwind en web y NativeWind en móvil, con tokens compartidos
- [ADR-0005](../adr/0005-result-en-vez-de-excepciones.md) · `Result` y códigos de error en lugar de excepciones
- [ADR-0006](../adr/0006-distribucion-movil-sin-tiendas.md) · Distribución móvil sin tiendas ni cuentas de desarrollador
