import {
  IDefinitionCredentialFilterArgs,
  IDefinitionValidateArgs,
  IPEXFilterResult,
  IPEXFilterResultWithInputDescriptor,
  IRequiredContext,
  PEXOpts,
  schema,
  VersionDiscoveryResult,
} from '../index'
import { IAgentPlugin } from '@veramo/core'

import { IPresentationExchange } from '../types/IPresentationExchange'
import { Checked, IPresentationDefinition, PEX } from '@sphereon/pex'
import {
  CompactJWT,
  CredentialMapper,
  IProof,
  JWT_PROOF_TYPE_2020,
  W3CVerifiableCredential
} from '@sphereon/ssi-types'
import { InputDescriptorV1, InputDescriptorV2 } from '@sphereon/pex-models'
import { toDIDs } from '@sphereon/ssi-sdk-ext.did-utils'
import { CredentialRole, UniqueDigitalCredential, verifiableCredentialForRoleFilter } from '@sphereon/ssi-sdk.credential-store'
import { FindDigitalCredentialArgs } from '@sphereon/ssi-sdk.data-store'

export class PresentationExchange implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  private readonly pex = new PEX()

  readonly methods: IPresentationExchange = {
    pexValidateDefinition: this.pexValidateDefinition.bind(this),
    pexDefinitionVersion: this.pexDefinitionVersion.bind(this),
    pexDefinitionFilterCredentials: this.pexDefinitionFilterCredentials.bind(this),
    pexDefinitionFilterCredentialsPerInputDescriptor: this.pexDefinitionFilterCredentialsPerInputDescriptor.bind(this),
  }

  constructor(opts?: PEXOpts) {}

  private async pexValidateDefinition(args: IDefinitionValidateArgs): Promise<boolean> {
    const { definition } = args
    const invalids: Checked[] = []

    try {
      const result = PEX.validateDefinition(definition)
      const validations = Array.isArray(result) ? result : [result]
      invalids.push(...validations.filter((v) => v.status === 'error'))
    } catch (error) {
      invalids.push({
        status: 'error',
        message:
          typeof error === 'string'
            ? error
            : typeof error === 'object' && 'message' in (error as object)
              ? (error as Error).message
              : 'unknown error',
        tag: 'validation',
      })
    }

    if (invalids.length > 0) {
      throw Error(`Invalid definition. ${invalids.map((v) => v.message).toString()}`)
    }
    return true // Never returns false, but REST API does not allow Promise<void>
  }

  async pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult> {
    return PEX.definitionVersionDiscovery(presentationDefinition)
  }

  async pexDefinitionFilterCredentials(args: IDefinitionCredentialFilterArgs, context: IRequiredContext): Promise<IPEXFilterResult> {
    const credentials = await this.pexFilterCredentials(args.credentialFilterOpts, context)
    const holderDIDs = args.holderDIDs ? toDIDs(args.holderDIDs) : toDIDs(await context.agent.dataStoreORMGetIdentifiers())
    const selectResults = this.pex.selectFrom(args.presentationDefinition, credentials ?? [], {
      ...args,
      holderDIDs,
      limitDisclosureSignatureSuites: args.limitDisclosureSignatureSuites ?? ['BbsBlsSignature2020'],
    })
    return {
      id: args.presentationDefinition.id,
      selectResults,
      filteredCredentials: selectResults.verifiableCredential?.map((vc) => CredentialMapper.storedCredentialToOriginalFormat(vc)) ?? [],
    }
  }

  async pexDefinitionFilterCredentialsPerInputDescriptor(
    args: IDefinitionCredentialFilterArgs,
    context: IRequiredContext,
  ): Promise<IPEXFilterResultWithInputDescriptor[]> {
    const origDefinition = args.presentationDefinition
    const credentials = await this.pexFilterCredentials(args.credentialFilterOpts ?? {}, context)
    const holderDIDs = args.holderDIDs ? toDIDs(args.holderDIDs) : toDIDs(await context.agent.dataStoreORMGetIdentifiers())
    const limitDisclosureSignatureSuites = args.limitDisclosureSignatureSuites

    const promises = new Map<InputDescriptorV1 | InputDescriptorV2, Promise<IPEXFilterResult>>()
    origDefinition.input_descriptors.forEach((inputDescriptor) => {
      const presentationDefinition = {
        id: inputDescriptor.id,
        input_descriptors: [inputDescriptor],
      }

      const credentialRole = args.credentialFilterOpts.credentialRole

      promises.set(
        inputDescriptor,
        this.pexDefinitionFilterCredentials(
          {
            credentialFilterOpts: { credentialRole, verifiableCredentials: credentials },
            // @ts-ignore
            presentationDefinition,
            holderDIDs,
            limitDisclosureSignatureSuites,
          },
          context,
        ),
      )
    })
    await Promise.all(promises.values())
    const result: IPEXFilterResultWithInputDescriptor[] = []
    for (const entry of promises.entries()) {
      result.push({ ...(await entry[1]), inputDescriptor: entry[0] })
    }
    return result
  }

  private async pexFilterCredentials(
    filterOpts: {
      credentialRole: CredentialRole
      verifiableCredentials?: W3CVerifiableCredential[]
      filter?: FindDigitalCredentialArgs
    },
    context: IRequiredContext,
  ): Promise<W3CVerifiableCredential[]> {
    if (filterOpts.verifiableCredentials && filterOpts.verifiableCredentials.length > 0) {
      return filterOpts.verifiableCredentials as W3CVerifiableCredential[]
    }

    const filter = verifiableCredentialForRoleFilter(filterOpts.credentialRole, filterOpts.filter)
    const uniqueCredentials = await context.agent.crsGetUniqueCredentials({ filter })

    return uniqueCredentials.map((uniqueVC: UniqueDigitalCredential) => {
      const vc = uniqueVC.uniformVerifiableCredential!
      const proof = Array.isArray(vc.proof) ? vc.proof : [vc.proof]
      const jwtProof = proof.find((p: IProof) => p?.type === JWT_PROOF_TYPE_2020)
      return jwtProof ? (jwtProof.jwt as CompactJWT) : vc
    })
  }
}
