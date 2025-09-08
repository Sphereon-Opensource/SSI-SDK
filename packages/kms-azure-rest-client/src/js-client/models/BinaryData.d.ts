export declare class BinaryData {
  'length'?: number
  'replayable'?: boolean
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
