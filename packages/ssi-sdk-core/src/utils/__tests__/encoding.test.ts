import { hexToMultibase, MultibaseFormat, multibaseToHex } from '../encoding'

describe('@sphereon/ssi-sdk-core:encoding', () => {
  const BASE58_EXAMPLE = 'C3CPq7c8PY'
  const MULTIBASE_EXAMPLE = `z${BASE58_EXAMPLE}`
  const HEX_EXAMPLE = '0123456789abcdef'

  // Hex to multibase
  it('should encode hex to multibase base58', () => {
    expect(hexToMultibase(HEX_EXAMPLE, MultibaseFormat.BASE58)).toEqual({ value: MULTIBASE_EXAMPLE, format: MultibaseFormat.BASE58 })
    expect(hexToMultibase(HEX_EXAMPLE.toUpperCase(), MultibaseFormat.BASE58)).toEqual({ value: MULTIBASE_EXAMPLE, format: MultibaseFormat.BASE58 })
  })
  it('should not encode hex to not supported multibase format', () => {
    expect(() => hexToMultibase(HEX_EXAMPLE, 'e' as never)).toThrowError()
  })
  it('should not encode hex to not multibase base58 with no input', () => {
    expect(() => hexToMultibase(undefined as never, MultibaseFormat.BASE58)).toThrowError()
  })

  // Multibase to hex
  it('should encode multibase base58 to hex', () => {
    expect(multibaseToHex(MULTIBASE_EXAMPLE)).toEqual({ value: HEX_EXAMPLE, format: MultibaseFormat.BASE58 })
  })
  it('should not encode unsupported multibase encoding to hex', () => {
    expect(() => multibaseToHex(`e${BASE58_EXAMPLE}`)).toThrowError()
  })
  it('should not encode multibase base58 encoding to hex with no input', () => {
    expect(() => multibaseToHex(undefined as never)).toThrowError()
  })
})
