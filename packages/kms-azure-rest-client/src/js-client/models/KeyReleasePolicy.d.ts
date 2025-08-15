import { BinaryData } from '../models/BinaryData'
export declare class KeyReleasePolicy {
  'encodedPolicy'?: BinaryData
  'contentType'?: string
  'immutable'?: boolean
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
