const { base58 } = require('@scure/base')

export enum MultibaseFormat {
  BASE58 = 'z',
}

export function hexToMultibase(hex: string, format: MultibaseFormat): { value: string; format: MultibaseFormat } {
  if (format !== MultibaseFormat.BASE58) {
    throw new Error('Only base58 supported for now using multibase!')
  }
  return { value: MultibaseFormat.BASE58 + base58.encode(hexToBytes(hex)), format }

  function hexToBytes(hex: string): Uint8Array {
    let bytes: number[] = []
    for (let c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16))
    return Uint8Array.of(...bytes)
  }
}

export function multibaseToHex(multibase: string): { value: string; format: MultibaseFormat } {
  if (!multibase.startsWith(MultibaseFormat.BASE58)) {
    throw new Error('Only base58 supported for now using multibase!')
  }
  return { value: bytesToHex(base58.decode(multibase.substr(1), 'btc')), format: MultibaseFormat.BASE58 }

  function bytesToHex(uint8a: Uint8Array): string {
    // pre-caching chars could speed this up 6x.
    let hex = ''
    for (let i = 0; i < uint8a.length; i++) {
      hex += uint8a[i].toString(16).padStart(2, '0')
    }
    return hex
  }
}
