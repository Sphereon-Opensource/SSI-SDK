export class KeyProperties {
  static getAttributeTypeMap() {
    return KeyProperties.attributeTypeMap
  }
  constructor() {}
}
KeyProperties.discriminator = undefined
KeyProperties.mapping = undefined
KeyProperties.attributeTypeMap = [
  {
    name: 'enabled',
    baseName: 'enabled',
    type: 'boolean',
    format: '',
  },
  {
    name: 'exportable',
    baseName: 'exportable',
    type: 'boolean',
    format: '',
  },
  {
    name: 'notBefore',
    baseName: 'notBefore',
    type: 'Date',
    format: 'date-time',
  },
  {
    name: 'version',
    baseName: 'version',
    type: 'string',
    format: '',
  },
  {
    name: 'expiresOn',
    baseName: 'expiresOn',
    type: 'Date',
    format: 'date-time',
  },
  {
    name: 'createdOn',
    baseName: 'createdOn',
    type: 'Date',
    format: 'date-time',
  },
  {
    name: 'updatedOn',
    baseName: 'updatedOn',
    type: 'Date',
    format: 'date-time',
  },
  {
    name: 'recoveryLevel',
    baseName: 'recoveryLevel',
    type: 'string',
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
    name: 'tags',
    baseName: 'tags',
    type: '{ [key: string]: string; }',
    format: '',
  },
  {
    name: 'managed',
    baseName: 'managed',
    type: 'boolean',
    format: '',
  },
  {
    name: 'recoverableDays',
    baseName: 'recoverableDays',
    type: 'number',
    format: 'int32',
  },
  {
    name: 'releasePolicy',
    baseName: 'releasePolicy',
    type: 'KeyReleasePolicy',
    format: '',
  },
  {
    name: 'hsmPlatform',
    baseName: 'hsmPlatform',
    type: 'string',
    format: '',
  },
]
//# sourceMappingURL=KeyProperties.js.map
