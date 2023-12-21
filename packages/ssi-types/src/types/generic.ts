/**
 * Accept a Type or a Promise of that Type.
 *
 * @internal
 */
export type OrPromise<T> = T | Promise<T>

export type BearerTokenArg = (() => Promise<string>) | string
