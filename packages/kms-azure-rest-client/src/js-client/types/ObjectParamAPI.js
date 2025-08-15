import { ObservableKeyVaultControllerApi } from './ObservableAPI'
export class ObjectKeyVaultControllerApi {
  constructor(configuration, requestFactory, responseProcessor) {
    this.api = new ObservableKeyVaultControllerApi(configuration, requestFactory, responseProcessor)
  }
  createEcKeyWithHttpInfo(param, options) {
    return this.api.createEcKeyWithHttpInfo(param.createEcKeyRequest, options).toPromise()
  }
  createEcKey(param, options) {
    return this.api.createEcKey(param.createEcKeyRequest, options).toPromise()
  }
  getKeyWithHttpInfo(param, options) {
    return this.api.getKeyWithHttpInfo(param.keyName, options).toPromise()
  }
  getKey(param, options) {
    return this.api.getKey(param.keyName, options).toPromise()
  }
  signPayloadWithHttpInfo(param, options) {
    return this.api.signPayloadWithHttpInfo(param.signPayloadDTO, options).toPromise()
  }
  signPayload(param, options) {
    return this.api.signPayload(param.signPayloadDTO, options).toPromise()
  }
  verifyPayloadWithHttpInfo(param, options) {
    return this.api.verifyPayloadWithHttpInfo(param.verifyPayloadDTO, options).toPromise()
  }
  verifyPayload(param, options) {
    return this.api.verifyPayload(param.verifyPayloadDTO, options).toPromise()
  }
}
//# sourceMappingURL=ObjectParamAPI.js.map
