import { KeyReleasePolicy } from '../models/KeyReleasePolicy'
export declare class KeyProperties {
  'enabled'?: boolean
  'exportable'?: boolean
  'notBefore'?: Date
  'version'?: string
  'expiresOn'?: Date
  'createdOn'?: Date
  'updatedOn'?: Date
  'recoveryLevel'?: string
  'name'?: string
  'id'?: string
  'tags'?: {
    [key: string]: string
  }
  'managed'?: boolean
  'recoverableDays'?: number
  'releasePolicy'?: KeyReleasePolicy
  'hsmPlatform'?: string
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
