export function env(key?: string, prefix?: string): string | undefined {
  if (!key) {
    return undefined
  }
  return process.env[`${prefix ? prefix.trim() : ''}${key}`]
}
