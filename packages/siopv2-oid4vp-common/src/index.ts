export * from './auth-model'
export * from './utils'

// We are exporting some common class from SIOP
/**
 * @private
 */
export {
  decodeUriAsJson,
  encodeJsonAsURI,
  type AuthorizationResponsePayload,
  type AuthorizationRequestPayload,
  URI,
  type AuthorizationRequestState,
  type RequestObjectPayload,
  AuthorizationRequest,
  AuthorizationResponse,
  RP,
  OP,
  OPBuilder,
  SupportedVersion,
  type PresentationVerificationResult,
  type PresentationVerificationCallback,
} from '@sphereon/did-auth-siop'
