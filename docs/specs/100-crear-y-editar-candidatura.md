# 100 · Crear y editar candidatura

| Campo      | Valor                                              |
| ---------- | -------------------------------------------------- |
| Estado     | Aprobado                                           |
| Versión    | 0.2                                                |
| Fecha      | 2026-10-05                                         |
| Requisitos | RF-02, RF-03 de [000-producto](000-producto.md)    |
| Hito       | M1 (núcleo); la interfaz, en M2 (web) y M4 (móvil) |

## 1. Objetivo

Definir cómo se crea y se edita una candidatura en `core`: el modelo, la validación, los casos de uso y los puertos que necesitan. Lo que se describe en la sección 8 (interfaz) es orientativo y se cerrará en M2.

## 2. Datos de entrada: `ApplicationDraft`

Los formularios envían siempre un borrador con tipos primitivos. El dominio lo normaliza y lo valida.

```ts
interface ApplicationDraft {
  company: string;
  position: string;
  source: string; // "linkedin" | "infojobs" | "tecnoempleo" | "company_site" | "referral" | "recruiter" | "other"
  workMode: string; // "remote" | "hybrid" | "onsite"
  status: string; // "wishlist" | "applied"; solo al crear
  jobUrl?: string;
  location?: string;
  salary?: { min?: number; max?: number; currency?: string }; // "EUR" | "GBP" | "USD"
  appliedAt?: string; // fecha de calendario "YYYY-MM-DD"
  tags?: string[];
  notes?: string;
}
```

Para editar se usa el mismo tipo sin `status` (`ApplicationDetailsDraft`).

Los campos de listas cerradas son `string` y no los tipos del dominio: los formularios trabajan con texto, y la validación es la que comprueba que el valor está en la lista (`INVALID_OPTION`). Tras validar, la candidatura sí usa los tipos cerrados.

## 3. Normalización (antes de validar)

| Campo                                                         | Normalización                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Textos (`company`, `position`, `location`, `notes`, `jobUrl`) | Se quitan los espacios del principio y del final. Un texto opcional que queda vacío se trata como ausente. |
| `tags`                                                        | Se quitan espacios y se descartan las vacías. Se conserva cómo las escribió la persona usuaria.            |
| `salary`                                                      | Si no tiene `min` ni `max`, se trata como ausente. `currency` por defecto: `EUR`.                          |
| `appliedAt`                                                   | Si el estado es `applied` y falta, se usa la fecha de hoy (`Clock.today()`).                               |

Las longitudes se cuentan en caracteres Unicode (`[...texto].length`), no en unidades UTF-16, para que una tilde o un emoji cuenten como uno.

## 4. Reglas de validación

Se validan **todos los campos a la vez** y se devuelven todos los problemas juntos, para que el formulario los muestre de una vez.

| Campo                             | Regla                                                                                | Código                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `company`, `position`             | Obligatorios, 1–120 caracteres                                                       | `REQUIRED_FIELD`, `FIELD_TOO_LONG` (`meta.max`)                  |
| `source`, `workMode`, `status`    | Valor de la lista cerrada                                                            | `INVALID_OPTION`                                                 |
| `jobUrl`                          | URL `http` o `https` válida, máx. 2.048 caracteres                                   | `INVALID_URL`, `FIELD_TOO_LONG`                                  |
| `location`                        | Máx. 120 caracteres                                                                  | `FIELD_TOO_LONG`                                                 |
| `salary.min`, `salary.max`        | Enteros > 0; si están los dos, `min ≤ max`                                           | `INVALID_SALARY_RANGE`                                           |
| `salary.currency`                 | `EUR`, `GBP` o `USD`                                                                 | `UNSUPPORTED_CURRENCY`                                           |
| `appliedAt`                       | Fecha real con formato `YYYY-MM-DD`, no futura                                       | `INVALID_DATE`, `FUTURE_DATE`                                    |
| `appliedAt` con estado `wishlist` | No se permite: aún no se ha aplicado                                                 | `APPLIED_AT_NOT_ALLOWED`                                         |
| `tags`                            | Máx. 10; cada una 1–30 caracteres; sin repetir (sin distinguir mayúsculas ni tildes) | `TOO_MANY_TAGS`, `FIELD_TOO_LONG`, `DUPLICATED_TAG` (`meta.tag`) |
| `notes`                           | Máx. 5.000 caracteres                                                                | `FIELD_TOO_LONG`                                                 |

Errores que devuelven los casos de uso:

```ts
interface FieldIssue {
  field: string; // "company", "salary.max", "tags.2"...
  code: FieldErrorCode;
  meta?: Record<string, string | number>;
}

type ApplicationUseCaseError =
  | { code: "VALIDATION_FAILED"; issues: FieldIssue[] }
  | { code: "APPLICATION_NOT_FOUND" }
  | { code: "UNAUTHENTICATED" };
```

**Cambios respecto a [000-producto](000-producto.md):** se añaden los códigos `INVALID_OPTION`, `INVALID_DATE`, `APPLIED_AT_NOT_ALLOWED` y `VALIDATION_FAILED`. Ya incorporados a la tabla 5.3.

## 5. Casos de uso

### 5.1 `CreateApplication`

Entrada: `ApplicationDraft`. Salida: `Result<ApplicationSnapshot, ApplicationUseCaseError>`.

1. Obtiene el usuario con `SessionProvider.currentUser()`. Si no hay → `UNAUTHENTICATED`.
2. Normaliza y valida el borrador. Si hay problemas → `VALIDATION_FAILED` con todos los `issues`.
3. Crea la candidatura con `id = IdGenerator.next()`, `archived = false` y `createdAt = updatedAt = Clock.now()`.
4. Añade al historial el cambio inicial: `{ from: null, to: status, changedAt: now }`.
5. La guarda con `ApplicationRepository.save()` y devuelve su snapshot.

### 5.2 `UpdateApplicationDetails`

Entrada: `{ id: string; details: ApplicationDetailsDraft }`. Sustituye todos los campos editables (semántica de reemplazo, no de parche), porque el formulario siempre envía la candidatura completa.

1. Sin usuario → `UNAUTHENTICATED`.
2. Busca la candidatura con `findById(owner, id)`. Si no existe o es de otra persona → `APPLICATION_NOT_FOUND`. No se distinguen los dos casos, para no revelar qué ids existen.
3. Valida con las reglas de la sección 4, usando el estado **actual** de la candidatura (no se puede cambiar desde aquí; para eso está RF-05).
4. **Si no ha cambiado nada**, devuelve la candidatura tal cual, sin guardar ni tocar `updatedAt`. Así, abrir y guardar sin cambios no hace que una candidatura «parada» parezca activa (RF-10).
5. Si hay cambios: actualiza los campos, pone `updatedAt = Clock.now()`, guarda y devuelve el snapshot. El historial de estados no cambia.

### 5.3 `ValidateApplicationDraft`

Entrada: `{ draft: ApplicationDraft | ApplicationDetailsDraft; currentStatus?: ApplicationStatus }`. Salida: `FieldIssue[]`.

Síncrono y sin acceso a datos: solo usa `Clock`. Lo usan los formularios para validar mientras se escribe, con **las mismas reglas** que los casos de uso.

## 6. Puertos que introduce esta spec

```ts
interface ApplicationRepository {
  findById(owner: UserId, id: ApplicationId): Promise<Application | null>;
  save(application: Application): Promise<void>;
  // search y delete se añaden en las specs 102 y 106.
}

interface SessionProvider {
  currentUser(): Promise<UserId | null>;
}
interface Clock {
  now(): Date;
  today(): CalendarDate;
} // today() en la zona horaria del dispositivo
interface IdGenerator {
  next(): string;
} // UUID v4
```

`Application` expone `toSnapshot()` (objeto plano, inmutable y serializable) y `Application.restore(snapshot)` para que los adaptadores lo guarden y lo recuperen sin conocer sus detalles internos.

## 7. Dobles de test y suite de contrato

Se exportan desde `@applytrack/core/testing`, que no forma parte del bundle de las apps:

- `InMemoryApplicationRepository`
- `FixedClock` (fecha y hora configurables)
- `SequentialIdGenerator` (ids previsibles en los tests)
- `FakeSessionProvider` (con o sin usuario)
- `describeApplicationRepositoryContract(createRepository)`: suite común que debe pasar cualquier `ApplicationRepository`:
  - lo guardado se recupera igual (`toSnapshot()` idéntico);
  - guardar dos veces el mismo id actualiza, no duplica;
  - `findById` con otro `owner` devuelve `null`;
  - `findById` con un id inexistente devuelve `null`.

## 8. Interfaz (orientativo, se cierra en M2 y M4)

- El estado inicial aparece preseleccionado en **«Me interesa»**.
- La fecha de candidatura solo se muestra con el estado «Aplicada» y se rellena con la fecha de hoy.
- Moneda: selector con EUR, GBP y USD, con EUR por defecto.
- Errores debajo de cada campo, traducidos con `errors.<code>`. Al pulsar «Guardar» con errores, el foco va al primer campo con error.
- Al editar, si hay cambios sin guardar y se intenta salir, se pide confirmación (RF-03).
- La distribución del formulario sigue [003-responsive](003-responsive.md): una columna en móvil y dos desde `md`.

## 9. Criterios de aceptación

Cada criterio se corresponde con al menos un test de `core`.

| Id        | Criterio                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CA-100-01 | Un borrador válido con los campos obligatorios crea una candidatura en `wishlist`, sin `appliedAt`, con un único cambio en el historial (`null → wishlist`). |
| CA-100-02 | Con estado `applied` y sin `appliedAt`, la fecha de candidatura es la de hoy según `Clock`.                                                                  |
| CA-100-03 | Un borrador con varios errores devuelve `VALIDATION_FAILED` con **todos** ellos, y no se guarda nada.                                                        |
| CA-100-04 | `appliedAt` con estado `wishlist` devuelve `APPLIED_AT_NOT_ALLOWED`.                                                                                         |
| CA-100-05 | `appliedAt` en el futuro devuelve `FUTURE_DATE`; una fecha imposible (`2026-02-30`) devuelve `INVALID_DATE`.                                                 |
| CA-100-06 | `salary` con `min > max` devuelve `INVALID_SALARY_RANGE`; sin moneda se guarda en `EUR`.                                                                     |
| CA-100-07 | Las etiquetas `Vue` y `vue ` se consideran repetidas (`DUPLICATED_TAG`).                                                                                     |
| CA-100-08 | Los textos se guardan sin espacios al principio ni al final, y los opcionales vacíos se guardan como ausentes.                                               |
| CA-100-09 | Sin sesión, crear y editar devuelven `UNAUTHENTICATED` y no se guarda nada.                                                                                  |
| CA-100-10 | Editar una candidatura de otra persona devuelve `APPLICATION_NOT_FOUND`.                                                                                     |
| CA-100-11 | Editar sin cambios no guarda ni modifica `updatedAt`.                                                                                                        |
| CA-100-12 | Editar con cambios actualiza los campos y `updatedAt`, y no toca `status` ni el historial.                                                                   |
| CA-100-13 | `ValidateApplicationDraft` devuelve exactamente los mismos `issues` que `CreateApplication` para el mismo borrador.                                          |
| CA-100-14 | `InMemoryApplicationRepository` pasa la suite de contrato.                                                                                                   |
| CA-100-15 | `pnpm depcruise` sigue sin infracciones y la cobertura de `core` es ≥ 90 %.                                                                                  |
