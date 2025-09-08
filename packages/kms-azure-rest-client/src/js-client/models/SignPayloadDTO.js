export class SignPayloadDTO {
  static getAttributeTypeMap() {
    return SignPayloadDTO.attributeTypeMap
  }
  constructor() {}
}
SignPayloadDTO.discriminator = undefined
SignPayloadDTO.mapping = undefined
SignPayloadDTO.attributeTypeMap = [
  {
    name: 'keyName',
    baseName: 'keyName',
    type: 'string',
    format: '',
  },
  {
    name: 'payload',
    baseName: 'payload',
    type: 'string',
    format: '',
  },
]
//# sourceMappingURL=SignPayloadDTO.js.map
