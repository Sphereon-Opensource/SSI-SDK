import { IAgentPlugin } from '@veramo/core'
import { schema } from '../index'
import { IVcManager } from '../types/IVcManager'
import { AuthorizedDIDContext, IDataStoreSaveVerifiableCredentialArgs, FindClaimsArgs, FindCredentialsArgs, UniqueVerifiableCredential} from '@veramo/core'
import { IDataStore, IDataStoreORM} from '@veramo/core'

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

  private readonly datastore: IDataStore;
  private readonly datastoreORM: IDataStoreORM;

  constructor(options: { datastore: IDataStore, datastoreORM: IDataStoreORM }) {
    this.datastore = options.datastore
    this.datastoreORM = options.datastoreORM
  }

  private async dataStoreSaveVerifiableCredential(args: IDataStoreSaveVerifiableCredentialArgs): Promise<string> {
    return await this.datastore.dataStoreSaveVerifiableCredential( args )
  }

  private async dataStoreORMGetVerifiableCredentialsByClaims(args: FindClaimsArgs, context: AuthorizedDIDContext): Promise<Array<UniqueVerifiableCredential>>{
    return await this.datastoreORM.dataStoreORMGetVerifiableCredentialsByClaims( args, context )
  }

  private async dataStoreORMGetVerifiableCredentialsCount(args: FindCredentialsArgs, context: AuthorizedDIDContext): Promise<number> {
    return await this.datastoreORM.dataStoreORMGetVerifiableCredentialsCount( args, context )
  }
}
