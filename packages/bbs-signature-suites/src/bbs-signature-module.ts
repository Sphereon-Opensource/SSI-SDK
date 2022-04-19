import { purposes } from '@digitalcredentials/jsonld-signatures'

import { IKeyManager, IResolver, VerifiableCredential, VerifiablePresentation } from '@veramo/core'
import Debug from 'debug'

import { BbsContextLoader } from './bbs-context-loader'
import { BbsSuiteLoader } from './bbs-suite-loader'
import { sign, verify } from 'jsonld-signatures'
import { BbsBlsSignature2020, BbsBlsSignatureProof2020, KeyPairOptions } from '@mattrglobal/jsonld-signatures-bbs'
import { customLoader, securityBbsContext } from './customDocumentLoader'
import { Bls12381G2KeyPair } from '@mattrglobal/bls12381-key-pair'
import { BbsDocumentLoader } from './bbs-document-loader'

export type RequiredAgentMethods = IResolver & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>

const debug = Debug('sphereon:ssi-sdk:bbs-signature-module')

export class BbsSignatureModule {
  private bbsSuiteLoader: BbsSuiteLoader
  private documentLoader: any
  constructor(options: { bbsContextLoader: BbsContextLoader; bbsSuiteLoader: BbsSuiteLoader }) {
    this.bbsSuiteLoader = options.bbsSuiteLoader
    this.documentLoader = new BbsDocumentLoader(options)
  }

  async verifyBbsSignaturePresentation(inputVP: VerifiablePresentation) {
    const suite = inputVP.proof.type === 'BbsBlsSignatureProof2020' ? new BbsBlsSignatureProof2020() : new BbsBlsSignature2020()
    const verifiedVP = await verify(inputVP, {
      suite: suite,
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader,
    })
  }

  async verifyBbsSignatureCredential(inputVC: VerifiableCredential) {
    const suite = inputVC.proof.type === 'BbsBlsSignatureProof2020' ? new BbsBlsSignatureProof2020() : new BbsBlsSignature2020()
    const verifiedVP = await verify(inputVC, {
      suite: suite,
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader,
    })
  }

  async signBbsSignatureCredential(inputVC: VerifiableCredential, keyPairOptions: KeyPairOptions) {
    debug('Entry of verifyBbsSignatureCredentialLocal')
    const hasProof: boolean = 'proof' in inputVC
    if (hasProof) {
      delete inputVC.proof
    }
    // const signingKeyPairJson = getFileAsJson(signingKeyPairFile);
    const signingKeyPair = new Bls12381G2KeyPair(keyPairOptions)

    const vcContext: string[] = inputVC['@context'] as string[]
    if (vcContext) {
      if (vcContext.indexOf(securityBbsContext) == -1) {
        vcContext.push(securityBbsContext)
      }
    }

    return await sign(inputVC, {
      suite: new BbsBlsSignature2020({ key: signingKeyPair }),
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader,
    })
  }

  async signBbsSignaturePresentation(inputVP: VerifiablePresentation, keyPairOptions: KeyPairOptions) {
    debug('Entry of verifyBbsSignatureCredentialLocal')
    const hasProof: boolean = 'proof' in inputVP
    if (hasProof) {
      delete inputVP.proof
    }
    // const signingKeyPairJson = getFileAsJson(signingKeyPairFile);
    const signingKeyPair = new Bls12381G2KeyPair(keyPairOptions)

    const vcContext: string[] = inputVP['@context'] as string[]
    if (vcContext) {
      if (vcContext.indexOf(securityBbsContext) == -1) {
        vcContext.push(securityBbsContext)
      }
    }

    return await sign(inputVP, {
      suite: new BbsBlsSignature2020({ key: signingKeyPair }),
      purpose: new purposes.AssertionProofPurpose(),
      documentLoader: customLoader,
    })
  }

  private getAllVerificationSuites() {
    return this.bbsSuiteLoader.getAllSignatureSuites().map((x) => x.getSuiteForVerification())
  }
}
