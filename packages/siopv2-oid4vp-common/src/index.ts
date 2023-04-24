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
  CheckLinkedDomain,
  URI,
  AuthorizationRequestState,
  RequestObjectPayload,
  AuthorizationRequest,
  AuthorizationResponse,
  RP,
  OP,
  SupportedVersion,
  SigningAlgo,
  PresentationDefinitionWithLocation,
  PresentationVerificationResult,
  PresentationVerificationCallback,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
