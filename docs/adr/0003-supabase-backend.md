# ADR-0003 · Supabase como backend

- **Estado:** Propuesta
- **Fecha:** 2026-10-05

## Contexto

El proyecto es frontend. Hace falta autenticación, una base de datos con aislamiento por usuario y un plan gratuito suficiente para un portfolio.

## Decisión

**Supabase**: Auth con enlace mágico, Postgres con Row Level Security y migraciones SQL versionadas en `supabase/`. El SDK `@supabase/supabase-js` funciona igual en web y en React Native.

## Consecuencias

- La seguridad entre usuarios se garantiza en base de datos (RLS), no solo en el cliente.
- Supabase local (`supabase start`) permite ejecutar la suite de contrato del repositorio en CI.
- Como solo vive en `adapter-supabase`, cambiar de proveedor no afecta a `core` ni a las apps.
- **Alternativas descartadas:** Firebase (Firestore encaja peor con las consultas y filtros del listado) y AWS Amplify (ya aparece en la experiencia profesional; Supabase añade una tecnología nueva y un modelo relacional).
