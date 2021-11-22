export interface IManagementKeyOpts {
  priority?: number
  privateKeyMultibase?: string
}

export interface IDidKeyOpts {
  priorityRequirement: number
  purpose: string[]
  privateKeyMultibase?: string
}

export interface ICreateIdentifierOpts {
  managementKeys: IManagementKeyOpts[]
  didKeys: IDidKeyOpts[]
  tags: string[]
  nonce: string
}
