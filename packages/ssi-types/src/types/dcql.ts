// FIXME Temporary minimal DCQL schema for PD manager

export interface DcqlQuery {
  credentials: DcqlCredentialQuery[]
}

export interface DcqlCredentialQuery {
  id: string
  format: string
  alg?: string[]
  claims: DcqlClaim[]
  meta?: Record<string, any>
}

export interface DcqlClaim {
  namespace: string
  claim_name: string
  filter?: DcqlFilter
}

export interface DcqlFilter {
  type: 'string' | 'number' | 'boolean'
  pattern?: string
  minimum?: number
  maximum?: number
}

export interface DcqlPresentationResult {
  canBeSatisfied: boolean
  credential_matches: Record<string, DcqlCredentialMatch>
  invalid_matches?: Record<string, DcqlCredentialMatch>
}

export interface DcqlCredentialMatch {
  success: boolean
  input_credential_index: number
  claim_set_index?: number
  output: any
}
