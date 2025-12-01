import { HttpInfo } from '../http/http'
import { Configuration } from '../configuration'
import { CreateEcKeyRequest } from '../models/CreateEcKeyRequest'
import { KeyVaultKey } from '../models/KeyVaultKey'
import { SignPayloadDTO } from '../models/SignPayloadDTO'
import { SignPayloadResponse } from '../models/SignPayloadResponse'
import { VerifyPayloadDTO } from '../models/VerifyPayloadDTO'
import { KeyVaultControllerApiRequestFactory, KeyVaultControllerApiResponseProcessor } from '../apis/KeyVaultControllerApi'
export declare class PromiseKeyVaultControllerApi {
  private api
  constructor(
    configuration: Configuration,
    requestFactory?: KeyVaultControllerApiRequestFactory,
    responseProcessor?: KeyVaultControllerApiResponseProcessor,
  )
  createEcKeyWithHttpInfo(createEcKeyRequest: CreateEcKeyRequest, _options?: Configuration): Promise<HttpInfo<KeyVaultKey>>
  createEcKey(createEcKeyRequest: CreateEcKeyRequest, _options?: Configuration): Promise<KeyVaultKey>
  getKeyWithHttpInfo(keyName: string, _options?: Configuration): Promise<HttpInfo<KeyVaultKey>>
  getKey(keyName: string, _options?: Configuration): Promise<KeyVaultKey>
  signPayloadWithHttpInfo(signPayloadDTO: SignPayloadDTO, _options?: Configuration): Promise<HttpInfo<SignPayloadResponse>>
  signPayload(signPayloadDTO: SignPayloadDTO, _options?: Configuration): Promise<SignPayloadResponse>
  verifyPayloadWithHttpInfo(verifyPayloadDTO: VerifyPayloadDTO, _options?: Configuration): Promise<HttpInfo<boolean>>
  verifyPayload(verifyPayloadDTO: VerifyPayloadDTO, _options?: Configuration): Promise<boolean>
}
