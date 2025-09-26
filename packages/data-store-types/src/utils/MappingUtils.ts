import { CredentialMapper, ObjectUtils } from '@sphereon/ssi-types'

function isHex(input: string) {
  return input.match(/^([0-9A-Fa-f])+$/g) !== null
}
export function ensureRawDocument(input: string | object): string {
  if (typeof input === 'string') {
    if (isHex(input) || ObjectUtils.isBase64(input)) {
      // mso_mdoc
      return input
    } else if (CredentialMapper.isJwtEncoded(input) || CredentialMapper.isSdJwtEncoded(input)) {
      return input
    }
    throw Error('Unknown input to be mapped as rawDocument')
  }

  try {
    return JSON.stringify(input)
  } catch (e) {
    throw new Error(`Can't stringify to a raw credential: ${input}`)
  }
}
