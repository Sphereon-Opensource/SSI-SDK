export class BinaryData {
  static getAttributeTypeMap() {
    return BinaryData.attributeTypeMap
  }
  constructor() {}
}
BinaryData.discriminator = undefined
BinaryData.mapping = undefined
BinaryData.attributeTypeMap = [
  {
    name: 'length',
    baseName: 'length',
    type: 'number',
    format: 'int64',
  },
  {
    name: 'replayable',
    baseName: 'replayable',
    type: 'boolean',
    format: '',
  },
]
//# sourceMappingURL=BinaryData.js.map
