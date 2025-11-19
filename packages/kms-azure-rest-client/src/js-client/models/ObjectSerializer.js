export * from '../models/BinaryData'
export * from '../models/CreateEcKeyRequest'
export * from '../models/JsonWebKey'
export * from '../models/KeyProperties'
export * from '../models/KeyReleasePolicy'
export * from '../models/KeyVaultKey'
export * from '../models/SignPayloadDTO'
export * from '../models/SignPayloadResponse'
export * from '../models/VerifyPayloadDTO'
import { BinaryData } from '../models/BinaryData'
import { CreateEcKeyRequest } from '../models/CreateEcKeyRequest'
import { JsonWebKey } from '../models/JsonWebKey'
import { KeyProperties } from '../models/KeyProperties'
import { KeyReleasePolicy } from '../models/KeyReleasePolicy'
import { KeyVaultKey } from '../models/KeyVaultKey'
import { SignPayloadDTO } from '../models/SignPayloadDTO'
import { SignPayloadResponse } from '../models/SignPayloadResponse'
import { VerifyPayloadDTO } from '../models/VerifyPayloadDTO'
let primitives = ['string', 'boolean', 'double', 'integer', 'long', 'float', 'number', 'any']
let enumsMap = new Set([])
let typeMap = {
  BinaryData: BinaryData,
  CreateEcKeyRequest: CreateEcKeyRequest,
  JsonWebKey: JsonWebKey,
  KeyProperties: KeyProperties,
  KeyReleasePolicy: KeyReleasePolicy,
  KeyVaultKey: KeyVaultKey,
  SignPayloadDTO: SignPayloadDTO,
  SignPayloadResponse: SignPayloadResponse,
  VerifyPayloadDTO: VerifyPayloadDTO,
}
const parseMimeType = (mimeType) => {
  const [type = '', subtype = ''] = mimeType.split('/')
  return {
    type,
    subtype,
    subtypeTokens: subtype.split('+'),
  }
}
const mimeTypePredicateFactory = (predicate) => (mimeType) => predicate(parseMimeType(mimeType))
const mimeTypeSimplePredicateFactory = (type, subtype) =>
  mimeTypePredicateFactory((descriptor) => {
    if (descriptor.type !== type) return false
    if (subtype != null && descriptor.subtype !== subtype) return false
    return true
  })
const isTextLikeMimeType = mimeTypeSimplePredicateFactory('text')
const isJsonMimeType = mimeTypeSimplePredicateFactory('application', 'json')
const isJsonLikeMimeType = mimeTypePredicateFactory(
  (descriptor) => descriptor.type === 'application' && descriptor.subtypeTokens.some((item) => item === 'json'),
)
const isOctetStreamMimeType = mimeTypeSimplePredicateFactory('application', 'octet-stream')
const isFormUrlencodedMimeType = mimeTypeSimplePredicateFactory('application', 'x-www-form-urlencoded')
const supportedMimeTypePredicatesWithPriority = [
  isJsonMimeType,
  isJsonLikeMimeType,
  isTextLikeMimeType,
  isOctetStreamMimeType,
  isFormUrlencodedMimeType,
]
const nullableSuffix = ' | null'
const optionalSuffix = ' | undefined'
const arrayPrefix = 'Array<'
const arraySuffix = '>'
const mapPrefix = '{ [key: string]: '
const mapSuffix = '; }'
export class ObjectSerializer {
  static findCorrectType(data, expectedType) {
    if (data == undefined) {
      return expectedType
    } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
      return expectedType
    } else if (expectedType === 'Date') {
      return expectedType
    } else {
      if (enumsMap.has(expectedType)) {
        return expectedType
      }
      if (!typeMap[expectedType]) {
        return expectedType
      }
      let discriminatorProperty = typeMap[expectedType].discriminator
      if (discriminatorProperty == null) {
        return expectedType
      } else {
        if (data[discriminatorProperty]) {
          var discriminatorType = data[discriminatorProperty]
          let mapping = typeMap[expectedType].mapping
          if (mapping != undefined && mapping[discriminatorType]) {
            return mapping[discriminatorType]
          } else if (typeMap[discriminatorType]) {
            return discriminatorType
          } else {
            return expectedType
          }
        } else {
          return expectedType
        }
      }
    }
  }
  static serialize(data, type, format) {
    if (data == undefined) {
      return data
    } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
      return data
    } else if (type.endsWith(nullableSuffix)) {
      let subType = type.slice(0, -nullableSuffix.length)
      return ObjectSerializer.serialize(data, subType, format)
    } else if (type.endsWith(optionalSuffix)) {
      let subType = type.slice(0, -optionalSuffix.length)
      return ObjectSerializer.serialize(data, subType, format)
    } else if (type.startsWith(arrayPrefix)) {
      let subType = type.slice(arrayPrefix.length, -arraySuffix.length)
      let transformedData = []
      for (let date of data) {
        transformedData.push(ObjectSerializer.serialize(date, subType, format))
      }
      return transformedData
    } else if (type.startsWith(mapPrefix)) {
      let subType = type.slice(mapPrefix.length, -mapSuffix.length)
      let transformedData = {}
      for (let key in data) {
        transformedData[key] = ObjectSerializer.serialize(data[key], subType, format)
      }
      return transformedData
    } else if (type === 'Date') {
      if (format == 'date') {
        let month = data.getMonth() + 1
        month = month < 10 ? '0' + month.toString() : month.toString()
        let day = data.getDate()
        day = day < 10 ? '0' + day.toString() : day.toString()
        return data.getFullYear() + '-' + month + '-' + day
      } else {
        return data.toISOString()
      }
    } else {
      if (enumsMap.has(type)) {
        return data
      }
      if (!typeMap[type]) {
        return data
      }
      type = this.findCorrectType(data, type)
      let attributeTypes = typeMap[type].getAttributeTypeMap()
      let instance = {}
      for (let attributeType of attributeTypes) {
        instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type, attributeType.format)
      }
      return instance
    }
  }
  static deserialize(data, type, format) {
    type = ObjectSerializer.findCorrectType(data, type)
    if (data == undefined) {
      return data
    } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
      return data
    } else if (type.endsWith(nullableSuffix)) {
      let subType = type.slice(0, -nullableSuffix.length)
      return ObjectSerializer.deserialize(data, subType, format)
    } else if (type.endsWith(optionalSuffix)) {
      let subType = type.slice(0, -optionalSuffix.length)
      return ObjectSerializer.deserialize(data, subType, format)
    } else if (type.startsWith(arrayPrefix)) {
      let subType = type.slice(arrayPrefix.length, -arraySuffix.length)
      let transformedData = []
      for (let date of data) {
        transformedData.push(ObjectSerializer.deserialize(date, subType, format))
      }
      return transformedData
    } else if (type.startsWith(mapPrefix)) {
      let subType = type.slice(mapPrefix.length, -mapSuffix.length)
      let transformedData = {}
      for (let key in data) {
        transformedData[key] = ObjectSerializer.deserialize(data[key], subType, format)
      }
      return transformedData
    } else if (type === 'Date') {
      return new Date(data)
    } else {
      if (enumsMap.has(type)) {
        return data
      }
      if (!typeMap[type]) {
        return data
      }
      let instance = new typeMap[type]()
      let attributeTypes = typeMap[type].getAttributeTypeMap()
      for (let attributeType of attributeTypes) {
        let value = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type, attributeType.format)
        if (value !== undefined) {
          instance[attributeType.name] = value
        }
      }
      return instance
    }
  }
  static normalizeMediaType(mediaType) {
    var _a
    if (mediaType === undefined) {
      return undefined
    }
    return ((_a = mediaType.split(';')[0]) !== null && _a !== void 0 ? _a : '').trim().toLowerCase()
  }
  static getPreferredMediaType(mediaTypes) {
    if (mediaTypes.length === 0) {
      return 'application/json'
    }
    const normalMediaTypes = mediaTypes.map(this.normalizeMediaType)
    for (const predicate of supportedMimeTypePredicatesWithPriority) {
      for (const mediaType of normalMediaTypes) {
        if (mediaType != null && predicate(mediaType)) {
          return mediaType
        }
      }
    }
    throw new Error('None of the given media types are supported: ' + mediaTypes.join(', '))
  }
  static stringify(data, mediaType) {
    if (isTextLikeMimeType(mediaType)) {
      return String(data)
    }
    if (isJsonLikeMimeType(mediaType)) {
      return JSON.stringify(data)
    }
    throw new Error('The mediaType ' + mediaType + ' is not supported by ObjectSerializer.stringify.')
  }
  static parse(rawData, mediaType) {
    if (mediaType === undefined) {
      throw new Error('Cannot parse content. No Content-Type defined.')
    }
    if (isTextLikeMimeType(mediaType)) {
      return rawData
    }
    if (isJsonLikeMimeType(mediaType)) {
      return JSON.parse(rawData)
    }
    throw new Error('The mediaType ' + mediaType + ' is not supported by ObjectSerializer.parse.')
  }
}
//# sourceMappingURL=ObjectSerializer.js.map
