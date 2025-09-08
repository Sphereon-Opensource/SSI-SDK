import { HttpInfo } from '../http/http'
import { Configuration } from '../configuration'
import { CreateEcKeyRequest } from '../models/CreateEcKeyRequest'
import { KeyVaultKey } from '../models/KeyVaultKey'
import { SignPayloadDTO } from '../models/SignPayloadDTO'
import { SignPayloadResponse } from '../models/SignPayloadResponse'
import { VerifyPayloadDTO } from '../models/VerifyPayloadDTO'
import { KeyVaultControllerApiRequestFactory, KeyVaultControllerApiResponseProcessor } from '../apis/KeyVaultControllerApi'
export interface KeyVaultControllerApiCreateEcKeyRequest {
  createEcKeyRequest: CreateEcKeyRequest
}
export interface KeyVaultControllerApiGetKeyRequest {
  keyName: string
}
export interface KeyVaultControllerApiSignPayloadRequest {
  signPayloadDTO: SignPayloadDTO
}
export interface KeyVaultControllerApiVerifyPayloadRequest {
  verifyPayloadDTO: VerifyPayloadDTO
}
export declare class ObjectKeyVaultControllerApi {
  private api
  constructor(
    configuration: Configuration,
    requestFactory?: KeyVaultControllerApiRequestFactory,
    responseProcessor?: KeyVaultControllerApiResponseProcessor
  )
  createEcKeyWithHttpInfo(param: KeyVaultControllerApiCreateEcKeyRequest, options?: Configuration): Promise<HttpInfo<KeyVaultKey>>
  createEcKey(param: KeyVaultControllerApiCreateEcKeyRequest, options?: Configuration): Promise<KeyVaultKey>
  getKeyWithHttpInfo(param: KeyVaultControllerApiGetKeyRequest, options?: Configuration): Promise<HttpInfo<KeyVaultKey>>
  getKey(param: KeyVaultControllerApiGetKeyRequest, options?: Configuration): Promise<KeyVaultKey>
  signPayloadWithHttpInfo(param: KeyVaultControllerApiSignPayloadRequest, options?: Configuration): Promise<HttpInfo<SignPayloadResponse>>
  signPayload(param: KeyVaultControllerApiSignPayloadRequest, options?: Configuration): Promise<SignPayloadResponse>
  verifyPayloadWithHttpInfo(param: KeyVaultControllerApiVerifyPayloadRequest, options?: Configuration): Promise<HttpInfo<boolean>>
  verifyPayload(param: KeyVaultControllerApiVerifyPayloadRequest, options?: Configuration): Promise<boolean>
}
