export * from './auth-model'
export * from './utils'

// We are exporting some common class from SIOP
/**
 * @private
 */
export {
  decodeUriAsJson,
  encodeJsonAsURI,
  URI,
  AuthorizationRequest,
  AuthorizationResponse,
  RP,
  OP,
  OPBuilder,
  SupportedVersion,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'

export type {
  RequestObjectPayload,
  AuthorizationRequestState,
  AuthorizationResponsePayload,
  AuthorizationRequestPayload,
  PresentationVerificationResult,
  PresentationVerificationCallback,
} from '@sphereon/did-auth-siop'
