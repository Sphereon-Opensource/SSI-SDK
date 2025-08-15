export declare class JsonWebKey {
  'keyType'?: string
  'keyOps'?: Array<string>
  'n'?: string
  'e'?: string
  'd'?: string
  'dp'?: string
  'dq'?: string
  'qi'?: string
  'p'?: string
  'q'?: string
  'k'?: string
  't'?: string
  'x'?: string
  'y'?: string
  'id'?: string
  'valid'?: boolean
  'curveName'?: string
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
