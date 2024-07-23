import { PresentationDefinitionWithLocation, PresentationExchange } from '@sphereon/did-auth-siop'
import { SelectResults, Status, SubmissionRequirementMatch } from '@sphereon/pex'
import { Format } from '@sphereon/pex-models'
import { getDID, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { ProofOptions } from '@sphereon/ssi-sdk.core'
import { CredentialMapper, Hasher, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { FindCredentialsArgs, IIdentifier } from '@veramo/core'
import { encodeJoseBlob } from '@veramo/utils'
import {
  DEFAULT_JWT_PROOF_TYPE, IGetPresentationExchangeArgs,
  IOID4VPArgs,
  VerifiableCredentialsWithDefinition,
  VerifiablePresentationWithDefinition
} from '../types'
import { createOID4VPPresentationSignCallback } from './functions'
import { OpSession } from './OpSession'

export class OID4VP {
  private readonly session: OpSession
  private readonly allDIDs: string[]
  private readonly hasher?: Hasher

  private constructor(args: IOID4VPArgs) {
    const { session, allDIDs, hasher } = args

    this.session = session
    this.allDIDs = allDIDs ?? []
    this.hasher = hasher
  }

  public static async init(args: IOID4VPArgs): Promise<OID4VP> {
    const { session, allDIDs = await session.getSupportedDIDs(), hasher } = args

    return new OID4VP({ session, allDIDs, hasher })
  }

  public async getPresentationDefinitions(): Promise<PresentationDefinitionWithLocation[] | undefined> {
    const definitions = await this.session.getPresentationDefinitions()
    if (definitions) {
      PresentationExchange.assertValidPresentationDefinitionWithLocations(definitions)
    }
    return definitions
  }

  private getPresentationExchange(args: IGetPresentationExchangeArgs): PresentationExchange {
    const { verifiableCredentials, allDIDs, hasher } = args

    return new PresentationExchange({
      allDIDs: allDIDs ?? this.allDIDs,
      allVerifiableCredentials: verifiableCredentials,
      hasher: hasher ?? this.hasher
    })
  }

  public async createVerifiablePresentations(
    credentialsWithDefinitions: VerifiableCredentialsWithDefinition[],
    opts?: {
      forceNoCredentialsInVP?: boolean // Allow to create a VP without credentials, like EBSI is using it. Defaults to false
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
      proofOpts?: ProofOptions
      identifierOpts?: IIdentifierOpts
      skipDidResolution?: boolean
      holderDID?: string
      subjectIsHolder?: boolean
      hasher?: Hasher
      applyFilter?: boolean
    },
  ): Promise<VerifiablePresentationWithDefinition[]> {
    return await Promise.all(credentialsWithDefinitions.map((credentials) => this.createVerifiablePresentation(credentials, opts)))
  }

  public async createVerifiablePresentation(
    selectedVerifiableCredentials: VerifiableCredentialsWithDefinition,
    opts?: {
      forceNoCredentialsInVP?: boolean // Allow to create a VP without credentials, like EBSI is using it. Defaults to false
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
      proofOpts?: ProofOptions
      identifierOpts?: IIdentifierOpts
      skipDidResolution?: boolean
      holderDID?: string
      subjectIsHolder?: boolean
      applyFilter?: boolean,
      hasher?: Hasher
    },
  ): Promise<VerifiablePresentationWithDefinition> {
    const { subjectIsHolder, holderDID, forceNoCredentialsInVP = false } = { ...opts }
    if (subjectIsHolder && holderDID) {
      throw Error('Cannot both have subject is holder and a holderDID value at the same time (programming error)')
    }
    if (forceNoCredentialsInVP) {
      selectedVerifiableCredentials.credentials = []
    } else if (!selectedVerifiableCredentials?.credentials || selectedVerifiableCredentials.credentials.length === 0) {
      throw Error('No verifiable verifiableCredentials provided for presentation definition')
    }

    const proofOptions: ProofOptions = {
      ...opts?.proofOpts,
      challenge: opts?.proofOpts?.nonce ?? opts?.proofOpts?.challenge ?? this.session.nonce,
      domain: opts?.proofOpts?.domain ?? (await this.session.getRedirectUri()),
    }

    let id: IIdentifier | string | undefined = opts?.identifierOpts?.identifier
    if (!id) {
      if (opts?.subjectIsHolder) {
        if (forceNoCredentialsInVP) {
          return Promise.reject(
            Error(
              `Cannot have subject is holder, when force no credentials is being used, as we could never determine the holder then. Please provide holderDID`,
            ),
          )
        }
        const firstVC = CredentialMapper.toUniformCredential(selectedVerifiableCredentials.credentials[0], { hasher: opts?.hasher ?? this.hasher })
        const holder = CredentialMapper.isSdJwtDecodedCredential(firstVC)
          ? firstVC.decodedPayload.cnf?.jwk
            //TODO SDK-19: convert the JWK to hex and search for the appropriate key and associated DID
            //doesn't apply to did:jwk only, as you can represent any DID key as a JWK. So whenever you encounter a JWK it doesn't mean it had to come from a did:jwk in the system. It just can always be represented as a did:jwk
            ? `did:jwk:${encodeJoseBlob(firstVC.decodedPayload.cnf?.jwk)}#0`
            : firstVC.decodedPayload.sub
          : Array.isArray(firstVC.credentialSubject)
            ? firstVC.credentialSubject[0].id
            : firstVC.credentialSubject.id
        if (holder) {
          id = await this.session.context.agent.didManagerGet({ did: holder })
        }
      } else if (opts?.holderDID) {
        id = await this.session.context.agent.didManagerGet({ did: opts.holderDID })
      }
    }

    const idOpts = opts?.identifierOpts ?? { identifier: id! }
    this.assertIdentifier(idOpts.identifier)

    // We are making sure to filter, in case the user submitted all verifiableCredentials in the wallet/agent. We also make sure to get original formats back
    const vcs = forceNoCredentialsInVP
      ? selectedVerifiableCredentials
      : opts?.applyFilter
        ? await this.filterCredentials(selectedVerifiableCredentials.definition, {
            restrictToFormats: opts?.restrictToFormats,
            restrictToDIDMethods: opts?.restrictToDIDMethods,
            filterOpts: {
              verifiableCredentials: selectedVerifiableCredentials.credentials.map((vc) => CredentialMapper.storedCredentialToOriginalFormat(vc)),
            },
          })
        : {
            definition: selectedVerifiableCredentials.definition,
            credentials: selectedVerifiableCredentials.credentials.map((vc) => CredentialMapper.storedCredentialToOriginalFormat(vc)),
          }

    const signCallback = await createOID4VPPresentationSignCallback({
      presentationSignCallback: this.session.options.presentationSignCallback,
      idOpts,
      context: this.session.context,
      domain: proofOptions.domain,
      challenge: proofOptions.challenge,
      format: opts?.restrictToFormats ?? selectedVerifiableCredentials.definition.definition.format,
      skipDidResolution: opts?.skipDidResolution ?? false,
    })

    const presentationResult = await this.getPresentationExchange({
      verifiableCredentials: vcs.credentials,
      allDIDs: this.allDIDs,
      hasher: opts?.hasher
    }).createVerifiablePresentation(
      vcs.definition.definition,
      vcs.credentials,
      signCallback,
      {
        proofOptions,
        holderDID: getDID(idOpts),
      },
    )

    const verifiablePresentation =
      typeof presentationResult.verifiablePresentation !== 'string' &&
      'proof' in presentationResult.verifiablePresentation &&
      'jwt' in presentationResult.verifiablePresentation.proof &&
      presentationResult.verifiablePresentation.proof.jwt
        ? presentationResult.verifiablePresentation.proof.jwt
        : presentationResult.verifiablePresentation

    return {
      ...presentationResult,
      verifiablePresentation,
      verifiableCredentials: vcs.credentials,
      definition: selectedVerifiableCredentials.definition,
      identifierOpts: idOpts,
    }
  }

  public async filterCredentialsAgainstAllDefinitions(opts?: {
    filterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindCredentialsArgs }
    holderDIDs?: string[]
    restrictToFormats?: Format
    restrictToDIDMethods?: string[]
  }): Promise<VerifiableCredentialsWithDefinition[]> {
    const defs = await this.getPresentationDefinitions()
    const result: VerifiableCredentialsWithDefinition[] = []
    if (defs) {
      for (const definition of defs) {
        result.push(await this.filterCredentials(definition, opts))
      }
    }
    return result
  }

  public async filterCredentials(
    presentationDefinition: PresentationDefinitionWithLocation,
    opts?: {
      filterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindCredentialsArgs }
      holderDIDs?: string[]
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
    },
  ): Promise<VerifiableCredentialsWithDefinition> {
    return {
      definition: presentationDefinition,
      credentials: (await this.filterCredentialsWithSelectionStatus(presentationDefinition, opts)).verifiableCredential as W3CVerifiableCredential[],
    }
  }

  public async filterCredentialsWithSelectionStatus(
    presentationDefinition: PresentationDefinitionWithLocation,
    opts?: {
      filterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindCredentialsArgs }
      holderDIDs?: string[]
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
    },
  ): Promise<SelectResults> {
    const selectionResults: SelectResults = await this.getPresentationExchange({
      verifiableCredentials: await this.getCredentials(opts?.filterOpts),
    }).selectVerifiableCredentialsForSubmission(presentationDefinition.definition, opts)
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

  private async getCredentials(filterOpts?: {
    verifiableCredentials?: W3CVerifiableCredential[]
    filter?: FindCredentialsArgs
  }): Promise<W3CVerifiableCredential[]> {
    if (filterOpts?.verifiableCredentials && filterOpts.verifiableCredentials.length > 0) {
      return filterOpts.verifiableCredentials
    }
    return (await this.session.context.agent.dataStoreORMGetVerifiableCredentials(filterOpts?.filter))
      .map((uniqueVC) => uniqueVC.verifiableCredential)
      .map((vc) => (vc.proof && vc.proof.type === DEFAULT_JWT_PROOF_TYPE ? vc.proof.jwt : vc))
  }

  private assertIdentifier(identifier?: IIdentifier | string): void {
    if (!identifier) {
      throw Error(`OID4VP needs an identifier at this point`)
    }
  }
}
