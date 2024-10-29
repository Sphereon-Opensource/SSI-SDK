import { VcIssuer } from '@sphereon/oid4vci-issuer'
import { DIDDocument } from '@veramo/core'
import { createVciIssuerBuilder } from './functions'
import { AuthorizationServerMetadata, IssuerMetadata, OpenidFederationMetadata } from '@sphereon/oid4vci-common'

import { CredentialDataSupplier } from '@sphereon/oid4vci-issuer'
import { IIssuerOptions, IMetadataOptions, IRequiredContext } from './types/IOID4VCIIssuer'

export class IssuerInstance {
  private _issuer: VcIssuer<DIDDocument> | undefined
  private readonly _metadataOptions: IMetadataOptions
  private readonly _issuerOptions: IIssuerOptions
  private readonly _issuerMetadata: IssuerMetadata
  private readonly _authorizationServerMetadata: AuthorizationServerMetadata
  private readonly _openidFederationMetadata: OpenidFederationMetadata

  public constructor({
    issuerOpts,
    metadataOpts,
    issuerMetadata,
    authorizationServerMetadata,
    openidFederationMetadata,
  }: {
    issuerOpts: IIssuerOptions
    metadataOpts: IMetadataOptions
    issuerMetadata: IssuerMetadata
    authorizationServerMetadata: AuthorizationServerMetadata
    openidFederationMetadata: OpenidFederationMetadata
  }) {
    this._issuerOptions = issuerOpts
    this._metadataOptions = metadataOpts
    this._issuerMetadata = issuerMetadata
    this._authorizationServerMetadata = authorizationServerMetadata
    this._openidFederationMetadata = openidFederationMetadata
  }

  public async get(opts: { context: IRequiredContext; credentialDataSupplier?: CredentialDataSupplier }): Promise<VcIssuer<DIDDocument>> {
    if (!this._issuer) {
      const builder = await createVciIssuerBuilder(
        {
          issuerOpts: this.issuerOptions,
          issuerMetadata: this.issuerMetadata,
          authorizationServerMetadata: this.authorizationServerMetadata,
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

  get issuerMetadata() {
    return this._issuerMetadata
  }

  get authorizationServerMetadata() {
    return this._authorizationServerMetadata
  }

  get openidFederationMetadata() {
    return this._openidFederationMetadata
  }
}
