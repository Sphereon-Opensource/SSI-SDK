export class KeyVaultKey {
  static getAttributeTypeMap() {
    return KeyVaultKey.attributeTypeMap
  }
  constructor() {}
}
KeyVaultKey.discriminator = undefined
KeyVaultKey.mapping = undefined
KeyVaultKey.attributeTypeMap = [
  {
    name: 'key',
    baseName: 'key',
    type: 'JsonWebKey',
    format: '',
  },
  {
    name: 'properties',
    baseName: 'properties',
    type: 'KeyProperties',
    format: '',
  },
  {
    name: 'name',
    baseName: 'name',
    type: 'string',
    format: '',
  },
  {
    name: 'id',
    baseName: 'id',
    type: 'string',
    format: '',
  },
  {
    name: 'keyType',
    baseName: 'keyType',
    type: 'string',
    format: '',
  },
  {
    name: 'keyOperations',
    baseName: 'keyOperations',
    type: 'Array<string>',
    format: '',
  },
]
//# sourceMappingURL=KeyVaultKey.js.map
