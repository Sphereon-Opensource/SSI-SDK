export class SignPayloadResponse {
  static getAttributeTypeMap() {
    return SignPayloadResponse.attributeTypeMap
  }
  constructor() {}
}
SignPayloadResponse.discriminator = undefined
SignPayloadResponse.mapping = undefined
SignPayloadResponse.attributeTypeMap = [
  {
    name: 'signature',
    baseName: 'signature',
    type: 'string',
    format: '',
  },
]
//# sourceMappingURL=SignPayloadResponse.js.map
