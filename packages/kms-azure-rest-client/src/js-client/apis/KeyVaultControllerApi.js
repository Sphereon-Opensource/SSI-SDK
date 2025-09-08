var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
import { BaseAPIRequestFactory, RequiredError } from './baseapi'
import { HttpMethod, HttpInfo } from '../http/http'
import { ObjectSerializer } from '../models/ObjectSerializer'
import { ApiException } from './exception'
import { isCodeInRange } from '../util'
export class KeyVaultControllerApiRequestFactory extends BaseAPIRequestFactory {
  createEcKey(createEcKeyRequest, _options) {
    var _a, _b, _c
    return __awaiter(this, void 0, void 0, function* () {
      let _config = _options || this.configuration
      if (createEcKeyRequest === null || createEcKeyRequest === undefined) {
        throw new RequiredError('KeyVaultControllerApi', 'createEcKey', 'createEcKeyRequest')
      }
      const localVarPath = '/api/keys/create-ec-key'
      const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST)
      requestContext.setHeaderParam('Accept', 'application/json, */*;q=0.8')
      const contentType = ObjectSerializer.getPreferredMediaType(['application/json'])
      requestContext.setHeaderParam('Content-Type', contentType)
      const serializedBody = ObjectSerializer.stringify(ObjectSerializer.serialize(createEcKeyRequest, 'CreateEcKeyRequest', ''), contentType)
      requestContext.setBody(serializedBody)
      let authMethod
      authMethod = _config.authMethods['apiKeyScheme']
      if (authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication) {
        yield authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication(requestContext)
      }
      const defaultAuth =
        ((_a = _options === null || _options === void 0 ? void 0 : _options.authMethods) === null || _a === void 0 ? void 0 : _a.default) ||
        ((_c = (_b = this.configuration) === null || _b === void 0 ? void 0 : _b.authMethods) === null || _c === void 0 ? void 0 : _c.default)
      if (defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication) {
        yield defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication(requestContext)
      }
      return requestContext
    })
  }
  getKey(keyName, _options) {
    var _a, _b, _c
    return __awaiter(this, void 0, void 0, function* () {
      let _config = _options || this.configuration
      if (keyName === null || keyName === undefined) {
        throw new RequiredError('KeyVaultControllerApi', 'getKey', 'keyName')
      }
      const localVarPath = '/api/keys/{keyName}'.replace('{' + 'keyName' + '}', encodeURIComponent(String(keyName)))
      const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET)
      requestContext.setHeaderParam('Accept', 'application/json, */*;q=0.8')
      let authMethod
      authMethod = _config.authMethods['apiKeyScheme']
      if (authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication) {
        yield authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication(requestContext)
      }
      const defaultAuth =
        ((_a = _options === null || _options === void 0 ? void 0 : _options.authMethods) === null || _a === void 0 ? void 0 : _a.default) ||
        ((_c = (_b = this.configuration) === null || _b === void 0 ? void 0 : _b.authMethods) === null || _c === void 0 ? void 0 : _c.default)
      if (defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication) {
        yield defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication(requestContext)
      }
      return requestContext
    })
  }
  signPayload(signPayloadDTO, _options) {
    var _a, _b, _c
    return __awaiter(this, void 0, void 0, function* () {
      let _config = _options || this.configuration
      if (signPayloadDTO === null || signPayloadDTO === undefined) {
        throw new RequiredError('KeyVaultControllerApi', 'signPayload', 'signPayloadDTO')
      }
      const localVarPath = '/api/keys/sign'
      const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST)
      requestContext.setHeaderParam('Accept', 'application/json, */*;q=0.8')
      const contentType = ObjectSerializer.getPreferredMediaType(['application/json'])
      requestContext.setHeaderParam('Content-Type', contentType)
      const serializedBody = ObjectSerializer.stringify(ObjectSerializer.serialize(signPayloadDTO, 'SignPayloadDTO', ''), contentType)
      requestContext.setBody(serializedBody)
      let authMethod
      authMethod = _config.authMethods['apiKeyScheme']
      if (authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication) {
        yield authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication(requestContext)
      }
      const defaultAuth =
        ((_a = _options === null || _options === void 0 ? void 0 : _options.authMethods) === null || _a === void 0 ? void 0 : _a.default) ||
        ((_c = (_b = this.configuration) === null || _b === void 0 ? void 0 : _b.authMethods) === null || _c === void 0 ? void 0 : _c.default)
      if (defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication) {
        yield defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication(requestContext)
      }
      return requestContext
    })
  }
  verifyPayload(verifyPayloadDTO, _options) {
    var _a, _b, _c
    return __awaiter(this, void 0, void 0, function* () {
      let _config = _options || this.configuration
      if (verifyPayloadDTO === null || verifyPayloadDTO === undefined) {
        throw new RequiredError('KeyVaultControllerApi', 'verifyPayload', 'verifyPayloadDTO')
      }
      const localVarPath = '/api/keys/verify'
      const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST)
      requestContext.setHeaderParam('Accept', 'application/json, */*;q=0.8')
      const contentType = ObjectSerializer.getPreferredMediaType(['application/json'])
      requestContext.setHeaderParam('Content-Type', contentType)
      const serializedBody = ObjectSerializer.stringify(ObjectSerializer.serialize(verifyPayloadDTO, 'VerifyPayloadDTO', ''), contentType)
      requestContext.setBody(serializedBody)
      let authMethod
      authMethod = _config.authMethods['apiKeyScheme']
      if (authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication) {
        yield authMethod === null || authMethod === void 0 ? void 0 : authMethod.applySecurityAuthentication(requestContext)
      }
      const defaultAuth =
        ((_a = _options === null || _options === void 0 ? void 0 : _options.authMethods) === null || _a === void 0 ? void 0 : _a.default) ||
        ((_c = (_b = this.configuration) === null || _b === void 0 ? void 0 : _b.authMethods) === null || _c === void 0 ? void 0 : _c.default)
      if (defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication) {
        yield defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.applySecurityAuthentication(requestContext)
      }
      return requestContext
    })
  }
}
export class KeyVaultControllerApiResponseProcessor {
  createEcKeyWithHttpInfo(response) {
    return __awaiter(this, void 0, void 0, function* () {
      const contentType = ObjectSerializer.normalizeMediaType(response.headers['content-type'])
      if (isCodeInRange('201', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      if (isCodeInRange('400', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        throw new ApiException(response.httpStatusCode, 'Invalid input parameters', body, response.headers)
      }
      if (isCodeInRange('500', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        throw new ApiException(response.httpStatusCode, 'Unexpected error during key creation', body, response.headers)
      }
      if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      throw new ApiException(response.httpStatusCode, 'Unknown API Status Code!', yield response.getBodyAsAny(), response.headers)
    })
  }
  getKeyWithHttpInfo(response) {
    return __awaiter(this, void 0, void 0, function* () {
      const contentType = ObjectSerializer.normalizeMediaType(response.headers['content-type'])
      if (isCodeInRange('200', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      if (isCodeInRange('404', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        throw new ApiException(response.httpStatusCode, 'Key not found', body, response.headers)
      }
      if (isCodeInRange('500', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        throw new ApiException(response.httpStatusCode, 'Unexpected error during key retrieval', body, response.headers)
      }
      if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'KeyVaultKey', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      throw new ApiException(response.httpStatusCode, 'Unknown API Status Code!', yield response.getBodyAsAny(), response.headers)
    })
  }
  signPayloadWithHttpInfo(response) {
    return __awaiter(this, void 0, void 0, function* () {
      const contentType = ObjectSerializer.normalizeMediaType(response.headers['content-type'])
      if (isCodeInRange('200', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'SignPayloadResponse', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      if (isCodeInRange('400', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'SignPayloadResponse', '')
        throw new ApiException(response.httpStatusCode, 'Invalid input parameters', body, response.headers)
      }
      if (isCodeInRange('404', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'SignPayloadResponse', '')
        throw new ApiException(response.httpStatusCode, 'Key not found', body, response.headers)
      }
      if (isCodeInRange('500', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'SignPayloadResponse', '')
        throw new ApiException(response.httpStatusCode, 'Unexpected error during signing', body, response.headers)
      }
      if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'SignPayloadResponse', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      throw new ApiException(response.httpStatusCode, 'Unknown API Status Code!', yield response.getBodyAsAny(), response.headers)
    })
  }
  verifyPayloadWithHttpInfo(response) {
    return __awaiter(this, void 0, void 0, function* () {
      const contentType = ObjectSerializer.normalizeMediaType(response.headers['content-type'])
      if (isCodeInRange('200', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'boolean', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      if (isCodeInRange('400', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'boolean', '')
        throw new ApiException(response.httpStatusCode, 'Invalid input parameters', body, response.headers)
      }
      if (isCodeInRange('404', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'boolean', '')
        throw new ApiException(response.httpStatusCode, 'Key not found', body, response.headers)
      }
      if (isCodeInRange('500', response.httpStatusCode)) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'boolean', '')
        throw new ApiException(response.httpStatusCode, 'Unexpected error during verification', body, response.headers)
      }
      if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
        const body = ObjectSerializer.deserialize(ObjectSerializer.parse(yield response.body.text(), contentType), 'boolean', '')
        return new HttpInfo(response.httpStatusCode, response.headers, response.body, body)
      }
      throw new ApiException(response.httpStatusCode, 'Unknown API Status Code!', yield response.getBodyAsAny(), response.headers)
    })
  }
}
//# sourceMappingURL=KeyVaultControllerApi.js.map
