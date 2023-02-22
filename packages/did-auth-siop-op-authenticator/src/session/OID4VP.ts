import { IIdentifierOpts } from '../types/IDidAuthSiopOpAuthenticator'
import { OpSession } from './OpSession'
import { CredentialMapper, W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { PresentationDefinitionWithLocation, PresentationExchange } from '@sphereon/did-auth-siop'
import { SelectResults, Status, SubmissionRequirementMatch } from '@sphereon/pex'
import { ProofOptions } from '@sphereon/ssi-sdk-core'
import { createPresentationSignCallback, determineKid, getKey } from './functions'

export class OID4VP {
  private readonly _session: OpSession
  private readonly _identifierOpts: IIdentifierOpts

  private constructor(session: OpSession, identifierOpts: IIdentifierOpts) {
    this._session = session
    this._identifierOpts = identifierOpts
  }

  public static async init(session: OpSession, identifierOpts: IIdentifierOpts): Promise<OID4VP> {
    return new OID4VP(session, identifierOpts)
  }

  public async getPresentationDefinitions(): Promise<PresentationDefinitionWithLocation[] | undefined> {
    const definitions = (await this._session.getAuthorizationRequest()).presentationDefinitions
    if (definitions) {
      PresentationExchange.assertValidPresentationDefinitionWithLocations(definitions)
    }
    return definitions
  }

  public getPresentationExchange(verifiableCredentials: W3CVerifiableCredential[]): PresentationExchange {
    return new PresentationExchange({
      did: this._identifierOpts.identifier.did,
      allVerifiableCredentials: verifiableCredentials,
    })
  }

  public async createVerifiablePresentation(presentationDefinition: PresentationDefinitionWithLocation, selectedVerifiableCredentials: W3CVerifiableCredential[], opts?: { proofOpts?: ProofOptions, identifierOpts?: IIdentifierOpts, holder?: string, subjectIsHolder?: boolean }): Promise<W3CVerifiablePresentation> {
    if (opts?.subjectIsHolder && opts?.holder) {
      throw Error('Cannot both have subject is issuer and a holder value at the same time (programming error)')
    } else if (!selectedVerifiableCredentials || selectedVerifiableCredentials.length === 0) {
      throw Error('No verifiable credentials provided for presentation definition')
    }

    let _oidvp: OID4VP
    if (opts?.identifierOpts) {
      _oidvp = await OID4VP.init(this._session, opts.identifierOpts)
    } else if (opts?.subjectIsHolder) {
      const firstVC = CredentialMapper.toUniformCredential(selectedVerifiableCredentials[0])
      const holder = Array.isArray(firstVC.credentialSubject) ? firstVC.credentialSubject[0].id : firstVC.credentialSubject.id
      if (!holder) {
        _oidvp = this
      } else {
        const identifier = await this._session.context.agent.didManagerGet({ did: holder })
        if (!identifier) {
          throw Error(`Could not find DID: ${holder}`)
        }
        _oidvp = await OID4VP.init(this._session, {
          identifier,
          verificationMethodSection: this._identifierOpts.verificationMethodSection,
        })
      }
    } else if (opts?.holder) {
      const identifier = await this._session.context.agent.didManagerGet({ did: opts.holder })
      if (!identifier.controllerKeyId) {
        throw Error(`Could not find DID: ${opts.holder}`)
      }
      _oidvp = await OID4VP.init(this._session, {
        identifier,
        verificationMethodSection: this._identifierOpts.verificationMethodSection,
      })
    } else {
      _oidvp = this
    }

    // Do not use this past this point!. We need to be able to swap the identifier (see above)

    // We are making sure to filter, in case the user submitted all credentials in the wallet/agent
    const vcs = await _oidvp.filterCredentials(presentationDefinition, selectedVerifiableCredentials)

    const key = await getKey(this._identifierOpts.identifier, 'authentication', _oidvp._session.context, _oidvp._identifierOpts.kid)
    const signCallback = await createPresentationSignCallback({
      presentationSignCallback: _oidvp._session.options.presentationSignCallback,
      kid: determineKid(key, _oidvp._identifierOpts),
      context: _oidvp._session.context,
    })
    return await this.getPresentationExchange(vcs).createVerifiablePresentation(presentationDefinition.definition, vcs, {
        proofOptions: opts?.proofOpts,
        holder: _oidvp._identifierOpts.identifier.did,
      }, signCallback,
    )
  }


  public async filterCredentials(presentationDefinition: PresentationDefinitionWithLocation, verifiableCredentials: W3CVerifiableCredential[]): Promise<W3CVerifiableCredential[]> {
    return (await this.filterCredentialsWithSelectionStatus(presentationDefinition, verifiableCredentials)).verifiableCredential as W3CVerifiableCredential[]
  }

  public async filterCredentialsWithSelectionStatus(presentationDefinition: PresentationDefinitionWithLocation, verifiableCredentials: W3CVerifiableCredential[]): Promise<SelectResults> {
    const selectionResults: SelectResults = await this.getPresentationExchange(verifiableCredentials).selectVerifiableCredentialsForSubmission(presentationDefinition.definition)
    if (selectionResults.errors && selectionResults.errors.length > 0) {
      throw Error(JSON.stringify(selectionResults.errors))
    } else if (selectionResults.areRequiredCredentialsPresent === Status.ERROR) {
      throw Error(`Not all required credentials are available to satisfy the relying party's request`)
    }

    const matches: SubmissionRequirementMatch[] | undefined = selectionResults.matches
    if (!matches || matches.length === 0 || !selectionResults.verifiableCredential || selectionResults.verifiableCredential.length === 0) {
      throw Error(JSON.stringify(selectionResults.errors))
    }
    return selectionResults
  }
}
