import {VerifiableCredentialSP} from "@sphereon/ssi-sdk-core";
import {IRequiredContext} from "@sphereon/ssi-sdk-vc-handler-ld-local";
import {IAgentPlugin} from '@veramo/core'
import { OrPromise, RecordLike } from '@veramo/utils'
import Debug from 'debug'
import { BbsSignatureModule } from "../bbs-signature-module";
import { IBindingOverrides, schema } from '../index'
import { IBbsSignatureHandlerLocal } from '../types/IBbsSignatureHandlerLocal'
import { purposes, sign } from 'jsonld-signatures';
import { ContextDoc, IVerifyBbsSignatureCredentialArgs } from '../types/types'
import { Bls12381G2KeyPair } from "@mattrglobal/bls12381-key-pair";
import { BbsBlsSignature2020 } from "@mattrglobal/jsonld-signatures-bbs";
import { customLoader, securityBbsContext} from "../customDocumentLoader";
import {AbstractKeyManagementSystem, AbstractKeyStore} from "@veramo/key-manager";

const debug = Debug('sphereon:ssi-sdk:bbs-signature-module')

const keyStore = null;

export class BbsPlusSignatureHandlerLocal implements IAgentPlugin {
  private bbsSignatureModule: BbsSignatureModule
  private keyStore = null;
  readonly schema = schema.IBbsSignatureHandlerLocal
  readonly methods: IBbsSignatureHandlerLocal = {
    verifyBbsSignaturePresentationLocal: this.verifyBbsSignaturePresentationLocal.bind(this),
    verifyBbsSignatureCredentialLocal: this.verifyBbsSignatureCredentialLocal.bind(this),
    signBbsSignatureCredentialLocal: this.signBbsSignatureCredentialLocal.bind(this),
    signBbsSignaturePresentationLocal: this.signBbsSignaturePresentationLocal.bind(this),
  }

  //TODO: fix this asap
  constructor(options: {
    contextMaps: RecordLike<OrPromise<ContextDoc>>[];
    // suites: SphereonLdSignature[];
    bindingOverrides?: IBindingOverrides;
    store: AbstractKeyStore;
    kms: Record<string, AbstractKeyManagementSystem>}) {
    /*this.bbsSignatureModule = new BbsSignatureModule({
      ldContextLoader: new LdContextLoader({contextsPaths: options.contextMaps}),
      ldSuiteLoader: new LdSuiteLoader({ldSignatureSuites: options.suites}),
    })*/

    this.keyStore = keyStore;
    this.overrideBindings(options.bindingOverrides)
  }

  private overrideBindings(overrides?: IBindingOverrides) {
    overrides?.forEach((methodName, bindingName) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof this[methodName] === 'function') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.methods[bindingName] = this[methodName].bind(this)
      } else {
        throw new Error(`Method ${methodName} supplied as target for ${bindingName} is not a valid method in CredentialHandlerLDLocal`)
      }
      debug(`binding: this.${bindingName}() -> CredentialHandlerLDLocal.${methodName}()`)
    })
  }

  /** {@inheritDoc BbsPlusSignatureHandlerLocal.verifyBbsSignaturePresentationLocal} */
  private async verifyBbsSignatureCredentialLocal(
      args: IVerifyBbsSignatureCredentialArgs,
      context: IRequiredContext
  ): Promise<VerifiableCredentialSP> {
    debug('Entry of verifyBbsSignatureCredentialLocal')
    const inputVC: Credential = args.credential as Credential;
    const hasProof: boolean = 'proof' in inputVC;
    if (hasProof) {
      //TODO: remove these
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete inputVC['proof'];
    }
    // const signingKeyPairJson = getFileAsJson(signingKeyPairFile);
    const signingKeyPair = new Bls12381G2KeyPair(args.);

    //TODO: remove these
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const vcContext = inputVC['@context'];
    if (vcContext) {
      if (vcContext.indexOf(securityBbsContext) == -1) {
        vcContext.push(securityBbsContext);
      }
    }

    return await sign(inputVC, {
      suite: new BbsBlsSignature2020({ key: signingKeyPair }),
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader,
    });
  }
}