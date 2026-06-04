import { NonPersistedCredentialDesign } from './credentialDesign'

export type GetCredentialDesignArgs = {
  credentialDesignId: string
}

export type GetCredentialDesignsArgs = {
  filter?: {
    tenantId?: string
  }
  limit?: number
  offset?: number
}

export type CountCredentialDesignsArgs = {
  filter?: {
    tenantId?: string
  }
}

export type FormStepGetOrCreateArgs = {
  formStepId: string
}

export type AddCredentialDesignArgs = {
  identifier: string
  tenantId?: string
  design?: NonPersistedCredentialDesign
  formStepId?: string
}

export type RemoveCredentialDesignArgs = {
  credentialDesignId: string
}

export type UpdateCredentialDesignArgs = {
  credentialDesignId: string
  identifier?: string
  tenantId?: string
  design?: Partial<NonPersistedCredentialDesign>
}
