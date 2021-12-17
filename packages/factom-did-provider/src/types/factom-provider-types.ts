export interface IManagementKeyOpts {
  priority?: number
  privateKeyMultibase?: string
  kid: string
}

export interface IDidKeyOpts {
  priorityRequirement: number
  purpose: string[]
  privateKeyMultibase?: string
  kid: string
}

export interface ICreateIdentifierOpts {
  network?: string | number
  managementKeys: IManagementKeyOpts[]
  didKeys: IDidKeyOpts[]
  tags: string[]
  nonce: string
}
