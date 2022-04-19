import { IAgentPlugin } from '@veramo/core'
import { OrPromise, RecordLike } from '@veramo/utils'
import Debug from 'debug'
import { BbsSignatureModule } from '../bbs-signature-module'
import { IBindingOverrides, schema } from '../index'
import { IBbsSignatureHandlerLocal } from '../types/IBbsSignatureHandlerLocal'
import {
  ContextDoc,
  IRequiredContext,
  ISignBbsSignatureCredentialArgs,
  ISignBbsSignaturePresentationArgs,
  IVerifyBbsSignatureCredentialArgs,
  IVerifyBbsSignaturePresentationArgs,
} from '../types/types'
import { AbstractKeyManagementSystem, AbstractKeyStore } from '@veramo/key-manager'

const debug = Debug('sphereon:ssi-sdk:bbs-signature-module')

const keyStore = null

export class BbsPlusSignatureHandlerLocal implements IAgentPlugin {
  private bbsSignatureModule: BbsSignatureModule
  private readonly keyStore = null
  readonly schema = schema.IBbsSignatureHandlerLocal
  readonly methods: IBbsSignatureHandlerLocal = {
    verifyBbsSignaturePresentationLocal: this.verifyBbsSignaturePresentationLocal.bind(this),
    verifyBbsSignatureCredentialLocal: this.verifyBbsSignatureCredentialLocal.bind(this),
    signBbsSignatureCredentialLocal: this.signBbsSignatureCredentialLocal.bind(this),
    signBbsSignaturePresentationLocal: this.signBbsSignaturePresentationLocal.bind(this),
  }

  constructor(options: {
    contextMaps: RecordLike<OrPromise<ContextDoc>>[]
    // suites: SphereonLdSignature[];
    bindingOverrides?: IBindingOverrides
    store: AbstractKeyStore
    kms: Record<string, AbstractKeyManagementSystem>
  }) {
    /*this.bbsSignatureModule = new BbsSignatureModule({
      ldContextLoader: new LdContextLoader({contextsPaths: options.contextMaps}),
      ldSuiteLoader: new LdSuiteLoader({ldSignatureSuites: options.suites}),
    })*/

    this.keyStore = keyStore
    this.overrideBindings(options.bindingOverrides)
  }

  private overrideBindings(overrides?: IBindingOverrides) {
    overrides?.forEach((methodName, bindingName) => {
      if (typeof this[methodName] === 'function') {
        this.methods[bindingName] = this[methodName].bind(this)
      } else {
        throw new Error(`Method ${methodName} supplied as target for ${bindingName} is not a valid method in CredentialHandlerLDLocal`)
      }
      debug(`binding: this.${bindingName}() -> CredentialHandlerLDLocal.${methodName}()`)
    })
  }

  /** {@inheritDoc BbsPlusSignatureHandlerLocal.verifyBbsSignaturePresentationLocal} */
  private async verifyBbsSignaturePresentationLocal(args: IVerifyBbsSignaturePresentationArgs, context: IRequiredContext) {
    return await this.bbsSignatureModule.verifyBbsSignaturePresentation(args.presentation)
  }

  /** {@inheritDoc BbsPlusSignatureHandlerLocal.verifyBbsSignaturePresentationLocal} */
  private async verifyBbsSignatureCredentialLocal(args: IVerifyBbsSignatureCredentialArgs, context: IRequiredContext): Promise<void> {
    return await this.bbsSignatureModule.verifyBbsSignatureCredential(args.credential)
  }

  /** {@inheritDoc BbsPlusSignatureHandlerLocal.signBbsSignatureCredentialLocal} */
  private async signBbsSignatureCredentialLocal(args: ISignBbsSignatureCredentialArgs, context: IRequiredContext) {
    return await this.bbsSignatureModule.signBbsSignatureCredential(args.credential, this.keyStore)
  }

  /** {@inheritDoc BbsPlusSignatureHandlerLocal.signBbsSignaturePresentationLocal} */
  private async signBbsSignaturePresentationLocal(args: ISignBbsSignaturePresentationArgs, context: IRequiredContext) {
    return await this.bbsSignatureModule.signBbsSignaturePresentation(args.presentation, this.keyStore)
  }
}
