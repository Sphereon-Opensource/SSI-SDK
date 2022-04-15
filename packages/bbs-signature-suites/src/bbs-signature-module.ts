import { purposes } from '@digitalcredentials/jsonld-signatures'

import * as vc from '@digitalcredentials/vc'
import { CredentialIssuancePurpose } from '@digitalcredentials/vc'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'
import {
  CredentialPayload,
  IAgentContext,
  IKey,
  IKeyManager,
  IResolver,
  PresentationPayload,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdDocumentLoader } from './ld-document-loader'
import { LdSuiteLoader } from './ld-suite-loader'
import {sign, verify} from "jsonld-signatures";
import {BbsBlsSignature2020, BbsBlsSignatureProof2020, KeyPairOptions} from "@mattrglobal/jsonld-signatures-bbs";
import {customLoader, securityBbsContext} from "./customDocumentLoader";
import {Bls12381G2KeyPair} from "@mattrglobal/bls12381-key-pair";

export type RequiredAgentMethods = IResolver & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>

const ProofPurpose = purposes.ProofPurpose
const AssertionProofPurpose = purposes.AssertionProofPurpose
const AuthenticationProofPurpose = purposes.AuthenticationProofPurpose

const debug = Debug('sphereon:ssi-sdk:bbs-sinature-module')

export class BbsSignatureModule {
  ldSuiteLoader: LdSuiteLoader
  private ldDocumentLoader: LdDocumentLoader

  constructor(options: { ldContextLoader: LdContextLoader; ldSuiteLoader: LdSuiteLoader }) {
    this.ldSuiteLoader = options.ldSuiteLoader
    this.ldDocumentLoader = new LdDocumentLoader(options)
  }

  async verifyBbsSignaturePresentation(inputVP: VerifiablePresentation) {
    const suite = inputVP.proof.type === 'BbsBlsSignatureProof2020' ? new BbsBlsSignatureProof2020() : new BbsBlsSignature2020();
    const verifiedVP = await verify(inputVP, {
      suite: suite,
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader
    });
  }

  async verifyBbsSignatureCredential(inputVC: VerifiableCredential) {
    const suite = inputVC.proof.type === 'BbsBlsSignatureProof2020' ? new BbsBlsSignatureProof2020() : new BbsBlsSignature2020();
    const verifiedVP = await verify(inputVC, {
      suite: suite,
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader
    });
  }

  async signBbsSignatureCredential(inputVC: VerifiableCredential, keyPairOptions: KeyPairOptions) {
    debug('Entry of verifyBbsSignatureCredentialLocal')
    const hasProof: boolean = 'proof' in inputVC;
    if (hasProof) {
      delete inputVC.proof;
    }
    // const signingKeyPairJson = getFileAsJson(signingKeyPairFile);
    const signingKeyPair = new Bls12381G2KeyPair(keyPairOptions);

    const vcContext: string[] = inputVC["@context"] as string[];
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

  async signBbsSignaturePresentation(inputVP: VerifiablePresentation, keyPairOptions: KeyPairOptions) {
    debug('Entry of verifyBbsSignatureCredentialLocal')
    const hasProof: boolean = 'proof' in inputVP;
    if (hasProof) {
      delete inputVP.proof;
    }
    // const signingKeyPairJson = getFileAsJson(signingKeyPairFile);
    const signingKeyPair = new Bls12381G2KeyPair(keyPairOptions);

    const vcContext: string[] = inputVP["@context"] as string[];
    if (vcContext) {
      if (vcContext.indexOf(securityBbsContext) == -1) {
        vcContext.push(securityBbsContext);
      }
    }

    return await sign(inputVP, {
      suite: new BbsBlsSignature2020({ key: signingKeyPair }),
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader,
    });
  }

  private getAllVerificationSuites() {
    return this.ldSuiteLoader.getAllSignatureSuites().map((x) => x.getSuiteForVerification())
  }

}
