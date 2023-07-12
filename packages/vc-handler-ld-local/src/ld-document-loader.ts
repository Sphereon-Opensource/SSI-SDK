import { extendContextLoader } from '@digitalcredentials/jsonld-signatures'
import vc from '@digitalcredentials/vc'
import {
  CredentialPayload,
  DIDDocument,
  IAgentContext,
  IResolver,
  PresentationPayload,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core'
import { fetch } from 'cross-fetch'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdSuiteLoader } from './ld-suite-loader'

const debug = Debug('sphereon:ssi-sdk:vc-handler-ld-local')

/**
 * Initializes a list of Veramo-wrapped LD Signature suites and exposes those to the Agent Module
 */
export class LdDocumentLoader {
  private ldContextLoader: LdContextLoader
  ldSuiteLoader: LdSuiteLoader

  constructor(options: { ldContextLoader: LdContextLoader; ldSuiteLoader: LdSuiteLoader }) {
    this.ldContextLoader = options.ldContextLoader
    this.ldSuiteLoader = options.ldSuiteLoader
  }

  getLoader(
    context: IAgentContext<IResolver>,
    {
      attemptToFetchContexts = false,
      verifiableData,
    }: { attemptToFetchContexts: boolean; verifiableData: VerifiableCredential | VerifiablePresentation | CredentialPayload | PresentationPayload }
  ) {
    return extendContextLoader(async (url: string) => {
      if (!url || url.trim().length === 0) {
        throw Error('URL needs to be provided to load a context!')
      }
      const origUrl = url
      if (url.startsWith('#') && verifiableData.issuer !== undefined) {
        url = (typeof verifiableData.issuer === 'string' ? verifiableData.issuer : verifiableData.issuer.id) + url
        console.log(url)
      }
      // did resolution
      if (url.toLowerCase().startsWith('did:')) {
        const resolutionResult = await context.agent.resolveDid({ didUrl: url })
        let didDoc: DIDDocument | null = resolutionResult.didDocument
        if (!didDoc) {
          throw new Error(`Could not fetch DID document with url: ${url}. Did you enable the the driver?`)
        }
        // currently Veramo LD suites can modify the resolution response for DIDs from
        // the document Loader. This allows to fix incompatibilities between DID Documents
        // and LD suites to be fixed specifically within the Veramo LD Suites definition
        this.ldSuiteLoader.getAllSignatureSuites().forEach((x) => x.preDidResolutionModification(url, didDoc as DIDDocument))

        // Move legacy publicKey to verificationMethod, so any dependency that does not support it, keeps functioning
        if (didDoc.publicKey) {
          if (!didDoc.verificationMethod) {
            didDoc.verificationMethod = []
          }
          didDoc.verificationMethod = [...didDoc.verificationMethod, ...didDoc.publicKey]
          if (didDoc.verificationMethod.length === 0) {
            throw new Error(`No verification method available for ${url}`)
          }
          delete didDoc.publicKey
        }

        if (url.indexOf('#') > 0 && didDoc['@context']) {
          if (origUrl !== url) {
            // Make sure we replace the result URLs with the original URLs, so framing keeps working
            didDoc = JSON.parse(JSON.stringify(didDoc).replace(url, origUrl)) as DIDDocument
            console.log('CHANGED:')
            console.log(didDoc)
          }

          // Apparently we got a whole DID document, but we are looking for a verification method
          // We use origUrl here, as that is how it was used in the VM
          const component = await context.agent.getDIDComponentById({ didDocument: didDoc, didUrl: origUrl })
          console.log('Component:')
          console.log(component)
          console.log('Component stringified:')
          console.log(JSON.stringify(component))
          if (component && typeof component !== 'string' && component.id) {
            // We have to provide a context
            const contexts = this.ldSuiteLoader
              .getAllSignatureSuites()
              .filter((x) => x.getSupportedVerificationType() === component.type /* || component.type === 'Ed25519VerificationKey2018'*/)
              .filter((value, index, self) => self.indexOf(value) === index)
              .map((value) => value.getContext())
            const fragment = { ...component, '@context': contexts }

            return {
              contextUrl: null,
              documentUrl: url,
              document: fragment,
            }
          }
        }

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
          debug('WARNING: attempting to fetch the doc directly for ', url)
          try {
            const response = await fetch(url, { redirect: 'follow' })
            if (response.status === 200) {
              const document = await response.json()
              // fixme: The VC API returns an _id object for RL Credentials, which is not allowed, so delete it here for now
              if (url.startsWith('https://vc-api.sphereon.io/services/credentials/')) {
                delete document._id
              }
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

      console.log(`WARNING: Possible unknown context/identifier for ${url} \n falling back to default documentLoader`)

      return vc.defaultDocumentLoader(url)
    })
  }
}
