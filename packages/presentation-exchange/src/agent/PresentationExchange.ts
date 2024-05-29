import {
  IDefinitionCredentialFilterArgs,
  IDefinitionExistsArgs,
  IDefinitionGetArgs,
  IDefinitionPersistArgs,
  IDefinitionRemoveArgs,
  IDefinitionsClearArgs,
  IPEXFilterResult,
  IPEXFilterResultWithInputDescriptor,
  IRequiredContext,
  PEXOpts,
  schema,
  VersionDiscoveryResult,
} from '../index'
import { FindCredentialsArgs, IAgentPlugin } from '@veramo/core'

import { IPresentationExchange } from '../types/IPresentationExchange'
import { Checked, IPresentationDefinition, PEX } from '@sphereon/pex'
import { CredentialMapper, JWT_PROOF_TYPE_2020, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { InputDescriptorV1, InputDescriptorV2 } from '@sphereon/pex-models'
import { toDIDs } from '@sphereon/ssi-sdk-ext.did-utils'
import { PresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'

export class PresentationExchange implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  private readonly pex = new PEX()

  readonly methods: IPresentationExchange = {
    pexStoreGetDefinition: this.pexStoreGetDefinition.bind(this),
    pexStorePersistDefinition: this.pexStorePersistDefinition.bind(this),
    pexStoreHasDefinition: this.pexStoreHasDefinition.bind(this),
    pexStoreRemoveDefinition: this.pexStoreRemoveDefinition.bind(this),
    pexStoreClearDefinitions: this.pexStoreClearDefinitions.bind(this),
    pexDefinitionVersion: this.pexDefinitionVersion.bind(this),
    pexDefinitionFilterCredentials: this.pexDefinitionFilterCredentials.bind(this),
    pexDefinitionFilterCredentialsPerInputDescriptor: this.pexDefinitionFilterCredentialsPerInputDescriptor.bind(this),
  }

  constructor(opts?: PEXOpts) {}

  private async pexStoreGetDefinition(
    { definitionId, tenantId, version }: IDefinitionGetArgs,
    context: IRequiredContext,
  ): Promise<IPresentationDefinition | undefined> {
    const definitions = await context.agent.pdmGetDefinitions({ filter: [{ definitionId, tenantId, version }] })
    if (definitions.length === 0) {
      return undefined
    }
    return definitions[0].definitionPayload // There can be multiple version, but they are ordered by latest version first
  }

  private async pexStoreHasDefinition({ definitionId, tenantId, version }: IDefinitionExistsArgs, context: IRequiredContext): Promise<boolean> {
    const definitions = await context.agent.pdmGetDefinitions({ filter: [{ definitionId, tenantId, version }] })
    return definitions !== undefined && definitions.length > 0 // TODO Maybe create pdStore.countDefinitions?
  }

  private async pexStorePersistDefinition(args: IDefinitionPersistArgs, context: IRequiredContext): Promise<IPresentationDefinition> {
    const { definitionId, tenantId, version, versionControlMode } = args
    const definition = definitionId === undefined ? args.definition : { ...args.definition, id: definitionId }

    if (args?.validation !== false) {
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
    }

    const definitionItem = await context.agent.pdmPersistDefinition({
      definitionItem: {
        tenantId,
        version,
        definitionPayload: definition,
      },
      versionControlMode,
    })
    return definitionItem.definitionPayload
  }

  private async pexStoreRemoveDefinition({ definitionId, tenantId, version }: IDefinitionRemoveArgs, context: IRequiredContext): Promise<boolean> {
    const definitions = await context.agent.pdmGetDefinitions({ filter: [{ definitionId, tenantId, version }] })
    if (definitions !== undefined && definitions.length > 0) {
      return await context.agent.pdmDeleteDefinition({ itemId: definitions[0].id }).then((): boolean => true)
    }
    return false
  }

  private async pexStoreClearDefinitions({ tenantId }: IDefinitionsClearArgs, context: IRequiredContext): Promise<boolean> {
    const definitions = await context.agent.pdmGetDefinitions({ filter: [{ tenantId }] })
    if (definitions.length === 0) {
      return false
    }
    await Promise.all(
      definitions.map(async (definitionItem: PresentationDefinitionItem) => {
        await context.agent.pdmDeleteDefinition({ itemId: definitionItem.id }) // TODO create deleteDefinitions in pdManager with tenantId filter?
      }),
    )
    return true
  }

  async pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult> {
    return PEX.definitionVersionDiscovery(presentationDefinition)
  }

  async pexDefinitionFilterCredentials(args: IDefinitionCredentialFilterArgs, context: IRequiredContext): Promise<IPEXFilterResult> {
    const credentials = await this.pexFilterCredentials(args.credentialFilterOpts ?? {}, context)
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

      promises.set(
        inputDescriptor,
        this.pexDefinitionFilterCredentials(
          {
            credentialFilterOpts: { verifiableCredentials: credentials },
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
      verifiableCredentials?: W3CVerifiableCredential[]
      filter?: FindCredentialsArgs
    },
    context: IRequiredContext,
  ): Promise<W3CVerifiableCredential[]> {
    if (filterOpts?.verifiableCredentials && filterOpts.verifiableCredentials.length > 0) {
      return filterOpts.verifiableCredentials as W3CVerifiableCredential[]
    }
    return (await context.agent.dataStoreORMGetVerifiableCredentials(filterOpts?.filter))
      .map((uniqueVC) => uniqueVC.verifiableCredential)
      .map((vc) => (vc.proof && vc.proof.type === JWT_PROOF_TYPE_2020 ? vc.proof.jwt : vc))
  }

  /*private assertIdentifier(identifier?: IIdentifier): void {
                if (!identifier) {
                  throw Error(`OID4VP needs an identifier at this point`)
                }
              }*/
}
