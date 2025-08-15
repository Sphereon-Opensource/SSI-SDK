import { BaseAPIRequestFactory } from './baseapi'
import { Configuration } from '../configuration'
import { RequestContext, ResponseContext, HttpInfo } from '../http/http'
import { CreateEcKeyRequest } from '../models/CreateEcKeyRequest'
import { KeyVaultKey } from '../models/KeyVaultKey'
import { SignPayloadDTO } from '../models/SignPayloadDTO'
import { SignPayloadResponse } from '../models/SignPayloadResponse'
import { VerifyPayloadDTO } from '../models/VerifyPayloadDTO'
export declare class KeyVaultControllerApiRequestFactory extends BaseAPIRequestFactory {
  createEcKey(createEcKeyRequest: CreateEcKeyRequest, _options?: Configuration): Promise<RequestContext>
  getKey(keyName: string, _options?: Configuration): Promise<RequestContext>
  signPayload(signPayloadDTO: SignPayloadDTO, _options?: Configuration): Promise<RequestContext>
  verifyPayload(verifyPayloadDTO: VerifyPayloadDTO, _options?: Configuration): Promise<RequestContext>
}
export declare class KeyVaultControllerApiResponseProcessor {
  createEcKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<KeyVaultKey>>
  getKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<KeyVaultKey>>
  signPayloadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SignPayloadResponse>>
  verifyPayloadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<boolean>>
}
