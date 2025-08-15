export class JsonWebKey {
  static getAttributeTypeMap() {
    return JsonWebKey.attributeTypeMap
  }
  constructor() {}
}
JsonWebKey.discriminator = undefined
JsonWebKey.mapping = undefined
JsonWebKey.attributeTypeMap = [
  {
    name: 'keyType',
    baseName: 'keyType',
    type: 'string',
    format: '',
  },
  {
    name: 'keyOps',
    baseName: 'keyOps',
    type: 'Array<string>',
    format: '',
  },
  {
    name: 'n',
    baseName: 'n',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'e',
    baseName: 'e',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'd',
    baseName: 'd',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'dp',
    baseName: 'dp',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'dq',
    baseName: 'dq',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'qi',
    baseName: 'qi',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'p',
    baseName: 'p',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'q',
    baseName: 'q',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'k',
    baseName: 'k',
    type: 'string',
    format: 'byte',
  },
  {
    name: 't',
    baseName: 't',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'x',
    baseName: 'x',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'y',
    baseName: 'y',
    type: 'string',
    format: 'byte',
  },
  {
    name: 'id',
    baseName: 'id',
    type: 'string',
    format: '',
  },
  {
    name: 'valid',
    baseName: 'valid',
    type: 'boolean',
    format: '',
  },
  {
    name: 'curveName',
    baseName: 'curveName',
    type: 'string',
    format: '',
  },
]
//# sourceMappingURL=JsonWebKey.js.map
