import { NonPersistedCredentialDesign } from './credentialDesign'

export type GetCredentialDesignArgs = {
  credentialDesignId: string
}

export type GetCredentialDesignsArgs = {
  filter?: {
    tenantId?: string
  }
}

export type AddCredentialDesignArgs = {
  name: string
  tenantId?: string
  design?: NonPersistedCredentialDesign
}

export type RemoveCredentialDesignArgs = {
  credentialDesignId: string
}

export type UpdateCredentialDesignArgs = {
  credentialDesignId: string
  name?: string
  tenantId?: string
  design?: Partial<NonPersistedCredentialDesign>
}
