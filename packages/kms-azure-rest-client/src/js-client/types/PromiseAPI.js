import { ObservableKeyVaultControllerApi } from './ObservableAPI'
export class PromiseKeyVaultControllerApi {
  constructor(configuration, requestFactory, responseProcessor) {
    this.api = new ObservableKeyVaultControllerApi(configuration, requestFactory, responseProcessor)
  }
  createEcKeyWithHttpInfo(createEcKeyRequest, _options) {
    const result = this.api.createEcKeyWithHttpInfo(createEcKeyRequest, _options)
    return result.toPromise()
  }
  createEcKey(createEcKeyRequest, _options) {
    const result = this.api.createEcKey(createEcKeyRequest, _options)
    return result.toPromise()
  }
  getKeyWithHttpInfo(keyName, _options) {
    const result = this.api.getKeyWithHttpInfo(keyName, _options)
    return result.toPromise()
  }
  getKey(keyName, _options) {
    const result = this.api.getKey(keyName, _options)
    return result.toPromise()
  }
  signPayloadWithHttpInfo(signPayloadDTO, _options) {
    const result = this.api.signPayloadWithHttpInfo(signPayloadDTO, _options)
    return result.toPromise()
  }
  signPayload(signPayloadDTO, _options) {
    const result = this.api.signPayload(signPayloadDTO, _options)
    return result.toPromise()
  }
  verifyPayloadWithHttpInfo(verifyPayloadDTO, _options) {
    const result = this.api.verifyPayloadWithHttpInfo(verifyPayloadDTO, _options)
    return result.toPromise()
  }
  verifyPayload(verifyPayloadDTO, _options) {
    const result = this.api.verifyPayload(verifyPayloadDTO, _options)
    return result.toPromise()
  }
}
//# sourceMappingURL=PromiseAPI.js.map
