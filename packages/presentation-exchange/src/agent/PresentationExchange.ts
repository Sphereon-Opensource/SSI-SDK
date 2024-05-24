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
import { AbstractPdStore, isPresentationDefinitionEqual, NonPersistedPresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'

export class PresentationExchange implements IAgentPlugin {
  private readonly pdStore: AbstractPdStore
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

  constructor(opts: PEXOpts) {
    this.pdStore = opts.pdStore

    if (opts && Array.isArray(opts?.importDefinitions)) {
      opts.importDefinitions.forEach(this.pexStorePersistDefinition)
    }
  }

  private async pexStoreGetDefinition({ definitionId, tenantId, version }: IDefinitionGetArgs): Promise<IPresentationDefinition | undefined> {
    const definitions = await this.pdStore.getDefinitions({ filter: [{ definitionId, tenantId, version }] })
    if (definitions.length === 0) {
      return undefined
    }
    return definitions[0].definitionPayload
  }

  private async pexStoreHasDefinition({ definitionId, tenantId, version }: IDefinitionExistsArgs): Promise<boolean> {
    const definitions = this.pexStoreGetDefinition({ definitionId, tenantId, version })
    return definitions != undefined // TODO Maybe create pdStore.countDefinitions?
  }

  private async pexStorePersistDefinition(args: IDefinitionPersistArgs): Promise<IPresentationDefinition> {
    const { definition, tenantId, version } = args // TODO ttl?
    if (args?.validation !== false) {
      let invalids: Checked[] = []

      try {
        const result = PEX.validateDefinition(definition) // throws an error in case the def is not valid
        const validations = Array.isArray(result) ? result : [result]
        invalids = validations.filter((v) => v.status === 'error')
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
    const definitionId = args.definitionId ?? definition.id
    const existing = await this.pdStore.getDefinitions({ filter: [{ definitionId, tenantId, version }] })
    const existingItem = existing.length > 0 ? existing[0] : undefined

    const definitionItem: NonPersistedPresentationDefinitionItem = {
      definitionId: definitionId,
      version: version ?? '1',
      tenantId: args.tenantId,
      purpose: definition.purpose,
      definitionPayload: definition,
    }
    const isPayloadModified = existingItem === undefined || !isPresentationDefinitionEqual(existingItem, definitionItem)
    if (!isPayloadModified) {
      return existingItem.definitionPayload
    }
    if (!existingItem) {
      const persistedItem = await this.pdStore.addDefinition(definitionItem)
      return persistedItem.definitionPayload
    } else if (args.overwriteExisting !== false) {
      existingItem.definitionId = definitionId
      existingItem.version = version ?? existingItem?.version ?? '1'
      existingItem.tenantId = args.tenantId
      existingItem.purpose = definition.purpose
      existingItem.definitionPayload = definition

      const persistedItem = await this.pdStore.updateDefinition(existingItem)
      return persistedItem.definitionPayload
    }
    throw Error(
      `Cannot update definition ${definitionId} for tenant ${tenantId} version ${version} because definition exists and overwriteExisting is set to false`,
    )
  }

  private async pexStoreRemoveDefinition({ definitionId, tenantId, version }: IDefinitionRemoveArgs): Promise<boolean> {
    const definition = await this.pexStoreGetDefinition({ definitionId, tenantId, version })
    if (definition !== undefined) {
      return await this.pdStore.deleteDefinition({ itemId: definition.id }).then((): boolean => true)
    }
    return false
  }

  private async pexStoreClearDefinitions({ tenantId }: IDefinitionsClearArgs): Promise<boolean> {
    const definitions = await this.pdStore.getDefinitions({ filter: [{ tenantId }] })
    if (definitions.length === 0) {
      return false
    }
    await Promise.all(
      definitions.map(async (definitionItem) => {
        await this.pdStore.deleteDefinition({ itemId: definitionItem.id }) // TODO create deleteDefinitions with tenantId filter?
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
