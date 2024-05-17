import { VcIssuer } from '@sphereon/oid4vci-issuer'
import { DIDDocument } from '@veramo/core'
import { createVciIssuerBuilder } from './functions'
import { IssuerMetadata } from '@sphereon/oid4vci-common'

import { CredentialDataSupplier } from '@sphereon/oid4vci-issuer'
import { IIssuerOptions, IMetadataOptions, IRequiredContext } from './types/IOID4VCIIssuer'

export class IssuerInstance {
  private _issuer: VcIssuer<DIDDocument> | undefined
  private readonly _metadataOptions: IMetadataOptions
  private readonly _issuerOptions: IIssuerOptions
  private readonly _metadata: IssuerMetadata

  public constructor({
    issuerOpts,
    metadataOpts,
    metadata,
  }: {
    issuerOpts: IIssuerOptions
    metadataOpts: IMetadataOptions
    metadata: IssuerMetadata
  }) {
    this._issuerOptions = issuerOpts
    this._metadataOptions = metadataOpts
    this._metadata = metadata
  }

  public async get(opts: { context: IRequiredContext; credentialDataSupplier?: CredentialDataSupplier }): Promise<VcIssuer<DIDDocument>> {
    if (!this._issuer) {
      const builder = await createVciIssuerBuilder(
        {
          issuerOpts: this.issuerOptions,
          metadata: this.metadata,
          credentialDataSupplier: opts?.credentialDataSupplier,
        },
        opts.context,
      )
      this._issuer = builder.build()
    }
    return this._issuer
  }

  get issuerOptions() {
    return this._issuerOptions
  }

  get metadataOptions() {
    return this._metadataOptions
  }

  get metadata() {
    return this._metadata
  }
}
