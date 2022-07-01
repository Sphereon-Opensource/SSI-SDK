import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
import { IVcManager } from '../types/IVcManager'
import { AuthorizedDIDContext, IDataStoreSaveVerifiableCredentialArgs, FindClaimsArgs, FindCredentialsArgs, UniqueVerifiableCredential} from '@veramo/core'
import { DataStore, DataStoreORM} from '@veramo/data-store'

/**
 * @public
 */
export class VcManager implements IAgentPlugin {
  readonly schema = schema.IVcManager
  readonly methods: IVcManager = {
    dataStoreSaveVerifiableCredential: this.dataStoreSaveVerifiableCredential.bind(this),
    dataStoreORMGetVerifiableCredentialsByClaims: this.dataStoreORMGetVerifiableCredentialsByClaims.bind(this),
    dataStoreORMGetVerifiableCredentialsCount: this.dataStoreORMGetVerifiableCredentialsCount.bind(this),
  }

  private readonly dataStore: DataStore;
  private readonly dataStoreORM: DataStoreORM;

  constructor(options: { dataStore: DataStore, dataStoreORM: DataStoreORM }) {
    this.dataStore = options.dataStore
    this.dataStoreORM = options.dataStoreORM
  }

  private async dataStoreSaveVerifiableCredential(args: IDataStoreSaveVerifiableCredentialArgs): Promise<string> {
    return await this.dataStore.dataStoreSaveVerifiableCredential( args )
  }

  private async dataStoreORMGetVerifiableCredentialsByClaims(args: FindClaimsArgs, context: AuthorizedDIDContext): Promise<Array<UniqueVerifiableCredential>>{
    return await this.dataStoreORM.dataStoreORMGetVerifiableCredentialsByClaims( args, context )
  }

  private async dataStoreORMGetVerifiableCredentialsCount(args: FindCredentialsArgs, context: AuthorizedDIDContext): Promise<number> {
    return await this.dataStoreORM.dataStoreORMGetVerifiableCredentialsCount( args, context )
  }
}
