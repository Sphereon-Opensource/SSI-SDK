import {
  FindCredentialsArgs,
  IAgentContext,
  ICredentialPlugin,
  IDataStoreORM,
  IDIDManager,
  IIdentifier,
  IPluginMethodMap,
  IResolver,
  PresentationPayload,
} from '@veramo/core'
import { IPresentation, Optional, W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { IPresentationDefinition, PEVersion, SelectResults } from '@sphereon/pex'
import { Format, InputDescriptorV1, InputDescriptorV2 } from '@sphereon/pex-models'
import { AbstractPDStore } from '@sphereon/ssi-sdk.data-store'

export interface IPresentationExchange extends IPluginMethodMap {
  pexStoreGetDefinition(args: IDefinitionGetArgs): Promise<IPresentationDefinition | undefined>

  pexStoreHasDefinition(args: IDefinitionExistsArgs): Promise<boolean>

  pexStorePersistDefinition(args: IDefinitionPersistArgs): Promise<IPresentationDefinition>

  pexStoreRemoveDefinition(args: IDefinitionRemoveArgs): Promise<boolean>

  pexStoreClearDefinitions(args: IDefinitionsClearArgs): Promise<boolean>

  pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult>

  pexDefinitionFilterCredentials(args: IDefinitionCredentialFilterArgs, context: IRequiredContext): Promise<IPEXFilterResult>

  pexDefinitionFilterCredentialsPerInputDescriptor(
    args: IDefinitionCredentialFilterArgs,
    context: IRequiredContext,
  ): Promise<IPEXFilterResultWithInputDescriptor[]>
}

export interface IDefinitionGetArgs {
  // TODO maybe just expose data store GetDefinitionsArgs?
  definitionId: string
  tenantId?: string
  version?: string
}

export type IDefinitionExistsArgs = IDefinitionGetArgs
export type IDefinitionClearArgs = IDefinitionGetArgs
export type IDefinitionRemoveArgs = IDefinitionGetArgs

export type IDefinitionImportArgs = IDefinitionPersistArgs

export type VersionControlMode = 'AutoIncrementMajor' | 'AutoIncrementMinor' | 'Manual' | 'Overwrite' | 'OverwriteLatest'

export interface IDefinitionPersistArgs {
  definition: IPresentationDefinition // The actual Presentation definition to be stored/
  definitionId?: string // Allows to define a custom key for storage. By default, the id of the definition will be used
  version?: string // Allows to define a version. By default, the version of the definition will be 1, or when it was saved before it will copy the most recent version
  versionControlMode?: VersionControlMode // Specify version control mode
  validation?: boolean // Whether to check the definition. Defaults to true
  tenantId?: string // The tenant id to use. Allows you to use multiple different tenants next to each-other
  ttl?: number // How long should the definition be stored in seconds. By default, it will be indefinite
}

export interface IDefinitionsClearArgs {
  tenantId?: string
}

export interface IDefinitionCredentialFilterArgs {
  presentationDefinition: IPresentationDefinition
  credentialFilterOpts?: { verifiableCredentials?: W3CVerifiableCredential[]; filter?: FindCredentialsArgs }
  holderDIDs?: (string | IIdentifier)[]
  limitDisclosureSignatureSuites?: string[]
  restrictToFormats?: Format
  restrictToDIDMethods?: string[]
}

export interface PEXOpts {
  defaultStore?: string
  defaultNamespace?: string
  pdStore: AbstractPDStore
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

/*
export interface IIdentifierOpts {
  identifier: IIdentifier | string
  verificationMethodSection?: DIDDocumentSection
  kid?: string
}
*/

export interface VersionDiscoveryResult {
  version?: PEVersion
  error?: string
}

export type IPEXPresentationSignCallback = (args: IPEXPresentationSignCallBackParams) => Promise<W3CVerifiablePresentation>

export interface IPEXPresentationSignCallBackParams {
  presentation: IPresentation | Optional<PresentationPayload, 'holder'>
  presentationDefinition: IPresentationDefinition
}

export type IRequiredContext = IAgentContext<IDataStoreORM & IResolver & IDIDManager & ICredentialPlugin>
