import { BearerTokenArg } from '@sphereon/ssi-types'

export const bearerToken = async (
  token: BearerTokenArg,
  opts?: {
    includeBearerHeader: boolean
  },
): Promise<string> => {
  const bearer = typeof token === 'string' ? token : await token()

  if (opts?.includeBearerHeader) {
    return `Bearer ${bearer}`
  }
  return bearer
}
