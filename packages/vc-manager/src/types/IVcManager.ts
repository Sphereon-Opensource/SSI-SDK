/**
 * @public
 */
import { IAgentContext, IPluginMethodMap, IDataStoreSaveVerifiableCredentialArgs, FindClaimsArgs, FindCredentialsArgs, AuthorizedDIDContext, UniqueVerifiableCredential} from '@veramo/core'


export interface IVcManager extends IPluginMethodMap {
  dataStoreSaveVerifiableCredential(args: IDataStoreSaveVerifiableCredentialArgs): Promise<string>
  dataStoreORMGetVerifiableCredentialsByClaims( args: FindClaimsArgs, context: AuthorizedDIDContext ): Promise<Array<UniqueVerifiableCredential>>
  dataStoreORMGetVerifiableCredentialsCount( args: FindCredentialsArgs, context: AuthorizedDIDContext ): Promise<number>
}

export type IRequiredContext = IAgentContext<never>
