/**
 * Resultado de una operación que puede fallar por una regla de negocio.
 * Ver docs/adr/0005-result-en-vez-de-excepciones.md.
 */
export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/**
 * Reúne varios resultados: devuelve todos los valores si todos son correctos,
 * o todos los errores si alguno falla (útil para validar formularios completos).
 */
export const combine = <T, E>(results: readonly Result<T, E>[]): Result<T[], E[]> => {
  const values: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (result.ok) values.push(result.value);
    else errors.push(result.error);
  }

  return errors.length > 0 ? err(errors) : ok(values);
};
