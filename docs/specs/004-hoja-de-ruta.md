# 004 · Hoja de ruta

| Campo   | Valor      |
| ------- | ---------- |
| Estado  | Aprobado   |
| Versión | 0.3        |
| Fecha   | 2026-10-05 |

Las estimaciones suponen **unas 20 h a la semana**. Cada hito termina con un PR mergeado, la CI en verde y un despliegue de previsualización.

Antes de cada funcionalidad se escribe su especificación (`docs/specs/1xx-<funcionalidad>.md`) con criterios de aceptación. Después se implementa, se prueba y se documenta.

| Hito                     | Contenido                                                                                                                                   | Estimación | Resultado visible                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| **M0 · Base** ✅         | Monorepo, configuración compartida, CI, `dependency-cruiser`, Husky, commitlint                                                             | 3–4 días   | Repo público con la CI en verde                                   |
| **M1 · Núcleo**          | Esqueletos de web y móvil enlazados con `core` ✅; dominio, casos de uso, `core/testing`, suite de contrato, `adapter-local` con datos demo | 1 semana   | `core` con ≥ 90 % de cobertura                                    |
| **M2 · Web (modo demo)** | Tokens, componentes base, layout responsive, i18n, tema, tablero, lista, formulario, detalle                                                | 2 semanas  | Web desplegada en Vercel que funciona sin cuenta                  |
| **M3 · Supabase**        | Migraciones, RLS, `adapter-supabase`, enlace mágico, preferencias en el perfil                                                              | 1 semana   | Web con cuentas reales                                            |
| **M4 · Móvil**           | Expo + NativeWind, mismas pantallas que la web, AsyncStorage para el modo demo                                                              | 2 semanas  | App que se abre en Expo Go con un QR y APK de Android descargable |
| **M5 · Calidad**         | E2E con Playwright a 4 anchos, axe, Maestro, Lighthouse, README con capturas y GIF                                                          | 3–4 días   | Proyecto listo para el portfolio                                  |

**Total MVP:** de 6,5 a 8 semanas.

**Cambio en la versión 0.3:** los esqueletos de la web (Vue 3 + Vite + Tailwind) y del móvil (Expo SDK 57) se adelantan a M1, para poder ver los avances en `localhost` y en Expo Go desde el principio. NativeWind sigue previsto para M4.

## Funcionalidades por especificar (en orden)

1. [`100-crear-y-editar-candidatura.md`](100-crear-y-editar-candidatura.md) (RF-02, RF-03), aprobada
2. `101-cambio-de-estado.md` (RF-05)
3. `102-tablero-y-lista.md` (RF-06, RF-07, RF-08)
4. `103-modo-demo.md` (RF-09)
5. `104-autenticacion.md` (RF-01, RF-11)
6. `105-panel-estadisticas.md` (RF-10)
7. `106-archivar-y-eliminar.md` (RF-04)
