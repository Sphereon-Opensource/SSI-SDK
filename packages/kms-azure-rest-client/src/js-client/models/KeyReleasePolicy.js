export class KeyReleasePolicy {
  static getAttributeTypeMap() {
    return KeyReleasePolicy.attributeTypeMap
  }
  constructor() {}
}
KeyReleasePolicy.discriminator = undefined
KeyReleasePolicy.mapping = undefined
KeyReleasePolicy.attributeTypeMap = [
  {
    name: 'encodedPolicy',
    baseName: 'encodedPolicy',
    type: 'BinaryData',
    format: '',
  },
  {
    name: 'contentType',
    baseName: 'contentType',
    type: 'string',
    format: '',
  },
  {
    name: 'immutable',
    baseName: 'immutable',
    type: 'boolean',
    format: '',
  },
]
//# sourceMappingURL=KeyReleasePolicy.js.map
