import {
  DIDDocumentSection,
  FindCredentialsArgs,
  IAgentContext,
  IDataStoreORM, IDIDManager,
  IIdentifier,
  IPluginMethodMap, PresentationPayload,
} from '@veramo/core'
import { W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { IKeyValueStore, IValueData } from '@veramo/kv-store'
import { IPresentationDefinition, SelectResults } from '@sphereon/pex'
import { PEVersion } from '@sphereon/pex/dist/main/lib/types'
import { InputDescriptorV1, InputDescriptorV2 } from '@sphereon/pex-models'


export interface IPresentationExchange extends IPluginMethodMap {
  pexStoreGetDefinition(args: IDefinitionGetArgs): Promise<IPresentationDefinition | undefined>

  pexStoreHasDefinition(args: IDefinitionExistsArgs): Promise<boolean>

  pexStorePersistDefinition(args: IDefinitionPersistArgs): Promise<IValueData<IPresentationDefinition>>

  pexStoreRemoveDefinition(args: IDefinitionRemoveArgs): Promise<boolean>

  pexStoreClearDefinitions(args: IDefinitionsClearArgs): Promise<void>

  pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult>

  pexDefinitionFilterCredentials(args: IDefinitionCredentialFilterArgs, context: IRequiredContext): Promise<IPEXFilterResult>

  pexDefinitionFilterCredentialsPerInputDescriptor(args: IDefinitionCredentialFilterArgs, context: IRequiredContext): Promise<IPEXFilterResultWithInputDescriptor[]>
}

export interface IDefinitionGetArgs {
  definitionId: string,
  storeId?: string,
  namespace?: string
}

export type IDefinitionExistsArgs = IDefinitionGetArgs
export type IDefinitionClearArgs = IDefinitionGetArgs
export type IDefinitionRemoveArgs = IDefinitionGetArgs


export type IDefinitionImportArgs = IDefinitionPersistArgs

export interface IDefinitionPersistArgs {
  overwriteExisting?: boolean
  definitionId?: string
  definition: IPresentationDefinition
  ttl?: number
  storeId?: string,
  namespace?: string
}

export interface IDefinitionsClearArgs {
  storeId?: string,
  // namespace?: string
}

export interface IDefinitionCredentialFilterArgs {
  presentationDefinition: IPresentationDefinition,
  credentialFilterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindCredentialsArgs },
  holderDIDs?: (string | IIdentifier)[],
  limitDisclosureSignatureSuites?: string[]

}

export interface PEXOpts {
  defaultStore?: string
  defaultNamespace?: string
  stores?: Map<string, IKeyValueStore<IPresentationDefinition>> | IKeyValueStore<IPresentationDefinition>
  importDefinitions?: IDefinitionImportArgs[]
}


export interface IPEXOptions {
  // presentationVerifyCallback?: PresentationVerificationCallback
  definition?: IPresentationDefinition
  definitionId: string
}

export interface IPEXFilterResultWithInputDescriptor extends IPEXFilterResult {
  inputDescriptor: InputDescriptorV1 | InputDescriptorV2
}

export interface IPEXFilterResult {
  id: string
  selectResults: SelectResults
  filteredCredentials: W3CVerifiableCredential[]
}

export interface IIdentifierOpts {
  identifier: IIdentifier | string
  verificationMethodSection?: DIDDocumentSection
  kid?: string
}

export interface VersionDiscoveryResult {
  version?: PEVersion
  error?: string
}



export type IPEXPresentationSignCallback = (args: IPEXPresentationSignCallBackParams) => Promise<W3CVerifiablePresentation>;

export interface IPEXPresentationSignCallBackParams {
  presentation: PresentationPayload,
  presentationDefinition: IPresentationDefinition
}

export type IRequiredContext = IAgentContext<IDataStoreORM & IDIDManager>
