import { hexToMultibase, MultibaseFormat, multibaseToHex } from '../encoding'

describe('@sphereon/ssi-sdk.core:encoding', () => {
  const BASE58_EXAMPLE = '6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp'
  const MULTIBASE_EXAMPLE = `z${BASE58_EXAMPLE}`
  const HEX_EXAMPLE = '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29'

  // Hex to multibase
  it('should encode hex to multibase base58', () => {
    expect(hexToMultibase(HEX_EXAMPLE, 'Ed25519')).toEqual({ value: MULTIBASE_EXAMPLE, keyType: 'Ed25519', format: MultibaseFormat.BASE58 })
    expect(hexToMultibase(HEX_EXAMPLE.toUpperCase(), 'Ed25519')).toEqual({
      value: MULTIBASE_EXAMPLE,
      keyType: 'Ed25519',
      format: MultibaseFormat.BASE58,
    })
  })
  it('should not encode hex to not supported multibase format', () => {
    expect(() => hexToMultibase(HEX_EXAMPLE, 'e' as never)).toThrowError()
  })
  it('should not encode hex to not multibase base58 with no input', () => {
    expect(() => hexToMultibase(undefined as never, 'Ed25519')).toThrowError()
  })

  // Multibase to hex
  it('should encode multibase base58 to hex', () => {
    expect(multibaseToHex(MULTIBASE_EXAMPLE)).toEqual({
      value: HEX_EXAMPLE,
      format: MultibaseFormat.BASE58,
      keyType: 'Ed25519',
    })
  })
  it('should not encode unsupported multibase encoding to hex', () => {
    expect(() => multibaseToHex(`e${BASE58_EXAMPLE}`)).toThrowError()
  })
  it('should not encode multibase base58 encoding to hex with no input', () => {
    expect(() => multibaseToHex(undefined as never)).toThrowError()
  })
})
describe('@sphereon/ssi-sdk.core:encoding X25519', () => {
  const MULTIBASE_EXAMPLE = `z6LSeu9HkTHSfLLeUs2nnzUSNedgDUevfNQgQjQC23ZCit6F`
  const HEX_EXAMPLE = '2fe57da347cd62431528daac5fbb290730fff684afc4cfc2ed90995f58cb3b74'

  // Hex to multibase
  it('should encode hex to multibase base58', () => {
    expect(hexToMultibase(HEX_EXAMPLE, 'X25519')).toEqual({ value: MULTIBASE_EXAMPLE, keyType: 'X25519', format: MultibaseFormat.BASE58 })
    expect(hexToMultibase(HEX_EXAMPLE.toUpperCase(), 'X25519')).toEqual({
      value: MULTIBASE_EXAMPLE,
      keyType: 'X25519',
      format: MultibaseFormat.BASE58,
    })
  })
  // Multibase to hex
  it('should encode multibase base58 to hex', () => {
    expect(multibaseToHex(MULTIBASE_EXAMPLE)).toEqual({
      value: HEX_EXAMPLE,
      format: MultibaseFormat.BASE58,
      keyType: 'X25519',
    })
  })
})

describe('@sphereon/ssi-sdk.core:encoding secp256k1', () => {
  const MULTIBASE_EXAMPLE = `zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme`
  const HEX_EXAMPLE = '03874c15c7fda20e539c6e5ba573c139884c351188799f5458b4b41f7924f235cd'

  // Hex to multibase
  it('should encode hex to multibase base58', () => {
    expect(hexToMultibase(HEX_EXAMPLE, 'Secp256k1')).toEqual({ value: MULTIBASE_EXAMPLE, keyType: 'Secp256k1', format: MultibaseFormat.BASE58 })
    expect(hexToMultibase(HEX_EXAMPLE.toUpperCase(), 'Secp256k1')).toEqual({
      value: MULTIBASE_EXAMPLE,
      keyType: 'Secp256k1',
      format: MultibaseFormat.BASE58,
    })
  })
  // Multibase to hex
  it('should encode multibase base58 to hex', () => {
    expect(multibaseToHex(MULTIBASE_EXAMPLE)).toEqual({
      value: HEX_EXAMPLE,
      format: MultibaseFormat.BASE58,
      keyType: 'Secp256k1',
    })
  })
})

describe('@sphereon/ssi-sdk.core:encoding secp256r1', () => {
  const MULTIBASE_EXAMPLE = `zDnaerDaTF5BXEavCrfRZEk316dpbLsfPDZ3WJ5hRTPFU2169`
  const HEX_EXAMPLE = '037f235830dd3defa722ef1aa249d6a0ddbba4f990b0817538933f573640653542'

  // Hex to multibase
  it('should encode hex to multibase base58', () => {
    expect(hexToMultibase(HEX_EXAMPLE, 'Secp256r1')).toEqual({ value: MULTIBASE_EXAMPLE, keyType: 'Secp256r1', format: MultibaseFormat.BASE58 })
    expect(hexToMultibase(HEX_EXAMPLE.toUpperCase(), 'Secp256r1')).toEqual({
      value: MULTIBASE_EXAMPLE,
      keyType: 'Secp256r1',
      format: MultibaseFormat.BASE58,
    })
  })
  // Multibase to hex
  it('should encode multibase base58 to hex', () => {
    expect(multibaseToHex(MULTIBASE_EXAMPLE)).toEqual({
      value: HEX_EXAMPLE,
      format: MultibaseFormat.BASE58,
      keyType: 'Secp256r1',
    })
  })
})

describe('@sphereon/ssi-sdk.core:encoding RSA', () => {
  const MULTIBASE_EXAMPLE = `z4MXj1wBzi9jUstyPMS4jQqB6KdJaiatPkAtVtGc6bQEQEEsKTic4G7Rou3iBf9vPmT5dbkm9qsZsuVNjq8HCuW1w24nhBFGkRE4cd2Uf2tfrB3N7h4mnyPp1BF3ZttHTYv3DLUPi1zMdkULiow3M1GfXkoC6DoxDUm1jmN6GBj22SjVsr6dxezRVQc7aj9TxE7JLbMH1wh5X3kA58H3DFW8rnYMakFGbca5CB2Jf6CnGQZmL7o5uJAdTwXfy2iiiyPxXEGerMhHwhjTA1mKYobyk2CpeEcmvynADfNZ5MBvcCS7m3XkFCMNUYBS9NQ3fze6vMSUPsNa6GVYmKx2x6JrdEjCk3qRMMmyjnjCMfR4pXbRMZa3i`
  const HEX_EXAMPLE =
    '3082010a0282010100b1b5fcd8d4d5e88ca5c4287b31f578865caf6a78826a3b8ff7b1b23aa4af4e6a0474139f945bd9d3a911ffd0fa72db78e4593a86c91f9da836186ebd3402d51f6a3844247ab5088b46929c311b43604fed84499f06f0f39bf55590e2187f1bbe229ba8f49fd2e570cd0e3733c76bfede80e1e7e0881e4538ea1bc5782be9512f8bf132526e05f4923564fe6e1e21bf7087adebb660fa533fca06d0a8e66991e1312d70b64a61da8ca77c028cdf939601e2cffe2855759b1d479f0847bcac59d7d62427a431d4e3dfd2697428b9dd6309a7b1167db99fe01af1ff1b739566fb949e47089d1dae84aef1214ef7f5773e86a0d3e9da246f9bec09d60c705891183d0203010001'

  // Hex to multibase
  it('should encode hex to multibase base58', () => {
    expect(hexToMultibase(HEX_EXAMPLE, 'RSA')).toEqual({ value: MULTIBASE_EXAMPLE, keyType: 'RSA', format: MultibaseFormat.BASE58 })
    expect(hexToMultibase(HEX_EXAMPLE.toUpperCase(), 'RSA')).toEqual({ value: MULTIBASE_EXAMPLE, keyType: 'RSA', format: MultibaseFormat.BASE58 })
  })
  // Multibase to hex
  it('should encode multibase base58 to hex', () => {
    expect(multibaseToHex(MULTIBASE_EXAMPLE)).toEqual({
      value: HEX_EXAMPLE,
      format: MultibaseFormat.BASE58,
      keyType: 'RSA',
    })
  })
})
