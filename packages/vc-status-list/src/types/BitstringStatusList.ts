export type BitstringConstructorOptions = {
  length?: number
  buffer?: Uint8Array
  leftToRightIndexing?: boolean
  littleEndianBits?: boolean // deprecated
}

export type IBitstring = {
  bits: Uint8Array
  length: number
  leftToRightIndexing: boolean

  set(position: number, on: boolean): void
  get(position: number): boolean
  encodeBits(): Promise<string>
  compressBits(): Promise<Uint8Array>
}

export type BitstringStatic = {
  new (options?: BitstringConstructorOptions): IBitstring
  decodeBits(options: { encoded: string }): Promise<Uint8Array>
  uncompressBits(options: { compressed: Uint8Array }): Promise<Uint8Array>
}

export type BitstringStatusListConstructorOptions = {
  length?: number
  buffer?: Uint8Array
}

export type IBitstringStatusList = {
  bitstring: IBitstring
  length: number

  setStatus(index: number, status: boolean): void
  getStatus(index: number): boolean
  encode(): Promise<string>
}

export type BitstringStatusListStatic = {
  new (options?: BitstringStatusListConstructorOptions): IBitstringStatusList
  decode(options: { encodedList: string }): Promise<IBitstringStatusList>
}
