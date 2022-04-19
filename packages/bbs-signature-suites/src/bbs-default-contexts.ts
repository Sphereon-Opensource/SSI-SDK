import { schemaOrg, v3_unstable, vc_example_vocab, citizen_vocab, credential_vocab, jws, odrl, bbs } from './contexts'

/**
 * Provides a hardcoded map of common context definitions
 */
export const LdDefaultContexts = new Map([
  ['https://w3id.org/security/v3-unstable', v3_unstable],
  ['https://www.w3id.org/security/v3-unstable', v3_unstable],
  ['https://www.w3.org/2018/credentials/examples/v1', vc_example_vocab],
  ['https://www.w3.org/2018/credentials/v1', credential_vocab],
  ['https://www.w3.org/ns/odrl.jsonld', odrl],
  ['https://w3id.org/security/suites/jws-2020/v1', jws],
  ['https://w3id.org/citizenship/v1', citizen_vocab],
  ['https://w3id.org/security/bbs/v1', bbs],
  ['https://schema.org', schemaOrg],
  ['https://schema.org/', schemaOrg],
  ['http://schema.org/', schemaOrg],
])
