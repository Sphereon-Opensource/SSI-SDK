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
import { extendContextLoader, purposes } from '@digitalcredentials/jsonld-signatures'
import * as vc from '@digitalcredentials/vc'
import { CredentialIssuancePurpose } from '@digitalcredentials/vc'
import { LdContextLoader } from './ld-context-loader'
import { LdSuiteLoader } from './ld-suite-loader'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'


export type RequiredAgentMethods = IResolver & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>

const ProofPurpose = purposes.ProofPurpose
const AssertionProofPurpose = purposes.AssertionProofPurpose
const AuthenticationProofPurpose = purposes.AuthenticationProofPurpose
// const CredentialIssuancePurpose = purposes.CredentialIssuancePurpose

const debug = Debug('veramo:w3c:ld-credential-module-local')

export class LdCredentialModule {
  /**
   * TODO: General Implementation Notes
   * - (SOLVED) EcdsaSecp256k1Signature2019 (Signature) and EcdsaSecp256k1VerificationKey2019 (Key)
   * are not useable right now, since they are not able to work with blockChainId and ECRecover.
   * - DID Fragment Resolution.
   * - Key Manager and Verification Methods: Veramo currently implements no link between those.
   */

  private ldContextLoader: LdContextLoader
  ldSuiteLoader: LdSuiteLoader

  constructor(options: { ldContextLoader: LdContextLoader; ldSuiteLoader: LdSuiteLoader }) {
    this.ldContextLoader = options.ldContextLoader
    this.ldSuiteLoader = options.ldSuiteLoader
  }

  getDocumentLoader(context: IAgentContext<IResolver>, attemptToFetchContexts: boolean = false) {
    return extendContextLoader(async (url: string) => {
      // console.log(`resolving context for: ${url}`)

      // did resolution
      if (url.toLowerCase().startsWith('did:')) {
        const resolutionResult = await context.agent.resolveDid({ didUrl: url })
        const didDoc = resolutionResult.didDocument
        if (!didDoc) {
          console.log(`Could not fetch DID document with url: ${url}`)
          return
        }

        if (url.indexOf('#') > 0 && didDoc['@context']) {
          // Apparently we got a whole DID document, but we are looking for a verification method
          // Todo extend to full objects in assertionMethod, authentication etc.
          if (didDoc.verificationMethod) {
            const verificationMethod = didDoc.verificationMethod.filter((vm) => vm.id === url)
            if (verificationMethod.length == 1) {
              // We have to provide a context
              const contexts = this.ldSuiteLoader
                .getAllSignatureSuites()
                .filter(
                  (x) =>
                    x.getSupportedVerificationType() === verificationMethod[0].type || verificationMethod[0].type === 'Ed25519VerificationKey2018'
                )
                .map((value) => value.getContext())
              const document = { ...verificationMethod[0], '@context': contexts }

              return {
                contextUrl: null,
                documentUrl: url,
                document,
              }
            }
          }
        }

        // currently Veramo LD suites can modify the resolution response for DIDs from
        // the document Loader. This allows to fix incompatibilities between DID Documents
        // and LD suites to be fixed specifically within the Veramo LD Suites definition
        this.ldSuiteLoader.getAllSignatureSuites().forEach((x) => x.preDidResolutionModification(url, didDoc))

        // console.log(`Returning from Documentloader: ${JSON.stringify(returnDocument)}`)
        return {
          contextUrl: null,
          documentUrl: url,
          document: didDoc,
        }
      }

      if (this.ldContextLoader.has(url)) {
        const contextDoc = await this.ldContextLoader.get(url)
        return {
          contextUrl: null,
          documentUrl: url,
          document: contextDoc,
        }
      } else {
        if (attemptToFetchContexts) {
          // attempt to fetch the remote context!!!! MEGA FAIL for JSON-LD.
          debug('WARNING: attempting to fetch the doc directly for ', url)
          try {
            const response = await fetch(url)
            if (response.status === 200) {
              const document = await response.json()
              return {
                contextUrl: null,
                documentUrl: url,
                document,
              }
            }
          } catch (e) {
            debug('WARNING: unable to fetch the doc or interpret it as JSON', e)
          }
        }
      }

      debug(`WARNING: Possible unknown context/identifier for ${url} \n falling back to default documentLoader`)

      return vc.defaultDocumentLoader(url)
    })
  }

  async issueLDVerifiableCredential(
    credential: CredentialPayload,
    issuerDid: string,
    key: IKey,
    verificationMethodId: string,
    purpose: typeof ProofPurpose = new CredentialIssuancePurpose(),
    context: IAgentContext<RequiredAgentMethods>
  ): Promise<VerifiableCredentialSP> {
    // fixme: We need to look at the verificationMethod in meta of the key, and then look up the suiteloader, as for instance ed25519 can be the 2018 or 2020 version
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.getDocumentLoader(context, true)

    // some suites can modify the incoming credential (e.g. add required contexts)W
    suite.preSigningCredModification(credential)

    return await vc.issue({
      credential,
      purpose,
      suite: await suite.getSuiteForSigning(key, issuerDid, verificationMethodId, context),
      documentLoader,
      compactProof: false,
    })
  }

  async signLDVerifiablePresentation(
    presentation: PresentationPayload,
    holderDid: string,
    key: IKey,
    verificationMethodId: string,
    challenge: string | undefined,
    domain: string | undefined,
    purpose: typeof ProofPurpose = (!challenge && !domain) ? new AssertionProofPurpose() : new AuthenticationProofPurpose( {domain, challenge}),
    context: IAgentContext<RequiredAgentMethods>
  ): Promise<VerifiablePresentationSP> {
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.getDocumentLoader(context, true)

    suite.preSigningPresModification(presentation)

    return await vc.signPresentation({
      presentation,
      suite: suite.getSuiteForSigning(key, holderDid, verificationMethodId, context),
      challenge,
      domain,
      documentLoader,
      purpose,
      compactProof: false,
    })
  }

  async verifyCredential(
    credential: VerifiableCredential,
    context: IAgentContext<IResolver>,
    fetchRemoteContexts: boolean = false,
    purpose: typeof ProofPurpose = new AssertionProofPurpose()
  ): Promise<boolean> {
    const verificationSuites = this.getAllVerificationSuites()
    this.ldSuiteLoader.getAllSignatureSuites().forEach(suite => suite.preVerificationCredModification(credential) )
    const result = await vc.verifyCredential({
      credential,
      suite: verificationSuites,
      documentLoader: this.getDocumentLoader(context, fetchRemoteContexts),
      purpose: purpose,
      compactProof: false,
    })

    if (result.verified) return true

    // NOT verified.

    // result can include raw Error
    debug(`Error verifying LD Verifiable Credential: ${JSON.stringify(result, null, 2)}`)
    console.log(JSON.stringify(result, null, 2))
    throw Error('Error verifying LD Verifiable Credential')
  }

  private getAllVerificationSuites() {
    return this.ldSuiteLoader.getAllSignatureSuites().map((x) => x.getSuiteForVerification())
  }

  async verifyPresentation(
    presentation: VerifiablePresentation,
    challenge: string | undefined,
    domain: string | undefined,
    context: IAgentContext<IResolver>,
    fetchRemoteContexts: boolean = false,
    presentationPurpose: typeof ProofPurpose = (!challenge && !domain) ? new AssertionProofPurpose() : new AuthenticationProofPurpose(domain, challenge),
  //AssertionProofPurpose()
  ): Promise<boolean> {
    // console.log(JSON.stringify(presentation, null, 2))

    const result = await vc.verify({
      presentation,
      suite: this.getAllVerificationSuites(),
      documentLoader: this.getDocumentLoader(context, fetchRemoteContexts),
      challenge,
      domain,
      presentationPurpose,
      compactProof: false,
    })

    if (result.verified) return true

    // NOT verified.

    // result can include raw Error
    console.log(`Error verifying LD Verifiable Presentation`)
    console.log(JSON.stringify(result, null, 2))
    throw Error('Error verifying LD Verifiable Presentation')
  }
}
