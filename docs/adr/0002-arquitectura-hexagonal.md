# ADR-0002 · Arquitectura hexagonal con núcleo compartido

- **Estado:** Propuesta
- **Fecha:** 2026-10-05

## Contexto

Las reglas de negocio (validaciones, transiciones de estado, estadísticas) tienen que ser idénticas en web y móvil. Además, el modo demo necesita la misma lógica con otro almacenamiento.

## Decisión

Arquitectura de **puertos y adaptadores**:

- `packages/core` contiene dominio y casos de uso, sin dependencias de runtime.
- La persistencia y la sesión son puertos de salida, con dos implementaciones: `adapter-supabase` y `adapter-local`.
- Las apps son adaptadores primarios y solo conectan las piezas en su raíz de composición (`src/di`).
- Las reglas de dependencia se comprueban en CI con `dependency-cruiser`.

## Consecuencias

- El modo demo y los E2E web no necesitan backend: basta con cambiar el adaptador.
- Las reglas de negocio se prueban una sola vez, rápido y sin red.
- Hay más archivos y más indirección que poniendo la lógica en stores. Se acepta, porque demostrar esta separación es uno de los objetivos del proyecto.
- **Alternativa descartada:** lógica en stores de Pinia y Zustand. Obligaría a duplicar las reglas en dos frameworks.
