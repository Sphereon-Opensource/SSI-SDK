import { IAgentPlugin } from '@veramo/core'
import {
  AbstractCredentialDesignStore,
  CredentialDesign,
  GetCredentialDesignsArgs
} from '@sphereon/ssi-sdk.data-store-types'
import { schema } from '../index'
import {
  AddCredentialDesignArgs,
  GetCredentialDesignArgs,
  ICredentialDesignManager,
  RemoveCredentialDesignArgs,
  RequiredContext,
  UpdateCredentialDesignArgs,
} from '../types/ICredentialDesignManager'

// Exposing the methods here for any REST implementation
export const credentialDesignManagerMethods: Array<string> = [
  'cdmGetCredentialDesign',
  'cdmGetCredentialDesigns',
  'cdmAddCredentialDesign',
  'cdmUpdateCredentialDesign',
  'cdmRemoveCredentialDesign',
]

/**
 * {@inheritDoc ICredentialDesignManager}
 */
export class CredentialDesignManager implements IAgentPlugin {
  readonly schema = schema.ICredentialDesignManager
  readonly methods: ICredentialDesignManager = {
    cdmGetCredentialDesign: this.cdmGetCredentialDesign.bind(this),
    cdmGetCredentialDesigns: this.cdmGetCredentialDesigns.bind(this),
    cdmAddCredentialDesign: this.cdmAddCredentialDesign.bind(this),
    cdmUpdateCredentialDesign: this.cdmUpdateCredentialDesign.bind(this),
    cdmRemoveCredentialDesign: this.cdmRemoveCredentialDesign.bind(this),
  }

  private readonly store: AbstractCredentialDesignStore

  constructor(options: { store: AbstractCredentialDesignStore }) {
    this.store = options.store
  }

  /** {@inheritDoc ICredentialDesignManager.cdmGetCredentialDesign} */
  private async cdmGetCredentialDesign(args: GetCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign> {
    const { credentialDesignId } = args
    return this.store.getCredentialDesign({ credentialDesignId })
  }

  /** {@inheritDoc ICredentialDesignManager.cdmGetCredentialDesigns} */
  private async cdmGetCredentialDesigns(args: GetCredentialDesignsArgs, context: RequiredContext): Promise<Array<CredentialDesign>> {
    return this.store.getCredentialDesigns(args)
  }

  /** {@inheritDoc ICredentialDesignManager.cdmAddCredentialDesign} */
  private async cdmAddCredentialDesign(args: AddCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign> {
    return this.store.addCredentialDesign(args)
  }

  /** {@inheritDoc ICredentialDesignManager.cdmUpdateCredentialDesign} */
  private async cdmUpdateCredentialDesign(args: UpdateCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign> {
    return this.store.updateCredentialDesign(args)
  }

  /** {@inheritDoc ICredentialDesignManager.cdmRemoveCredentialDesign} */
  private async cdmRemoveCredentialDesign(args: RemoveCredentialDesignArgs, context: RequiredContext): Promise<boolean> {
    await this.store.removeCredentialDesign(args)
    return true
  }
}
