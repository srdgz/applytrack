# ADR-0005 · `Result` y códigos de error en lugar de excepciones

- **Estado:** Propuesta
- **Fecha:** 2026-10-05

## Contexto

Los errores de negocio (validación, transición no permitida) son esperables y la UI tiene que mostrarlos traducidos. Con excepciones, el tipo de error no aparece en la firma de la función y es fácil olvidarse de manejarlo.

## Decisión

- Los métodos del dominio y los casos de uso devuelven `Result<T, DomainError>` (`{ ok: true, value } | { ok: false, error }`).
- `DomainError` lleva un `code` de una unión cerrada, más `field` y `meta` opcionales. La UI lo traduce con la clave `errors.<code>`.
- Las excepciones se reservan para fallos inesperados (red, bug). Los capturan los adaptadores primarios y se muestran con un mensaje genérico.

## Consecuencias

- TypeScript obliga a comprobar `ok` antes de usar el valor.
- `core` no depende del idioma.
- Algo más de código que con `throw`. Se compensa con helpers pequeños (`ok`, `err`, `combine`) sin librerías externas.
