export * from './auth-model'
export * from './utils'

// We are exporting some common class from SIOP
/**
 * @private
 */
export {
  decodeUriAsJson,
  encodeJsonAsURI,
  AuthorizationResponsePayload,
  AuthorizationRequestPayload,
  URI,
  AuthorizationRequestState,
  RequestObjectPayload,
  AuthorizationRequest,
  AuthorizationResponse,
  RP,
  OP,
  OPBuilder,
  SupportedVersion,
  PresentationDefinitionWithLocation,
  PresentationVerificationResult,
  PresentationVerificationCallback,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
