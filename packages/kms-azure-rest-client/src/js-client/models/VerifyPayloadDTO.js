export class VerifyPayloadDTO {
  static getAttributeTypeMap() {
    return VerifyPayloadDTO.attributeTypeMap
  }
  constructor() {}
}
VerifyPayloadDTO.discriminator = undefined
VerifyPayloadDTO.mapping = undefined
VerifyPayloadDTO.attributeTypeMap = [
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
  {
    name: 'signature',
    baseName: 'signature',
    type: 'string',
    format: '',
  },
]
//# sourceMappingURL=VerifyPayloadDTO.js.map
