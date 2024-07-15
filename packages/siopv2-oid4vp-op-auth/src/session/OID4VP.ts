import { PresentationDefinitionWithLocation, PresentationExchange } from '@sphereon/did-auth-siop'
import { SelectResults, Status, SubmissionRequirementMatch } from '@sphereon/pex'
import { Format } from '@sphereon/pex-models'
import { getDID, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'

import { ProofOptions } from '@sphereon/ssi-sdk.core'
import { CredentialMapper, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { IIdentifier } from '@veramo/core'
import {
  DEFAULT_JWT_PROOF_TYPE,
  VerifiableCredentialsWithDefinition,
  VerifiablePresentationWithDefinition,
} from '../types/IDidAuthSiopOpAuthenticator'
import { createOID4VPPresentationSignCallback } from './functions'
import { OpSession } from './OpSession'
import { UniqueDigitalCredential, verifiableCredentialForRoleFilter } from '@sphereon/ssi-sdk.credential-store'
import { CompactJWT } from '@sphereon/ssi-types/dist'
import { CredentialRole, FindDigitalCredentialArgs } from '@sphereon/ssi-sdk.data-store/dist'

export class OID4VP {
  private readonly session: OpSession
  private readonly allDIDs: string[]

  private constructor(session: OpSession, allDIDs?: string[]) {
    this.session = session
    this.allDIDs = allDIDs ?? []
  }

  public static async init(session: OpSession, allDIDs: string[]): Promise<OID4VP> {
    return new OID4VP(session, allDIDs ?? (await session.getSupportedDIDs()))
  }

  public async getPresentationDefinitions(): Promise<PresentationDefinitionWithLocation[] | undefined> {
    const definitions = await this.session.getPresentationDefinitions()
    if (definitions) {
      PresentationExchange.assertValidPresentationDefinitionWithLocations(definitions)
    }
    return definitions
  }

  private getPresentationExchange(verifiableCredentials: W3CVerifiableCredential[], allDIDs?: string[]): PresentationExchange {
    return new PresentationExchange({
      allDIDs: allDIDs ?? this.allDIDs,
      allVerifiableCredentials: verifiableCredentials,
    })
  }

  public async createVerifiablePresentations(
    credentialRole: CredentialRole,
    credentialsWithDefinitions: VerifiableCredentialsWithDefinition[],
    opts?: {
      forceNoCredentialsInVP?: boolean // Allow to create a VP without credentials, like EBSI is using it. Default to true
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
      proofOpts?: ProofOptions
      identifierOpts?: IIdentifierOpts
      skipDidResolution?: boolean
      holderDID?: string
      subjectIsHolder?: boolean
      applyFilter?: boolean
    },
  ): Promise<VerifiablePresentationWithDefinition[]> {
    return await Promise.all(credentialsWithDefinitions.map((cred) => this.createVerifiablePresentation(credentialRole, cred, opts)))
  }

  public async createVerifiablePresentation(
    credentialRole: CredentialRole,
    selectedVerifiableCredentials: VerifiableCredentialsWithDefinition,
    opts?: {
      forceNoCredentialsInVP?: boolean // Allow to create a VP without credentials, like EBSI is using it. Default to true
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
      proofOpts?: ProofOptions
      identifierOpts?: IIdentifierOpts
      skipDidResolution?: boolean
      holderDID?: string
      subjectIsHolder?: boolean
      applyFilter?: boolean
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
        const firstVC = CredentialMapper.toUniformCredential(selectedVerifiableCredentials.credentials[0])
        const holder = Array.isArray(firstVC.credentialSubject) ? firstVC.credentialSubject[0].id : firstVC.credentialSubject.id
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
        ? await this.filterCredentials(credentialRole, selectedVerifiableCredentials.definition, {
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
    const presentationResult = await this.getPresentationExchange(vcs.credentials, this.allDIDs).createVerifiablePresentation(
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

  public async filterCredentialsAgainstAllDefinitions(
    credentialRole: CredentialRole,
    opts?: {
      filterOpts?: {
        verifiableCredentials?: W3CVerifiableCredential[]
        filter?: FindDigitalCredentialArgs
      }
      holderDIDs?: string[]
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
    },
  ): Promise<VerifiableCredentialsWithDefinition[]> {
    const defs = await this.getPresentationDefinitions()
    const result: VerifiableCredentialsWithDefinition[] = []
    if (defs) {
      for (const definition of defs) {
        result.push(await this.filterCredentials(credentialRole, definition, opts))
      }
    }
    return result
  }

  public async filterCredentials(
    credentialRole: CredentialRole,
    presentationDefinition: PresentationDefinitionWithLocation,
    opts?: {
      filterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindDigitalCredentialArgs }
      holderDIDs?: string[]
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
    },
  ): Promise<VerifiableCredentialsWithDefinition> {
    return {
      definition: presentationDefinition,
      credentials: (await this.filterCredentialsWithSelectionStatus(credentialRole, presentationDefinition, opts))
        .verifiableCredential as W3CVerifiableCredential[],
    }
  }

  public async filterCredentialsWithSelectionStatus(
    credentialRole: CredentialRole,
    presentationDefinition: PresentationDefinitionWithLocation,
    opts?: {
      filterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindDigitalCredentialArgs }
      holderDIDs?: string[]
      restrictToFormats?: Format
      restrictToDIDMethods?: string[]
    },
  ): Promise<SelectResults> {
    const selectionResults: SelectResults = await this.getPresentationExchange(
      await this.getCredentials(credentialRole, opts?.filterOpts),
    ).selectVerifiableCredentialsForSubmission(presentationDefinition.definition, opts)
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

  private async getCredentials(
    credentialRole: CredentialRole,
    filterOpts?: {
      verifiableCredentials?: W3CVerifiableCredential[]
      filter?: FindDigitalCredentialArgs
    },
  ): Promise<W3CVerifiableCredential[]> {
    if (filterOpts?.verifiableCredentials && filterOpts.verifiableCredentials.length > 0) {
      return filterOpts.verifiableCredentials
    }

    const filter = verifiableCredentialForRoleFilter(credentialRole, filterOpts?.filter)
    const uniqueCredentials = await this.session.context.agent.crsGetUniqueCredentials({ filter })
    return uniqueCredentials.map((uniqueVC: UniqueDigitalCredential) => {
      const vc = uniqueVC.uniformVerifiableCredential!
      const proof = Array.isArray(vc.proof) ? vc.proof : [vc.proof]
      const jwtProof = proof.find((p) => p?.type === DEFAULT_JWT_PROOF_TYPE)
      return jwtProof ? (jwtProof.jwt as CompactJWT) : vc
    })
  }

  private assertIdentifier(identifier?: IIdentifier | string): void {
    if (!identifier) {
      throw Error(`OID4VP needs an identifier at this point`)
    }
  }
}
