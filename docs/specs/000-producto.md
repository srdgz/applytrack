# 000 · Especificación de producto

| Campo   | Valor      |
| ------- | ---------- |
| Estado  | Aprobado   |
| Versión | 0.3        |
| Fecha   | 2026-10-05 |

## 1. Visión

ApplyTrack es un gestor de candidaturas de empleo para personas que están buscando trabajo activamente. Sustituye la hoja de cálculo de siempre: reúne en un solo sitio cada oferta, el estado en que se encuentra, las entrevistas y lo que se ha hablado en cada una.

Hay un cliente web (Vue 3) y una app móvil (React Native). Comparten la misma lógica de negocio y los mismos datos.

## 2. Usuarios

| Perfil                                                        | Necesidad principal                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Persona que busca empleo** (usuaria principal)              | Registrar candidaturas rápido, ver de un vistazo en qué punto está cada una y no olvidar los seguimientos. |
| **Reclutador/a que visita el portfolio** (usuario secundario) | Probar la app en menos de un minuto, sin registrarse.                                                      |

El segundo perfil condiciona una decisión de producto: hay un **modo demo** con datos de ejemplo que no necesita cuenta (ver RF-09).

## 3. Glosario

| Término (ES)     | Término en código (EN) | Definición                                                                           |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Candidatura      | `Application`          | Una oferta concreta a la que la persona usuaria se plantea aplicar o ya ha aplicado. |
| Estado           | `ApplicationStatus`    | Fase del proceso en que está una candidatura.                                        |
| Cambio de estado | `StatusChange`         | Registro histórico de cada transición, con fecha y nota opcional.                    |
| Entrevista       | `Interview`            | Evento programado dentro de una candidatura (fase 2).                                |
| Fuente           | `ApplicationSource`    | Canal por el que llegó la oferta (LinkedIn, InfoJobs, referido...).                  |
| Modalidad        | `WorkMode`             | Remoto, híbrido o presencial.                                                        |

**Regla:** el código, los nombres de base de datos y los commits van en inglés. Los textos de interfaz se traducen (ver [002-i18n](002-i18n.md)).

## 4. Alcance

### 4.1 MVP (versión 1.0)

- Autenticación por email (enlace mágico).
- Crear, editar, archivar y eliminar candidaturas.
- Cambiar el estado de una candidatura, guardando el historial.
- Vista de tablero (kanban) y vista de lista, con búsqueda y filtros.
- Panel con estadísticas básicas.
- Modo demo sin cuenta.
- Español e inglés.
- Tema claro y oscuro.
- Responsive en web y adaptable a móvil y tableta en la app.

### 4.2 Fase 2

- Entrevistas con fecha, tipo y notas.
- Recordatorios de seguimiento (notificaciones locales en móvil, aviso en la web). Son notificaciones locales y no push remotas, porque las push exigen cuentas de desarrollador de Apple y Google (ver [ADR-0006](../adr/0006-distribucion-movil-sin-tiendas.md)).
- Contactos por candidatura (nombre, cargo, email, LinkedIn).
- Exportar a CSV.

### 4.3 Fuera de alcance

- Importar ofertas desde portales mediante scraping.
- Funciones colaborativas o multiusuario sobre las mismas candidaturas.
- Generar cartas de presentación o CV.
- Modo sin conexión completo en móvil (se valorará después de la fase 2).

## 5. Modelo de dominio

### 5.1 Candidatura (`Application`)

| Campo                     | Tipo                   | Obligatorio | Reglas                                                                                        |
| ------------------------- | ---------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `id`                      | `ApplicationId` (UUID) | Sí          | Lo genera el sistema.                                                                         |
| `ownerId`                 | `UserId`               | Sí          | Usuario propietario.                                                                          |
| `company`                 | `string`               | Sí          | 1–120 caracteres, sin espacios al principio ni al final.                                      |
| `position`                | `string`               | Sí          | 1–120 caracteres.                                                                             |
| `jobUrl`                  | `Url`                  | No          | URL `http` o `https` válida.                                                                  |
| `source`                  | `ApplicationSource`    | Sí          | `linkedin`, `infojobs`, `tecnoempleo`, `company_site`, `referral`, `recruiter`, `other`.      |
| `location`                | `string`               | No          | Máx. 120 caracteres.                                                                          |
| `workMode`                | `WorkMode`             | Sí          | `remote`, `hybrid`, `onsite`.                                                                 |
| `salary`                  | `SalaryRange`          | No          | `min ≤ max`, ambos > 0, moneda `EUR`, `GBP` o `USD` (por defecto `EUR`), siempre bruto anual. |
| `status`                  | `ApplicationStatus`    | Sí          | Ver 5.2. Valor inicial: `wishlist` (por defecto) o `applied`.                                 |
| `appliedAt`               | `Date`                 | Condicional | Obligatorio desde que el estado es `applied` o posterior. No puede ser futura.                |
| `tags`                    | `string[]`             | No          | Máx. 10 etiquetas de 1–30 caracteres; sin duplicados (sin distinguir mayúsculas).             |
| `notes`                   | `string`               | No          | Máx. 5.000 caracteres. Texto plano.                                                           |
| `archived`                | `boolean`              | Sí          | Por defecto `false`.                                                                          |
| `history`                 | `StatusChange[]`       | Sí          | Se añade a ella; nunca se edita.                                                              |
| `createdAt` / `updatedAt` | `Date`                 | Sí          | Los gestiona el sistema.                                                                      |

### 5.2 Estados y transiciones

```
                ┌──────────────────────────────────────────────┐
                │                                              ▼
 wishlist ──► applied ──► screening ──► interviewing ──► offer ──► accepted
    │            │            │              │             │
    └────────────┴────────────┴──────────────┴─────────────┴──► rejected | withdrawn | no_response
```

| Desde                               | Puede pasar a                                                       |
| ----------------------------------- | ------------------------------------------------------------------- |
| `wishlist`                          | `applied`, `withdrawn`                                              |
| `applied`                           | `screening`, `interviewing`, `rejected`, `withdrawn`, `no_response` |
| `screening`                         | `interviewing`, `offer`, `rejected`, `withdrawn`, `no_response`     |
| `interviewing`                      | `offer`, `rejected`, `withdrawn`, `no_response`                     |
| `offer`                             | `accepted`, `rejected`, `withdrawn`                                 |
| `no_response`                       | `screening`, `interviewing`, `rejected` (la empresa contesta tarde) |
| `accepted`, `rejected`, `withdrawn` | Ninguno (estados finales)                                           |

- **Activos:** `wishlist`, `applied`, `screening`, `interviewing`, `offer`.
- **Cerrados:** `accepted`, `rejected`, `withdrawn`, `no_response`.
- Una transición no permitida devuelve el error de dominio `INVALID_STATUS_TRANSITION` y no modifica nada.
- Cada transición válida añade un `StatusChange { from, to, changedAt, note? }` al historial.
- Al pasar a `applied` sin `appliedAt`, se rellena con la fecha de la transición.

### 5.3 Errores de dominio

El dominio no lanza mensajes de texto: devuelve **códigos de error** que la interfaz traduce. Así el núcleo no sabe nada del idioma.

| Código                             | Cuándo                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `REQUIRED_FIELD`                   | Falta un campo obligatorio.                                                                        |
| `FIELD_TOO_LONG`                   | Se supera la longitud máxima.                                                                      |
| `INVALID_URL`                      | `jobUrl` no es una URL válida.                                                                     |
| `INVALID_SALARY_RANGE`             | `min > max` o algún valor ≤ 0.                                                                     |
| `UNSUPPORTED_CURRENCY`             | Moneda distinta de `EUR`, `GBP` o `USD`.                                                           |
| `FUTURE_DATE`                      | `appliedAt` es una fecha futura.                                                                   |
| `INVALID_DATE`                     | `appliedAt` no es una fecha real con formato `YYYY-MM-DD`.                                         |
| `APPLIED_AT_NOT_ALLOWED`           | `appliedAt` con estado `wishlist`.                                                                 |
| `INVALID_OPTION`                   | Valor fuera de una lista cerrada (fuente, modalidad, estado).                                      |
| `TOO_MANY_TAGS` / `DUPLICATED_TAG` | Fallan las reglas de etiquetas.                                                                    |
| `INVALID_STATUS_TRANSITION`        | Transición no permitida (ver 5.2).                                                                 |
| `APPLICATION_NOT_FOUND`            | El id no existe o no pertenece al usuario.                                                         |
| `UNAUTHENTICATED`                  | Operación que exige sesión, hecha sin ella.                                                        |
| `VALIDATION_FAILED`                | Agrupa todos los errores de campo de un formulario (ver [100](100-crear-y-editar-candidatura.md)). |

## 6. Requisitos funcionales

### RF-01 · Autenticación

- Registro e inicio de sesión con enlace mágico por email (Supabase Auth).
- Cerrar sesión desde cualquier pantalla.
- Cada persona solo puede ver y modificar sus propias candidaturas. Se garantiza también en base de datos con Row Level Security, no solo en el cliente.

### RF-02 · Crear candidatura

- Formulario con los campos de 5.1. Obligatorios: empresa, puesto, fuente, modalidad y estado inicial.
- El estado inicial aparece preseleccionado en «Me interesa» (`wishlist`) y se puede cambiar a «Aplicada» (`applied`).
- Validación en el momento, con mensajes traducidos.
- Al guardar, vuelve a la vista desde la que se abrió y muestra una confirmación.

### RF-03 · Editar candidatura

- Se pueden editar todos los campos menos `status`, que solo cambia con RF-05.
- Si hay cambios sin guardar y se intenta salir, se pide confirmación.

### RF-04 · Archivar y eliminar

- **Archivar** oculta la candidatura de las vistas por defecto. Se puede deshacer.
- **Eliminar** es definitivo y pide confirmación expresa.

### RF-05 · Cambiar estado

- Desde el detalle de la candidatura (selector con las transiciones permitidas) o arrastrando la tarjeta en el tablero.
- En el tablero, al arrastrar a una columna no permitida la tarjeta vuelve a su sitio y se explica por qué.
- Nota opcional por cada cambio.
- **Accesibilidad:** arrastrar nunca es la única forma; siempre hay una alternativa con teclado o con botones.

### RF-06 · Vista de tablero

- Una columna por estado activo, más una columna «Cerradas» que agrupa los cuatro estados cerrados.
- Cada tarjeta muestra empresa, puesto, modalidad, días desde la última actualización y etiquetas.

### RF-07 · Vista de lista

- Tabla en escritorio y tarjetas apiladas en pantallas estrechas.
- Ordenar por empresa, fecha de candidatura o última actualización.
- Paginación o carga incremental a partir de 50 elementos.

### RF-08 · Búsqueda y filtros

- Búsqueda de texto en empresa, puesto y etiquetas, sin distinguir mayúsculas ni tildes.
- Filtros: estado, modalidad, fuente, etiqueta y archivadas sí/no.
- En la web, los filtros se reflejan en la URL para poder compartirlos y que el botón «atrás» funcione.

### RF-09 · Modo demo

- Botón «Probar sin cuenta» en la pantalla de inicio.
- Carga unas 15 candidaturas de ejemplo repartidas por todos los estados y en el idioma activo.
- Los datos viven solo en el dispositivo (`localStorage` en web, almacenamiento local en móvil). Un aviso permanente indica que se está en modo demo.
- Se puede reiniciar la demo en cualquier momento.

### RF-10 · Panel de estadísticas

- Número de candidaturas por estado.
- Tasa de respuesta: candidaturas que han pasado de `applied` / total de las que han llegado a `applied`.
- Candidaturas enviadas por semana (últimas 8 semanas).
- Candidaturas «paradas»: activas y sin cambios en más de 14 días.

### RF-11 · Preferencias

- Idioma (español / inglés) y tema (claro / oscuro / sistema).
- Se guardan en el dispositivo y, con sesión iniciada, también en el perfil, para conservarlas entre dispositivos.

## 7. Requisitos no funcionales

| Id     | Requisito                  | Criterio verificable                                                                                                                                                     |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RNF-01 | **Arquitectura hexagonal** | El paquete `core` no importa nada de Vue, React, React Native ni Supabase. Una regla de lint lo hace cumplir en CI. Ver [001-arquitectura](001-arquitectura.md).         |
| RNF-02 | **SOLID**                  | Cada caso de uso es una clase o función con una sola responsabilidad y recibe sus dependencias por constructor. Ver 001, sección 5.                                      |
| RNF-03 | **Responsive**             | Sin scroll horizontal ni contenido cortado de 320 px a 2560 px de ancho. Ver [003-responsive](003-responsive.md).                                                        |
| RNF-04 | **i18n**                   | Español e inglés al 100 %. Un test de CI falla si a un idioma le falta alguna clave. Ver [002-i18n](002-i18n.md).                                                        |
| RNF-05 | **Accesibilidad**          | WCAG 2.2 AA. Sin infracciones graves de axe en las pantallas principales. Todo se puede usar con teclado y lector de pantalla.                                           |
| RNF-06 | **Rendimiento web**        | Lighthouse ≥ 90 en Performance y Accessibility en móvil. JS inicial < 200 KB comprimido.                                                                                 |
| RNF-07 | **Testing**                | `core` con ≥ 90 % de cobertura de líneas. Flujos principales cubiertos con E2E (Playwright en web, Maestro en móvil).                                                    |
| RNF-08 | **CI/CD**                  | Cada PR pasa lint, typecheck y tests. `main` despliega la web en Vercel, con previsualización por PR. El móvil no se publica: se ejecuta desde el código (ver ADR-0006). |
| RNF-09 | **Seguridad**              | RLS activado en todas las tablas. Ninguna clave privada en el cliente. Variables por entorno.                                                                            |

## 8. Criterios de aceptación del MVP

```gherkin
Escenario: crear una candidatura válida
  Dado que he iniciado sesión
  Cuando creo una candidatura con empresa "Acme", puesto "Frontend Developer",
       fuente "linkedin", modalidad "remote" y estado "applied"
  Entonces aparece en la columna "Aplicadas" del tablero
  Y su fecha de candidatura es hoy

Escenario: transición no permitida
  Dado una candidatura en estado "wishlist"
  Cuando intento moverla a "offer"
  Entonces la candidatura sigue en "wishlist"
  Y veo un mensaje que explica que esa transición no está permitida, en el idioma activo

Escenario: historial de estados
  Dado una candidatura que ha pasado por "applied" y "screening"
  Cuando abro su detalle
  Entonces veo los dos cambios ordenados por fecha, con sus notas

Escenario: cambio de idioma
  Dado que la interfaz está en español
  Cuando cambio el idioma a inglés
  Entonces todos los textos, fechas y cifras se muestran en inglés sin recargar
  Y la preferencia se conserva al volver a abrir la app

Escenario: modo demo
  Dado que no tengo cuenta
  Cuando pulso "Probar sin cuenta"
  Entonces veo el tablero con candidaturas de ejemplo
  Y un aviso indica que estoy en modo demo

Escenario: aislamiento entre usuarios
  Dado dos usuarios A y B con candidaturas propias
  Cuando A consulta la base de datos directamente con su token
  Entonces no obtiene ninguna candidatura de B
```

## 9. Decisiones de la revisión

| #   | Pregunta                     | Decisión                                                                                                                          |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Estado inicial por defecto   | `wishlist` («Me interesa»).                                                                                                       |
| 2   | Monedas del salario          | `EUR`, `GBP` y `USD`.                                                                                                             |
| 3   | Distribución de la app móvil | Solo versiones de prueba, sin tiendas ni cuentas de desarrollador. Ver [ADR-0006](../adr/0006-distribucion-movil-sin-tiendas.md). |
| 4   | Idioma de la documentación   | Español por ahora; se traducirá si se empieza a aplicar a ofertas en inglés. La interfaz de la app sigue siendo bilingüe.         |
