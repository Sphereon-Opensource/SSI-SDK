/**
 * Provides `did:oyd` {@link @ownyourdata/did-provider-oyd#OydDIDProvider | identifier provider } for the
 * {@link @veramo/did-manager#DIDManager}
 *
 * @packageDocumentation
 */
export { OydDIDProvider, DefaultOydCmsmCallbacks, defaultOydCmsmSignCallback, defaultOydCmsmPublicKeyCallback } from './oyd-did-provider'
export { getDidOydResolver } from './resolver'
export type * from './types/oyd-provider-types'
