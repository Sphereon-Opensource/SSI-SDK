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
  type CreateAuthorizationRequest,
  type CreateAuthorizationRequestPayload,
  type CreateAuthorizationResponse,
  type CreateAuthorizationResponsePayload,
  type CallbackOpts,
  type CallbackOptsPayload,
  type QRCodeOpts,
  type QRCodeOptsPayload,
  type RequestUriMethod,
  type RequestError,
  type RequestErrorPayload,
  type AuthStatusResponse,
  type AuthStatusResponsePayload,
  createAuthorizationResponseFromPayload,
  createAuthorizationRequestToPayload,
  authStatusResponseFromPayload,
  ResponseType,
  ResponseMode,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
