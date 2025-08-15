export class CreateEcKeyRequest {
  static getAttributeTypeMap() {
    return CreateEcKeyRequest.attributeTypeMap
  }
  constructor() {}
}
CreateEcKeyRequest.discriminator = undefined
CreateEcKeyRequest.mapping = undefined
CreateEcKeyRequest.attributeTypeMap = [
  {
    name: 'keyName',
    baseName: 'keyName',
    type: 'string',
    format: '',
  },
  {
    name: 'curveName',
    baseName: 'curveName',
    type: 'string',
    format: '',
  },
  {
    name: 'operations',
    baseName: 'operations',
    type: 'Array<string>',
    format: '',
  },
]
//# sourceMappingURL=CreateEcKeyRequest.js.map
