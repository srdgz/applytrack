# ADR-0004 · Tailwind en web y NativeWind en móvil, con tokens compartidos

- **Estado:** Propuesta
- **Fecha:** 2026-10-05

## Contexto

Hace falta un diseño propio, responsive y coherente entre plataformas, con tema claro y oscuro. Librerías como Element Plus aceleran el arranque, pero dan un aspecto de panel de administración y no existen en React Native.

## Decisión

- **Web:** Tailwind CSS 4 con componentes propios. Los componentes accesibles complejos (diálogos, menús, combobox) se apoyan en primitivas sin estilos de **Reka UI**.
- **Móvil:** NativeWind 4.
- **Tokens:** `packages/design-tokens` define colores, espaciados, radios, tipografía y breakpoints en un único sitio y genera la configuración de los dos lados.

## Consecuencias

- Las clases utilitarias son casi idénticas en las dos apps.
- Hay que construir y probar los componentes propios: más trabajo inicial, pero se puede enseñar.
- Reka UI resuelve el foco y los atributos ARIA de los componentes difíciles, así no se reinventa la accesibilidad.
