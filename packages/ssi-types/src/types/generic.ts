/**
 * Accept a Type or a Promise of that Type.
 *
 * @internal
 */
export type OrPromise<T> = T | Promise<T>
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type BearerTokenArg = (() => Promise<string>) | string
