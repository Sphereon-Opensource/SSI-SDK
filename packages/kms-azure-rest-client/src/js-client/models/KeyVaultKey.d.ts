import { JsonWebKey } from '../models/JsonWebKey'
import { KeyProperties } from '../models/KeyProperties'
export declare class KeyVaultKey {
  'key'?: JsonWebKey
  'properties'?: KeyProperties
  'name'?: string
  'id'?: string
  'keyType'?: string
  'keyOperations'?: Array<string>
  static readonly discriminator: string | undefined
  static readonly mapping:
    | {
        [index: string]: string
      }
    | undefined
  static readonly attributeTypeMap: Array<{
    name: string
    baseName: string
    type: string
    format: string
  }>
  static getAttributeTypeMap(): {
    name: string
    baseName: string
    type: string
    format: string
  }[]
  constructor()
}
