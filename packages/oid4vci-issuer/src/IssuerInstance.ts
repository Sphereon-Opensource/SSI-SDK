import { CredentialDataSupplier, VcIssuer } from '@sphereon/oid4vci-issuer'
import { createVciIssuerBuilder } from './functions'
import { AuthorizationServerMetadata, IssuerMetadata } from '@sphereon/oid4vci-common'
import { IIssuerOptions, IMetadataOptions, IRequiredContext } from './types/IOID4VCIIssuer'

export class IssuerInstance {
  private _issuer: VcIssuer | undefined
  private readonly _metadataOptions: IMetadataOptions
  private readonly _issuerOptions: IIssuerOptions
  private _issuerMetadata: IssuerMetadata
  private readonly _authorizationServerMetadata: AuthorizationServerMetadata

  public constructor({
    issuerOpts,
    metadataOpts,
    issuerMetadata,
    authorizationServerMetadata,
  }: {
    issuerOpts: IIssuerOptions
    metadataOpts: IMetadataOptions
    issuerMetadata: IssuerMetadata
    authorizationServerMetadata: AuthorizationServerMetadata
  }) {
    this._issuerOptions = issuerOpts
    this._metadataOptions = metadataOpts
    this._issuerMetadata = issuerMetadata
    this._authorizationServerMetadata = authorizationServerMetadata
  }

  public async get(opts: { context: IRequiredContext; credentialDataSupplier?: CredentialDataSupplier }): Promise<VcIssuer> {
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

  set issuerMetadata(value: IssuerMetadata) {
    // TODO SSISDK-87 create proper solution to update issuer metadata
    if (this._issuer?.issuerMetadata) {
      this._issuer.issuerMetadata = {
        ...this._issuer?.issuerMetadata,
        credential_configurations_supported: value.credential_configurations_supported
      }
    }

    this._issuerMetadata = value
  }

  get authorizationServerMetadata() {
    return this._authorizationServerMetadata
  }
}
