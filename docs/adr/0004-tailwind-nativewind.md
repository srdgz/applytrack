# ADR-0004 · Tailwind en web y NativeWind en móvil, con tokens compartidos

- **Estado:** Aceptada (actualizada el 2026-10-08)
- **Fecha:** 2026-10-05

## Contexto

Hace falta un diseño propio, responsive y coherente entre plataformas, con tema claro y oscuro. Librerías como Element Plus aceleran el arranque, pero dan un aspecto de panel de administración y no existen en React Native.

## Decisión

- **Web:** Tailwind CSS 4 con componentes propios. Los componentes accesibles complejos (diálogos, menús, combobox) se apoyan en primitivas sin estilos de **Reka UI**.
- **Móvil:** NativeWind 4.2 con Tailwind CSS 3, que es la combinación estable para Expo 57. NativeWind 5 (con Tailwind 4) sigue en _release candidate_; se migrará cuando sea estable.
- **Tokens:** `packages/design-tokens` define los colores en hexadecimal para el móvil. La web mantiene sus `oklch` en `style.css` y un test comprueba que coinciden (spec 109).

## Consecuencias

- Las clases utilitarias son casi idénticas en las dos apps.
- Hay que construir y probar los componentes propios: más trabajo inicial, pero se puede enseñar.
- Reka UI resuelve el foco y los atributos ARIA de los componentes difíciles, así no se reinventa la accesibilidad.
