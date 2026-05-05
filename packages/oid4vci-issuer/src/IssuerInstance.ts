import { CredentialDataSupplier, CredentialSignerCallback, VcIssuer } from '@sphereon/oid4vci-issuer'
import { legacyKeyRefsToIdentifierOpts } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { createVciIssuerBuilder, getCredentialSignerCallback } from './functions'
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

  /**
   * Returns the (lazily-built and cached) {@link VcIssuer} for this instance.
   *
   * When `wrapCredentialSignerCallback` is provided on first invocation, the wrapper is applied to the
   * configured {@link CredentialSignerCallback} before `build()` is called, so the resulting issuer's
   * signer callback is the wrapped one. This is the supported injection point for cross-cutting concerns
   * such as persisting the issued credential server-side (see DEV-35). Avoid mutating the issuer's
   * signer callback after construction.
   */
  public async get(opts: {
    context: IRequiredContext
    credentialDataSupplier?: CredentialDataSupplier
    wrapCredentialSignerCallback?: (original: CredentialSignerCallback) => CredentialSignerCallback
  }): Promise<VcIssuer> {
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
      if (opts.wrapCredentialSignerCallback) {
        const idOpts = legacyKeyRefsToIdentifierOpts({ didOpts: this._issuerOptions.didOpts, idOpts: this._issuerOptions.idOpts })
        const original = await getCredentialSignerCallback(idOpts, opts.context)
        builder.withCredentialSignerCallback(opts.wrapCredentialSignerCallback(original))
      }
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
