import { IParsedDID } from '@sphereon/ssi-types'

export const parseDid = (did: string): IParsedDID => {
  const parsedDid = parse(did)
  if (parsedDid === null) {
    throw new Error('invalid did')
  }

  return parsedDid
}

const parse = (didUrl: string): IParsedDID | null => {
  const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
  const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
  const METHOD = '([a-z0-9]+)'
  const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
  const PARAM_CHAR = '[a-zA-Z0-9_.:%-]'
  const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`
  const PARAMS = `((${PARAM})*)`
  const PATH = `(/[^#?]*)?`
  const QUERY = `([?][^#]*)?`
  const FRAGMENT = `(#.*)?`
  const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`)

  if (didUrl === '' || !didUrl) return null
  const sections = didUrl.match(DID_MATCHER)
  if (sections) {
    const parts: IParsedDID = {
      did: `did:${sections[1]}:${sections[2]}`,
      method: sections[1],
      id: sections[2],
      didUrl,
    }
    if (sections[4]) {
      const params = sections[4].slice(1).split(';')
      parts.params = {}
      for (const p of params) {
        const kv = p.split('=')
        parts.params[kv[0]] = kv[1]
      }
    }
    if (sections[6]) parts.path = sections[6]
    if (sections[7]) parts.query = sections[7].slice(1)
    if (sections[8]) parts.fragment = sections[8].slice(1)
    return parts
  }

  return null
}
