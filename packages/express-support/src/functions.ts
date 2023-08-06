export function env(key?: string, prefix?: string): string | undefined {
  if (!key) {
    return
  }
  return process.env[`${prefix ? prefix.trim() : ''}${key}`]
}
