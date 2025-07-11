export type BitstringStatusPurpose = 'revocation' | 'suspension' | 'refresh' | 'message' | string // From vc-bitstring-status-lists without pulling in the whole dep for just this one type

export type BitstringStatus = {
  status: string
  message?: string
  [x: string]: any
}
