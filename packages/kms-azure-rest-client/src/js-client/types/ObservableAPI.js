import { of, from } from '../rxjsStub'
import { mergeMap, map } from '../rxjsStub'
import { KeyVaultControllerApiRequestFactory, KeyVaultControllerApiResponseProcessor } from '../apis/KeyVaultControllerApi'
export class ObservableKeyVaultControllerApi {
  constructor(configuration, requestFactory, responseProcessor) {
    this.configuration = configuration
    this.requestFactory = requestFactory || new KeyVaultControllerApiRequestFactory(configuration)
    this.responseProcessor = responseProcessor || new KeyVaultControllerApiResponseProcessor()
  }
  createEcKeyWithHttpInfo(createEcKeyRequest, _options) {
    const requestContextPromise = this.requestFactory.createEcKey(createEcKeyRequest, _options)
    let middlewarePreObservable = from(requestContextPromise)
    for (const middleware of this.configuration.middleware) {
      middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx) => middleware.pre(ctx)))
    }
    return middlewarePreObservable.pipe(mergeMap((ctx) => this.configuration.httpApi.send(ctx))).pipe(
      mergeMap((response) => {
        let middlewarePostObservable = of(response)
        for (const middleware of this.configuration.middleware) {
          middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp) => middleware.post(rsp)))
        }
        return middlewarePostObservable.pipe(map((rsp) => this.responseProcessor.createEcKeyWithHttpInfo(rsp)))
      }),
    )
  }
  createEcKey(createEcKeyRequest, _options) {
    return this.createEcKeyWithHttpInfo(createEcKeyRequest, _options).pipe(map((apiResponse) => apiResponse.data))
  }
  getKeyWithHttpInfo(keyName, _options) {
    const requestContextPromise = this.requestFactory.getKey(keyName, _options)
    let middlewarePreObservable = from(requestContextPromise)
    for (const middleware of this.configuration.middleware) {
      middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx) => middleware.pre(ctx)))
    }
    return middlewarePreObservable.pipe(mergeMap((ctx) => this.configuration.httpApi.send(ctx))).pipe(
      mergeMap((response) => {
        let middlewarePostObservable = of(response)
        for (const middleware of this.configuration.middleware) {
          middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp) => middleware.post(rsp)))
        }
        return middlewarePostObservable.pipe(map((rsp) => this.responseProcessor.getKeyWithHttpInfo(rsp)))
      }),
    )
  }
  getKey(keyName, _options) {
    return this.getKeyWithHttpInfo(keyName, _options).pipe(map((apiResponse) => apiResponse.data))
  }
  signPayloadWithHttpInfo(signPayloadDTO, _options) {
    const requestContextPromise = this.requestFactory.signPayload(signPayloadDTO, _options)
    let middlewarePreObservable = from(requestContextPromise)
    for (const middleware of this.configuration.middleware) {
      middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx) => middleware.pre(ctx)))
    }
    return middlewarePreObservable.pipe(mergeMap((ctx) => this.configuration.httpApi.send(ctx))).pipe(
      mergeMap((response) => {
        let middlewarePostObservable = of(response)
        for (const middleware of this.configuration.middleware) {
          middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp) => middleware.post(rsp)))
        }
        return middlewarePostObservable.pipe(map((rsp) => this.responseProcessor.signPayloadWithHttpInfo(rsp)))
      }),
    )
  }
  signPayload(signPayloadDTO, _options) {
    return this.signPayloadWithHttpInfo(signPayloadDTO, _options).pipe(map((apiResponse) => apiResponse.data))
  }
  verifyPayloadWithHttpInfo(verifyPayloadDTO, _options) {
    const requestContextPromise = this.requestFactory.verifyPayload(verifyPayloadDTO, _options)
    let middlewarePreObservable = from(requestContextPromise)
    for (const middleware of this.configuration.middleware) {
      middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx) => middleware.pre(ctx)))
    }
    return middlewarePreObservable.pipe(mergeMap((ctx) => this.configuration.httpApi.send(ctx))).pipe(
      mergeMap((response) => {
        let middlewarePostObservable = of(response)
        for (const middleware of this.configuration.middleware) {
          middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp) => middleware.post(rsp)))
        }
        return middlewarePostObservable.pipe(map((rsp) => this.responseProcessor.verifyPayloadWithHttpInfo(rsp)))
      }),
    )
  }
  verifyPayload(verifyPayloadDTO, _options) {
    return this.verifyPayloadWithHttpInfo(verifyPayloadDTO, _options).pipe(map((apiResponse) => apiResponse.data))
  }
}
//# sourceMappingURL=ObservableAPI.js.map
