import { HttpInfo } from '../http/http'
import { Configuration } from '../configuration'
import { Observable } from '../rxjsStub'
import { CreateEcKeyRequest } from '../models/CreateEcKeyRequest'
import { KeyVaultKey } from '../models/KeyVaultKey'
import { SignPayloadDTO } from '../models/SignPayloadDTO'
import { SignPayloadResponse } from '../models/SignPayloadResponse'
import { VerifyPayloadDTO } from '../models/VerifyPayloadDTO'
import { KeyVaultControllerApiRequestFactory, KeyVaultControllerApiResponseProcessor } from '../apis/KeyVaultControllerApi'
export declare class ObservableKeyVaultControllerApi {
  private requestFactory
  private responseProcessor
  private configuration
  constructor(
    configuration: Configuration,
    requestFactory?: KeyVaultControllerApiRequestFactory,
    responseProcessor?: KeyVaultControllerApiResponseProcessor
  )
  createEcKeyWithHttpInfo(createEcKeyRequest: CreateEcKeyRequest, _options?: Configuration): Observable<HttpInfo<KeyVaultKey>>
  createEcKey(createEcKeyRequest: CreateEcKeyRequest, _options?: Configuration): Observable<KeyVaultKey>
  getKeyWithHttpInfo(keyName: string, _options?: Configuration): Observable<HttpInfo<KeyVaultKey>>
  getKey(keyName: string, _options?: Configuration): Observable<KeyVaultKey>
  signPayloadWithHttpInfo(signPayloadDTO: SignPayloadDTO, _options?: Configuration): Observable<HttpInfo<SignPayloadResponse>>
  signPayload(signPayloadDTO: SignPayloadDTO, _options?: Configuration): Observable<SignPayloadResponse>
  verifyPayloadWithHttpInfo(verifyPayloadDTO: VerifyPayloadDTO, _options?: Configuration): Observable<HttpInfo<boolean>>
  verifyPayload(verifyPayloadDTO: VerifyPayloadDTO, _options?: Configuration): Observable<boolean>
}
