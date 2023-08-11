export * from './auth-model.mjs'
export * from './utils.mjs'

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
  OPBuilder,
  SupportedVersion,
  SigningAlgo,
  PresentationDefinitionWithLocation,
  PresentationVerificationResult,
  PresentationVerificationCallback,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
